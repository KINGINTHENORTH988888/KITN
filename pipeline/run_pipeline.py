import hashlib
import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

from pipeline.config import (
    INDEX_DIR,
    INDEX_FILE,
    MANUAL_CONTRIBUTIONS_FILE,
    PUBLIC_INDEX_FILE,
    SOURCES_FILE,
    SOURCES_HEALTH_FILE,
)
from pipeline.collectors import collect_from_source
from pipeline.processors import clean_text, process_raw_item, resolve_space, sanitize_url


def _load_json_list(path: Path) -> list[dict]:
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, list):
            return [x for x in data if isinstance(x, dict)]
        if isinstance(data, dict) and isinstance(data.get("items"), list):
            return [x for x in data["items"] if isinstance(x, dict)]
    except Exception:
        return []
    return []


def _load_existing_items(path: Path) -> list[dict]:
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, dict) and isinstance(data.get("items"), list):
            return [x for x in data["items"] if isinstance(x, dict)]
    except Exception:
        return []
    return []


def _title_date_key(item: dict) -> str:
    title = re.sub(r"\s+", " ", clean_text(item.get("titre_original")).lower()).strip()
    dt = str(item.get("date_publication") or "").strip()[:10]
    return f"{title}|{dt}" if title else ""


def _extract_domain(source: dict) -> str:
    if source.get("domain"):
        return str(source["domain"]).strip().lower()
    raw_url = str(source.get("url") or "").strip()
    if not raw_url:
        return ""
    try:
        return (urlsplit(raw_url).hostname or "").lower()
    except ValueError:
        return ""


def _content_fingerprint(item: dict) -> str:
    payload = {
        "id": item.get("id"),
        "titre_original": item.get("titre_original"),
        "auteurs": item.get("auteurs"),
        "revue_ou_institution": item.get("revue_ou_institution"),
        "mots_cles": item.get("mots_cles"),
        "date_publication": item.get("date_publication"),
        "statut_validation": item.get("statut_validation"),
        "langue_originale": item.get("langue_originale"),
        "type_document": item.get("type_document"),
        "espace": item.get("espace"),
        "pole": item.get("pole"),
        "poles_secondaires": item.get("poles_secondaires"),
        "confiance_classification": item.get("confiance_classification"),
        "url_publication": item.get("url_publication"),
        "pdf_direct": item.get("pdf_direct"),
        "resume": item.get("resume"),
        "analyse_strategique": item.get("analyse_strategique"),
    }
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _merge_preserving_rich_fields(existing: dict, incoming: dict, now_iso: str) -> tuple[dict, bool]:
    merged = dict(existing)
    changed = False

    list_fields = ("auteurs", "mots_cles", "poles_secondaires")
    for lf in list_fields:
        new_list = incoming.get(lf)
        if isinstance(new_list, list) and len(new_list) > len(merged.get(lf) or []):
            merged[lf] = new_list
            changed = True

    scalar_fields = (
        "titre_original",
        "revue_ou_institution",
        "date_publication",
        "date_statut",
        "langue_originale",
        "type_document",
        "espace",
        "pole",
        "confiance_classification",
        "lien_maroc",
        "url_publication",
        "doi",
        "pdf_direct",
        "resume",
        "analyse_strategique",
    )
    for sf in scalar_fields:
        val = incoming.get(sf)
        if val is None or (isinstance(val, str) and not val.strip()):
            continue
        cur = merged.get(sf)
        if not cur or (sf == "resume" and len(str(val)) > len(str(cur))):
            if cur != val:
                merged[sf] = val
                changed = True

    if incoming.get("date_anomalie") is not None and merged.get("date_anomalie") != incoming.get("date_anomalie"):
        merged["date_anomalie"] = bool(incoming.get("date_anomalie"))
        changed = True

    if incoming.get("texte_integral_disponible") and not merged.get("texte_integral_disponible"):
        merged["texte_integral_disponible"] = True
        changed = True

    if isinstance(incoming.get("score_pertinence"), (int, float)):
        new_score = int(incoming["score_pertinence"])
        if new_score > int(merged.get("score_pertinence") or 0):
            merged["score_pertinence"] = new_score
            changed = True

    if not merged.get("collecte_le") and incoming.get("collecte_le"):
        merged["collecte_le"] = incoming["collecte_le"]
        changed = True

    if changed:
        merged["mis_a_jour_le"] = now_iso

    return merged, changed


def _sync_public_index(src_file: Path, dst_file: Path) -> None:
    if not src_file.exists():
        return
    dst_file.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src_file, dst_file)


