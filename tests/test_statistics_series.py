import unittest

from pipeline.run_pipeline import _merge_statistics_series, _merge_valid_statistics_series, _statistics_period_sort_key
from pipeline.collectors import _bam_ckan_number, _bam_ckan_series_from_rows, _split_xlsx_sheets


class TestStatisticsSeriesMerge(unittest.TestCase):
    def test_merge_preserves_older_observations_and_uses_new_values_for_revised_periods(self):
        existing = {
            "indicator_code": "TEST_INDICATOR",
            "label_fr": "Ancien libellé",
            "history": [
                {"year": "2020", "value": 10},
                {"year": "2021", "value": 20},
                {"year": "2022", "value": 30},
            ],
            "latest": {"year": "2022", "value": 30},
            "previous": {"year": "2021", "value": 20},
            "source_name": "Source officielle",
            "last_successful_collection_at": "2026-10-01T00:00:00Z",
        }
        incoming = {
            "indicator_code": "TEST_INDICATOR",
            "label_fr": "Libellé actualisé",
            "history": [
                {"year": "2021", "value": 21},
                {"year": "2023", "value": 40},
            ],
            "latest": {"year": "2023", "value": 40},
            "previous": {"year": "2022", "value": 30},
            "source_name": "Source officielle",
        }

        merged = _merge_statistics_series(existing, incoming, "2026-11-27T04:00:00Z")

        self.assertEqual(
            merged["history"],
            [
                {"year": "2020", "value": 10},
                {"year": "2021", "value": 21},
                {"year": "2022", "value": 30},
                {"year": "2023", "value": 40},
            ],
        )
        self.assertEqual(merged["latest"], {"year": "2023", "value": 40})
        self.assertEqual(merged["previous"], {"year": "2022", "value": 30})
        self.assertEqual(merged["label_fr"], "Libellé actualisé")
        self.assertEqual(merged["last_successful_collection_at"], "2026-11-27T04:00:00Z")
        self.assertEqual(merged["collection_status"], "collected")

    def test_merge_keeps_existing_metadata_when_incoming_fields_are_empty(self):
        existing = {
            "indicator_code": "TEST_INDICATOR",
            "description_fr": "Définition officielle conservée",
            "history": [{"year": "2024", "value": 12}],
        }
        incoming = {
            "indicator_code": "TEST_INDICATOR",
            "description_fr": "",
            "source_url": None,
            "history": [{"year": "2025", "value": 13}],
        }

        merged = _merge_statistics_series(existing, incoming, "2026-11-27T04:00:00Z")

        self.assertEqual(merged["description_fr"], "Définition officielle conservée")
        self.assertNotIn("source_url", merged)
        self.assertEqual([point["year"] for point in merged["history"]], ["2024", "2025"])

    def test_daily_period_labels_are_sorted_chronologically(self):
        collected_at = "2026-11-27T04:00:00Z"
        periods = ["Aujourd'hui", "Veille", "2026-11-25"]
        ordered = sorted(periods, key=lambda value: _statistics_period_sort_key(value, collected_at))
        self.assertEqual(ordered, ["2026-11-25", "Veille", "Aujourd'hui"])

    def test_period_sorting_supports_observations_before_2000(self):
        collected_at = "2026-11-27T04:00:00Z"
        periods = ["2000-01", "1998", "1999-T4", "2001-02-03", "2026"]
        ordered = sorted(periods, key=lambda value: _statistics_period_sort_key(value, collected_at))
        self.assertEqual(ordered, ["1998", "1999-T4", "2000-01", "2001-02-03", "2026"])

    def test_invalid_calendar_period_does_not_crash_history_sorting(self):
        collected_at = "2026-11-27T04:00:00Z"
        periods = ["2026-02-31", "2026-02-01", "2025-13"]
        ordered = sorted(periods, key=lambda value: _statistics_period_sort_key(value, collected_at))
        self.assertEqual(ordered[0], "2026-02-01")
        self.assertEqual(set(ordered[1:]), {"2026-02-31", "2025-13"})

    def test_merge_keeps_pre_2000_history_before_recent_observations(self):
        existing = {
            "indicator_code": "LONG_RUNNING_INDICATOR",
            "history": [
                {"year": "1998", "value": 18},
                {"year": "1999", "value": 19},
                {"year": "2000", "value": 20},
                {"year": "2024", "value": 24},
            ],
            "latest": {"year": "2024", "value": 24},
        }
        incoming = {
            "indicator_code": "LONG_RUNNING_INDICATOR",
            "history": [{"year": "2025", "value": 25}],
            "latest": {"year": "2025", "value": 25},
        }

        merged = _merge_statistics_series(existing, incoming, "2026-11-27T04:00:00Z")

        self.assertEqual(
            [point["year"] for point in merged["history"]],
            ["1998", "1999", "2000", "2024", "2025"],
        )
        self.assertEqual(merged["latest"], {"year": "2025", "value": 25})

    def test_merge_uses_previous_published_history_even_when_current_series_exists(self):
        old = {
            "indicator_code": "BAM_MONIA_RATE",
            "history": [
                {"year": "2026-11-24", "value": 2.1},
                {"year": "2026-11-25", "value": 2.2},
                {"year": "2026-11-26", "value": 2.3},
            ],
            "latest": {"year": "2026-11-26", "value": 2.3},
        }
        current = {
            "indicator_code": "BAM_MONIA_RATE",
            "history": [
                {"year": "2026-11-26", "value": 2.35},
                {"year": "2026-11-27", "value": 2.4},
            ],
            "latest": {"year": "2026-11-27", "value": 2.4},
            "previous": {"year": "2026-11-26", "value": 2.35},
        }

        merged = _merge_statistics_series(old, current, "2026-11-27T04:00:00Z")

        self.assertEqual(
            merged["history"],
            [
                {"year": "2026-11-24", "value": 2.1},
                {"year": "2026-11-25", "value": 2.2},
                {"year": "2026-11-26", "value": 2.35},
                {"year": "2026-11-27", "value": 2.4},
            ],
        )

    def test_older_incoming_latest_does_not_replace_a_newer_published_observation(self):
        existing = {
            "indicator_code": "TEST_INDICATOR",
            "history": [
                {"year": "2020", "value": 10},
                {"year": "2025", "value": 50},
            ],
            "latest": {"year": "2025", "value": 50},
            "previous": {"year": "2020", "value": 10},
        }
        incoming = {
            "indicator_code": "TEST_INDICATOR",
            "history": [
                {"year": "2021", "value": 20},
                {"year": "2022", "value": 30},
            ],
            "latest": {"year": "2022", "value": 30},
            "previous": {"year": "2021", "value": 20},
        }

        merged = _merge_statistics_series(existing, incoming, "2026-11-27T04:00:00Z")

        self.assertEqual(merged["latest"], {"year": "2025", "value": 50})
        self.assertEqual(merged["previous"], {"year": "2022", "value": 30})

    def test_daily_previous_point_is_kept_and_sorted_before_today(self):
        incoming = {
            "indicator_code": "BAM_FX_EUR",
            "history": [{"year": "Aujourd'hui", "value": 10.5}],
            "latest": {"year": "Aujourd'hui", "value": 10.5},
            "previous": {"year": "Veille", "value": 10.4},
        }

        merged = _merge_statistics_series(None, incoming, "2026-11-27T04:00:00Z")

        self.assertEqual(
            merged["history"],
            [
                {"year": "Veille", "value": 10.4},
                {"year": "Aujourd'hui", "value": 10.5},
            ],
        )
        self.assertEqual(merged["latest"], {"year": "Aujourd'hui", "value": 10.5})
        self.assertEqual(merged["previous"], {"year": "Veille", "value": 10.4})

    def test_bam_ckan_number_parser_respects_french_and_english_decimal_conventions(self):
        cases = {
            "1.234,56": 1234.56,
            "1,234.56": 1234.56,
            "1 234,56": 1234.56,
            "1\u202f234,56": 1234.56,
            "(1.234,56)": -1234.56,
            "5,25 %": 5.25,
            "1,23": 1.23,
            "1.234": 1.234,
            "—": None,
            "n.d.": None,
        }
        for raw, expected in cases.items():
            with self.subTest(raw=raw):
                self.assertEqual(_bam_ckan_number(raw), expected)

    def test_bam_ckan_keeps_worksheet_units_separate(self):
        combined_rows = [
            ["Encours monétaires — en MDH"],
            ["Indicateur", "2024", "2025"],
            ["Crédits à l'économie", "100", "110"],
            [],
            ["Taux — en %"],
            ["Indicateur", "2024", "2025"],
            ["Taux débiteur", "5.2", "5.3"],
        ]

        sheets = _split_xlsx_sheets(combined_rows)
        self.assertEqual(len(sheets), 2)

        dataset = {"title": "Jeu BAM", "notes": ""}
        resource = {"url": "https://data.gov.ma/resource.xlsx", "name": "resource.xlsx"}
        monetary = _bam_ckan_series_from_rows(sheets[0], dataset, resource)
        rates = _bam_ckan_series_from_rows(sheets[1], dataset, resource)

        self.assertEqual(len(monetary), 1)
        self.assertEqual(len(rates), 1)
        self.assertEqual(monetary[0]["statistics_series"]["unit_fr"], "MDH")
        self.assertEqual(rates[0]["statistics_series"]["unit_fr"], "%")
        self.assertEqual(monetary[0]["statistics_series"]["history"][-1]["value"], 110.0)
        self.assertEqual(rates[0]["statistics_series"]["history"][-1]["value"], 5.3)

    def test_invalid_new_ckan_metadata_does_not_replace_a_valid_published_series(self):
        existing = {
            "indicator_code": "BAM_CKAN_TEST",
            "unit_fr": "MDH",
            "history": [
                {"year": "2024", "value": 100},
                {"year": "2025", "value": 110},
            ],
            "latest": {"year": "2025", "value": 110},
        }
        invalid_incoming = {
            "indicator_code": "BAM_CKAN_TEST",
            "unit_fr": "Unité non précisée",
            "history": [
                {"year": "2025", "value": 111},
                {"year": "2026", "value": 120},
            ],
            "latest": {"year": "2026", "value": 120},
        }

        merged = _merge_valid_statistics_series(
            existing, invalid_incoming, "2026-11-27T04:00:00Z"
        )

        self.assertIsNone(merged)
        self.assertEqual(existing["unit_fr"], "MDH")
        self.assertEqual(existing["latest"], {"year": "2025", "value": 110})

    def test_invalid_new_ckan_observation_does_not_poison_valid_history(self):
        existing = {
            "indicator_code": "BAM_CKAN_TEST",
            "unit_fr": "MDH",
            "history": [
                {"year": "2024", "value": 100},
                {"year": "2025", "value": 110},
            ],
            "latest": {"year": "2025", "value": 110},
        }
        invalid_incoming = {
            "indicator_code": "BAM_CKAN_TEST",
            "unit_fr": "MDH",
            "history": [
                {"year": "2025", "value": 111},
                {"year": "2099", "value": 120},
            ],
            "latest": {"year": "2099", "value": 120},
        }

        merged = _merge_valid_statistics_series(
            existing, invalid_incoming, "2026-11-27T04:00:00Z"
        )

        self.assertIsNone(merged)
        self.assertEqual(existing["latest"], {"year": "2025", "value": 110})

    def test_new_series_is_initialized_without_existing_history(self):
        incoming = {
            "indicator_code": "NEW_INDICATOR",
            "history": [{"year": "2026", "value": 5}],
            "latest": {"year": "2026", "value": 5},
        }

        merged = _merge_statistics_series(None, incoming, "2026-11-27T04:00:00Z")

        self.assertEqual(merged["history"], incoming["history"])
        self.assertEqual(merged["collection_status"], "collected")
        self.assertEqual(merged["last_successful_collection_at"], "2026-11-27T04:00:00Z")


if __name__ == "__main__":
    unittest.main()
