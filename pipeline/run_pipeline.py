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
    STATISTICS_FILE,
    PUBLIC_STATISTICS_FILE,
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


def _url_key(item: dict) -> str:
    url = sanitize_url(item.get("url_publication"))
    return url.rstrip("/").lower() if url else ""


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
        "revue_ou_institution",
        "langue_originale",
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

    # Prefer richer metadata from a fresh extraction of the same record.
    old_title = str(merged.get("titre_original") or "")
    new_title = str(incoming.get("titre_original") or "")
    old_title_is_listing_label = bool(re.match(r"^\d{1,2}\s+[A-Za-zÀ-ÿ.]+\s+20\d{2}\s+-", old_title))
    new_title_is_listing_label = bool(re.match(r"^\d{1,2}\s+[A-Za-zÀ-ÿ.]+\s+20\d{2}\s+-", new_title))
    if (
        new_title
        and incoming.get("source_id") == merged.get("source_id")
        and (old_title_is_listing_label and not new_title_is_listing_label or len(new_title) > len(old_title) and not new_title_is_listing_label)
    ):
        merged["titre_original"] = new_title
        changed = True

    old_date = str(merged.get("date_publication") or "")
    new_date = str(incoming.get("date_publication") or "")
    if new_date and len(new_date) > len(old_date) and not incoming.get("date_anomalie"):
        merged["date_publication"] = new_date
        merged["date_statut"] = incoming.get("date_statut") or merged.get("date_statut")
        changed = True

    confidence_rank = {"faible": 1, "moyen": 2, "eleve": 3}
    old_rank = confidence_rank.get(str(merged.get("confiance_classification") or ""), 0)
    new_rank = confidence_rank.get(str(incoming.get("confiance_classification") or ""), 0)
    if new_rank >= old_rank and new_rank > 0:
        for field in ("type_document", "espace", "pole", "confiance_classification"):
            value = incoming.get(field)
            if value and merged.get(field) != value:
                merged[field] = value
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
    url_to_id: dict[str, str] = {}
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
        url_key = _url_key(normalized)
        existing_id = td_to_id.get(td) if td else None
        existing_id = existing_id or (url_to_id.get(url_key) if url_key else None)
        if existing_id:
            by_id[existing_id], _ = _merge_preserving_rich_fields(by_id[existing_id], normalized, now_iso)
            if td:
                td_to_id.setdefault(td, existing_id)
            if url_key:
                url_to_id[url_key] = existing_id
            continue
        by_id[iid] = normalized
        if td:
            td_to_id[td] = iid
        if url_key:
            url_to_id[url_key] = iid
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
        url_key = _url_key(proc)
        target_id = iid if iid in by_id else (td_to_id.get(td) or (url_to_id.get(url_key) if url_key else None))
        if target_id:
            by_id[target_id], _ = _merge_preserving_rich_fields(by_id[target_id], proc, now_iso)
            if td:
                td_to_id.setdefault(td, target_id)
            if url_key:
                url_to_id[url_key] = target_id
        else:
            by_id[iid] = proc
            if td:
                td_to_id[td] = iid
            if url_key:
                url_to_id[url_key] = iid
            order_ids.append(iid)

    total_fetched = 0
    total_processed = 0
    total_added = 0
    total_updated = 0
    health_records: list[dict] = []
    statistics_series: dict[str, dict] = {}

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
            for raw in raw_items:
                series = raw.get("statistics_series") if isinstance(raw, dict) else None
                if isinstance(series, dict) and series.get("indicator_code"):
                    statistics_series[str(series["indicator_code"])] = series
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
                url_key = _url_key(proc)
                target_id = iid if iid in by_id else (td_to_id.get(td) or (url_to_id.get(url_key) if url_key else None))
                if target_id:
                    before_fp = _content_fingerprint(by_id[target_id])
                    by_id[target_id], _ = _merge_preserving_rich_fields(by_id[target_id], proc, now_iso)
                    if td:
                        td_to_id.setdefault(td, target_id)
                    if url_key:
                        url_to_id[url_key] = target_id
                    after_fp = _content_fingerprint(by_id[target_id])
                    if before_fp != after_fp:
                        total_updated += 1
                else:
                    by_id[iid] = proc
                    if td:
                        td_to_id[td] = iid
                    if url_key:
                        url_to_id[url_key] = iid
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
            "target_space": src.get("target_space") or src.get("space") or resolve_space(str(src.get("default_doc_type") or ""), ""),
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
    if STATISTICS_FILE.exists():
        try:
            previous_statistics = json.loads(STATISTICS_FILE.read_text(encoding="utf-8"))
            for previous in previous_statistics.get("indicators", []):
                if isinstance(previous, dict) and previous.get("indicator_code"):
                    statistics_series.setdefault(str(previous["indicator_code"]), previous)
        except (OSError, json.JSONDecodeError, AttributeError):
            pass
    statistics_payload = {
        "generated_at": now_iso,
        "source": "Sources officielles — Banque mondiale et Bank Al-Maghrib",
        "sources": sorted({str(item.get("source_name") or "") for item in statistics_series.values() if item.get("source_name")}),
        "source_url": "https://data.worldbank.org/country/morocco",
        "indicators": list(statistics_series.values()),
    }
    STATISTICS_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATISTICS_FILE.write_text(json.dumps(statistics_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    _sync_public_index(STATISTICS_FILE, PUBLIC_STATISTICS_FILE)
    return index_payload


if __name__ == "__main__":
    run()
