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
    clean_text,
    detect_real_language,
    evaluate_morocco_relevance,
    validate_publication_date,
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


def _content_fingerprint(rec: dict) -> str:
    """Empreinte des champs éditoriaux/métier pour détecter un changement réel."""
    comparable = {
        "titre_original": rec.get("titre_original"),
        "auteurs": rec.get("auteurs") or [],
        "date_publication": rec.get("date_publication"),
        "langue_originale": rec.get("langue_originale"),
        "resume": rec.get("resume"),
        "url_publication": rec.get("url_publication"),
        "doi": rec.get("doi"),
        "pdf_direct": rec.get("pdf_direct"),
        "type_document": rec.get("type_document"),
        "pole": rec.get("pole"),
        "poles_secondaires": rec.get("poles_secondaires") or [],
        "confiance_classification": rec.get("confiance_classification"),
        "pertinence_maroc": rec.get("pertinence_maroc") or {},
        "date_statut": rec.get("date_statut"),
        "date_anomalie": bool(rec.get("date_anomalie")),
        "statut_validation": rec.get("statut_validation"),
    }
    return json.dumps(comparable, ensure_ascii=False, sort_keys=True)


def run() -> None:
    now_iso = datetime.now(timezone.utc).isoformat()
    sources = _load_json(SOURCES_FILE, [])
    health = _load_json(HEALTH_FILE, {"last_run": None, "sources": {}})
    if not isinstance(health.get("sources"), dict):
        health["sources"] = {}

    existing_by_id: dict[str, dict] = {}
    PUBLICATIONS_DIR.mkdir(parents=True, exist_ok=True)
    for pub_file in sorted(PUBLICATIONS_DIR.glob("*.json")):
        month_items = _load_json(pub_file, [])
        if isinstance(month_items, list):
            for item in month_items:
                if isinstance(item, dict) and item.get("id"):
                    existing_by_id[item["id"]] = item

    previous_fingerprints = {
        pub_id: _content_fingerprint(rec) for pub_id, rec in existing_by_id.items()
    }

    changed_count = 0

    for source in sources:
        if not source.get("enabled", True):
            continue

        sid = source["id"]
        try:
            raw_items = collect_from_source(source)
            accepted_for_source = 0

            for raw in raw_items:
                title = clean_text(raw.get("title"))
                abstract = clean_text(raw.get("abstract"))
                if not title:
                    continue

                relevance = evaluate_morocco_relevance(title, abstract)
                if not relevance["is_relevant"]:
                    continue

                pub_id = build_stable_id(
                    doi=raw.get("doi"),
                    url=raw.get("url"),
                    title=title,
                    published_date=raw.get("published_date"),
                )
                prev = existing_by_id.get(pub_id)

                # Préserver un résumé ou PDF déjà connu si la source ne le renvoie plus
                prev_resume = clean_text(prev.get("resume")) if prev else ""
                merged_abstract = abstract or prev_resume or None
                lang = detect_real_language(
                    f"{title}. {merged_abstract or ''}",
                    raw.get("source_lang_hint") or (prev.get("langue_originale") if prev else None),
                )
                classification = classify_document(
                    title,
                    merged_abstract or "",
                    raw.get("default_doc_type", "publication_scientifique"),
                )

                published_date = (raw.get("published_date") or (prev.get("date_publication") if prev else None) or "").strip() or None
                date_check = validate_publication_date(published_date)

                url_check = verify_url_real(raw.get("url") or (prev.get("url_publication") if prev else None))
                pdf_source_url = raw.get("pdf_url") or (prev.get("pdf_direct") if prev else None)
                pdf_check = (
                    verify_url_real(pdf_source_url)
                    if pdf_source_url
                    else {
                        "status": "non_fourni",
                        "final_url": None,
                        "content_type": None,
                        "checked_at": now_iso,
                    }
                )

                if url_check["status"] in ("http_404", "http_410", "manquant_ou_invalide"):
                    continue

                merged_pdf = (
                    pdf_check["final_url"]
                    if pdf_check["status"] == "verifie"
                    else (prev.get("pdf_direct") if prev else None)
                )

                statut_validation = (
                    "valide"
                    if (url_check["status"] == "verifie" and not date_check["date_anomalie"])
                    else "a_verifier"
                )

                first_seen = (prev.get("first_seen_at") if prev else None) or (prev.get("collecte_le") if prev else None) or now_iso

                candidate = {
                    "id": pub_id,
                    "titre_original": title,
                    "auteurs": raw.get("authors") or (prev.get("auteurs") if prev else []) or [],
                    "date_publication": published_date,
                    "date_statut": date_check["date_statut"],
                    "date_anomalie": date_check["date_anomalie"],
                    "langue_originale": lang,
                    "source_id": sid,
                    "source_nom": raw.get("source_name") or sid,
                    "resume": merged_abstract,
                    "url_publication": url_check["final_url"] or raw.get("url") or (prev.get("url_publication") if prev else None),
                    "doi": raw.get("doi") or (prev.get("doi") if prev else None),
                    "pdf_direct": merged_pdf,
                    "verification_liens": {
                        "url_statut": url_check["status"],
                        "url_content_type": url_check["content_type"],
                        "pdf_statut": pdf_check["status"],
                        "dernier_controle": now_iso,
                    },
                    "type_document": classification["doc_type"],
                    "pole": classification["pole"],
                    "poles_secondaires": classification["poles_secondaires"],
                    "confiance_classification": classification["confidence"],
                    "pertinence_maroc": {
                        "score": relevance["score"],
                        "justification": relevance["justification"],
                    },
                    "statut_validation": statut_validation,
                    "first_seen_at": first_seen,
                    "last_seen_at": now_iso,
                    "updated_at": prev.get("updated_at") if prev else now_iso,
                    "collecte_le": prev.get("collecte_le") if prev else now_iso,
                }

                new_fp = _content_fingerprint(candidate)
                old_fp = previous_fingerprints.get(pub_id)

                if old_fp is None or new_fp != old_fp:
                    candidate["updated_at"] = now_iso
                    candidate["collecte_le"] = now_iso
                    changed_count += 1
                elif prev:
                    candidate["updated_at"] = prev.get("updated_at") or prev.get("collecte_le") or now_iso
                    candidate["collecte_le"] = prev.get("collecte_le") or now_iso

                existing_by_id[pub_id] = candidate
                accepted_for_source += 1

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

    all_records = list(existing_by_id.values())
    all_records.sort(
        key=lambda x: (x.get("date_publication") or "", x.get("updated_at") or x.get("collecte_le") or ""),
        reverse=True,
    )

    if changed_count > 0:
        by_month: dict[str, list[dict]] = {}
        for rec in all_records:
            mk = _month_key(rec.get("date_publication"))
            by_month.setdefault(mk, []).append(rec)

        for mk, items in by_month.items():
            _save_json(PUBLICATIONS_DIR / f"{mk}.json", items)

        search_items = [
            {
                "id": r["id"],
                "titre_original": r["titre_original"],
                "auteurs": r["auteurs"],
                "date_publication": r["date_publication"],
                "date_statut": r.get("date_statut", "date_confirmee"),
                "date_anomalie": bool(r.get("date_anomalie")),
                "statut_validation": r.get("statut_validation", "valide"),
                "langue_originale": r["langue_originale"],
                "source_id": r["source_id"],
                "source_nom": r["source_nom"],
                "type_document": r["type_document"],
                "pole": r["pole"],
                "poles_secondaires": r.get("poles_secondaires") or [],
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
                "new_or_updated_this_run": changed_count,
                "items": search_items,
            },
        )
    else:
        print("Aucun changement métier détecté sur les notices existantes ; index et archives conservés.")

    health["last_run"] = now_iso
    _save_json(HEALTH_FILE, health)
    print(f"Veille terminée. Total publications en base : {len(all_records)} (modifiées/ajoutées cette passe : {changed_count}).")


if __name__ == "__main__":
    run()
