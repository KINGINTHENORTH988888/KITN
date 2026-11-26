import json
import tempfile
import unittest
from datetime import date
from pathlib import Path
from unittest.mock import patch

from pipeline.collectors import collect_from_source
from pipeline.processors import (
    build_stable_id,
    classify_document,
    clean_text,
    detect_real_language,
    evaluate_morocco_relevance,
    process_raw_item,
    resolve_space,
    sanitize_url,
    validate_publication_date,
)
from pipeline.run_pipeline import _content_fingerprint, run


class TestPipelineProcessors(unittest.TestCase):
    def test_detect_real_language(self):
        self.assertEqual(detect_real_language("Politique publique et gouvernance au Maroc"), "fr")
        self.assertEqual(detect_real_language("Public policy and economic growth in Morocco"), "en")
        self.assertEqual(detect_real_language("تقرير حول الحكامة والسياسات العمومية في المغرب"), "ar")

    def test_validate_publication_date(self):
        ref = date(2026, 11, 26)
        self.assertEqual(
            validate_publication_date("2025-05-10", reference_date=ref),
            {"date_statut": "date_confirmee", "date_anomalie": False},
        )
        self.assertEqual(
            validate_publication_date("2027-04", reference_date=ref),
            {"date_statut": "date_future_a_verifier", "date_anomalie": True},
        )
        self.assertEqual(
            validate_publication_date("2028-01-15", reference_date=ref),
            {"date_statut": "date_future_a_verifier", "date_anomalie": True},
        )
        self.assertEqual(
            validate_publication_date("not-a-date", reference_date=ref),
            {"date_statut": "date_invalide", "date_anomalie": True},
        )

    def test_clean_text_and_sanitize_url(self):
        cleaned = clean_text("<p>Les m\ufb01tiers du Care &amp; \u200b\u202e\u201cd\u2019analyse\u201d</p>")
        self.assertEqual(cleaned, 'Les mfitiers du Care & "d\'analyse"')

        arabic_cleaned = clean_text("\u200fالسياسات العمومية في المغرب\u202c")
        self.assertEqual(arabic_cleaned, "السياسات العمومية في المغرب")

        dirty_url = "https://link.springer.com/chapter/10.1007/978-3-032-32865-6_9?error=cookies_not_supported&code=abc123"
        self.assertEqual(
            sanitize_url(dirty_url),
            "https://link.springer.com/chapter/10.1007/978-3-032-32865-6_9",
        )
        self.assertIsNone(sanitize_url("javascript:alert(1)"))

    def test_evaluate_morocco_relevance(self):
        relevant = evaluate_morocco_relevance(
            "Réforme de la gouvernance territoriale et sécurité publique au Maroc",
            "Analyse des politiques publiques et de la régionalisation avancée au Maroc.",
        )
        self.assertTrue(relevant["is_relevant"])
        self.assertGreaterEqual(relevant["score"], 50)

        irrelevant = evaluate_morocco_relevance(
            "Quantum entanglement in superconducting qubits",
            "Laboratory measurements on microwave resonators.",
        )
        self.assertFalse(irrelevant["is_relevant"])

    def test_classify_document_poles_and_spaces(self):
        sec = classify_document(
            "Sécurité publique, police et ordre public",
            "Prévention de la criminalité et coopération sécuritaire.",
        )
        self.assertEqual(sec["pole"], "securite_affaires_interieures")
        self.assertEqual(sec["confiance_classification"], "eleve")
        self.assertEqual(resolve_space("concours", "institutions_gouvernance"), "academy")
        self.assertEqual(resolve_space("statistique", "economie_finances_publiques"), "chiffres")
        self.assertEqual(resolve_space("rapport_institutionnel", "institutions_gouvernance"), "bibliotheque")

    def test_process_raw_item_metadata(self):
        proc = process_raw_item(
            {
                "title": "Note sur la gouvernance et les finances publiques au Maroc",
                "abstract": "Analyse budgétaire et réformes administratives.",
                "authors": ["Auteur Test"],
                "venue": "Institut Marocain",
                "keywords": ["gouvernance", "budget"],
                "published_date": "2026-10-01",
                "url": "https://example.org/note-gouvernance",
                "default_doc_type": "rapport_institutionnel",
            },
            {"id": "test_inst", "name": "Test Inst", "lang_hint": "fr"},
            now_iso="2026-11-26T17:00:00Z",
        )
        self.assertIsNotNone(proc)
        self.assertEqual(proc["collecte_le"], "2026-11-26T17:00:00Z")
        self.assertEqual(proc["mis_a_jour_le"], "2026-11-26T17:00:00Z")
        self.assertEqual(proc["espace"], "bibliotheque")
        self.assertEqual(proc["revue_ou_institution"], "Institut Marocain")

    def test_stable_id_and_fingerprint(self):
        id1 = build_stable_id("10.1000/xyz", "https://example.org/a", "Titre A", "2025-01-01")
        id2 = build_stable_id("https://doi.org/10.1000/XYZ", "https://example.org/b", "Titre A", "2025-01-01")
        self.assertEqual(id1, id2)

        rec_a = {"id": id1, "titre_original": "Titre A", "resume": "Résumé 1", "collecte_le": "2026-01-01T00:00:00Z"}
        rec_b = {"id": id1, "titre_original": "Titre A", "resume": "Résumé 1", "collecte_le": "2026-11-26T12:00:00Z"}
        self.assertEqual(_content_fingerprint(rec_a), _content_fingerprint(rec_b))

    def test_collect_rss_atom_mocked(self):
        sample_rss = """<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Flux Test</title>
            <item>
              <title>Note de conjoncture au Maroc</title>
              <link>https://example.org/note-1</link>
              <pubDate>2026-10-12</pubDate>
              <description>&lt;p&gt;Indicateurs économiques et emploi au Maroc.&lt;/p&gt;</description>
            </item>
          </channel>
        </rss>"""

        with tempfile.TemporaryDirectory():
            with patch("pipeline.collectors._fetch_text", return_value=sample_rss):
                items = collect_from_source({
                    "id": "test_rss",
                    "name": "Flux Test",
                    "type": "rss_atom",
                    "url": "https://example.org/rss.xml",
                    "lang_hint": "fr",
                    "default_doc_type": "statistique",
                })
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "Note de conjoncture au Maroc")
        self.assertEqual(items[0]["published_date"], "2026-10-12")
        self.assertEqual(items[0]["default_doc_type"], "statistique")
        self.assertTrue(Path(".").exists())

    def test_collect_html_links_mocked(self):
        sample_html = """
        <html><body>
          <a href="/rapports/rapport-annuel.pdf">Rapport annuel sur les politiques publiques</a>
          <a href="/court">Court</a>
        </body></html>
        """
        with patch("pipeline.collectors._fetch_text", return_value=sample_html):
            items = collect_from_source({
                "id": "test_html",
                "name": "Page Test",
                "type": "html_links",
                "url": "https://example.org/index.html",
                "default_doc_type": "rapport_institutionnel",
            })
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["url"], "https://example.org/rapports/rapport-annuel.pdf")
        self.assertEqual(items[0]["pdf_url"], "https://example.org/rapports/rapport-annuel.pdf")

    def test_run_pipeline_preserves_existing_and_merges_manual(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            data_dir = root / "data"
            idx_dir = data_dir / "index"
            pub_idx = root / "public" / "data" / "index" / "search-index.json"
            idx_dir.mkdir(parents=True, exist_ok=True)

            sources_path = data_dir / "sources.json"
            manual_path = data_dir / "manual_contributions.json"
            index_path = idx_dir / "search-index.json"
            health_path = data_dir / "sources-health.json"

            sources_path.write_text("[]", encoding="utf-8")
            manual_path.write_text(
                json.dumps({
                    "items": [{
                        "id": "kitn_manual_test1",
                        "title": "Annonce de concours administratif au Maroc",
                        "type_document": "concours",
                        "espace": "academy",
                        "pole": "institutions_gouvernance",
                        "published_date": "2026-11-10",
                        "resume": "Conditions et calendrier de préparation.",
                    }]
                }),
                encoding="utf-8",
            )
            index_path.write_text(
                json.dumps({
                    "items": [{
                        "id": "kitn_existing_1",
                        "titre_original": "Étude économique au Maroc",
                        "auteurs": ["Chercheur A"],
                        "date_publication": "2026-09-01",
                        "type_document": "rapport",
                        "pole": "economie_finances_publiques",
                        "resume": "Résumé détaillé déjà validé.",
                    }]
                }),
                encoding="utf-8",
            )

            with (
                patch("pipeline.run_pipeline.SOURCES_FILE", sources_path),
                patch("pipeline.run_pipeline.MANUAL_CONTRIBUTIONS_FILE", manual_path),
                patch("pipeline.run_pipeline.INDEX_DIR", idx_dir),
                patch("pipeline.run_pipeline.INDEX_FILE", index_path),
                patch("pipeline.run_pipeline.PUBLIC_INDEX_FILE", pub_idx),
                patch("pipeline.run_pipeline.SOURCES_HEALTH_FILE", health_path),
            ):
                payload = run()

            ids = {it["id"] for it in payload["items"]}
            self.assertIn("kitn_existing_1", ids)
            self.assertIn("kitn_manual_test1", ids)
            self.assertTrue(pub_idx.exists())
            self.assertTrue(health_path.exists())


if __name__ == "__main__":
    unittest.main()
