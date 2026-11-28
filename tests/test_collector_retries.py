import unittest
from datetime import datetime, timezone
from email.message import Message
from unittest.mock import patch
from urllib.error import HTTPError

import pipeline.collectors as collectors
from pipeline.collectors import _fetch_text, _retry_delay_seconds


class FakeResponse:
    def __init__(self, payload=b'{"ok": true}'):
        self.payload = payload
        self.headers = Message()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return False

    def read(self):
        return self.payload


class TestCollectorRetries(unittest.TestCase):
    def _http_error(self, code, headers=None):
        return HTTPError(
            "https://example.org/data",
            code,
            "temporary failure",
            headers or Message(),
            None,
        )

    def test_retry_after_seconds_is_respected(self):
        headers = Message()
        headers["Retry-After"] = "3"
        with (
            patch("pipeline.collectors.urlopen", side_effect=[self._http_error(429, headers), FakeResponse()]) as mocked,
            patch("pipeline.collectors.time.sleep") as sleep,
            patch("pipeline.collectors.random.uniform", return_value=0),
        ):
            result = _fetch_text("https://example.org/data")

        self.assertEqual(result, '{"ok": true}')
        self.assertEqual(mocked.call_count, 2)
        sleep.assert_called_once_with(3.0)

    def test_retry_after_http_date_is_parsed(self):
        now = datetime(2026, 11, 27, 12, 0, 0, tzinfo=timezone.utc)
        with patch("pipeline.collectors.random.uniform", return_value=0):
            delay = _retry_delay_seconds("Fri, 27 Nov 2026 12:00:12 GMT", 0, now=now)
        self.assertEqual(delay, 12.0)

    def test_transient_errors_use_exponential_backoff(self):
        errors = [self._http_error(503), self._http_error(503), self._http_error(503), FakeResponse()]
        with (
            patch("pipeline.collectors.urlopen", side_effect=errors) as mocked,
            patch("pipeline.collectors.time.sleep") as sleep,
            patch("pipeline.collectors.random.uniform", return_value=0),
        ):
            result = _fetch_text("https://example.org/data")

        self.assertEqual(result, '{"ok": true}')
        self.assertEqual(mocked.call_count, 4)
        self.assertEqual([call.args[0] for call in sleep.call_args_list], [2.0, 4.0, 8.0])


    def test_openalex_per_second_429_respects_retry_after_and_retries(self):
        headers = Message()
        headers["Retry-After"] = "1"
        error = HTTPError(
            "https://api.openalex.org/works",
            429,
            "Too Many Requests",
            headers,
            __import__("io").BytesIO(b'{"reason":"requests_per_second"}'),
        )
        with (
            patch.object(collectors, "_OPENALEX_RATE_LIMITED_UNTIL", 0),
            patch.object(collectors, "_OPENALEX_LAST_REQUEST_AT", 0),
            patch("pipeline.collectors.time.monotonic", return_value=100.0),
            patch("pipeline.collectors.urlopen", side_effect=[error, FakeResponse()]) as mocked,
            patch("pipeline.collectors.time.sleep") as sleep,
            patch("pipeline.collectors.random.uniform", return_value=0),
        ):
            result = _fetch_text("https://api.openalex.org/works?search=Morocco")

        self.assertEqual(result, '{"ok": true}')
        self.assertEqual(mocked.call_count, 2)
        sleep.assert_called_once_with(1.0)

    def test_openalex_429_opens_circuit_and_skips_later_sources(self):
        error = HTTPError(
            "https://api.openalex.org/works",
            429,
            "Too Many Requests",
            Message(),
            None,
        )
        with (
            patch.object(collectors, "_OPENALEX_RATE_LIMITED_UNTIL", 0),
            patch.object(collectors, "_OPENALEX_LAST_REQUEST_AT", 0),
            patch("pipeline.collectors.time.monotonic", return_value=100.0),
            patch("pipeline.collectors.urlopen", side_effect=error) as mocked,
        ):
            with self.assertRaises(HTTPError):
                _fetch_text("https://api.openalex.org/works?search=Morocco")
            with self.assertRaisesRegex(HTTPError, "circuit is open"):
                _fetch_text("https://api.openalex.org/works?search=Morocco%20governance")

            self.assertEqual(
                collectors._OPENALEX_RATE_LIMITED_UNTIL,
                100.0 + collectors._OPENALEX_RATE_LIMIT_COOLDOWN_SECONDS,
            )

        self.assertEqual(mocked.call_count, 1)

    def test_monia_reports_both_csv_and_page_failures(self):
        csv_error = HTTPError(
            "https://www.bkam.ma/export/blockcsv/data",
            403,
            "Forbidden",
            Message(),
            None,
        )
        page_error = HTTPError(
            "https://www.bkam.ma/monia",
            403,
            "Forbidden",
            Message(),
            None,
        )
        source = {
            "statistics_pages": [{
                "kind": "monia",
                "url": "https://www.bkam.ma/monia",
                "csv_url": "https://www.bkam.ma/export/blockcsv/data",
            }]
        }
        with patch("pipeline.collectors._fetch_text", side_effect=[csv_error, page_error]):
            with self.assertRaisesRegex(RuntimeError, "export CSV.*page officielle"):
                collectors.collect_bank_al_maghrib(source)

    def test_excessive_retry_after_is_not_retried_early(self):
        self.assertIsNone(_retry_delay_seconds("300", 0))


if __name__ == "__main__":
    unittest.main()
