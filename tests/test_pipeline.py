import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from pipeline.collectors import collect_from_source
from pipeline.processors import (
    build_stable_id,
    classify_document,
    detect_real_language,
    evaluate_morocco_relevance,
    validate_publication_date,
)
from pipeline.run_pipeline import _content_fingerprint


class TestPipelineProcessors(unittest.TestCase):
    def test_detect_real_language(self):
        self.assertEqual(detect_real_language("Politique publique et gouvernance au Maroc"), "fr")
        self.assertEqual(detect_real_language("Public policy and economic growth in Morocco"), "en")
        self.assertEqual(detect_real_language("تقرير حول الحكامة والسياسات العمومية في المغرب"), "ar")

    def test_validate_publication_date(self):
        self.assertEqual(
            validate_publication_date("2025-05-10"),
            {"date_statut": "date_confirmee", "date_anomalie": False},
        )
        self.assertEqual(
            validate_publication_date("2028-01-15"),
            {"date_statut": "date_future_a_verifier", "date_anomalie": True},
        )
        self.assertEqual(
            validate_publication_date("not-a-date"),
            {"date_statut": "date_invalide", "date_anomalie": True},
        )

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

    def test_classify_document_poles(self):
        sec = classify_document(
            "Sécurité publique, police et ordre public",
            "Prévention de la criminalité et coopération sécuritaire.",
        )
        self.assertEqual(sec["pole"], "securite_affaires_interieures")
        self.assertEqual(sec["confidence"], "eleve")

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


if __name__ == "__main__":
    unittest.main()
