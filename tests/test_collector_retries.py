import unittest
from datetime import datetime, timezone
from unittest.mock import patch

from pipeline import collectors


class TestOpenAlexRequestControls(unittest.TestCase):
    def test_retry_after_seconds_is_respected(self):
        with patch("pipeline.collectors.random.uniform", return_value=0):
            self.assertEqual(collectors._retry_delay_seconds("12", 0), 12)

    def test_retry_after_http_date_is_respected(self):
        now = datetime(2026, 11, 27, 12, 0, 0, tzinfo=timezone.utc)
        retry_at = "Fri, 27 Nov 2026 12:00:10 GMT"
        with patch("pipeline.collectors.random.uniform", return_value=0):
            self.assertEqual(collectors._retry_delay_seconds(retry_at, 0, now), 10)

    def test_invalid_retry_after_uses_exponential_backoff(self):
        with patch("pipeline.collectors.random.uniform", return_value=0):
            self.assertEqual(collectors._retry_delay_seconds("not-a-date", 0), 2)
            self.assertEqual(collectors._retry_delay_seconds(None, 2), 8)

    def test_retry_after_over_two_minutes_aborts_retry(self):
        self.assertIsNone(collectors._retry_delay_seconds("180", 0))

    def test_openalex_requests_are_spaced_across_sources(self):
        original_last_request = collectors._OPENALEX_LAST_REQUEST_AT
        collectors._OPENALEX_LAST_REQUEST_AT = 0.0
        try:
            with (
                patch("pipeline.collectors.time.monotonic", side_effect=[10.0, 10.0, 11.0, 14.0]),
                patch("pipeline.collectors.time.sleep") as sleep,
            ):
                collectors._wait_for_openalex_slot("api.openalex.org")
                collectors._wait_for_openalex_slot("api.openalex.org")
            sleep.assert_called_once_with(2.0)
        finally:
            collectors._OPENALEX_LAST_REQUEST_AT = original_last_request

    def test_other_hosts_are_not_delayed_by_openalex_limiter(self):
        with patch("pipeline.collectors.time.monotonic") as monotonic, patch("pipeline.collectors.time.sleep") as sleep:
            collectors._wait_for_openalex_slot("api.crossref.org")
        monotonic.assert_not_called()
        sleep.assert_not_called()


if __name__ == "__main__":
    unittest.main()
