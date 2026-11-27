import json
from datetime import datetime, timezone
from pathlib import Path

from pipeline.collectors import collect_hcp_labour_statistics

# One-off, read-only live check after hardening the HCP article-body parser.


def main() -> None:
    sources = json.loads(Path("data/sources.json").read_text(encoding="utf-8"))
    source = next(item for item in sources if item.get("id") == "hcp_labour_statistics")

    items = collect_hcp_labour_statistics(source)
    regional = [
        series
        for item in items
        for series in (item.get("regional_statistics") or [])
    ]
    warnings = sorted({
        warning
        for item in items
        for warning in (item.get("statistics_collection_warnings") or [])
    })

    scopes = {series.get("residence_scope") for series in regional}
    indicators = {series.get("indicator_code") for series in regional}
    regions = {series.get("geography_code") for series in regional}
    periods = {
        point.get("year")
        for series in regional
        for point in (series.get("history") or [])
    }

    print("HCP NATIONAL ITEMS:", len(items))
    print("HCP REGIONAL SERIES:", len(regional))
    print("HCP REGIONAL SCOPES:", sorted(scopes))
    print("HCP REGIONAL INDICATORS:", len(indicators))
    print("HCP GEOGRAPHIES:", len(regions))
    print("HCP PERIODS:", sorted(periods))
    print("HCP WARNINGS:", warnings)

    if len(regional) != 234:
        raise SystemExit(f"Expected 234 regional series from the current PDF, received {len(regional)}")
    if scopes != {"all", "urban", "rural"} or len(indicators) != 6 or len(regions) != 13:
        raise SystemExit("The regional PDF extraction is incomplete or has an unexpected structure")
    if periods != {"T1/2026", "T2/2026", "T3/2026"}:
        raise SystemExit(f"Unexpected periods: {sorted(periods)}")
    if warnings:
        raise SystemExit("The HCP collector reported warnings during the live validation")

    collected_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    regional_series = []
    for item in regional:
        series = dict(item)
        series["last_successful_collection_at"] = collected_at
        series["collection_status"] = "collected"
        regional_series.append(series)
    regional_series.sort(key=lambda item: (
        str(item.get("indicator_code") or ""),
        str(item.get("residence_scope") or ""),
        str(item.get("geography_code") or ""),
    ))
    payload = {
        "generated_at": collected_at,
        "source": "Haut-Commissariat au Plan — Enquête sur la main-d’œuvre",
        "series_count": len(regional_series),
        "series": regional_series,
    }
    for output_path in (
        Path("data/regional-statistics.json"),
        Path("public/data/regional-statistics.json"),
    ):
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print("HCP REGIONAL DATASET WRITTEN:", output_path, "| bytes:", output_path.stat().st_size)

    sample = next(
        series for series in regional
        if series.get("indicator_code") == "HCP_EMO_REGIONAL_STRICT_UNEMPLOYMENT"
        and series.get("residence_scope") == "all"
        and series.get("geography_code") == "DAKHLA_OUED_ED_DAHAB"
    )
    print("SAMPLE DAKHLA STRICT UNEMPLOYMENT:", sample.get("latest"))


if __name__ == "__main__":
    main()
