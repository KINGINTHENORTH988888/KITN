import json
import unittest
from pathlib import Path
from unittest.mock import patch

from pipeline.collectors import collect_world_bank_api


SOCIAL_CODES = {
    "SL.TLF.CACT.ZS",
    "SL.UEM.1524.ZS",
    "SL.EMP.TOTL.SP.ZS",
    "SP.DYN.LE00.IN",
    "SH.DYN.MORT",
    "SP.URB.TOTL.IN.ZS",
    "SE.PRM.ENRR",
    "SE.SEC.ENRR",
}


class TestWorldBankSocialConfiguration(unittest.TestCase):
    def test_curated_social_indicators_are_configured_with_long_history(self):
        path = Path(__file__).resolve().parents[1] / "data" / "sources.json"
        sources = json.loads(path.read_text(encoding="utf-8"))
        source = next(item for item in sources if item.get("id") == "world_bank_maroc")
        configured = {item["code"]: item for item in source.get("indicators", [])}

        self.assertTrue(SOCIAL_CODES.issubset(configured))
        self.assertEqual(source["max_items"], len(source["indicators"]))
        self.assertGreaterEqual(source["history_points"], 66)
        for code in SOCIAL_CODES:
            self.assertEqual(configured[code]["pole"], "societe_developpement_humain")

    def test_world_bank_collector_uses_configured_history_window_and_social_pole(self):
        payload = [
            {"lastupdated": "2026-11-11"},
            [
                {"date": "2025", "value": 65.2},
                {"date": "2024", "value": 64.9},
                {"date": "2023", "value": 64.4},
            ],
        ]
        source = {
            "id": "world_bank_maroc",
            "url": "https://api.worldbank.org/v2/country/MAR/indicator/",
            "max_items": 1,
            "history_points": 25,
            "indicators": [{
                "code": "SL.TLF.CACT.ZS",
                "label_fr": "Taux d’activité de la population",
                "unit_fr": "%",
                "pole": "societe_developpement_humain",
                "category": "Emploi et activité",
            }],
        }

        with patch("pipeline.collectors._fetch_text", return_value=json.dumps(payload)) as fetch:
            items = collect_world_bank_api(source)

        self.assertEqual(len(items), 1)
        self.assertIn("per_page=25", fetch.call_args.args[0])
        self.assertEqual(items[0]["statistics_series"]["pole"], "societe_developpement_humain")
        self.assertEqual(items[0]["statistics_series"]["history"], [
            {"year": 2023, "value": 64.4},
            {"year": 2024, "value": 64.9},
            {"year": 2025, "value": 65.2},
        ])


if __name__ == "__main__":
    unittest.main()
