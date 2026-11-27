import json
from pathlib import Path

from pipeline.collectors import collect_hcp_labour_statistics


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

    sample = next(
        series for series in regional
        if series.get("indicator_code") == "HCP_EMO_REGIONAL_STRICT_UNEMPLOYMENT"
        and series.get("residence_scope") == "all"
        and series.get("geography_code") == "DAKHLA_OUED_ED_DAHAB"
    )
    print("SAMPLE DAKHLA STRICT UNEMPLOYMENT:", sample.get("latest"))


if __name__ == "__main__":
    main()
