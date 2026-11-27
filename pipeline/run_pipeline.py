import hashlib
import json
import re
import shutil
import os
from datetime import datetime, timedelta, timezone
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
from pipeline.collectors import collect_crossref_by_doi, collect_from_source
from pipeline.processors import clean_text, normalize_doi, process_raw_item, resolve_space, sanitize_url


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


def _doi_key(item: dict) -> str:
    return normalize_doi(item.get("doi")) or ""


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
        "doi": item.get("doi"),
        "doi_statut": item.get("doi_statut"),
        "metadata_enrichissement_tente_le": item.get("metadata_enrichissement_tente_le"),
        "metadata_enrichie_le": item.get("metadata_enrichie_le"),
        "metadata_source_enrichissement": item.get("metadata_source_enrichissement"),
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

    incoming_doi = incoming.get("doi")
    incoming_doi_status = incoming.get("doi_statut")
    current_doi_status = merged.get("doi_statut")
    if incoming_doi_status in ("valide", "invalide", "absent"):
        if incoming_doi_status == "valide" and incoming_doi:
            if merged.get("doi") != incoming_doi or current_doi_status != "valide":
                merged["doi"] = incoming_doi
                merged["doi_statut"] = "valide"
                changed = True
        elif not merged.get("doi") and current_doi_status != incoming_doi_status:
            merged["doi_statut"] = incoming_doi_status
            changed = True
    elif merged.get("doi") and not current_doi_status:
        merged["doi_statut"] = "valide"
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

    incoming_date = str(incoming.get("date_publication") or "").strip()
    merged_date = str(merged.get("date_publication") or "").strip()
    if (
        incoming_date
        and incoming_date == merged_date
        and incoming.get("date_anomalie") is not None
        and merged.get("date_anomalie") != incoming.get("date_anomalie")
    ):
        merged["date_anomalie"] = bool(incoming.get("date_anomalie"))
        merged["date_statut"] = incoming.get("date_statut") or merged.get("date_statut")
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



def _is_valid_statistics_series(series: dict) -> bool:
    """Reject legacy BAM XLSX series with impossible years or footnote-only units."""
    code = str(series.get("indicator_code") or "")
    if not code.startswith("BAM_CKAN_"):
        return True
    unit = clean_text(series.get("unit_fr") or series.get("unit_ar") or "")
    if unit in {"*", "**", "Unité publiée par BAM"}:
        return False
    current_year = datetime.now(timezone.utc).year
    points = list(series.get("history") or [])
    latest = series.get("latest")
    if isinstance(latest, dict):
        points.append(latest)
    for point in points:
        if not isinstance(point, dict):
            continue
        match = re.match(r"(\d{4})", str(point.get("year") or ""))
        if match and int(match.group(1)) > current_year:
            return False
    return True


def _statistics_period_sort_key(period: str, collected_at: str) -> tuple:
    """Return a chronological key for the period formats used by KITN collectors."""
    raw = str(period or "").strip()
    parsed = None

    for pattern, fmt in (
        (r"20\d{2}-\d{2}-\d{2}", "%Y-%m-%d"),
        (r"20\d{2}-\d{2}", "%Y-%m"),
        (r"20\d{2}", "%Y"),
    ):
        if re.fullmatch(pattern, raw):
            parsed = datetime.strptime(raw, fmt)
            break

    quarter = re.fullmatch(r"(20\d{2})-T([1-4])", raw, re.IGNORECASE)
    if quarter:
        parsed = datetime(int(quarter.group(1)), (int(quarter.group(2)) - 1) * 3 + 1, 1)
    else:
        quarter = re.fullmatch(r"T([1-4])[-/](20\d{2})", raw, re.IGNORECASE)
        if quarter:
            parsed = datetime(int(quarter.group(2)), (int(quarter.group(1)) - 1) * 3 + 1, 1)

    normalized = raw.casefold().replace("’", "'")
    try:
        anchor = datetime.strptime(str(collected_at)[:10], "%Y-%m-%d")
    except ValueError:
        anchor = datetime.now(timezone.utc).replace(tzinfo=None)
    if normalized in ("aujourd'hui", "aujourdhui", "today"):
        parsed = anchor
    elif normalized in ("veille", "hier", "yesterday"):
        parsed = anchor - timedelta(days=1)

    if parsed is not None:
        return (0, parsed.strftime("%Y-%m-%d"), raw)
    return (1, raw, raw)


