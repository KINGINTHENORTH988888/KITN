#!/usr/bin/env python3
"""Read-only live validation of Bank Al-Maghrib's public MONIA HTML table.

Writes a CI artifact for review; never modifies the published statistics files.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from pipeline.collectors import collect_bank_al_maghrib
from pipeline.run_pipeline import _is_valid_statistics_series


ROOT = Path(__file__).resolve().parents[1]
SOURCES_FILE = ROOT / "data" / "sources.json"
OUTPUT_FILE = ROOT / "data" / "bam-monia-preview.json"


def main() -> int:
    sources = json.loads(SOURCES_FILE.read_text(encoding="utf-8"))
    source = next((item for item in sources if item.get("id") == "bank_al_maghrib_monia"), None)
    if not source:
        raise RuntimeError("La source bank_al_maghrib_monia est absente de data/sources.json.")

    items = collect_bank_al_maghrib(source)
    series = [
        item["statistics_series"]
        for item in items
        if isinstance(item, dict) and isinstance(item.get("statistics_series"), dict)
    ]
    if not series:
        raise RuntimeError("Le tableau officiel MONIA n'a produit aucune série statistique.")

    expected_codes = {"BAM_MONIA_RATE", "BAM_MONIA_VOLUME"}
    by_code = {str(item.get("indicator_code") or ""): item for item in series}
    missing = sorted(expected_codes - set(by_code))
    if missing:
        raise RuntimeError("Séries MONIA manquantes : " + ", ".join(missing))

    for code, item in by_code.items():
        if not _is_valid_statistics_series(item):
            raise RuntimeError(f"La série {code} ne passe pas la validation statistique.")
        periods = [str(point.get("year")) for point in item.get("history", []) if isinstance(point, dict)]
        if len(periods) < 2 or len(set(periods)) != len(periods):
            raise RuntimeError(f"La série {code} doit contenir au moins deux dates distinctes.")

    preview = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source_id": source["id"],
        "source_name": source.get("name"),
        "source_url": source.get("statistics_pages", [{}])[0].get("url"),
        "summary": {
            "series_count": len(series),
            "observation_count": max(len(item.get("history", [])) for item in series),
            "latest_reference_date": max(
                str(point.get("year"))
                for item in series
                for point in item.get("history", [])
                if isinstance(point, dict)
            ),
        },
        "series": series,
    }
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(preview, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print("BAM MONIA SERIES:", len(series))
    for code, item in sorted(by_code.items()):
        history = item.get("history") or []
        print(
            "BAM MONIA INDICATOR:",
            code,
            "| observations:",
            len(history),
            "| latest:",
            json.dumps(item.get("latest"), ensure_ascii=False),
            "| previous:",
            json.dumps(item.get("previous"), ensure_ascii=False),
        )
    print("BAM MONIA PREVIEW WRITTEN:", OUTPUT_FILE.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
