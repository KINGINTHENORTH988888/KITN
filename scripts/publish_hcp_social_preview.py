"""Publish a verified HCP social-indicators preview without running the full pipeline."""
import json
from datetime import datetime, timezone
from pathlib import Path

from pipeline.collectors import collect_hcp_social_indicators
from pipeline.run_pipeline import _merge_regional_statistics_series, _merge_valid_statistics_series


EXPECTED_LATEST = {
    "HCP_SOCIAL_POPULATION": 36828.0,
    "HCP_SOCIAL_URBANIZATION": 62.8,
    "HCP_SOCIAL_FERTILITY": 1.97,
    "HCP_SOCIAL_UNEMPLOYMENT": 13.3,
    "HCP_SOCIAL_PRIMARY_NET_SCHOOLING": 99.1,
    "HCP_SOCIAL_UPPER_SECONDARY_GROSS_SCHOOLING": 73.0,
    "HCP_SOCIAL_UNDER5_MORTALITY": 22.2,
    "HCP_SOCIAL_GINI": 0.405,
}
SOURCE_NAME = "Haut-Commissariat au Plan — Les indicateurs sociaux du Maroc, édition 2026"
EXPECTED_REGIONAL_SERIES = 108



def merge_hcp_regional_preview(existing_payload: dict, incoming: list[dict], collected_at: str) -> dict:
    """Append HCP social regional series without discarding existing EMO history."""
    if not isinstance(existing_payload, dict):
        raise ValueError("Existing HCP regional dataset is not a JSON object.")
    existing_series = existing_payload.get("series")
    if not isinstance(existing_series, list):
        raise ValueError("Existing HCP regional dataset has no valid series list.")

    merged_by_key = {}
    for series in existing_series:
        if not isinstance(series, dict):
            continue
        key = str(series.get("series_key") or series.get("id") or "").strip()
        if key:
            merged_by_key[key] = series

    for series in incoming:
        if not isinstance(series, dict):
            raise ValueError("HCP social regional series contains a non-object entry.")
        key = str(series.get("series_key") or series.get("id") or "").strip()
        merged = _merge_regional_statistics_series(merged_by_key.get(key), series, collected_at)
        if merged is None:
            raise ValueError(f"Quality validation rejected HCP regional series {key or '(missing key)'}.")
        merged_by_key[key] = merged

    merged_series = sorted(
        merged_by_key.values(),
        key=lambda item: (
            str(item.get("indicator_code") or ""),
            str(item.get("residence_scope") or ""),
            str(item.get("geography_code") or ""),
        ),
    )
    payload = dict(existing_payload)
    payload.update({
        "generated_at": collected_at,
        "source": "Sources officielles du HCP — EMO et indicateurs sociaux du Maroc, édition 2026",
        "series_count": len(merged_series),
        "series": merged_series,
    })
    return payload


def main() -> None:
    items = collect_hcp_social_indicators({
        "url": "https://www.hcp.ma/file/248623/",
        "pdf_url": "https://www.hcp.ma/file/248623/",
        "referer": "https://www.hcp.ma/downloads/Les-indicateurs-sociaux_t22430.html",
    })
    incoming = [
        item["statistics_series"]
        for item in items
        if isinstance(item, dict) and isinstance(item.get("statistics_series"), dict)
    ]
    warnings = sorted({
        warning
        for item in items
        for warning in (item.get("statistics_collection_warnings") or [])
    })
    regional_incoming = [
        regional
        for item in items
        if isinstance(item, dict)
        for regional in (item.get("regional_statistics") or [])
        if isinstance(regional, dict)
    ]
    observed = {item["indicator_code"]: item.get("latest", {}).get("value") for item in incoming}
    if warnings:
        raise SystemExit("HCP social report warnings: " + " | ".join(warnings))
    if set(observed) != set(EXPECTED_LATEST):
        raise SystemExit(f"Expected {len(EXPECTED_LATEST)} social series, received {len(observed)}.")
    if len(regional_incoming) != EXPECTED_REGIONAL_SERIES:
        raise SystemExit(
            f"Expected {EXPECTED_REGIONAL_SERIES} regional social series, received {len(regional_incoming)}."
        )
    for code, expected in EXPECTED_LATEST.items():
        actual = observed.get(code)
        if actual is None or abs(float(actual) - expected) > 0.001:
            raise SystemExit(f"{code}: expected {expected}, received {actual}.")

    statistics_path = Path("data/statistics.json")
    public_statistics_path = Path("public/data/statistics.json")
    payload = json.loads(statistics_path.read_text(encoding="utf-8"))
    existing = {
        str(item.get("indicator_code") or item.get("id") or ""): item
        for item in payload.get("indicators", [])
        if isinstance(item, dict) and (item.get("indicator_code") or item.get("id"))
    }
    collected_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    for series in incoming:
        code = str(series["indicator_code"])
        merged = _merge_valid_statistics_series(existing.get(code), series, collected_at)
        if merged is None:
            raise SystemExit(f"Quality validation rejected HCP series {code}.")
        existing[code] = merged

    indicators = list(existing.values())
    sources = list(payload.get("sources") or [])
    if SOURCE_NAME not in sources:
        sources.append(SOURCE_NAME)
    payload.update({
        "generated_at": collected_at,
        "source": "Sources officielles — " + " et ".join(sources),
        "sources": sources,
        "indicator_count": len(indicators),
        "indicators": indicators,
    })
    serialized = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    statistics_path.parent.mkdir(parents=True, exist_ok=True)
    public_statistics_path.parent.mkdir(parents=True, exist_ok=True)
    statistics_path.write_text(serialized, encoding="utf-8")
    public_statistics_path.write_text(serialized, encoding="utf-8")

    regional_path = Path("data/regional-statistics.json")
    public_regional_path = Path("public/data/regional-statistics.json")
    if not regional_path.exists():
        raise SystemExit("HCP EMO regional dataset is missing; refusing to publish a partial social preview.")
    regional_payload = json.loads(regional_path.read_text(encoding="utf-8"))
    regional_payload = merge_hcp_regional_preview(regional_payload, regional_incoming, collected_at)
    regional_serialized = json.dumps(regional_payload, ensure_ascii=False, indent=2) + "\n"
    public_regional_path.parent.mkdir(parents=True, exist_ok=True)
    regional_path.write_text(regional_serialized, encoding="utf-8")
    public_regional_path.write_text(regional_serialized, encoding="utf-8")

    print("HCP SOCIAL PREVIEW SERIES:", len(incoming))
    print("HCP SOCIAL REGIONAL SERIES:", len(regional_incoming))
    print("REGIONAL STATISTICS TOTAL AFTER HCP:", regional_payload["series_count"])
    print("HCP SOCIAL PREVIEW VALUES:", observed)
    print("STATISTICS TOTAL AFTER HCP:", len(indicators))
    print(
        "SOCIAL SERIES TOTAL AFTER HCP:",
        sum(item.get("pole") == "societe_developpement_humain" for item in indicators),
    )
    print("HCP SOCIAL PREVIEW GENERATED:", collected_at)


if __name__ == "__main__":
    main()
