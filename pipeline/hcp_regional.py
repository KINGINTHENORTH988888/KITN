"""Parsing helpers for HCP EMO regional tables.

The parser is deliberately independent from PDF I/O so that extracted text can
be tested against saved, small fixtures before the collector downloads PDFs.
"""
from __future__ import annotations

import re
from typing import Any


HCP_EMO_REGIONS = (
    ("Tanger-Tétouan-Al Hoceima", "TANGER_TETOUAN_AL_HOCEIMA"),
    ("Oriental", "ORIENTAL"),
    ("Fès-Meknès", "FES_MEKNES"),
    ("Rabat-Salé-Kénitra", "RABAT_SALE_KENITRA"),
    ("Béni Mellal-Khénifra", "BENI_MELLAL_KHENIFRA"),
    ("Casablanca-Settat", "CASABLANCA_SETTAT"),
    ("Marrakech-Safi", "MARRAKECH_SAFI"),
    ("Drâa-Tafilalet", "DRAA_TAFILALET"),
    ("Souss-Massa", "SOUSS_MASSA"),
    ("Guelmim-Oued Noun", "GUELMIM_OUED_NOUN"),
    ("Laâyoune-Sakia El Hamra", "LAAYOUNE_SAKIA_EL_HAMRA"),
    ("Dakhla-Oued Ed-Dahab", "DAKHLA_OUED_ED_DAHAB"),
)

HCP_EMO_REGIONAL_INDICATORS = (
    (
        "LABOUR_FORCE_PARTICIPATION",
        "Taux de participation à la main-d’œuvre",
        "Taux de participation à la main[-\\s]?d’œuvre",
    ),
    (
        "EMPLOYMENT_RATE",
        "Taux d’emploi contre revenu",
        "Taux d[’']emploi contre revenu",
    ),
    (
        "UNDERUTILIZATION",
        "Taux composite de la sous-utilisation de la main-d’œuvre",
        "Taux composite de la sous-utilisation de la main[-\\s]?d’œuvre",
    ),
    (
        "STRICT_UNEMPLOYMENT",
        "Taux de chômage strict",
        "Taux de chômage strict",
    ),
    (
        "COMBINED_UNEMPLOYMENT_POTENTIAL",
        "Taux combiné du chômage strict et de la main-d’œuvre potentielle",
        "Taux combiné du chômage strict et de la main[-\\s]?d’œuvre potentielle",
    ),
    (
        "COMBINED_UNEMPLOYMENT_UNDEREMPLOYMENT",
        "Taux combiné du chômage strict et du sous-emploi lié à la durée de travail",
        "Taux combiné du chômage strict et du sous-emploi lié à la durée de travail",
    ),
)

_CELL = r"(?:-?\d+(?:[,.]\d+)?(?:\s*(?:ᵐˢ|ms))?|ps|\.)"


def _parse_cell(token: str) -> tuple[float | None, str]:
    normalized = re.sub(r"\s+", "", str(token or "")).casefold()
    normalized = normalized.replace("ᵐˢ", "ms").replace("ᴹˢ", "ms")
    if normalized in {"", ".", "…", "..."}:
        return None, "not_available"
    if normalized == "ps":
        return None, "insufficient_significance"
    match = re.fullmatch(r"(-?\d+(?:[,.]\d+)?)(ms)?", normalized)
    if not match:
        return None, "unrecognized"
    try:
        value = float(match.group(1).replace(",", "."))
    except ValueError:
        return None, "unrecognized"
    return value, "medium_significance" if match.group(2) else "standard"


def _page_periods(text: str) -> list[str]:
    match = re.search(
        r"Indicateurs\s+(T[1-4]/20\d{2})\s+(T[1-4]/20\d{2})\s+(T[1-4]/20\d{2})",
        text,
        re.IGNORECASE,
    )
    return [value.upper() for value in match.groups()] if match else []


def parse_hcp_emo_regional_tables(
    extracted_text: str,
    *,
    source_url: str,
    published_date: str | None = None,
) -> list[dict[str, Any]]:
    """Parse the regional HCP EMO tables from extracted PDF text.

    Returns one series per indicator, residence scope and region (plus the
    national total). Suppressed/insufficient-significance cells remain explicit
    as null observations with a quality flag; they are never converted to zero.
    """
    if not extracted_text or not source_url:
        return []

    pages = str(extracted_text).split("\f")
    output: list[dict[str, Any]] = []
    seen_keys: set[str] = set()

    for page_index, raw_page in enumerate(pages, start=1):
        normalized_page = (
            raw_page.replace("\u00a0", " ")
            .replace("\u202f", " ")
            .replace("‑", "-")
            .replace("–", "-")
        )
        page = re.sub(r"\s+", " ", normalized_page).strip()
        if not page:
            continue
        periods = _page_periods(page)
        if not periods:
            continue

        # The first section label on these table pages is the residence scope.
        heading = page[: min(len(page), 900)].casefold()
        if re.search(r"\burbain\b", heading):
            residence_scope = "urban"
        elif re.search(r"\brural\b", heading):
            residence_scope = "rural"
        else:
            residence_scope = "all"

        indicator = None
        for code, label, pattern in HCP_EMO_REGIONAL_INDICATORS:
            if re.search(pattern, page, re.IGNORECASE):
                indicator = (code, label)
                break
        if not indicator:
            continue

        code, label = indicator
        rows: list[tuple[str, str, list[tuple[float | None, str]]]] = []

        for region_name, region_code in HCP_EMO_REGIONS:
            match = re.search(
                re.escape(region_name) + r"\s+(" + _CELL + r")\s+(" + _CELL + r")\s+(" + _CELL + r")",
                page,
                re.IGNORECASE,
            )
            if not match:
                continue
            cells = [_parse_cell(match.group(i)) for i in range(1, 4)]
            rows.append((region_name, region_code, cells))

        total_match = re.search(
            r"\bEnsemble\s+(" + _CELL + r")\s+(" + _CELL + r")\s+(" + _CELL + r")",
            page,
            re.IGNORECASE,
        )
        if total_match:
            rows.append(("Ensemble national", "MAR", [_parse_cell(total_match.group(i)) for i in range(1, 4)]))

        if not rows:
            continue

        for region_name, region_code, cells in rows:
            key = f"{code}:{residence_scope}:{region_code}"
            if key in seen_keys:
                continue
            seen_keys.add(key)
            history = [
                {
                    "year": period,
                    "value": value,
                    "quality_flag": quality_flag,
                }
                for period, (value, quality_flag) in zip(periods, cells)
            ]
            # The latest period stays explicit even when HCP suppresses its value.
            # Never fall back to an older quarter and present it as the current one.
            latest = history[-1]
            output.append({
                "id": key,
                "series_key": key,
                "indicator_code": f"HCP_EMO_REGIONAL_{code}",
                "label_fr": label,
                "unit_fr": "%",
                "frequency": "quarterly",
                "geography_level": "country" if region_code == "MAR" else "region",
                "geography_code": region_code,
                "geography_name_fr": region_name,
                "residence_scope": residence_scope,
                "history": history,
                "latest": latest,
                "source_name": "Haut-Commissariat au Plan — Enquête sur la main-d’œuvre",
                "source_url": source_url,
                "last_updated": published_date or periods[-1],
                "comparability_group": "HCP_EMO_2026",
                "methodology_break": True,
                "methodology_note_fr": (
                    "Rupture méthodologique : l’EMO 2026 remplace l’ENE. "
                    "Ne pas raccorder directement cette série aux anciennes séries ENE."
                ),
                "source_page": page_index,
            })

    return output
