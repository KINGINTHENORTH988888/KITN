import json
from datetime import datetime, timezone
from pathlib import Path

from pipeline.collectors import collect_from_source
from pipeline.config import (
    HEALTH_FILE,
    PUBLICATIONS_DIR,
    SEARCH_INDEX_FILE,
    SOURCES_FILE,
)
from pipeline.processors import (
    build_stable_id,
    classify_document,
    detect_real_language,
    evaluate_morocco_relevance,
    verify_url_real,
)


def _load_json(path: Path, default):
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _save_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _month_key(date_str: str | None) -> str:
    if date_str and len(date_str) >= 7 and date_str[4] == "-":
        return date_str[:7]
    return datetime.now(timezone.utc).strftime("%Y-%m")


def run() -> None:
    now_iso = datetime.now(timezone.utc).isoformat()
    sources = _load_json(SOURCES_FILE, [])
    health = _load_json(HEALTH_FILE, {"last_run": None, "sources": {}})
    if not isinstance(health.get("sources"), dict):
        health["sources"] = {}

    # Charger les publications existantes pour éviter les doublons
    existing_by_id: dict[str, dict] = {}
    PUBLICATIONS_DIR.mkdir(parents=True, exist_ok=True)
    for pub_file in sorted(PUBLICATIONS_DIR.glob("*.json")):
        month_items = _load_json(pub_file, [])
        if isinstance(month_items, list):
            for item in month_items:
                if isinstance(item, dict) and item.get("id"):
                    existing_by_id[item["id"]] = item

    new_or_updated_count = 0

    for source in sources:
        if not source.get("enabled", True):
            continue

        sid = source["id"]
        try:
            raw_items = collect_from_source(source)
            accepted_for_source = 0

            for raw in raw_items:
                title = (raw.get("title") or "").strip()
                abstract = (raw.get("abstract") or "").strip()
                if not title:
                    continue

                relevance = evaluate_morocco_relevance(title, abstract)
                if not relevance["is_relevant"]:
                    continue

                lang = detect_real_language(f"{title}. {abstract}", raw.get("source_lang_hint"))
                classification = classify_document(
                    title,
                    abstract,
                    raw.get("default_doc_type", "publication_scientifique"),
                )

                pub_id = build_stable_id(
                    doi=raw.get("doi"),
                    url=raw.get("url"),
                    title=title,
                    published_date=raw.get("published_date"),
                )

                url_check = verify_url_real(raw.get("url"))
                pdf_check = verify_url_real(raw.get("pdf_url")) if raw.get("pdf_url") else {
                    "status": "non_fourni",
                    "final_url": None,
                    "content_type": None,
                    "checked_at": now_iso,
                }

                # On garde la publication si l'URL n'est pas cassée en erreur HTTP 404/410
                if url_check["status"] in ("http_404", "http_410", "manquant_ou_invalide"):
                    continue

                record = {
                    "id": pub_id,
                    "titre_original": title,
                    "auteurs": raw.get("authors") or [],
                    "date_publication": raw.get("published_date"),
                    "langue_originale": lang,
                    "source_id": sid,
                    "source_nom": raw.get("source_name") or sid,
                    "resume": abstract or None,
                    "url_publication": url_check["final_url"] or raw.get("url"),
                    "doi": raw.get("doi"),
                    "pdf_direct": pdf_check["final_url"] if pdf_check["status"] == "verifie" else None,
                    "verification_liens": {
                        "url_statut": url_check["status"],
                        "url_content_type": url_check["content_type"],
                        "pdf_statut": pdf_check["status"],
                        "dernier_controle": now_iso,
                    },
                    "type_document": classification["doc_type"],
                    "pole": classification["pole"],
                    "confiance_classification": classification["confidence"],
                    "pertinence_maroc": {
                        "score": relevance["score"],
                        "justification": relevance["justification"],
                    },
                    "statut_validation": "valide" if url_check["status"] == "verifie" else "a_verifier",
                    "collecte_le": now_iso,
                }

                existing_by_id[pub_id] = record
                accepted_for_source += 1
                new_or_updated_count += 1

            health["sources"][sid] = {
                "status": "ok",
                "collected_raw": len(raw_items),
                "accepted_relevant": accepted_for_source,
                "last_checked": now_iso,
                "error": None,
            }
        except Exception as exc:
            health["sources"][sid] = {
                "status": "erreur",
                "collected_raw": 0,
                "accepted_relevant": 0,
                "last_checked": now_iso,
                "error": str(exc)[:300],
            }

    # Regrouper par mois dans data/publications/YYYY-MM.json
    by_month: dict[str, list[dict]] = {}
    all_records = list(existing_by_id.values())
    all_records.sort(key=lambda x: (x.get("date_publication") or "", x.get("collecte_le") or ""), reverse=True)

    for rec in all_records:
        mk = _month_key(rec.get("date_publication"))
        by_month.setdefault(mk, []).append(rec)

    for mk, items in by_month.items():
        _save_json(PUBLICATIONS_DIR / f"{mk}.json", items)

    # Construire l'index léger pour la recherche et les filtres
    search_items = [
        {
            "id": r["id"],
            "titre_original": r["titre_original"],
            "auteurs": r["auteurs"],
            "date_publication": r["date_publication"],
            "langue_originale": r["langue_originale"],
            "source_id": r["source_id"],
            "source_nom": r["source_nom"],
            "type_document": r["type_document"],
            "pole": r["pole"],
            "confiance_classification": r["confiance_classification"],
            "score_pertinence": (r.get("pertinence_maroc") or {}).get("score", 0),
            "url_publication": r["url_publication"],
            "doi": r["doi"],
            "pdf_direct": r["pdf_direct"],
            "resume": (r.get("resume") or "")[:320],
        }
        for r in all_records
    ]

    _save_json(
        SEARCH_INDEX_FILE,
        {
            "updated_at": now_iso,
            "total": len(search_items),
            "new_or_updated_this_run": new_or_updated_count,
            "items": search_items,
        },
    )

    health["last_run"] = now_iso
    _save_json(HEALTH_FILE, health)
    print(f"Veille terminée. Total publications en base : {len(all_records)} (traitées cette passe : {new_or_updated_count}).")


if __name__ == "__main__":
    run()