def run() -> dict:
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    sources = _load_json_list(SOURCES_FILE)
    active_sources = [s for s in sources if s.get("enabled", True)]

    existing_items = _load_existing_items(INDEX_FILE)
    by_id: dict[str, dict] = {}
    td_to_id: dict[str, str] = {}
    order_ids: list[str] = []

    for item in existing_items:
        iid = str(item.get("id") or "").strip()
        if not iid:
            continue
        normalized = dict(item)
        normalized["titre_original"] = clean_text(normalized.get("titre_original"))
        normalized["resume"] = clean_text(normalized.get("resume"))
        normalized["url_publication"] = sanitize_url(normalized.get("url_publication"))
        normalized["pdf_direct"] = sanitize_url(normalized.get("pdf_direct"))
        if not normalized.get("espace"):
            normalized["espace"] = resolve_space(
                str(normalized.get("type_document") or ""),
                str(normalized.get("pole") or ""),
            )
        td = _title_date_key(normalized)
        if td and td in td_to_id:
            canon_id = td_to_id[td]
            by_id[canon_id], _ = _merge_preserving_rich_fields(by_id[canon_id], normalized, now_iso)
            continue
        by_id[iid] = normalized
        if td:
            td_to_id[td] = iid
        order_ids.append(iid)

    manual_raw = _load_json_list(MANUAL_CONTRIBUTIONS_FILE)
    for m_entry in manual_raw:
        proc = process_raw_item(
            m_entry,
            {"id": "manual_studio", "name": "Contribution manuelle KITN", "enabled": True},
            now_iso=now_iso,
            bypass_relevance=True,
        )
        if not proc:
            continue
        proc["origine"] = "manuel"
        iid = proc["id"]
        td = _title_date_key(proc)
        target_id = iid if iid in by_id else td_to_id.get(td)
        if target_id:
            by_id[target_id], _ = _merge_preserving_rich_fields(by_id[target_id], proc, now_iso)
        else:
            by_id[iid] = proc
            if td:
                td_to_id[td] = iid
            order_ids.append(iid)

    total_fetched = 0
    total_processed = 0
    total_added = 0
    total_updated = 0
    health_records: list[dict] = []

    for src in active_sources:
        sid = str(src.get("id") or "unknown")
        fetched_count = 0
        accepted_count = 0
        status = "ok"
        stage = "collecte_effectuee"
        error_msg = None

        try:
            raw_items = collect_from_source(src)
            fetched_count = len(raw_items)
            total_fetched += fetched_count
            if not raw_items:
                status = "warning"
                stage = "aucun_contenu"
                error_msg = "Aucun document exploitable détecté par le collecteur."

            for raw in raw_items:
                proc = process_raw_item(raw, src, now_iso=now_iso)
                if not proc:
                    continue
                accepted_count += 1
                total_processed += 1
                iid = proc["id"]
                td = _title_date_key(proc)
                target_id = iid if iid in by_id else td_to_id.get(td)
                if target_id:
                    before_fp = _content_fingerprint(by_id[target_id])
                    by_id[target_id], _ = _merge_preserving_rich_fields(by_id[target_id], proc, now_iso)
                    after_fp = _content_fingerprint(by_id[target_id])
                    if before_fp != after_fp:
                        total_updated += 1
                else:
                    by_id[iid] = proc
                    if td:
                        td_to_id[td] = iid
                    order_ids.append(iid)
                    total_added += 1

            if fetched_count > 0 and accepted_count == 0:
                status = "warning"
                stage = "aucun_document_pertinent"
                error_msg = "Des éléments ont été collectés, mais aucun n'a passé les contrôles de pertinence."

        except Exception as exc:
            status = "error"
            stage = "erreur_collecte"
            error_msg = str(exc)

        health_records.append({
            "source_id": sid,
            "source_name": src.get("name") or sid,
            "domain": _extract_domain(src),
            "target_space": src.get("target_space") or resolve_space(str(src.get("default_doc_type") or ""), ""),
            "type": src.get("type") or "",
            "enabled": True,
            "status": status,
            "stage": stage,
            "fetched": fetched_count,
            "accepted": accepted_count,
            "error": error_msg,
            "checked_at": now_iso,
        })

    final_items = [by_id[iid] for iid in order_ids if iid in by_id]
    final_items.sort(key=lambda it: str(it.get("date_publication") or ""), reverse=True)

    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    index_payload = {
        "generated_at": now_iso,
        "total": len(final_items),
        "active_sources": len(active_sources),
        "fetched_in_run": total_fetched,
        "processed_in_run": total_processed,
        "added_in_run": total_added,
        "updated_in_run": total_updated,
        "items": final_items,
    }
    INDEX_FILE.write_text(json.dumps(index_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    health_payload = {
        "updated_at": now_iso,
        "active_sources": len(active_sources),
        "total_fetched": total_fetched,
        "total_accepted": total_processed,
        "sources": health_records,
    }
    SOURCES_HEALTH_FILE.write_text(json.dumps(health_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    _sync_public_index(INDEX_FILE, PUBLIC_INDEX_FILE)
    return index_payload


if __name__ == "__main__":
    run()