def _merge_statistics_series(existing: dict | None, incoming: dict, collected_at: str) -> dict:
    """Merge a newly collected series with its history without losing older observations."""
    merged = dict(existing) if isinstance(existing, dict) else {}
    incoming = dict(incoming) if isinstance(incoming, dict) else {}

    for key, value in incoming.items():
        if key == "history":
            continue
        if value is not None and value != "":
            merged[key] = value

    old_history = merged.get("history") if isinstance(merged.get("history"), list) else []
    new_history = incoming.get("history") if isinstance(incoming.get("history"), list) else []
    points_by_period: dict[str, dict] = {}
    for point in old_history + new_history:
        if not isinstance(point, dict) or point.get("year") is None or point.get("value") is None:
            continue
        # Incoming observations are processed last and replace revised values
        # for the same period while preserving every other historical point.
        points_by_period[str(point["year"])] = dict(point)

    if points_by_period:
        merged["history"] = [
            points_by_period[key]
            for key in sorted(points_by_period, key=lambda period: _statistics_period_sort_key(period, collected_at))
        ]
    elif old_history or new_history:
        merged["history"] = old_history or new_history

    latest = incoming.get("latest")
    if isinstance(latest, dict) and latest.get("value") is not None:
        merged["latest"] = latest
    elif merged.get("history"):
        merged["latest"] = merged["history"][-1]

    previous = incoming.get("previous")
    if isinstance(previous, dict) and previous.get("value") is not None:
        merged["previous"] = previous
    elif "previous" not in merged:
        merged["previous"] = None

    merged["last_successful_collection_at"] = collected_at
    merged["collection_status"] = "collected"
    return merged


