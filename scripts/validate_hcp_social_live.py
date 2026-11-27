"""Read-only live validation of the HCP 2026 national social-indicators PDF."""
from pipeline.collectors import collect_hcp_social_indicators


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


def main() -> None:
    items = collect_hcp_social_indicators({
        "url": "https://www.hcp.ma/file/248623/",
        "pdf_url": "https://www.hcp.ma/file/248623/",
        "referer": "https://www.hcp.ma/downloads/Les-indicateurs-sociaux_t22430.html",
    })
    series = [
        item["statistics_series"]
        for item in items
        if isinstance(item, dict) and isinstance(item.get("statistics_series"), dict)
    ]
    warnings = sorted({
        warning
        for item in items
        for warning in (item.get("statistics_collection_warnings") or [])
    })
    observed = {item["indicator_code"]: item.get("latest", {}).get("value") for item in series}

    print("HCP SOCIAL REPORT SERIES:", len(series))
    print("HCP SOCIAL REPORT INDICATORS:", sorted(observed))
    print("HCP SOCIAL REPORT LATEST:", observed)
    print("HCP SOCIAL REPORT WARNINGS:", warnings)

    if warnings:
        raise SystemExit("The HCP social-indicators collector returned warnings.")
    if set(observed) != set(EXPECTED_LATEST):
        raise SystemExit(
            f"Expected {len(EXPECTED_LATEST)} identified series, received {len(observed)}."
        )
    for code, expected in EXPECTED_LATEST.items():
        actual = observed.get(code)
        if actual is None or abs(float(actual) - expected) > 0.001:
            raise SystemExit(f"{code}: expected {expected}, received {actual}.")


if __name__ == "__main__":
    main()
