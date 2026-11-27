"""Structured extraction of selected national social indicators from the HCP 2026 compendium."""
from __future__ import annotations

import re

from pipeline.hcp_regional import HCP_EMO_REGIONS, HCP_EMO_REGION_NAMES_AR


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


_AR_TRANSLATIONS = {
    "HCP_SOCIAL_POPULATION": {
        "label": "السكان القانونيون",
        "description": "عدد السكان القانونيين للمغرب، استنادًا إلى الإحصاءات العامة للسكان والسكنى.",
        "unit": "ألف نسمة",
        "category": "الديموغرافيا",
    },
    "HCP_SOCIAL_URBANIZATION": {
        "label": "معدل التمدّن",
        "description": "نسبة السكان المقيمين في الوسط الحضري وفقًا لإحصاءات المندوبية السامية للتخطيط.",
        "unit": "%",
        "category": "الديموغرافيا",
    },
    "HCP_SOCIAL_FERTILITY": {
        "label": "مؤشر الخصوبة الإجمالي",
        "description": "متوسط عدد الأطفال لكل امرأة وفقًا لإحصاءات المندوبية السامية للتخطيط.",
        "unit": "طفل لكل امرأة",
        "category": "الديموغرافيا",
    },
    "HCP_SOCIAL_UNEMPLOYMENT": {
        "label": "معدل البطالة الوطني",
        "description": "معدل البطالة الوطني المستند إلى البحث الوطني حول التشغيل الصادر عن المندوبية السامية للتخطيط.",
        "unit": "%",
        "category": "التشغيل والنشاط",
    },
    "HCP_SOCIAL_PRIMARY_NET_SCHOOLING": {
        "label": "معدل التمدرس الصافي بالتعليم الابتدائي",
        "description": "معدل التمدرس الصافي بالتعليم الابتدائي على المستوى الوطني، وفقًا لبيانات وزارة التربية الوطنية.",
        "unit": "%",
        "category": "التعليم",
    },
    "HCP_SOCIAL_UPPER_SECONDARY_GROSS_SCHOOLING": {
        "label": "معدل التمدرس الإجمالي بالتعليم الثانوي التأهيلي",
        "description": "معدل التمدرس الإجمالي بالتعليم الثانوي التأهيلي على المستوى الوطني، وفقًا لبيانات وزارة التربية الوطنية.",
        "unit": "%",
        "category": "التعليم",
    },
    "HCP_SOCIAL_UNDER5_MORTALITY": {
        "label": "معدل وفيات الأطفال دون سن الخامسة",
        "description": "عدد وفيات الأطفال دون سن الخامسة لكل ألف ولادة حية.",
        "unit": "وفاة لكل 1,000 ولادة حية",
        "category": "الصحة",
    },
    "HCP_SOCIAL_GINI": {
        "label": "معامل جيني للنفقات",
        "description": "معامل جيني لقياس التفاوت في نفقات الأسر.",
        "unit": "مؤشر (من 0 إلى 1)",
        "category": "الفقر والتفاوتات",
    },
}

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

    mismatch_warning = None
    for start in starts:
        block = []
        for line in lines[start + 1 : start + 65]:
            if re.search(r"\bTableau\s+\d+\.\d+(?:\s+[a-z])?\s*:", line, re.IGNORECASE):
                break
            block.append(re.sub(r"\s+", " ", line).strip())

        years = []
        for line in block:
            candidates = _YEAR_RE.findall(line)
            if len(candidates) >= 2:
                years = [re.sub(r"\s+", "", item) for item in candidates]
                break
        if not years:
            # The first occurrence is often the table of contents; keep looking
            # for the actual table, which has a period header and data rows.
            continue

        national_seen = not definition.get("national_section", False)
        selected = None
        for line in block:
            if definition.get("national_section") and re.match(r"^National\b", line, re.IGNORECASE):
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
            mismatch_warning = (
                f"{definition['code']} : {len(values)} valeurs détectées pour "
                f"{len(years)} périodes ; série ignorée par prudence."
            )
            continue
        return [
            {"year": year, "value": value}
            for year, value in zip(years, values)
        ], None

    if mismatch_warning:
        return [], mismatch_warning
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
        translation = _AR_TRANSLATIONS[code]
        series.append({
            "id": code,
            "indicator_code": code,
            "label_fr": definition["label"],
            "label_ar": translation["label"],
            "description_fr": definition["description"],
            "description_ar": translation["description"],
            "unit_fr": definition["unit"],
            "unit_ar": translation["unit"],
            "category_ar": translation["category"],
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


_SOCIAL_REGION_ALIASES = {
    "DRAA_TAFILALET": ("Draa-Tafilalet",),
    "LAAYOUNE_SAKIA_EL_HAMRA": ("Laayoune-Sakia Al Hamra", "Laâyoune-Sakia Al Hamra"),
    "DAKHLA_OUED_ED_DAHAB": ("Dakhla-Oued Eddahab",),
}

_SOCIAL_REGIONAL_TABLES = (
    {
        "pattern": r"Tableau\s+6\.21\s*:",
        "periods": ("2001", "2014", "2022"),
        "source_page": 258,
        "indicators": ({
            "code": "HCP_SOCIAL_REGIONAL_MONETARY_POVERTY",
            "label_fr": "Taux de pauvreté monétaire",
            "label_ar": "معدل الفقر النقدي",
            "description_fr": "Part de la population vivant sous le seuil national de pauvreté monétaire, par région.",
            "description_ar": "نسبة السكان الذين يعيشون تحت عتبة الفقر النقدي الوطني حسب الجهة.",
            "unit_fr": "%",
            "unit_ar": "٪",
            "indexes": (0, 1, 2),
            "comparability_group": "HCP_ENCDM_ENNVM_MONETARY_POVERTY",
            "methodology_note_fr": "Série publiée par le HCP à partir de l’ENCDM 2001 et 2014 et de l’ENNVM 2022.",
            "methodology_note_ar": "سلسلة منشورة من المندوبية السامية للتخطيط اعتمادًا على بحث نفقات الاستهلاك 2001 و2014 والبحث الوطني حول مستوى معيشة الأسر 2022.",
        },),
    },
    {
        "pattern": r"Tableau\s+6\.21a\s*:",
        "periods": ("2014", "2024"),
        "source_page": 258,
        "indicators": (
            {
                "code": "HCP_SOCIAL_REGIONAL_MULTIDIMENSIONAL_POVERTY_INDEX",
                "label_fr": "Indice de pauvreté multidimensionnelle",
                "label_ar": "مؤشر الفقر متعدد الأبعاد",
                "description_fr": "Indice de pauvreté multidimensionnelle par région, selon les RGPH 2014 et 2024.",
                "description_ar": "مؤشر الفقر متعدد الأبعاد حسب الجهة، استنادًا إلى الإحصاءين العامين للسكان والسكنى لسنتي 2014 و2024.",
                "unit_fr": "%",
                "unit_ar": "٪",
                "indexes": (0, 1),
                "comparability_group": "HCP_RGPH_MULTIDIMENSIONAL_POVERTY",
                "methodology_note_fr": "Comparaison issue des RGPH 2014 et 2024 ; l’indice synthétise les privations multidimensionnelles.",
                "methodology_note_ar": "مقارنة مستندة إلى الإحصاءين العامين للسكان والسكنى 2014 و2024؛ ويلخص المؤشر أوجه الحرمان متعددة الأبعاد.",
            },
            {
                "code": "HCP_SOCIAL_REGIONAL_MULTIDIMENSIONAL_POVERTY_RATE",
                "label_fr": "Taux de pauvreté multidimensionnelle",
                "label_ar": "معدل الفقر متعدد الأبعاد",
                "description_fr": "Part de la population en situation de pauvreté multidimensionnelle par région, selon les RGPH 2014 et 2024.",
                "description_ar": "نسبة السكان في وضعية فقر متعدد الأبعاد حسب الجهة، استنادًا إلى الإحصاءين العامين للسكان والسكنى لسنتي 2014 و2024.",
                "unit_fr": "%",
                "unit_ar": "٪",
                "indexes": (2, 3),
                "comparability_group": "HCP_RGPH_MULTIDIMENSIONAL_POVERTY",
                "methodology_note_fr": "Comparaison issue des RGPH 2014 et 2024 ; le taux mesure la part de la population concernée.",
                "methodology_note_ar": "مقارنة مستندة إلى الإحصاءين العامين للسكان والسكنى 2014 و2024؛ ويقيس المعدل نسبة السكان المعنيين.",
            },
        ),
    },
    {
        "pattern": r"Tableau\s+6\.22\s*:",
        "periods": ("2001", "2014", "2022"),
        "source_page": 259,
        "indicators": ({
            "code": "HCP_SOCIAL_REGIONAL_VULNERABILITY",
            "label_fr": "Taux de vulnérabilité monétaire",
            "label_ar": "معدل الهشاشة النقدية",
            "description_fr": "Part de la population exposée au risque de pauvreté monétaire, par région.",
            "description_ar": "نسبة السكان المعرضين لخطر الفقر النقدي حسب الجهة.",
            "unit_fr": "%",
            "unit_ar": "٪",
            "indexes": (0, 1, 2),
            "comparability_group": "HCP_ENCDM_ENNVM_MONETARY_VULNERABILITY",
            "methodology_note_fr": "Série publiée par le HCP à partir de l’ENCDM 2001 et 2014 et de l’ENNVM 2022.",
            "methodology_note_ar": "سلسلة منشورة من المندوبية السامية للتخطيط اعتمادًا على بحث نفقات الاستهلاك 2001 و2014 والبحث الوطني حول مستوى معيشة الأسر 2022.",
        },),
    },
    {
        "pattern": r"Tableau\s+6\.24\s*:",
        "periods": ("2001", "2014", "2022"),
        "source_page": 260,
        "indicators": ({
            "code": "HCP_SOCIAL_REGIONAL_POVERTY_GAP",
            "label_fr": "Indice volumétrique de la pauvreté",
            "label_ar": "مؤشر فجوة الفقر",
            "description_fr": "Mesure de la profondeur de la pauvreté monétaire par région.",
            "description_ar": "مقياس عمق الفقر النقدي حسب الجهة.",
            "unit_fr": "%",
            "unit_ar": "٪",
            "indexes": (0, 1, 2),
            "comparability_group": "HCP_ENCDM_ENNVM_POVERTY_GAP",
            "methodology_note_fr": "Les valeurs marquées d’un astérisque dans la publication HCP sont des estimations établies à partir de la carte de pauvreté monétaire 2014.",
            "methodology_note_ar": "القيم المعلّمة بنجمة في منشور المندوبية السامية للتخطيط هي تقديرات مستندة إلى خريطة الفقر النقدي لسنة 2014.",
        },),
    },
    {
        "pattern": r"Tableau\s+6\.25\s*:",
        "periods": ("2001", "2014", "2022"),
        "source_page": 260,
        "indicators": ({
            "code": "HCP_SOCIAL_REGIONAL_POVERTY_SEVERITY",
            "label_fr": "Indice de sévérité de la pauvreté",
            "label_ar": "مؤشر حدة الفقر",
            "description_fr": "Mesure de la sévérité de la pauvreté monétaire par région.",
            "description_ar": "مقياس شدة الفقر النقدي حسب الجهة.",
            "unit_fr": "%",
            "unit_ar": "٪",
            "indexes": (0, 1, 2),
            "comparability_group": "HCP_ENCDM_ENNVM_POVERTY_SEVERITY",
            "methodology_note_fr": "Les valeurs marquées d’un astérisque dans la publication HCP sont des estimations établies à partir de la carte de pauvreté monétaire 2014.",
            "methodology_note_ar": "القيم المعلّمة بنجمة في منشور المندوبية السامية للتخطيط هي تقديرات مستندة إلى خريطة الفقر النقدي لسنة 2014.",
        },),
    },
    {
        "pattern": r"Tableau\s+1\.18\s*\.?\s*a\s*:",
        "periods": ("2024",),
        "source_page": 35,
        "fertility_scopes": True,
        "indicators": ({
            "code": "HCP_SOCIAL_REGIONAL_FERTILITY",
            "label_fr": "Indice synthétique de fécondité",
            "label_ar": "مؤشر الخصوبة الإجمالي",
            "description_fr": "Nombre moyen d’enfants par femme, par région et milieu de résidence, selon le RGPH 2024.",
            "description_ar": "متوسط عدد الأطفال لكل امرأة حسب الجهة ووسط الإقامة، استنادًا إلى الإحصاء العام للسكان والسكنى لسنة 2024.",
            "unit_fr": "enfants par femme",
            "unit_ar": "طفل لكل امرأة",
            "indexes": (0, 1, 2),
            "comparability_group": "HCP_RGPH_2024_FERTILITY",
            "methodology_note_fr": "Les colonnes distinguent les milieux urbain, rural et l’ensemble de la région.",
            "methodology_note_ar": "تُميّز الأعمدة بين الوسط الحضري والوسط القروي ومجموع الجهة.",
        },),
    },
)

_SOCIAL_REGION_NUMBER_RE = re.compile(r"(?<![\w/])(-?\d+(?:[,.]\d+)?)([^\s\d]*)")


def _social_region_aliases(region_code: str, region_name: str) -> tuple[str, ...]:
    return tuple(dict.fromkeys((region_name, *_SOCIAL_REGION_ALIASES.get(region_code, ()))))


def _social_region_rows(lines: list[str]) -> dict[str, tuple[list[float], list[str]]]:
    rows: dict[str, tuple[list[float], list[str]]] = {}
    for raw_line in lines:
        line = raw_line.replace("\u00a0", " ").replace("\u202f", " ").strip()
        if not line:
            continue
        for region_name, region_code in HCP_EMO_REGIONS:
            match = None
            for alias in _social_region_aliases(region_code, region_name):
                match = re.match(r"^\s*" + re.escape(alias) + r"\s+(.+)$", line, re.IGNORECASE)
                if match:
                    break
            if not match:
                continue
            tokens = _SOCIAL_REGION_NUMBER_RE.findall(match.group(1))
            values: list[float] = []
            flags: list[str] = []
            for raw_value, suffix in tokens:
                try:
                    values.append(float(raw_value.replace(",", ".")))
                    flags.append("estimated" if "*" in suffix or "" in suffix else "standard")
                except ValueError:
                    continue
            if values:
                rows[region_code] = (values, flags)
            break
    return rows


def parse_hcp_social_regional_indicators(
    text: str,
    source_url: str = HCP_SOCIAL_REPORT_URL,
) -> tuple[list[dict], list[str]]:
    """Parse regional poverty and fertility tables from the HCP 2026 social compendium."""
    lines = [line.strip() for line in str(text or "").splitlines() if line.strip()]
    output: list[dict] = []
    warnings: list[str] = []
    expected_regions = {code for _name, code in HCP_EMO_REGIONS}

    for table in _SOCIAL_REGIONAL_TABLES:
        block_rows: dict[str, tuple[list[float], list[str]]] = {}
        found_heading = False
        for index, line in enumerate(lines):
            if not re.search(table["pattern"], line, re.IGNORECASE):
                continue
            found_heading = True
            block: list[str] = []
            for candidate in lines[index + 1:]:
                if re.search(r"^\s*Tableau\s+\d+\.\d+", candidate, re.IGNORECASE):
                    break
                if re.match(r"^\s*Source\s*:", candidate, re.IGNORECASE):
                    break
                block.append(candidate)
            candidate_rows = _social_region_rows(block)
            if len(candidate_rows) > len(block_rows):
                block_rows = candidate_rows
            if expected_regions.issubset(candidate_rows):
                break

        if not found_heading:
            warnings.append(f"Tableau HCP régional introuvable : {table['pattern']}.")
            continue
        missing_regions = sorted(expected_regions - set(block_rows))
        if missing_regions:
            warnings.append(
                f"Tableau HCP régional partiel ({table['pattern']}) : "
                f"{len(block_rows)}/12 régions ; manquantes : {', '.join(missing_regions[:4])}."
            )

        for definition in table["indicators"]:
            indexes = definition["indexes"]
            for region_name, region_code in HCP_EMO_REGIONS:
                parsed = block_rows.get(region_code)
                if not parsed:
                    continue
                values, flags = parsed
                if len(values) <= max(indexes):
                    warnings.append(
                        f"{definition['code']} : valeurs insuffisantes pour {region_name} "
                        f"({len(values)} détectées, index {max(indexes)} requis)."
                    )
                    continue

                scopes = ("urban", "rural", "all") if table.get("fertility_scopes") else ("all",)
                for scope_index, scope in enumerate(scopes):
                    value_index = indexes[scope_index] if table.get("fertility_scopes") else indexes
                    if isinstance(value_index, int):
                        value_index = (value_index,)
                    history = []
                    for period_index, period in enumerate(table["periods"]):
                        cell_index = value_index[period_index]
                        history.append({
                            "year": period,
                            "value": values[cell_index],
                            "quality_flag": flags[cell_index],
                        })
                    key = f"{definition['code']}:{scope}:{region_code}"
                    output.append({
                        "id": key,
                        "series_key": key,
                        "indicator_code": definition["code"],
                        "label_fr": definition["label_fr"],
                        "label_ar": definition["label_ar"],
                        "description_fr": definition["description_fr"],
                        "description_ar": definition["description_ar"],
                        "unit_fr": definition["unit_fr"],
                        "unit_ar": definition["unit_ar"],
                        "frequency": "recensement / enquête",
                        "geography_level": "region",
                        "geography_code": region_code,
                        "geography_name_fr": region_name,
                        "geography_name_ar": HCP_EMO_REGION_NAMES_AR.get(region_code, region_name),
                        "residence_scope": scope,
                        "history": history,
                        "latest": history[-1],
                        "source_name": HCP_SOCIAL_SOURCE_NAME,
                        "source_name_ar": "المندوبية السامية للتخطيط — المؤشرات الاجتماعية للمغرب، طبعة 2026",
                        "source_url": source_url,
                        "last_updated": HCP_SOCIAL_REPORT_DATE,
                        "source_page": table["source_page"],
                        "comparability_group": definition["comparability_group"],
                        "methodology_break": False,
                        "methodology_note_fr": definition["methodology_note_fr"],
                        "methodology_note_ar": definition["methodology_note_ar"],
                    })

    return output, warnings