def run() -> dict:
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    sources = _load_json_list(SOURCES_FILE)
    active_sources = [s for s in sources if s.get("enabled", True)]

    existing_items = _load_existing_items(INDEX_FILE)
    by_id: dict[str, dict] = {}
    td_to_id: dict[str, str] = {}
    url_to_id: dict[str, str] = {}
    doi_to_id: dict[str, str] = {}
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
        doi_key = _doi_key(normalized)
        existing_id = doi_to_id.get(doi_key) if doi_key else None
        existing_id = existing_id or (td_to_id.get(td) if td else None)
        existing_id = existing_id or (url_to_id.get(url_key) if url_key else None)
        if existing_id:
            by_id[existing_id], _ = _merge_preserving_rich_fields(by_id[existing_id], normalized, now_iso)
            if td:
                td_to_id.setdefault(td, existing_id)
            if url_key:
                url_to_id[url_key] = existing_id
            if doi_key:
                doi_to_id[doi_key] = existing_id
            continue
        by_id[iid] = normalized
        if td:
            td_to_id[td] = iid
        if url_key:
            url_to_id[url_key] = iid
        if doi_key:
            doi_to_id[doi_key] = iid
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
        doi_key = _doi_key(proc)
        target_id = iid if iid in by_id else (doi_to_id.get(doi_key) if doi_key else None)
        target_id = target_id or td_to_id.get(td) or (url_to_id.get(url_key) if url_key else None)
        if target_id:
            by_id[target_id], _ = _merge_preserving_rich_fields(by_id[target_id], proc, now_iso)
            if td:
                td_to_id.setdefault(td, target_id)
            if url_key:
                url_to_id[url_key] = target_id
            if doi_key:
                doi_to_id[doi_key] = target_id
        else:
            by_id[iid] = proc
            if td:
                td_to_id[td] = iid
            if url_key:
                url_to_id[url_key] = iid
            if doi_key:
                doi_to_id[doi_key] = iid
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
        statistics_count = 0
        statistics_codes: list[str] = []
        statistics_warnings: list[str] = []
        status = "ok"
        stage = "collecte_effectuee"
        error_msg = None

        try:
            raw_items = collect_from_source(src)
            fetched_count = len(raw_items)
            total_fetched += fetched_count
            for raw in raw_items:
                if isinstance(raw, dict):
                    warnings = raw.get("statistics_collection_warnings")
                    if isinstance(warnings, list):
                        statistics_warnings.extend(str(warning) for warning in warnings if warning)
                series = raw.get("statistics_series") if isinstance(raw, dict) else None
                if isinstance(series, dict) and series.get("indicator_code"):
                    code = str(series["indicator_code"])
                    statistics_series[code] = _merge_statistics_series(
                        statistics_series.get(code), series, now_iso
                    )
                    statistics_count += 1
                    statistics_codes.append(code)
            statistics_warnings = sorted(set(statistics_warnings))
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
                doi_key = _doi_key(proc)
                target_id = iid if iid in by_id else (doi_to_id.get(doi_key) if doi_key else None)
                target_id = target_id or td_to_id.get(td) or (url_to_id.get(url_key) if url_key else None)
                if target_id:
                    before_fp = _content_fingerprint(by_id[target_id])
                    by_id[target_id], _ = _merge_preserving_rich_fields(by_id[target_id], proc, now_iso)
                    if td:
                        td_to_id.setdefault(td, target_id)
                    if url_key:
                        url_to_id[url_key] = target_id
                    if doi_key:
                        doi_to_id[doi_key] = target_id
                    after_fp = _content_fingerprint(by_id[target_id])
                    if before_fp != after_fp:
                        total_updated += 1
                else:
                    by_id[iid] = proc
                    if td:
                        td_to_id[td] = iid
                    if url_key:
                        url_to_id[url_key] = iid
                    if doi_key:
                        doi_to_id[doi_key] = iid
                    order_ids.append(iid)
                    total_added += 1

            if fetched_count > 0 and accepted_count == 0:
                if statistics_count > 0:
                    # Statistical series are valid data outputs even when they are
                    # intentionally not indexed as documentary notices.
                    status = "warning" if statistics_warnings else "ok"
                    stage = "collecte_statistique_partielle" if statistics_warnings else "series_statistiques_collectees"
                    error_msg = f"{len(statistics_warnings)} ressource(s) BAM non exploitable(s)." if statistics_warnings else None
                else:
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
            "statistics_collected": statistics_count,
            "statistics_indicators": sorted(set(statistics_codes)),
            "statistics_warnings": statistics_warnings,
            "error": error_msg,
            "checked_at": now_iso,
        })

    # Enrich a small batch of DOI-backed scientific records without replacing trusted fields.
    try:
        requested_enrichment_limit = int(os.environ.get("KITN_DOI_ENRICHMENT_LIMIT", "12"))
    except (TypeError, ValueError):
        requested_enrichment_limit = 12
    enrichment_limit = max(0, min(30, requested_enrichment_limit))
    enrichment_attempted = 0
    enrichment_updated = 0
    for iid in order_ids:
        if enrichment_attempted >= enrichment_limit:
            break
        item = by_id.get(iid)
        if not item:
            continue
        is_science = item.get("espace") == "science" or item.get("type_document") == "publication_scientifique"
        doi = normalize_doi(item.get("doi"))
        if not is_science or not doi:
            continue
        needs_metadata = (
            not str(item.get("resume") or "").strip()
            or not (item.get("auteurs") or [])
            or not str(item.get("revue_ou_institution") or "").strip()
            or not str(item.get("date_publication") or "").strip()
        )
        if not needs_metadata:
            continue

        last_attempt = str(item.get("metadata_enrichissement_tente_le") or "").strip()
        if last_attempt:
            try:
                last_attempt_dt = datetime.fromisoformat(last_attempt.replace("Z", "+00:00"))
                current_dt = datetime.fromisoformat(now_iso.replace("Z", "+00:00"))
                if current_dt - last_attempt_dt < timedelta(days=7):
                    continue
            except ValueError:
                pass

        enrichment_attempted += 1
        item["metadata_enrichissement_tente_le"] = now_iso
        try:
            raw_enrichment = collect_crossref_by_doi(doi)
            if not raw_enrichment:
                continue
            enrichment_source = {
                "id": "crossref_doi_enrichment",
                "name": "Crossref — enrichissement par DOI",
                "target_space": "science",
                "default_doc_type": "publication_scientifique",
                "lang_hint": item.get("langue_originale") or "en",
            }
            enriched = process_raw_item(
                raw_enrichment,
                enrichment_source,
                now_iso=now_iso,
                bypass_relevance=True,
            )
            if not enriched:
                continue
            before_fp = _content_fingerprint(item)
            merged, changed = _merge_preserving_rich_fields(item, enriched, now_iso)
            if changed:
                merged["metadata_enrichie_le"] = now_iso
                merged["metadata_source_enrichissement"] = "Crossref"
                by_id[iid] = merged
                if before_fp != _content_fingerprint(merged):
                    enrichment_updated += 1
        except Exception:
            # One missing DOI record must never stop the full collection pipeline.
            continue

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
        "doi_enrichment_attempted": enrichment_attempted,
        "doi_enrichment_updated": enrichment_updated,
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
                if not isinstance(previous, dict) or not previous.get("indicator_code"):
                    continue
                code = str(previous["indicator_code"])
                if code in statistics_series:
                    # Merge the prior published history into the current collection;
                    # the new observation wins if the source revised the same period.
                    statistics_series[code] = _merge_statistics_series(
                        previous, statistics_series[code], now_iso
                    )
                else:
                    carried = dict(previous)
                    carried["collection_status"] = "carried_forward"
                    statistics_series[code] = carried
        except (OSError, json.JSONDecodeError, AttributeError):
            pass
    statistics_series = {
        code: series for code, series in statistics_series.items()
        if _is_valid_statistics_series(series)
    }
    statistics_sources = sorted({
        str(item.get("source_name") or "")
        for item in statistics_series.values()
        if item.get("source_name")
    })
    statistics_payload = {
        "generated_at": now_iso,
        "source": "Sources officielles — " + " et ".join(statistics_sources) if statistics_sources else "Aucune source statistique disponible",
        "sources": statistics_sources,
        "indicator_count": len(statistics_series),
        "indicators": list(statistics_series.values()),
    }
    STATISTICS_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATISTICS_FILE.write_text(json.dumps(statistics_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    _sync_public_index(STATISTICS_FILE, PUBLIC_STATISTICS_FILE)
    return index_payload


if __name__ == "__main__":
    run()
