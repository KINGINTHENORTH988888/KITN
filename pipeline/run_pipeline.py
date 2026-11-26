import hashlib
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

from pipeline.collectors import collect_from_source
from pipeline.config import (
    DATA_DIR,
    HEALTH_FILE,
    INDEX_DIR,
    PUBLICATIONS_DIR,
    SEARCH_INDEX_FILE,
    SOURCES_FILE,
)
from pipeline.processors import process_raw_item


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _load_json_list(path: Path) -> list[dict]:
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _load_json_dict(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _content_fingerprint(record: dict) -> str:
    relevant = {
        "id": record.get("id"),
        "titre_original": record.get("titre_original"),
        "auteurs": record.get("auteurs"),
        "date_publication": record.get("date_publication"),
        "date_statut": record.get("date_statut"),
        "date_anomalie": record.get("date_anomalie"),
        "statut_validation": record.get("statut_validation"),
        "langue_originale": record.get("langue_originale"),
        "type_document": record.get("type_document"),
        "pole": record.get("pole"),
        "poles_secondaires": record.get("poles_secondaires"),
        "lien_maroc": record.get("lien_maroc"),
        "score_pertinence": record.get("score_pertinence"),
        "url_publication": record.get("url_publication"),
        "pdf_direct": record.get("pdf_direct"),
        "doi": record.get("doi"),
        "resume": record.get("resume"),
    }
    raw = json.dumps(relevant, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _merge_existing_metadata(existing: dict | None, incoming: dict, now_ts: str) -> dict:
    merged = dict(incoming)
    if existing:
        merged["first_seen_at"] = existing.get("first_seen_at") or now_ts
        if not merged.get("resume") and existing.get("resume"):
            merged["resume"] = existing["resume"]
        if not merged.get("pdf_direct") and existing.get("pdf_direct"):
            merged["pdf_direct"] = existing["pdf_direct"]
        if not merged.get("doi") and existing.get("doi"):
            merged["doi"] = existing["doi"]
        if not merged.get("auteurs") and existing.get("auteurs"):
            merged["auteurs"] = existing["auteurs"]
    else:
        merged["first_seen_at"] = now_ts

    merged["last_seen_at"] = now_ts
    prev_fp = existing.get("_fingerprint") if existing else None
    new_fp = _content_fingerprint(merged)
    if not existing or prev_fp != new_fp:
        merged["updated_at"] = now_ts
    else:
        merged["updated_at"] = existing.get("updated_at") or now_ts
    merged["_fingerprint"] = new_fp
    return merged


def run() -> dict:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    PUBLICATIONS_DIR.mkdir(parents=True, exist_ok=True)
    INDEX_DIR.mkdir(parents=True, exist_ok=True)

    now_ts = _now_iso()
    sources = _load_json_list(SOURCES_FILE)
    health_map = _load_json_dict(HEALTH_FILE)

    existing_index = _load_json_dict(SEARCH_INDEX_FILE)
    existing_items = existing_index.get("items") if isinstance(existing_index.get("items"), list) else []
    by_id: dict[str, dict] = {}
    for item in existing_items:
        if isinstance(item, dict) and item.get("id"):
            by_id[str(item["id"])] = item

    collected_count = 0
    accepted_count = 0
    active_sources = 0

    for source in sources:
        if not isinstance(source, dict) or not source.get("enabled"):
            continue
        source_id = str(source.get("id") or source.get("name") or "unknown")
        active_sources += 1

        try:
            raw_items = collect_from_source(source)
            collected_count += len(raw_items)
            kept_for_source = 0

            for raw in raw_items:
                processed = process_raw_item(raw, source)
                if not processed:
                    continue
                item_id = processed["id"]
                merged = _merge_existing_metadata(by_id.get(item_id), processed, now_ts)
                by_id[item_id] = merged
                accepted_count += 1
                kept_for_source += 1

            health_map[source_id] = {
                "source_id": source_id,
                "name": source.get("name") or source_id,
                "status": "ok",
                "last_run_at": now_ts,
                "raw_fetched": len(raw_items),
                "kept": kept_for_source,
                "error": None,
            }
        except Exception as exc:
            health_map[source_id] = {
                "source_id": source_id,
                "name": source.get("name") or source_id,
                "status": "error",
                "last_run_at": now_ts,
                "raw_fetched": 0,
                "kept": 0,
                "error": str(exc)[:300],
            }

    final_items = []
    for rec in by_id.values():
        clean_rec = {k: v for k, v in rec.items() if k != "_fingerprint"}
        final_items.append(clean_rec)

    final_items.sort(key=lambda x: str(x.get("date_publication") or ""), reverse=True)

    index_payload = {
        "generated_at": now_ts,
        "total": len(final_items),
        "active_sources": active_sources,
        "fetched_in_run": collected_count,
        "processed_in_run": accepted_count,
        "items": final_items,
    }

    SEARCH_INDEX_FILE.write_text(
        json.dumps(index_payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    HEALTH_FILE.write_text(
        json.dumps(health_map, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    public_index = DATA_DIR.parent / "public" / "data" / "index"
    if (DATA_DIR.parent / "public").exists():
        public_index.mkdir(parents=True, exist_ok=True)
        shutil.copy2(SEARCH_INDEX_FILE, public_index / "search-index.json")

    return index_payload


if __name__ == "__main__":
    summary = run()
    print(
        f"KITN pipeline terminé : {summary['total']} notices dans l'index "
        f"({summary['active_sources']} sources actives, {summary['processed_in_run']} traitées)."
    )
