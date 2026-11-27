import unittest
from unittest.mock import patch

from pipeline.collectors import _hcp_emo_period, collect_hcp_labour_statistics


class TestHcpEmoDiscovery(unittest.TestCase):
    def test_period_parser_supports_written_and_numeric_quarters(self):
        self.assertEqual(_hcp_emo_period("Situation du marché du travail au troisième trimestre 2026"), (2026, 3))
        self.assertEqual(_hcp_emo_period("Situation du marche du travail T3 2026"), (2026, 3))
        self.assertEqual(_hcp_emo_period("Emploi au Maroc 2ème trimestre 2025"), (2025, 2))
        self.assertEqual(_hcp_emo_period("Emploi au Maroc sans période"), (0, 0))

    def test_discovers_release_when_article_url_has_no_hcp_numeric_suffix(self):
        listing = """
        <html><body>
          <a href="/actualites/situation-marche-du-travail-t3-2026">Lire la suite</a>
          <a href="/Actualite-marche-du-travail_r424.html">Marché du travail</a>
        </body></html>
        """
        detail = """
        <html><head>
          <meta property="og:title" content="Situation du marché du travail au Maroc T3 2026" />
          <meta property="article:published_time" content="2026-11-03T08:00:00+01:00" />
        </head><body>
          <p>Au troisième trimestre 2026, la main-d’œuvre s’établit à 11,7 millions de personnes, tandis que le nombre de personnes en emploi contre revenu atteint 10,5 millions.</p>
          <p>Le taux composite de la sous-utilisation de la main-d’œuvre atteint 19,6%. Le taux de chômage strict s’établit à 10,5%.</p>
          <p>Le taux de chômage strict atteint 30,5% chez les jeunes de 15 à 24 ans et 16,7% chez les femmes.</p>
          <p>Le taux composite de la sous-utilisation de la main-d’œuvre atteint 44,5% chez les jeunes de 15-24 ans et 28,5% chez les femmes.</p>
        </body></html>
        """

        def fake_fetch(url):
            return listing if "Actualite-marche-du-travail" in url else detail

        with patch("pipeline.collectors._fetch_text", side_effect=fake_fetch):
            items = collect_hcp_labour_statistics({
                "id": "hcp_labour_statistics",
                "name": "HCP — EMO",
                "url": "https://www.hcp.ma/",
                "listing_urls": ["https://m.hcp.ma/Actualite-marche-du-travail_r424.html"],
                "max_pages": 1,
            })

        self.assertEqual(len(items), 8)
        self.assertEqual(items[0]["statistics_series"]["latest"]["year"], "T3/2026")
        self.assertEqual(items[0]["statistics_series"]["source_url"], "https://m.hcp.ma/actualites/situation-marche-du-travail-t3-2026")

    def test_ignores_non_hcp_and_non_labour_links(self):
        listing = """
        <a href="https://example.org/emploi-maroc-t3-2026">Emploi au Maroc T3 2026</a>
        <a href="/actualites/situation-inflation-t3-2026">Situation de l'inflation T3 2026</a>
        """
        with patch("pipeline.collectors._fetch_text", return_value=listing):
            items = collect_hcp_labour_statistics({
                "id": "hcp_labour_statistics",
                "url": "https://www.hcp.ma/",
                "listing_urls": ["/Actualite-marche-du-travail_r424.html"],
            })
        self.assertEqual(items, [])


if __name__ == "__main__":
    unittest.main()
