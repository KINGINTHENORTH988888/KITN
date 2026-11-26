import json
import tempfile
import unittest
from datetime import date
from pathlib import Path
from unittest.mock import patch

from pipeline.collectors import collect_bank_al_maghrib, collect_bank_al_maghrib_api, collect_from_source, collect_world_bank_api
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
from pipeline.run_pipeline import _content_fingerprint, _merge_preserving_rich_fields, run


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
        direct = evaluate_morocco_relevance(
            "Réforme de la gouvernance territoriale et sécurité publique au Maroc",
            "Analyse des politiques publiques et de la régionalisation avancée au Maroc.",
        )
        self.assertTrue(direct["is_relevant"])
        self.assertEqual(direct["lien_maroc"], "direct")
        self.assertGreaterEqual(direct["score"], 45)

        isolated_mention = evaluate_morocco_relevance(
            "Notes on Morocco",
            "General astronomical observations with no policy or economic context.",
        )
        self.assertFalse(isolated_mention["is_relevant"])

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

    def test_merge_preserves_rich_resume(self):
        existing = {
            "id": "kitn_test_merge",
            "titre_original": "Étude stratégique au Maroc",
            "resume": "Résumé détaillé et complet couvrant les politiques publiques et les réformes territoriales.",
            "auteurs": ["Auteur 1", "Auteur 2"],
        }
        incoming = {
            "id": "kitn_test_merge",
            "titre_original": "Étude stratégique au Maroc",
            "resume": "Court.",
            "auteurs": ["Auteur 1"],
        }
        merged, _ = _merge_preserving_rich_fields(existing, incoming, "2026-11-26T18:00:00Z")
        self.assertEqual(merged["resume"], existing["resume"])
        self.assertEqual(merged["auteurs"], existing["auteurs"])


    def test_merge_prefers_clean_institutional_title_over_listing_label(self):
        existing = {
            "id": "kitn_listing",
            "source_id": "cour_des_comptes_maroc",
            "url_publication": "https://www.courdescomptes.ma/publication/report/",
            "titre_original": "08 Juil. 2026 - Rapport annuel Rapport sur l'exécution de la loi de finances",
        }
        incoming = {
            "id": "kitn_detail",
            "source_id": "cour_des_comptes_maroc",
            "url_publication": "https://www.courdescomptes.ma/publication/report/",
            "titre_original": "Rapport sur l'exécution de la loi de finances pour l'année 2024",
            "resume": "Résumé détaillé du rapport sur l'exécution de la loi de finances.",
        }
        merged, changed = _merge_preserving_rich_fields(existing, incoming, "2026-11-26T22:00:00Z")
        self.assertTrue(changed)
        self.assertEqual(merged["titre_original"], incoming["titre_original"])
        self.assertEqual(merged["resume"], incoming["resume"])

    def test_stable_id_and_fingerprint(self):
        id1 = build_stable_id("10.1000/xyz", "https://example.org/a", "Titre A", "2025-01-01")
        id2 = build_stable_id("https://doi.org/10.1000/XYZ", "https://example.org/b", "Titre A", "2025-01-01")
        self.assertEqual(id1, id2)

        rec_a = {"id": id1, "titre_original": "Titre A", "resume": "Résumé 1", "collecte_le": "2026-01-01T00:00:00Z"}
        rec_b = {"id": id1, "titre_original": "Titre A", "resume": "Résumé 1", "collecte_le": "2026-11-26T12:00:00Z"}
        self.assertEqual(_content_fingerprint(rec_a), _content_fingerprint(rec_b))



    def test_crossref_date_handles_null_month_and_day(self):
        from pipeline.collectors import _crossref_date
        self.assertEqual(_crossref_date({"published": {"date-parts": [[2025, None, None]]}}), "2025")
        self.assertEqual(_crossref_date({"published": {"date-parts": [[2025, 6, None]]}}), "2025-06")
        self.assertEqual(_crossref_date({"published": {"date-parts": [[None, None, None]]}}), "")

    def test_collect_crossref_api_mocked(self):
        payload = {
            "message": {
                "items": [{
                    "DOI": "10.1000/example.2026",
                    "title": ["Public policy evaluation in Morocco"],
                    "author": [{"given": "Rachid", "family": "Essedik"}],
                    "published": {"date-parts": [[2025, 6, 13]]},
                    "URL": "https://doi.org/10.1000/example.2026",
                    "publisher": "Policy Press",
                    "container-title": ["Public Policy Evaluation"],
                    "abstract": "<jats:p>Policy evaluation in Morocco.</jats:p>",
                    "subject": ["Public policy"],
                }]
            }
        }
        with patch("pipeline.collectors._fetch_text", return_value=json.dumps(payload)):
            items = collect_from_source({
                "id": "crossref_maroc", "type": "crossref",
                "url": "https://api.crossref.org/works?query=Morocco",
                "default_doc_type": "publication_scientifique",
            })
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "Public policy evaluation in Morocco")
        self.assertEqual(items[0]["published_date"], "2025-06-13")
        self.assertEqual(items[0]["authors"], ["Rachid Essedik"])
        self.assertEqual(items[0]["doi"], "10.1000/example.2026")

    def test_collect_hal_api_mocked(self):
        payload = {
            "response": {
                "docs": [{
                    "docid": "123456",
                    "title_s": ["Gouvernance territoriale au Maroc"],
                    "abstract_s": ["Étude sur les politiques publiques territoriales au Maroc."],
                    "authFullName_s": ["Auteur Test"],
                    "producedDateY_i": 2024,
                    "uri_s": "https://hal.science/hal-0123456v1",
                }]
            }
        }
        with patch("pipeline.collectors._fetch_text", return_value=json.dumps(payload)):
            items = collect_from_source({
                "id": "hal_science_morocco", "type": "hal_api",
                "url": "https://api.archives-ouvertes.fr/search/?q=morocco",
                "default_doc_type": "publication_scientifique",
            })
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "Gouvernance territoriale au Maroc")
        self.assertEqual(items[0]["published_date"], "2024")
        self.assertEqual(items[0]["authors"], ["Auteur Test"])

    def test_research_aggregators_do_not_get_national_source_boost(self):
        aggregate = evaluate_morocco_relevance(
            "Research methods in astronomy",
            "A comparative research paper with no Moroccan policy focus.",
            {"id": "crossref_maroc", "type": "crossref"},
        )
        self.assertFalse(aggregate["is_relevant"])
        self.assertEqual(aggregate["score"], 0)

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
            <item>
              <title>Résumé du match de football</title>
              <link>https://example.org/sport</link>
              <pubDate>2026-10-13</pubDate>
              <description>Sport et football.</description>
            </item>
            <item>
              <title>Industrie de défense : financement et souveraineté</title>
              <link>https://example.org/defense</link>
              <pubDate>2026-10-14</pubDate>
              <description>Une feuille de route stratégique pour le Maroc.</description>
            </item>
          </channel>
        </rss>"""

        with patch("pipeline.collectors._fetch_text", return_value=sample_rss):
            items = collect_from_source({
                "id": "test_rss",
                "name": "Flux Test",
                "type": "rss_atom",
                "url": "https://example.org/rss.xml",
                "lang_hint": "fr",
                "default_doc_type": "article_presse",
                "target_space": "veille",
                "max_items": 10,
                "include_title_tokens": ["économ", "défense"],
                "exclude_title_tokens": ["football"],
            })
        self.assertEqual(len(items), 2)
        self.assertEqual(items[0]["title"], "Note de conjoncture au Maroc")
        self.assertEqual(items[0]["published_date"], "2026-10-12")
        self.assertEqual(items[0]["default_doc_type"], "article_presse")
        self.assertEqual(items[0]["espace"], "veille")
        self.assertEqual(items[1]["title"], "Industrie de défense: financement et souveraineté")



    def test_collect_institutional_html_links_enriches_detail_metadata(self):
        listing = '<html><a href="/publication/report-2024/">Rapport annuel sur les finances publiques</a></html>'
        detail = """
        <html><head>
          <meta property="og:title" content="Rapport annuel sur les finances publiques - Cour des comptes" />
          <meta property="og:description" content="Ce rapport présente les résultats du contrôle de l'exécution des finances publiques et les principales recommandations de la Cour des comptes." />
          <meta property="article:published_time" content="2026-07-08T11:12:24+00:00" />
        </head><body><h1>Rapport annuel sur les finances publiques</h1>
        <p>Le rapport analyse l'exécution budgétaire, les dépenses publiques et les principaux résultats de l'exercice.</p></body></html>
        """
        with patch("pipeline.collectors._fetch_text", side_effect=[listing, detail]):
            items = collect_from_source({
                "id": "cour_des_comptes_maroc",
                "name": "Cour des comptes — Maroc",
                "type": "html_links",
                "url": "https://www.courdescomptes.ma/publications/",
                "default_doc_type": "rapport_institutionnel",
                "fetch_details": True,
                "min_anchor_length": 12,
            })
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "Rapport annuel sur les finances publiques")
        self.assertIn("contrôle de l'exécution", items[0]["abstract"])
        self.assertEqual(items[0]["published_date"], "2026-07-08T11:12:24+00:00")



    def test_collect_bank_al_maghrib_api_uses_subscription_key_and_maps_rates(self):
        from unittest.mock import MagicMock
        import os

        response = MagicMock()
        response.__enter__.return_value.read.return_value = json.dumps([{
            "coursJour": 10.25,
            "diffCours": 0.03,
            "libDevise": "EUR",
            "coursVeille": 10.22,
            "diffCoursVeille": 0.01,
        }]).encode("utf-8")
        with patch.dict(os.environ, {"BKAM_API_KEY": "test-key"}), patch("pipeline.collectors.urlopen", return_value=response) as mocked:
            items = collect_bank_al_maghrib_api({
                "id": "bank_al_maghrib",
                "api_base": "https://api.centralbankofmorocco.ma/cours/Version1/api",
                "currencies": ["EUR"],
            })
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["statistics_series"]["latest"]["value"], 10.25)
        self.assertEqual(items[0]["statistics_series"]["previous"]["value"], 10.22)
        self.assertEqual(items[0]["statistics_series"]["change_unit"], "MAD")
        request = mocked.call_args.args[0]
        self.assertEqual(request.get_header("Subscription-key"), "test-key")

    def test_collect_bank_al_maghrib_api_requires_secret(self):
        import os
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(RuntimeError, "BKAM_API_KEY"):
                collect_bank_al_maghrib_api({"currencies": ["EUR"]})

    def test_collect_bank_al_maghrib_extracts_monthly_indicators_and_monia(self):
        monthly_html = """
        <html><body>
        <h2>Principaux indicateurs du mois de Septembre 2026</h2>
        <p>En septembre 2026, la masse monétaire a marqué une hausse, en glissement annuel, de 12,2% après 11,9% le mois dernier pour atteindre 2 237,9 MMDH.</p>
        <p>Au niveau des contreparties de M3, les avoirs officiels de réserve et les créances nettes sur l'Administration Centrale ont enregistré des hausses respectives de 21,2% après 21,7% et de 6,7% après 7,2%.</p>
        <p>Le crédit bancaire au secteur non financier s'est accru de 11,2% après 10,4%, reflétant la progression des concours aux sociétés non financières privées de 13,8% après 11,4% et aux ménages de 3,5% après 3,3%.</p>
        <p>Les créances en souffrance ont décéléré de 3,7% à 2,3% et leur ratio au crédit bancaire s'est établi à 7,9% contre 8,2% en août 2026.</p>
        </body></html>
        """
        monia_html = """
        <html><body><table>
          <tr><th>Indice MONIA</th><th>Volume JJ</th><th>Date de référence</th><th>Date de publication</th></tr>
          <tr><td>2,195 %</td><td>12709</td><td>25/11/2026</td><td>26/11/2026</td></tr>
          <tr><td>2,139 %</td><td>13888</td><td>24/11/2026</td><td>25/11/2026</td></tr>
        </table></body></html>
        """
        source = {
            "id": "bank_al_maghrib",
            "name": "Bank Al-Maghrib",
            "statistics_pages": [
                {"kind": "monthly_indicators", "url": "https://www.bkam.ma/fr/Statistiques/Principaux-indicateurs"},
                {"kind": "monia", "url": "https://www.bkam.ma/Marches/MONIA"},
            ],
        }
        with patch("pipeline.collectors._fetch_text", side_effect=[monthly_html, monia_html]):
            items = collect_bank_al_maghrib(source)
        series = {item["statistics_series"]["indicator_code"]: item["statistics_series"] for item in items}
        self.assertIn("BAM_M3_STOCK", series)
        self.assertEqual(series["BAM_M3_STOCK"]["latest"]["value"], 2237.9)
        self.assertEqual(series["BAM_M3_GROWTH"]["latest"]["value"], 12.2)
        self.assertEqual(series["BAM_CREDIT_NFS_GROWTH"]["latest"]["value"], 11.2)
        self.assertEqual(series["BAM_NPL_RATIO"]["latest"]["value"], 7.9)
        self.assertEqual(series["BAM_MONIA_RATE"]["latest"], {"year": "2026-11-25", "value": 2.195})
        self.assertEqual(series["BAM_MONIA_VOLUME"]["latest"]["value"], 12709)
        bam_source = {
            "id": "bank_al_maghrib",
            "name": "Bank Al-Maghrib",
            "target_space": "chiffres",
            "default_doc_type": "statistique",
        }
        processed = process_raw_item(items[0], bam_source)
        self.assertIsNotNone(processed)
        self.assertEqual(processed["espace"], "chiffres")
        self.assertEqual(processed["pole"], "economie_finances_publiques")

    def test_collect_world_bank_api_builds_historical_series(self):
        payload = [
            {"lastupdated": "2026-11-11"},
            [
                {"date": "2025", "value": 4.5},
                {"date": "2024", "value": 3.8},
                {"date": "2023", "value": None},
            ],
        ]
        with patch("pipeline.collectors._fetch_text", return_value=json.dumps(payload)):
            items = collect_world_bank_api({
                "id": "world_bank_maroc",
                "url": "https://api.worldbank.org/v2/country/MAR/indicator/",
                "max_items": 1,
                "indicators": [{
                    "code": "NY.GDP.MKTP.KD.ZG",
                    "label_fr": "Croissance du PIB",
                    "label_ar": "نمو الناتج الداخلي الإجمالي",
                    "unit_fr": "%",
                    "unit_ar": "٪",
                    "scale_divisor": 1,
                    "precision": 1,
                    "pole": "economie_finances_publiques",
                }],
            })
        self.assertEqual(len(items), 1)
        series = items[0]["statistics_series"]
        self.assertEqual(series["latest"], {"year": 2025, "value": 4.5})
        self.assertEqual(series["previous"], {"year": 2024, "value": 3.8})
        self.assertEqual([point["year"] for point in series["history"]], [2024, 2025])
        self.assertEqual(items[0]["espace"], "chiffres")

    def test_collect_world_bank_api_continues_after_one_indicator_failure(self):
        good_payload = json.dumps([{"lastupdated": "2026-11-11"}, [{"date": "2025", "value": 4.5}]])
        with patch("pipeline.collectors._fetch_text", side_effect=[RuntimeError("temporary outage"), good_payload]):
            items = collect_world_bank_api({
                "url": "https://api.worldbank.org/v2/country/MAR/indicator/",
                "indicators": [{"code": "BAD"}, {"code": "GOOD", "label_fr": "Indicateur"}],
                "max_items": 2,
            })
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["statistics_series"]["indicator_code"], "GOOD")

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


    def test_collect_hcp_enriches_article_metadata(self):
        listing_html = """
        <html><body>
          <a href="/Marche-du-travail_r423.html">Marché du travail</a>
          <a href="/Situation-du-marche-du-travail-au-Maroc_a4364.html">Situation du marché du travail au Maroc au troisième trimestre 2026</a>
        </body></html>
        """
        detail_html = """
        <html><head>
          <title>Situation du marché du travail au Maroc</title>
          <meta property="og:title" content="Situation du marché du travail au Maroc au troisième trimestre 2026" />
          <meta property="og:description" content="Le HCP publie les principaux indicateurs du marché du travail au Maroc au troisième trimestre 2026." />
          <meta property="article:published_time" content="2026-11-03T10:00:00+01:00" />
          <meta name="author" content="HCP — Direction de la statistique" />
        </head><body>
          <h1>Situation du marché du travail au Maroc</h1>
          <p>Rabat, le 3 novembre 2026, le Haut-Commissariat au Plan présente les résultats de l'enquête sur la main-d'œuvre.</p>
          <p>Le taux d'activité, le taux d'emploi et le taux de chômage sont détaillés par sexe et par milieu de résidence.</p>
        </body></html>
        """

        def fake_fetch(url):
            if "_a4364.html" in url:
                return detail_html
            return listing_html

        with patch("pipeline.collectors._fetch_text", side_effect=fake_fetch):
            items = collect_from_source({
                "id": "hcp_maroc",
                "name": "Haut-Commissariat au Plan (HCP)",
                "type": "html_links",
                "url": "https://www.hcp.ma/",
                "listing_urls": ["/listing"],
                "lang_hint": "fr",
                "default_doc_type": "statistique",
                "max_items": 5,
            })

        self.assertEqual(len(items), 1)
        self.assertIn("troisième trimestre 2026", items[0]["title"])
        self.assertIn("principaux indicateurs", items[0]["abstract"])
        self.assertEqual(items[0]["published_date"], "2026-11-03T10:00:00+01:00")
        self.assertEqual(items[0]["authors"], ["HCP - Direction de la statistique"])
        self.assertEqual(items[0]["default_doc_type"], "statistique")


    def test_process_raw_item_uses_source_target_space(self):
        proc = process_raw_item(
            {
                "title": "Taux de chômage au Maroc au troisième trimestre 2026",
                "abstract": "Le HCP publie les indicateurs du marché du travail au Maroc.",
                "published_date": "2026-11-03",
                "url": "https://www.hcp.ma/example_a1234.html",
                "default_doc_type": "statistique",
            },
            {
                "id": "hcp_maroc",
                "name": "Haut-Commissariat au Plan (HCP)",
                "target_space": "chiffres",
                "default_doc_type": "statistique",
            },
            now_iso="2026-11-26T19:00:00Z",
        )
        self.assertIsNotNone(proc)
        self.assertEqual(proc["espace"], "chiffres")
        self.assertEqual(proc["type_document"], "statistique")


    def test_hcp_institutional_news_does_not_enter_statistics_space(self):
        proc = process_raw_item(
            {
                "title": "Le HCP renforce sa coopération institutionnelle avec Statistics Denmark",
                "abstract": "Un partenariat portant sur la modernisation statistique et la coopération institutionnelle.",
                "published_date": "2026-11-25",
                "url": "https://www.hcp.ma/example_a4372.html",
                "default_doc_type": "rapport_institutionnel",
            },
            {
                "id": "hcp_maroc",
                "name": "Haut-Commissariat au Plan (HCP)",
                "target_space": "chiffres",
                "default_doc_type": "statistique",
            },
            now_iso="2026-11-26T20:00:00Z",
        )
        self.assertIsNotNone(proc)
        self.assertEqual(proc["espace"], "bibliotheque")
        self.assertEqual(proc["type_document"], "rapport_institutionnel")

    def test_merge_refreshes_better_classification_and_date(self):
        existing = {
            "id": "kitn_hcp_merge",
            "source_id": "hcp_maroc",
            "titre_original": "Taux de chômage",
            "date_publication": "2026",
            "type_document": "publication_scientifique",
            "espace": "science",
            "pole": "recherche_scientifique",
            "confiance_classification": "eleve",
            "resume": "Résumé générique.",
        }
        incoming = {
            "id": "kitn_hcp_merge",
            "source_id": "hcp_maroc",
            "titre_original": "Taux de chômage au Maroc au troisième trimestre 2026",
            "date_publication": "2026-11-03",
            "date_statut": "date_confirmee",
            "date_anomalie": False,
            "type_document": "statistique",
            "espace": "chiffres",
            "pole": "economie_finances_publiques",
            "confiance_classification": "eleve",
            "resume": "Résumé détaillé des indicateurs du marché du travail au Maroc.",
        }
        merged, changed = _merge_preserving_rich_fields(existing, incoming, "2026-11-26T19:00:00Z")
        self.assertTrue(changed)
        self.assertEqual(merged["espace"], "chiffres")
        self.assertEqual(merged["type_document"], "statistique")
        self.assertEqual(merged["date_publication"], "2026-11-03")
        self.assertIn("troisième trimestre", merged["titre_original"])
        self.assertEqual(merged["resume"], incoming["resume"])

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

            sources_path.write_text(
                json.dumps([{
                    "id": "src_health_check",
                    "name": "Source Audit Check",
                    "domain": "example.ma",
                    "target_space": "chiffres",
                    "type": "html_links",
                    "url": "https://example.ma/stats",
                    "enabled": True,
                    "default_doc_type": "statistique",
                }]),
                encoding="utf-8",
            )
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
                patch("pipeline.run_pipeline.collect_from_source", return_value=[]),
            ):
                payload = run()

            ids = {it["id"] for it in payload["items"]}
            self.assertIn("kitn_existing_1", ids)
            self.assertIn("kitn_manual_test1", ids)
            self.assertTrue(pub_idx.exists())
            self.assertTrue(health_path.exists())
            health_data = json.loads(health_path.read_text(encoding="utf-8"))
            self.assertEqual(health_data["sources"][0]["domain"], "example.ma")
            self.assertEqual(health_data["sources"][0]["target_space"], "chiffres")
            self.assertEqual(health_data["sources"][0]["stage"], "aucun_contenu")
            self.assertEqual(health_data["sources"][0]["status"], "warning")


if __name__ == "__main__":
    unittest.main()
