"""Structured extraction of selected national social indicators from the HCP 2026 compendium."""
from __future__ import annotations

import re


HCP_SOCIAL_REPORT_URL = "https://www.hcp.ma/file/248623/"
HCP_SOCIAL_REPORT_DATE = "2026-07-27"
HCP_SOCIAL_SOURCE_NAME = "Haut-Commissariat au Plan — Les indicateurs sociaux du Maroc, édition 2026"

# Each definition points to one named HCP table and one unambiguous row.
# This intentionally favors a smaller, auditable set over speculative extraction.
_TABLES = (
    {
        "code": "HCP_SOCIAL_POPULATION",
        "label": "Population légale",
        "description": "Population légale du Maroc, issue des recensements généraux de la population et de l'habitat.",
        "unit": "milliers d'habitants",
        "category": "Démographie",
        "table": r"Tableau\s+1\.1\s*:",
        "row": r"^Ensemble\b",
    },
    {
        "code": "HCP_SOCIAL_URBANIZATION",
        "label": "Taux d’urbanisation",
        "description": "Part de la population résidant en milieu urbain selon les recensements du HCP.",
        "unit": "%",
        "category": "Démographie",
        "table": r"Tableau\s+1\.4\s*:",
        "row": r"^Taux\s+d['’]urbanisation\b",
    },
    {
        "code": "HCP_SOCIAL_FERTILITY",
        "label": "Indice synthétique de fécondité",
        "description": "Nombre moyen d'enfants par femme, selon les recensements du HCP.",
        "unit": "enfants par femme",
        "category": "Démographie",
        "table": r"Tableau\s+1\.20\s*:",
        "row": r"^ISF\s*\(",
    },
    {
        "code": "HCP_SOCIAL_UNEMPLOYMENT",
        "label": "Taux de chômage — national",
        "description": "Taux de chômage national issu de l’Enquête nationale sur l’emploi du HCP.",
        "unit": "%",
        "category": "Emploi et activité",
        "table": r"Tableau\s+2\.20\s*:",
        "row": r"^Ensemble\b",
    },
    {
        "code": "HCP_SOCIAL_PRIMARY_NET_SCHOOLING",
        "label": "Taux net de scolarisation au primaire",
        "description": "Taux net de scolarisation au primaire, total national, selon le ministère de l’Éducation nationale.",
        "unit": "%",
        "category": "Éducation",
        "table": r"Tableau\s+3\.23\s*:",
        "row": r"^Total\b",
        "national_section": True,
    },
    {
        "code": "HCP_SOCIAL_UPPER_SECONDARY_GROSS_SCHOOLING",
        "label": "Taux brut de scolarisation au secondaire qualifiant",
        "description": "Taux brut de scolarisation au secondaire qualifiant, total national, selon le ministère de l’Éducation nationale.",
        "unit": "%",
        "category": "Éducation",
        "table": r"Tableau\s+3\.38\s*:",
        "row": r"^Total\b",
        "national_section": True,
    },
    {
        "code": "HCP_SOCIAL_UNDER5_MORTALITY",
        "label": "Quotient de mortalité infanto-juvénile",
        "description": "Quotient de mortalité des enfants de moins de cinq ans, pour mille naissances vivantes.",
        "unit": "décès pour 1 000 naissances vivantes",
        "category": "Santé",
        "table": r"Tableau\s+4\.35\s*:",
        "row": r"^Ensemble\b",
    },
    {
        "code": "HCP_SOCIAL_GINI",
        "label": "Indice de Gini des dépenses",
        "description": "Indice de Gini mesurant les inégalités de dépenses des ménages.",
        "unit": "indice (0 à 1)",
        "category": "Pauvreté et inégalités",
        "table": r"Tableau\s+6\.23\s*:",
        "row": r"^Ensemble\b",
    },
)

_YEAR_RE = re.compile(r"(?<!\d)(?:19|20)\d{2}(?:\s*/\s*\d{2})?(?!\d)")
_NUMBER_RE = re.compile(r"(?<![\w/])(?:\d{1,3}(?:[ \u00a0]\d{3})+|\d+(?:[,.]\d+)?)(?![\w/])")


