import json
import unittest
from pathlib import Path
from unittest.mock import patch

from pipeline.collectors import collect_rss_atom


class TestArabicPressSources(unittest.TestCase):
    def test_alalam_ar_source_is_configured_as_filtered_arabic_watch_feed(self):
        path = Path(__file__).resolve().parents[1] / "data" / "sources.json"
        sources = json.loads(path.read_text(encoding="utf-8"))
        source = next(item for item in sources if item.get("id") == "alalam_ar")

        self.assertTrue(source["enabled"])
        self.assertEqual(source["type"], "rss_atom")
        self.assertEqual(source["target_space"], "veille")
        self.assertEqual(source["lang_hint"], "ar")
        self.assertEqual(source["default_doc_type"], "article_presse")
        self.assertEqual(source["url"], "https://www.alalam.ma/xml/syndication.rss")
        self.assertIn("الأمن", source["include_title_tokens"])
        self.assertIn("رياضة", source["exclude_title_tokens"])

    def test_alalam_feed_keeps_relevant_arabic_public_affairs_and_excludes_sports(self):
        config_path = Path(__file__).resolve().parents[1] / "data" / "sources.json"
        sources = json.loads(config_path.read_text(encoding="utf-8"))
        source = next(item for item in sources if item.get("id") == "alalam_ar")
        feed = """<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0"><channel>
          <item>
            <title>الشرطة في فاس توقف جانحا</title>
            <link>https://www.alalam.ma/article-security.html</link>
            <description>بلاغ حول تدخل أمني في فاس</description>
            <pubDate>Fri, 27 Nov 2026 10:26:00 +0100</pubDate>
          </item>
          <item>
            <title>فوز فريق في مباراة كرة القدم</title>
            <link>https://www.alalam.ma/article-sport.html</link>
            <description>أخبار رياضية</description>
            <pubDate>Fri, 27 Nov 2026 10:20:00 +0100</pubDate>
          </item>
        </channel></rss>"""

        with patch("pipeline.collectors._fetch_text", return_value=feed):
            items = collect_rss_atom(source)

        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "الشرطة في فاس توقف جانحا")
        self.assertEqual(items[0]["source_lang_hint"], "ar")
        self.assertEqual(items[0]["espace"], "veille")
        self.assertEqual(items[0]["default_doc_type"], "article_presse")
        self.assertEqual(items[0]["published_date"], "2026-11-27")
        self.assertIn("تدخل أمني", items[0]["abstract"])


if __name__ == "__main__":
    unittest.main()
