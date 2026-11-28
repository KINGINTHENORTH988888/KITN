#!/usr/bin/env python3
"""Read-only live validation of the official BAM CKAN XLSX collector.

The script writes a review artifact only. It never updates the published datasets.
"""
from __future__ import annotations

import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
import time

from pipeline.collectors import collect_bank_al_maghrib_ckan
from pipeline.run_pipeline import _is_valid_statistics_series


ROOT = Path(__file__).resolve().parents[1]
SOURCES_FILE = ROOT / "data" / "sources.json"
OUTPUT_FILE = ROOT / "data" / "bam-ckan-preview.json"


def main() -> int:
    sources = json.loads(SOURCES_FILE.read_text(encoding="utf-8"))
    source = next(
        (item for item in sources if item.get("id") == "bank_al_maghrib_ckan"),
        None,
    )
    if not source:
        raise RuntimeError("La source bank_al_maghrib_ckan est absente de data/sources.json.")

    raw_items = None
    collection_error = None
    for attempt in range(2):
        try:
            raw_items = collect_bank_al_maghrib_ckan(source)
            collection_error = None
            break
        except Exception as exc:
            collection_error = exc
            if attempt == 0:
                print(f"BAM CKAN transient collection error; retrying once: {str(exc)[:220]}")
                time.sleep(5)

    if raw_items is None:
        # A live source outage must be visible in the artifact, but must not
        # prevent the remaining independent MONIA/HCP validations from running.
        preview = {
            "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "source_id": source["id"],
            "source_name": source.get("name"),
            "catalogue": "data.gov.ma — organisation bank-al-maghrib",
            "status": "unavailable",
            "error": str(collection_error)[:500] if collection_error else "Collecte indisponible",
            "summary": {
                "candidate_series": 0,
                "valid_series": 0,
                "rejected_series": 0,
                "duplicate_indicator_codes": 0,
                "distinct_datasets": 0,
                "warnings": 1,
            },
            "warnings": [
                "Validation live non réalisée : le catalogue BAM CKAN n'a pas répondu après une nouvelle tentative."
            ],
            "indicators": [],
        }
        OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT_FILE.write_text(json.dumps(preview, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("BAM CKAN LIVE STATUS: unavailable")
        print("BAM CKAN LIVE ERROR:", preview["error"])
        print("BAM CKAN PREVIEW WRITTEN:", OUTPUT_FILE.name)
        return 0

    candidates = [
        item["statistics_series"]
        for item in raw_items
        if isinstance(item, dict) and isinstance(item.get("statistics_series"), dict)
    ]
    warnings = sorted({
        str(warning)
        for item in raw_items
        if isinstance(item, dict)
        for warning in (item.get("statistics_collection_warnings") or [])
        if warning
    })

    if not candidates:
        raise RuntimeError("Le catalogue BAM CKAN n'a produit aucune série candidate.")

    valid = [series for series in candidates if _is_valid_statistics_series(series)]
    rejected = [series for series in candidates if not _is_valid_statistics_series(series)]
    code_counts = Counter(str(series.get("indicator_code") or "") for series in candidates)
    duplicate_codes = sorted(code for code, count in code_counts.items() if code and count > 1)
    duplicate_groups = [
        {
            "indicator_code": code,
            "occurrences": [
                {
                    "dataset_name": series.get("dataset_name"),
                    "resource_name": series.get("resource_name"),
                    "sheet_name": series.get("sheet_name"),
                    "source_position": series.get("source_position"),
                    "context_fr": series.get("context_fr"),
                    "label_fr": series.get("label_fr"),
                    "unit_fr": series.get("unit_fr"),
                    "periods": [str(point.get("year")) for point in (series.get("history") or []) if isinstance(point, dict)],
                    "latest": series.get("latest"),
                }
                for series in candidates
                if str(series.get("indicator_code") or "") == code
            ],
        }
        for code in duplicate_codes
    ]
    units = Counter(str(series.get("unit_fr") or "(unité absente)") for series in candidates)
    datasets = Counter(str(series.get("dataset_name") or "(jeu sans nom)") for series in candidates)

    def rejection_reason(series: dict) -> str:
        unit = str(series.get("unit_fr") or "").strip()
        if unit in {"", "*", "**", "Unité publiée par BAM", "Unité non précisée"}:
            return "unité absente ou indéterminée"
        history = series.get("history") or []
        if len({str(point.get("year")) for point in history if isinstance(point, dict)}) < 2:
            return "moins de deux périodes distinctes"
        return "période ou valeur non conforme"

    preview = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source_id": source["id"],
        "source_name": source.get("name"),
        "catalogue": "data.gov.ma — organisation bank-al-maghrib",
        "summary": {
            "candidate_series": len(candidates),
            "valid_series": len(valid),
            "rejected_series": len(rejected),
            "duplicate_indicator_codes": len(duplicate_codes),
            "distinct_datasets": len(datasets),
            "warnings": len(warnings),
        },
        "units": dict(units),
        "series_by_dataset": dict(datasets),
        "duplicate_codes": duplicate_codes,
        "duplicate_groups": duplicate_groups,
        "warnings": warnings,
        "rejected_examples": [
            {
                "indicator_code": series.get("indicator_code"),
                "label_fr": series.get("label_fr"),
                "dataset_name": series.get("dataset_name"),
                "unit_fr": series.get("unit_fr"),
                "reason": rejection_reason(series),
            }
            for series in rejected[:30]
        ],
        "indicators": [
            {**series, "validation_status": "valid" if _is_valid_statistics_series(series) else "rejected"}
            for series in candidates
        ],
    }
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(preview, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print("BAM CKAN CANDIDATE SERIES:", len(candidates))
    print("BAM CKAN VALID SERIES:", len(valid))
    print("BAM CKAN REJECTED SERIES:", len(rejected))
    print("BAM CKAN DATASETS WITH SERIES:", len(datasets))
    print("BAM CKAN UNIT DISTRIBUTION:", json.dumps(dict(units), ensure_ascii=False, sort_keys=True))
    print("BAM CKAN DUPLICATE CODES:", json.dumps(duplicate_codes, ensure_ascii=False))
    print("BAM CKAN DUPLICATE DETAILS:", json.dumps(duplicate_groups[:25], ensure_ascii=False))
    print("BAM CKAN WARNINGS:", len(warnings))
    for warning in warnings[:20]:
        print("BAM CKAN WARNING:", warning)
    print("BAM CKAN PREVIEW WRITTEN:", OUTPUT_FILE.name)

    if duplicate_codes:
        raise RuntimeError("Codes BAM CKAN encore dupliqués après l'ajout du nom de feuille.")
    if not valid:
        raise RuntimeError("Aucune série BAM CKAN valide après contrôle qualité.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
