import unittest

from pipeline.run_pipeline import _merge_statistics_series, _statistics_period_sort_key


class TestStatisticsSeriesMerge(unittest.TestCase):
    def test_refresh_keeps_old_history_and_replaces_revised_period(self):
        existing = {
            "indicator_code": "BAM_MONIA_RATE",
            "label_fr": "Indice MONIA",
            "unit_fr": "%",
            "source_name": "Bank Al-Maghrib",
            "history": [
                {"year": "2024-01-02", "value": 3.0},
                {"year": "2025-01-02", "value": 2.5},
            ],
            "latest": {"year": "2025-01-02", "value": 2.5},
            "previous": {"year": "2024-01-02", "value": 3.0},
        }
        incoming = {
            "indicator_code": "BAM_MONIA_RATE",
            "label_fr": "Indice MONIA",
            "unit_fr": "%",
            "source_url": "https://example.org/monia.csv",
            "history": [
                {"year": "2025-01-02", "value": 2.4},
                {"year": "2026-01-02", "value": 2.0},
            ],
            "latest": {"year": "2026-01-02", "value": 2.0},
            "previous": {"year": "2025-01-02", "value": 2.4},
        }

        merged = _merge_statistics_series(existing, incoming, "2026-01-03T12:00:00Z")

        self.assertEqual(
            merged["history"],
            [
                {"year": "2024-01-02", "value": 3.0},
                {"year": "2025-01-02", "value": 2.4},
                {"year": "2026-01-02", "value": 2.0},
            ],
        )
        self.assertEqual(merged["latest"], {"year": "2026-01-02", "value": 2.0})
        self.assertEqual(merged["previous"], {"year": "2025-01-02", "value": 2.4})
        self.assertEqual(merged["last_successful_collection_at"], "2026-01-03T12:00:00Z")
        self.assertEqual(merged["collection_status"], "collected")
        self.assertEqual(merged["source_url"], "https://example.org/monia.csv")

    def test_merge_orders_annual_quarterly_monthly_and_daily_periods(self):
        periods = ["2026", "2026-09", "T3/2026", "2026-09-17", "2026-T1", "2025"]
        ordered = sorted(periods, key=_statistics_period_sort_key)
        self.assertEqual(
            ordered,
            ["2025", "2026", "2026-T1", "T3/2026", "2026-09", "2026-09-17"],
        )

    def test_merge_ignores_non_finite_observations(self):
        merged = _merge_statistics_series(
            None,
            {
                "indicator_code": "TEST_SERIES",
                "history": [
                    {"year": "2024", "value": 1.5},
                    {"year": "2025", "value": float("inf")},
                    {"year": "2026", "value": "not-a-number"},
                ],
                "latest": {"year": "2025", "value": float("nan")},
            },
            "2026-11-27T12:00:00Z",
        )
        self.assertEqual(merged["history"], [{"year": "2024", "value": 1.5}])
        self.assertEqual(merged["latest"], {"year": "2024", "value": 1.5})
        self.assertIsNone(merged["previous"])


if __name__ == "__main__":
    unittest.main()
