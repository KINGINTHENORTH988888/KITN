import unittest
from unittest.mock import patch

from pipeline.collectors import collect_hcp_labour_statistics


class TestHcpEmoPublishedPage(unittest.TestCase):
    def test_listing_fetch_failure_is_reported_instead_of_silently_hidden(self):
        source = {
            "id": "hcp_labour_statistics",
            "type": "hcp_labour_statistics",
            "url": "https://www.hcp.ma/",
            "listing_urls": ["https://m.hcp.ma/Actualite-marche-du-travail_r424.html"],
        }
        with patch("pipeline.collectors._fetch_text", side_effect=RuntimeError("403 Forbidden")):
            with self.assertRaisesRegex(RuntimeError, "403 Forbidden"):
                collect_hcp_labour_statistics(source)

    def test_latest_published_hcp_emo_page_is_extracted_from_realistic_listing(self):
        article_url = (
            "https://m.hcp.ma/Situation-du-marche-du-travail-au-Maroc-au-troisieme-"
            "trimestre-2026-selon-l-enquete-sur-la-main-d-oeuvre-EMO2026_a4364.html"
        )
        listing = f"""<html><body>
        <p>Le Haut-Commissariat au Plan présente la situation du marché du travail au troisième trimestre 2026.</p>
        <a href="{article_url}">Lire la suite</a>
        </body></html>"""
        article = """<html><head>
        <meta property="og:title" content="Situation du marché du travail au Maroc au troisième trimestre 2026 selon l'enquête sur la main-d’œuvre (EMO2026)"/>
        <meta property="article:published_time" content="2026-11-03T08:00:00-01:00"/>
        </head><body>
        <p>Au troisième trimestre 2026, la main-d’œuvre s’établit à 11,7 millions de personnes, tandis que le nombre de personnes en emploi contre revenu atteint 10,5 millions.</p>
        <p>Le taux composite de la sous-utilisation de la main-d’œuvre atteint 19,6%, traduisant l’ampleur des besoins de travail non satisfaits. Le taux de chômage strict s’établit à 10,5%, en hausse de 0,9 point par rapport au deuxième trimestre 2026.</p>
        <p>Les disparités entre les catégories de population demeurent marquées. Le taux composite de la sous-utilisation de la main-d’œuvre atteint 44,5% chez les jeunes de 15-24 ans et 28,5% chez les femmes. Le taux de chômage strict s’élève respectivement à 30,5% et 16,7% pour ces deux catégories.</p>
        </body></html>"""
        source = {
            "id": "hcp_labour_statistics",
            "type": "hcp_labour_statistics",
            "url": "https://www.hcp.ma/",
            "listing_urls": ["https://m.hcp.ma/Actualite-marche-du-travail_r424.html"],
            "max_pages": 2,
        }

        with patch("pipeline.collectors._fetch_text", side_effect=[listing, article]) as fetch:
            items = collect_hcp_labour_statistics(source)

        self.assertEqual(fetch.call_count, 2)
        self.assertEqual(len(items), 8)
        values = {
            item["statistics_series"]["indicator_code"]: item["statistics_series"]["latest"]["value"]
            for item in items
        }
        self.assertEqual(values["HCP_EMO_UNEMPLOYMENT"], 10.5)
        self.assertEqual(values["HCP_EMO_UNDERUTILIZATION"], 19.6)
        self.assertEqual(values["HCP_EMO_LABOUR_FORCE"], 11.7)
        self.assertEqual(values["HCP_EMO_EMPLOYMENT"], 10.5)
        self.assertEqual(values["HCP_EMO_YOUTH_UNEMPLOYMENT"], 30.5)
        self.assertEqual(values["HCP_EMO_WOMEN_UNEMPLOYMENT"], 16.7)
        self.assertEqual(values["HCP_EMO_YOUTH_UNDERUTILIZATION"], 44.5)
        self.assertEqual(values["HCP_EMO_WOMEN_UNDERUTILIZATION"], 28.5)
        self.assertEqual(items[0]["statistics_series"]["latest"]["year"], "T3/2026")
        self.assertEqual(items[0]["statistics_series"]["source_url"], article_url)
        self.assertTrue(items[0]["statistics_series"]["methodology_break"])
        self.assertEqual(items[0]["statistics_series"]["comparability_group"], "HCP_EMO_2026")
        self.assertIn("ne pas raccorder directement", items[0]["statistics_series"]["methodology_note_fr"].lower())
        self.assertIn("انقطاع منهجي", items[0]["statistics_series"]["methodology_note_ar"])


if __name__ == "__main__":
    unittest.main()
