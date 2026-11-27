import unittest
from datetime import datetime, timezone
from email.message import Message
from unittest.mock import patch
from urllib.error import HTTPError

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

    def test_excessive_retry_after_is_not_retried_early(self):
        self.assertIsNone(_retry_delay_seconds("300", 0))


if __name__ == "__main__":
    unittest.main()