def _numbers_from_row(line: str) -> list[float]:
    values = []
    for raw in _NUMBER_RE.findall(line):
        normalized = raw.replace("\u00a0", "").replace(" ", "").replace(",", ".")
        try:
            values.append(float(normalized))
        except ValueError:
            continue
    return values


def _extract_table_observations(lines: list[str], definition: dict) -> tuple[list[dict], str | None]:
    starts = [
        i for i, line in enumerate(lines)
        if re.search(definition["table"], line, re.IGNORECASE)
    ]
    if not starts:
        return [], f"{definition['code']} : tableau HCP introuvable ({definition['table']})."

    for start in starts:
        block = []
        for line in lines[start + 1 : start + 65]:
            if re.search(r"\\bTableau\\s+\\d+\\.\\d+(?:\\s+[a-z])?\\s*:", line, re.IGNORECASE):
                break
            block.append(re.sub(r"\\s+", " ", line).strip())

        years = []
        for line in block:
            candidates = _YEAR_RE.findall(line)
            if len(candidates) >= 2:
                years = [re.sub(r"\\s+", "", item) for item in candidates]
                break
        if not years:
            # The first occurrence is often the table of contents; keep looking
            # for the actual table, which has a period header and data rows.
            continue

        national_seen = not definition.get("national_section", False)
        selected = None
        for line in block:
            if definition.get("national_section") and re.match(r"^National\\b", line, re.IGNORECASE):
                national_seen = True
                continue
            if not national_seen:
                continue
            if re.search(definition["row"], line, re.IGNORECASE):
                selected = line
                break

        if selected is None:
            continue
        values = _numbers_from_row(selected)
        if len(values) != len(years):
            continue
        return [
            {"year": year, "value": value}
            for year, value in zip(years, values)
        ], None

    return [], f"{definition['code']} : tableau trouvé mais ligne nationale ou périodes non exploitables."

def parse_hcp_social_indicators(text: str, source_url: str = HCP_SOCIAL_REPORT_URL) -> tuple[list[dict], list[str]]:
    """Parse explicitly identified national rows from the HCP 2026 social indicators PDF."""
    lines = [line.strip() for line in str(text or "").splitlines() if line.strip()]
    series = []
    warnings = []

    for definition in _TABLES:
        history, warning = _extract_table_observations(lines, definition)
        if warning:
            warnings.append(warning)
            continue
        latest = history[-1]
        previous = history[-2] if len(history) > 1 else None
        code = definition["code"]
        series.append({
            "id": code,
            "indicator_code": code,
            "label_fr": definition["label"],
            "label_ar": definition["label"],
            "description_fr": definition["description"],
            "description_ar": definition["description"],
            "unit_fr": definition["unit"],
            "unit_ar": definition["unit"],
            "scale_divisor": 1,
            "precision": 2 if code == "HCP_SOCIAL_GINI" else 1,
            "category": definition["category"],
            "pole": "societe_developpement_humain",
            "frequency": "annuelle" if code in {
                "HCP_SOCIAL_UNEMPLOYMENT",
                "HCP_SOCIAL_PRIMARY_NET_SCHOOLING",
                "HCP_SOCIAL_UPPER_SECONDARY_GROSS_SCHOOLING",
            } else "recensement / enquête",
            "latest": latest,
            "previous": previous,
            "history": history,
            "source_name": HCP_SOCIAL_SOURCE_NAME,
            "source_name_ar": "المندوبية السامية للتخطيط — المؤشرات الاجتماعية للمغرب، طبعة 2026",
            "source_url": source_url,
            "last_updated": HCP_SOCIAL_REPORT_DATE,
            "methodology_note_fr": (
                "Extraction automatisée d'une ligne explicitement identifiée dans le tableau source. "
                "Les périodes et définitions suivent la publication HCP 2026 ; elles ne sont pas "
                "fusionnées avec les estimations internationales."
            ),
            "methodology_note_ar": (
                "استخراج آلي لسطر محدد من الجدول الأصلي. الفترات والتعاريف تتبع منشور المندوبية "
                "لسنة 2026، ولا يتم دمجها مع التقديرات الدولية."
            ),
        })
    return series, warnings
