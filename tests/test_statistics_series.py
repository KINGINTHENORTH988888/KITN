import unittest

from pipeline.run_pipeline import _merge_statistics_series, _statistics_period_sort_key


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
