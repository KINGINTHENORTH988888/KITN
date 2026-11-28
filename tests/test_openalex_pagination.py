import json
import unittest
from urllib.parse import parse_qs, urlsplit
from unittest.mock import patch
from urllib.error import HTTPError

from pipeline.collectors import _openalex_cursor_url, collect_openalex


def _work(title):
    return {
        "id": "https://openalex.org/W123",
        "display_name": title,
        "publication_year": 2025,
        "authorships": [],
        "keywords": [],
    }


class TestOpenAlexPagination(unittest.TestCase):
    def test_cursor_url_uses_api_key_query_parameter_without_duplicates(self):
        url = "https://api.openalex.org/works?search=Morocco&api_key=old&per-page=5"
        result = _openalex_cursor_url(url, "*", 10, api_key="new-secret")
        query = parse_qs(urlsplit(result).query)
        self.assertEqual(query["api_key"], ["new-secret"])
        self.assertEqual(query["per-page"], ["10"])
        self.assertEqual(query["cursor"], ["*"])
        self.assertEqual(query["search"], ["Morocco"])

    def test_collects_multiple_cursor_pages_up_to_source_limit(self):
        pages = [
            {
                "meta": {"next_cursor": "cursor-page-2"},
                "results": [_work("Étude sur la gouvernance au Maroc")],
            },
            {
                "meta": {"next_cursor": None},
                "results": [_work("Étude sur les finances publiques au Maroc")],
            },
        ]
        source = {
            "url": "https://api.openalex.org/works?search=Morocco&per-page=1&filter=type%3Aarticle",
            "max_items": 2,
            "lang_hint": "en",
        }

        with (
            patch.dict("os.environ", {"OPENALEX_API_KEY": "test-openalex-key"}),
            patch(
                "pipeline.collectors._fetch_text",
                side_effect=[json.dumps(page) for page in pages],
            ) as fetch,
        ):
            items = collect_openalex(source)

        self.assertEqual(len(items), 2)
        self.assertEqual(fetch.call_count, 2)
        first_query = parse_qs(urlsplit(fetch.call_args_list[0].args[0]).query)
        second_query = parse_qs(urlsplit(fetch.call_args_list[1].args[0]).query)
        self.assertEqual(first_query["cursor"], ["*"])
        self.assertEqual(first_query["per-page"], ["1"])
        self.assertEqual(second_query["cursor"], ["cursor-page-2"])
        self.assertEqual(second_query["filter"], ["type:article"])
        self.assertEqual(first_query["api_key"], ["test-openalex-key"])
        self.assertNotIn("extra_headers", fetch.call_args_list[0].kwargs)

    def test_source_limit_stops_pagination_without_losing_existing_cap(self):
        page = {
            "meta": {"next_cursor": "cursor-page-2"},
            "results": [_work("Premier résultat"), _work("Deuxième résultat")],
        }
        source = {
            "url": "https://api.openalex.org/works?search=Morocco&per-page=2",
            "max_items": 2,
        }

        with patch("pipeline.collectors._fetch_text", return_value=json.dumps(page)) as fetch:
            items = collect_openalex(source)

        self.assertEqual(len(items), 2)
        fetch.assert_called_once()

    def test_repeated_cursor_stops_to_prevent_infinite_loop(self):
        page = {
            "meta": {"next_cursor": "same-cursor"},
            "results": [_work("Premier résultat")],
        }
        source = {
            "url": "https://api.openalex.org/works?search=Morocco&per-page=1",
            "max_items": 3,
        }

        with (
            patch.dict("os.environ", {"OPENALEX_API_KEY": "test-openalex-key"}),
            patch(
                "pipeline.collectors._fetch_text",
                side_effect=[json.dumps(page), json.dumps(page)],
            ) as fetch,
        ):
            items = collect_openalex(source)

        self.assertEqual(len(items), 2)
        self.assertEqual(fetch.call_count, 2)


    def test_rate_limit_without_key_reports_required_secret(self):
        source = {
            "url": "https://api.openalex.org/works?search=Morocco&per-page=1",
            "max_items": 3,
        }
        error = HTTPError(
            "https://api.openalex.org/works",
            429,
            "Too Many Requests",
            None,
            None,
        )
        with (
            patch.dict("os.environ", {}, clear=True),
            patch("pipeline.collectors._fetch_text", side_effect=error),
        ):
            with self.assertRaisesRegex(RuntimeError, "OPENALEX_API_KEY"):
                collect_openalex(source)

    def test_without_api_key_keeps_keyless_first_page_working(self):
        page = {
            "meta": {"next_cursor": "cursor-page-2"},
            "results": [_work("Résultat accessible sans clé")],
        }
        source = {
            "url": "https://api.openalex.org/works?search=Morocco&per-page=1",
            "max_items": 3,
        }

        with (
            patch.dict("os.environ", {}, clear=True),
            patch("pipeline.collectors._fetch_text", return_value=json.dumps(page)) as fetch,
        ):
            items = collect_openalex(source)

        self.assertEqual(len(items), 1)
        fetch.assert_called_once()
        self.assertNotIn("extra_headers", fetch.call_args.kwargs)
