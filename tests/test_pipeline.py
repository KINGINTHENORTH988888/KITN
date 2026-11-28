import json
import tempfile
import unittest
from datetime import date
from pathlib import Path
from unittest.mock import patch

from pipeline.collectors import collect_bank_al_maghrib, collect_bank_al_maghrib_api, collect_crossref_by_doi, collect_from_source, collect_world_bank_api
from pipeline.processors import (
    build_stable_id,
    classify_document,
    clean_text,
    detect_real_language,
    evaluate_morocco_relevance,
    normalize_doi,
    process_raw_item,
    resolve_space,
    sanitize_url,
    validate_publication_date,
)
from pipeline.run_pipeline import _content_fingerprint, _doi_key, _merge_preserving_rich_fields, run


class TestPipelineProcessors(unittest.TestCase):
    def test_hcp_labour_statistics_extracts_latest_official_indicators(self):
        listing = '<a href="/Situation-du-marche-du-travail-au-Maroc-au-troisieme-trimestre-2026_a4364.html">Lire la suite</a>'
        article = """<html><head><meta property="og:title" content="Situation du marché du travail au Maroc au troisième trimestre 2026"/></head><body>
        <p>Au troisième trimestre 2026, la main-d’œuvre s’établit à 11,7 millions de personnes, tandis que le nombre de personnes en emploi contre revenu atteint 10,5 millions.</p>
        <p>Le taux composite de la sous-utilisation de la main-d’œuvre atteint 19,6%. Le taux de chômage strict s’établit à 10,5%.</p>
        <p>Le taux de chômage strict s’élève respectivement à 30,5% et 16,7% pour ces deux catégories.</p>
        <p>Le taux composite de la sous-utilisation de la main-d’œuvre atteint 44,5% chez les jeunes de 15-24 ans et 28,5% chez les femmes.</p>
        </body></html>"""
        source = {"id":"hcp_labour_statistics","type":"hcp_labour_statistics","url":"https://www.hcp.ma/","listing_urls":["/Actualite-marche-du-travail_r424.html"]}
        with patch("pipeline.collectors._fetch_text", side_effect=[listing, article]):
            items = collect_from_source(source)
        self.assertEqual(len(items), 8, [x["statistics_series"]["indicator_code"] for x in items])
        values = {x["statistics_series"]["indicator_code"]: x["statistics_series"]["latest"]["value"] for x in items}
        self.assertEqual(values["HCP_EMO_UNEMPLOYMENT"], 10.5)
        self.assertEqual(values["HCP_EMO_UNDERUTILIZATION"], 19.6)
        self.assertEqual(values["HCP_EMO_LABOUR_FORCE"], 11.7)
        self.assertEqual(values["HCP_EMO_EMPLOYMENT"], 10.5)
        self.assertEqual(values["HCP_EMO_YOUTH_UNEMPLOYMENT"], 30.5)
        self.assertEqual(values["HCP_EMO_WOMEN_UNEMPLOYMENT"], 16.7)
        self.assertEqual(values["HCP_EMO_YOUTH_UNDERUTILIZATION"], 44.5)
        self.assertEqual(values["HCP_EMO_WOMEN_UNDERUTILIZATION"], 28.5)
        self.assertEqual(items[0]["statistics_series"]["latest"]["year"], "T3/2026")


    def test_hcp_labour_statistics_maps_respectively_values_to_named_category_order(self):
        listing = '<a href="/Situation-du-marche-du-travail-au-Maroc-au-troisieme-trimestre-2026_a4364.html">Situation du marché du travail au Maroc au troisième trimestre 2026</a>'
        article = """<html><head><meta property="og:title" content="Situation du marché du travail au Maroc au troisième trimestre 2026"/></head><body>
        <p>Au troisième trimestre 2026, la main-d’œuvre s’établit à 11,7 millions de personnes, tandis que le nombre de personnes en emploi contre revenu atteint 10,5 millions.</p>
        <p>Le taux composite de la sous-utilisation de la main-d’œuvre atteint 19,6%. Le taux de chômage strict s’établit à 10,5%.</p>
        <p>Le taux composite de la sous-utilisation de la main-d’œuvre atteint 28,5% chez les femmes et 44,5% chez les jeunes de 15-24 ans.</p>
        <p>Le taux de chômage strict s’élève respectivement à 16,7% et 30,5% pour ces deux catégories.</p>
        </body></html>"""
        source = {"id":"hcp_labour_statistics","type":"hcp_labour_statistics","url":"https://www.hcp.ma/","listing_urls":["/Actualite-marche-du-travail_r424.html"]}

        with patch("pipeline.collectors._fetch_text", side_effect=[listing, article]):
            items = collect_from_source(source)

        values = {
            item["statistics_series"]["indicator_code"]: item["statistics_series"]["latest"]["value"]
            for item in items
        }
        self.assertEqual(values["HCP_EMO_YOUTH_UNEMPLOYMENT"], 30.5)
        self.assertEqual(values["HCP_EMO_WOMEN_UNEMPLOYMENT"], 16.7)
        self.assertEqual(values["HCP_EMO_YOUTH_UNDERUTILIZATION"], 44.5)
        self.assertEqual(values["HCP_EMO_WOMEN_UNDERUTILIZATION"], 28.5)

    def test_hcp_labour_statistics_does_not_guess_categories_from_respectively_alone(self):
        listing = '<a href="/Situation-du-marche-du-travail-au-Maroc-au-troisieme-trimestre-2026_a4364.html">Situation du marché du travail au Maroc au troisième trimestre 2026</a>'
        article = """<html><head><meta property="og:title" content="Situation du marché du travail au Maroc au troisième trimestre 2026"/></head><body>
        <p>Au troisième trimestre 2026, la main-d’œuvre s’établit à 11,7 millions de personnes, tandis que le nombre de personnes en emploi contre revenu atteint 10,5 millions.</p>
        <p>Le taux composite de la sous-utilisation de la main-d’œuvre atteint 19,6%. Le taux de chômage strict s’établit à 10,5%.</p>
        <p>Le taux de chômage strict s’élève respectivement à 30,5% et 16,7% pour ces deux catégories.</p>
        </body></html>"""
        source = {"id":"hcp_labour_statistics","type":"hcp_labour_statistics","url":"https://www.hcp.ma/","listing_urls":["/Actualite-marche-du-travail_r424.html"]}

        with patch("pipeline.collectors._fetch_text", side_effect=[listing, article]):
            items = collect_from_source(source)

        codes = {item["statistics_series"]["indicator_code"] for item in items}
        self.assertEqual(len(items), 4)
        self.assertFalse(any(code in codes for code in {
            "HCP_EMO_YOUTH_UNEMPLOYMENT",
            "HCP_EMO_WOMEN_UNEMPLOYMENT",
            "HCP_EMO_YOUTH_UNDERUTILIZATION",
            "HCP_EMO_WOMEN_UNDERUTILIZATION",
        }))

    def test_mef_tand_statistics_extracts_public_finance_monetary_and_real_indicators(self):
        html = """<table>
        <tr><th>Catégories de données</th><th>Unité</th><th>Période de référence</th><th>Données actuelles</th><th>Données précédentes</th><th>Variation</th></tr>
        <tr><td>a) PIB à prix constant (2014)</td><td>MDH</td><td>T2-2026</td><td>350.273</td><td>347.396</td><td>0,8</td></tr>
        <tr><td>Taux de Chômage</td><td>%</td><td>T3-2026</td><td>10,5%</td><td>9,5%</td><td></td></tr>
        <tr><td>1- Recettes Ordinaires</td><td>MDH</td><td>sept.-26</td><td>338.877</td><td>295.148</td><td>14,8</td></tr>
        <tr><td>M3</td><td>MDH</td><td>sept.-26</td><td>2.237.946</td><td>2.217.026</td><td>0,9</td></tr>
        <tr><td>Total encours de la dette</td><td>MDH</td><td>T2-2026</td><td>1.190.381,2</td><td>1.169.753,3</td><td>1,76</td></tr>
        </table>"""
        source = {"id":"mef_tand_statistics","type":"mef_tand_statistics","statistics_url":"https://www.finances.gov.ma/tand"}
        with patch("pipeline.collectors._fetch_text", return_value=html):
            items = collect_from_source(source)
        series = {x["statistics_series"]["indicator_code"]: x["statistics_series"] for x in items}
        self.assertEqual(len(items), 5)
        self.assertEqual(series["MEF_GDP_CONSTANT"]["latest"]["value"], 350273.0)
        self.assertEqual(series["MEF_UNEMPLOYMENT_RATE"]["latest"]["value"], 10.5)
        self.assertEqual(series["MEF_ORDINARY_REVENUES"]["latest"]["value"], 338877.0)
        self.assertEqual(series["MEF_M3"]["latest"]["value"], 2237946.0)
        self.assertEqual(series["MEF_TOTAL_CENTRAL_GOV_DEBT"]["latest"]["value"], 1190381.2)
        self.assertEqual(series["MEF_GDP_CONSTANT"]["latest"]["year"], "2026-T2")
        self.assertEqual(series["MEF_ORDINARY_REVENUES"]["latest"]["year"], "2026-09")

    def test_mef_number_parses_french_grouping_and_decimal_separators(self):
        from pipeline.collectors import _mef_number
        self.assertEqual(_mef_number("862.341,94"), 862341.94)
        self.assertEqual(_mef_number("350.273"), 350273.0)
        self.assertEqual(_mef_number("-0,56"), -0.56)

    def test_bank_al_maghrib_public_monia_scraper_needs_no_api_key(self):
        html = """<table><tr><th>Indice MONIA</th><th>Volume JJ</th><th>Date de référence</th><th>Date de publication</th></tr>
        <tr><td>2,195 %</td><td>12709</td><td>25/11/2026</td><td>26/11/2026</td></tr>
        <tr><td>2,139 %</td><td>13888</td><td>24/11/2026</td><td>25/11/2026</td></tr></table>"""
        source = {"id":"bank_al_maghrib_monia","type":"bank_al_maghrib","name":"Bank Al-Maghrib","statistics_pages":[{"kind":"monia","url":"https://www.bkam.ma/monia"}]}
        with patch("pipeline.collectors._fetch_text", return_value=html):
            items = collect_from_source(source)
        self.assertEqual(len(items), 2)
        self.assertEqual(items[0]["statistics_series"]["indicator_code"], "BAM_MONIA_RATE")
        self.assertEqual(items[0]["statistics_series"]["latest"]["value"], 2.195)
        self.assertEqual(items[1]["statistics_series"]["indicator_code"], "BAM_MONIA_VOLUME")
        self.assertEqual(items[1]["statistics_series"]["latest"]["value"], 12709.0)


    def test_emploi_public_collector_extracts_official_notice_fields(self):
        listing = '<a href="/fr/concours/details/5200930a-096d-4d16-b1f6-4f140fc3b9e0">Avis de concours de recrutement de Administrateur 2ème grade - echelle 11 Annonce 2 postes</a>'
        detail = """<html><body>Administration qui recrute Archives du Maroc
        Délai de dépôt des candidatures 28 Août 2026 - 16:30
        Date du concours 27 Septembre 2026 Date de publication 10 Août 2026
        Téléchargement <a href="/files/arrete.pdf">Arrêté d'ouverture du concours</a>
        Description Grade : Administrateur 2ème grade - echelle 11
        Nombre de postes : 2 Type de recrutement : Recrutement régulier
        Code du concours : C43219/26</body></html>"""
        source = {"id":"emploi_public_maroc","type":"emploi_public","url":"https://www.emploi-public.ma/fr/concours-liste?page=1","max_items":10}
        with patch("pipeline.collectors._fetch_text", side_effect=[listing, detail]):
            items = collect_from_source(source)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "Administrateur 2ème grade - echelle 11")
        self.assertIn("Archives du Maroc", items[0]["abstract"])
        self.assertIn("Nombre de postes : 2", items[0]["abstract"])
        self.assertIn("C43219/26", items[0]["abstract"])
        self.assertEqual(items[0]["published_date"], "2026-08-10")
        self.assertEqual(items[0]["pdf_url"], "https://www.emploi-public.ma/files/arrete.pdf")
        self.assertEqual(items[0]["espace"], "academy")

    def test_hespress_collector_filters_topics_and_extracts_metadata(self):
        listing = """<a href="/politique/article/123">Le gouvernement annonce une réforme des finances publiques au Maroc</a>
        <a href="/sport/article/456">Le Maroc gagne un match de football</a>"""
        article = """<html><head>
        <meta property="og:title" content="Réforme des finances publiques au Maroc - Hespress"/>
        <meta property="og:description" content="Le gouvernement présente les grandes lignes de la réforme budgétaire et ses effets sur les politiques publiques au Maroc."/>
        <meta property="article:published_time" content="2026-11-26T10:30:00+01:00"/>
        <meta name="author" content="Rédaction"/></head><body><h1>Réforme des finances publiques au Maroc</h1></body></html>"""
        source = {"id":"hespress_ar","type":"hespress_news","url":"https://www.hespress.com/","max_items":10,"include_title_tokens":["gouvernement","budget","finances publiques","réforme"],"exclude_title_tokens":["football","sport"]}
        sport_article = """<html><head>
        <meta property="og:title" content="Le Maroc gagne un match de football - Hespress"/>
        <meta property="og:description" content="Le championnat de football et le match de la sélection nationale."/>
        </head></html>"""
        with patch("pipeline.collectors._fetch_text", side_effect=[listing, sport_article, article]):
            items = collect_from_source(source)
        self.assertEqual(len(items), 1)
        self.assertIn("gouvernement", items[0]["abstract"].lower())
        self.assertEqual(items[0]["published_date"], "2026-11-26T10:30:00+01:00")
        self.assertEqual(items[0]["authors"], ["Rédaction"])
        self.assertEqual(items[0]["espace"], "veille")

    def test_hespress_collector_skips_irrelevant_and_empty_detail_pages(self):
        listing = """<a href="/sport/article/456">Le Maroc gagne un match de football</a>
        <a href="/politique/article/789">Une actualité sur un sujet sans résumé</a>"""
        article = "<html><head><title>Une actualité</title></head><body><h1>Une actualité</h1></body></html>"
        source = {"id":"hespress_ar","type":"hespress_news","url":"https://www.hespress.com/","max_items":10,"include_title_tokens":["gouvernement","budget","réforme"]}
        with patch("pipeline.collectors._fetch_text", side_effect=[listing, article]):
            self.assertEqual(collect_from_source(source), [])


    def test_detect_real_language(self):
        self.assertEqual(detect_real_language("Politique publique et gouvernance au Maroc"), "fr")
        self.assertEqual(detect_real_language("Public policy and economic growth in Morocco"), "en")
        self.assertEqual(detect_real_language("تقرير حول الحكامة والسياسات العمومية في المغرب"), "ar")

    def test_normalize_doi(self):
        self.assertEqual(normalize_doi("https://doi.org/10.1000/ABC.123"), "10.1000/abc.123")
        self.assertEqual(normalize_doi("doi: 10.1234/Some.Path"), "10.1234/some.path")
        self.assertIsNone(normalize_doi("not-a-doi"))
        self.assertIsNone(normalize_doi("10.12/too-short-prefix"))
        self.assertIsNone(normalize_doi("javascript:alert(1)"))

    def test_process_raw_item_marks_doi_quality(self):
        source = {
            "id": "crossref_test",
            "name": "Crossref",
            "default_doc_type": "publication_scientifique",
        }
        valid = process_raw_item(
            {
                "title": "Étude sur la gouvernance publique au Maroc",
                "abstract": "Analyse de la gouvernance et des politiques publiques au Maroc.",
                "doi": "https://doi.org/10.1000/ABC.123",
                "published_date": "2025",
                "url": "https://example.org/article",
            },
            source,
            now_iso="2026-11-27T00:00:00Z",
        )
        self.assertIsNotNone(valid)
        self.assertEqual(valid["doi"], "10.1000/abc.123")
        self.assertEqual(valid["doi_statut"], "valide")

        invalid = process_raw_item(
            {
                "title": "Étude sur la gouvernance publique au Maroc",
                "abstract": "Analyse de la gouvernance et des politiques publiques au Maroc.",
                "doi": "https://example.org/not-a-doi",
                "published_date": "2025",
                "url": "https://example.org/article",
            },
            source,
            now_iso="2026-11-27T00:00:00Z",
        )
        self.assertIsNotNone(invalid)
        self.assertEqual(invalid["doi"], "https://example.org/not-a-doi")
        self.assertEqual(invalid["doi_statut"], "invalide")

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

    def test_relevance_uses_word_boundaries_and_english_topics(self):
        false_positive = evaluate_morocco_relevance(
            "Made-up experimental notes",
            "Laboratory analysis of generic samples.",
        )
        self.assertFalse(false_positive["is_relevant"])

        english = evaluate_morocco_relevance(
            "Moroccan public finance and fiscal policy reform",
            "An empirical study of governance and public administration in Morocco.",
        )
        self.assertTrue(english["is_relevant"])
        self.assertEqual(english["lien_maroc"], "direct")

        isolated_city = evaluate_morocco_relevance(
            "Rabat astronomy observations",
            "A study of distant galaxies and stellar evolution.",
        )
        self.assertFalse(isolated_city["is_relevant"])

        generic_morocco_research = evaluate_morocco_relevance(
            "Research methods in astronomy",
            "A comparative research paper on astronomy and astrophysics.",
            {"id": "crossref_maroc", "type": "crossref"},
        )
        self.assertFalse(generic_morocco_research["is_relevant"])

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

    def test_collect_crossref_by_doi_mocked(self):
        payload = {
            "status": "ok",
            "message": {
                "DOI": "10.1000/example.2026",
                "title": ["Étude de la gouvernance au Maroc"],
                "author": [{"given": "Rachid", "family": "Essedik"}],
                "published": {"date-parts": [[2025, 6, 13]]},
                "URL": "https://doi.org/10.1000/example.2026",
                "publisher": "Policy Press",
                "container-title": ["Public Policy Evaluation"],
                "abstract": "<jats:p>Résumé scientifique complet sur la gouvernance au Maroc.</jats:p>",
                "subject": ["Public policy"],
            },
        }
        with patch("pipeline.collectors._fetch_text", return_value=json.dumps(payload)) as fetch:
            item = collect_crossref_by_doi("https://doi.org/10.1000/EXAMPLE.2026")
        self.assertIsNotNone(item)
        self.assertEqual(item["doi"], "10.1000/example.2026")
        self.assertEqual(item["authors"], ["Rachid Essedik"])
        self.assertEqual(item["venue"], "Public Policy Evaluation")
        self.assertIn("Résumé scientifique complet", item["abstract"])
        self.assertIn("/works/doi/10.1000/example.2026", fetch.call_args.args[0])

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
            "A comparative research paper on astronomy and astrophysics.",
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
        self.assertEqual(len(items), 2)
        self.assertEqual(items[0]["statistics_series"]["indicator_code"], "GOOD")
        self.assertIn("BAD", items[1]["statistics_collection_warnings"][0])
        self.assertIn("temporary outage", items[1]["statistics_collection_warnings"][0])

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

    def test_merge_does_not_transfer_future_date_anomaly_to_trusted_date(self):
        existing = {
            "id": "kitn_date_guard",
            "date_publication": "2025-05-10",
            "date_statut": "date_confirmee",
            "date_anomalie": False,
        }
        incoming = {
            "id": "kitn_date_guard",
            "date_publication": "2027-03-15",
            "date_statut": "date_future_a_verifier",
            "date_anomalie": True,
        }
        merged, changed = _merge_preserving_rich_fields(existing, incoming, "2026-11-27T12:00:00Z")
        self.assertFalse(changed)
        self.assertEqual(merged["date_publication"], "2025-05-10")
        self.assertFalse(merged["date_anomalie"])
        self.assertEqual(merged["date_statut"], "date_confirmee")

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
                        "doi": "https://doi.org/10.1000/DUPLICATE.1",
                        "source_id": "crossref_test",
                    }, {
                        "id": "kitn_existing_duplicate_doi",
                        "titre_original": "A differently titled record for the same DOI",
                        "auteurs": ["Chercheur A", "Chercheur B"],
                        "date_publication": "2026-09-02",
                        "type_document": "publication_scientifique",
                        "pole": "recherche_scientifique",
                        "resume": "Second abstract from another source.",
                        "doi": "10.1000/duplicate.1",
                        "source_id": "openalex_test",
                    }, {
                        "id": "kitn_existing_enrich",
                        "titre_original": "Étude scientifique à enrichir sur le Maroc",
                        "auteurs": ["Auteur initial"],
                        "date_publication": "2025-05-01",
                        "type_document": "publication_scientifique",
                        "espace": "science",
                        "pole": "recherche_scientifique",
                        "resume": "",
                        "doi": "10.1000/enrich.1",
                        "revue_ou_institution": "Revue initiale",
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
                patch("pipeline.run_pipeline.collect_crossref_by_doi", return_value={
                    "title": "Étude scientifique à enrichir sur le Maroc",
                    "abstract": "Résumé complet de la recherche portant sur les politiques publiques au Maroc.",
                    "authors": ["Auteur initial", "Auteur complémentaire"],
                    "venue": "Revue initiale",
                    "keywords": ["gouvernance"],
                    "published_date": "2025-05-01",
                    "url": "https://doi.org/10.1000/enrich.1",
                    "doi": "10.1000/enrich.1",
                    "default_doc_type": "publication_scientifique",
                }),
            ):
                payload = run()

            ids = {it["id"] for it in payload["items"]}
            self.assertIn("kitn_existing_1", ids)
            self.assertIn("kitn_existing_enrich", ids)
            self.assertNotIn("kitn_existing_duplicate_doi", ids)
            self.assertEqual(sum(1 for it in payload["items"] if normalize_doi(it.get("doi")) == "10.1000/duplicate.1"), 1)
            self.assertIn("kitn_manual_test1", ids)
            enriched_item = next(it for it in payload["items"] if it["id"] == "kitn_existing_enrich")
            self.assertIn("Résumé complet de la recherche", enriched_item["resume"])
            self.assertIn("Auteur complémentaire", enriched_item["auteurs"])
            self.assertEqual(enriched_item["metadata_source_enrichissement"], "Crossref")
            self.assertTrue(enriched_item["metadata_enrichissement_tente_le"])
            self.assertEqual(payload["doi_enrichment_attempted"], 1)
            self.assertEqual(payload["doi_enrichment_updated"], 1)
            self.assertTrue(pub_idx.exists())
            self.assertTrue(health_path.exists())
            health_data = json.loads(health_path.read_text(encoding="utf-8"))
            self.assertEqual(health_data["sources"][0]["domain"], "example.ma")
            self.assertEqual(health_data["sources"][0]["target_space"], "chiffres")
            self.assertEqual(health_data["sources"][0]["stage"], "aucun_contenu")
            self.assertEqual(health_data["sources"][0]["status"], "warning")


    def test_run_pipeline_reports_statistical_series_separately_from_documents(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            data_dir = root / "data"
            public_dir = root / "public" / "data"
            index_dir = data_dir / "index"
            index_dir.mkdir(parents=True, exist_ok=True)
            public_dir.mkdir(parents=True, exist_ok=True)
            sources_path = data_dir / "sources.json"
            manual_path = data_dir / "manual_contributions.json"
            index_path = index_dir / "search-index.json"
            health_path = data_dir / "sources-health.json"
            public_health = public_dir / "sources-health.json"
            statistics_path = data_dir / "statistics.json"
            regional_statistics_path = data_dir / "regional-statistics.json"
            public_index = public_dir / "index" / "search-index.json"
            public_statistics = public_dir / "statistics.json"
            public_regional_statistics = public_dir / "regional-statistics.json"
            sources_path.write_text(json.dumps([{
                "id": "mef_test",
                "name": "MEF — statistiques",
                "domain": "finances.gov.ma",
                "target_space": "chiffres",
                "type": "mef_tand_statistics",
                "enabled": True,
                "default_doc_type": "statistique",
                "indicators": [{"code": "MEF_GDP_CONSTANT"}, {"code": "MEF_MISSING_TEST"}],
            }]), encoding="utf-8")
            manual_path.write_text(json.dumps({"items": []}), encoding="utf-8")
            index_path.write_text(json.dumps({"items": []}), encoding="utf-8")

            statistical_items = [{
                "title": "PIB à prix constant — Maroc",
                "abstract": "Série officielle du PIB.",
                "url": "https://finances.gov.ma/statistiques/pib",
                "statistics_series": {
                    "indicator_code": "MEF_GDP_CONSTANT",
                    "label_fr": "PIB à prix constant",
                    "latest": {"year": "2026-T2", "value": 350273},
                    "history": [{"year": "2026-T2", "value": 350273}],
                    "source_name": "MEF",
                    "source_url": "https://finances.gov.ma/statistiques/pib",
                },
                "regional_statistics": [{
                    "id": "HCP_EMO_REGIONAL_TEST:all:MAR",
                    "series_key": "HCP_EMO_REGIONAL_TEST:all:MAR",
                    "indicator_code": "HCP_EMO_REGIONAL_TEST",
                    "geography_code": "MAR",
                    "residence_scope": "all",
                    "history": [{"year": "T3/2026", "value": 41.8, "quality_flag": "standard"}],
                }],
            }]

            with (
                patch("pipeline.run_pipeline.SOURCES_FILE", sources_path),
                patch("pipeline.run_pipeline.MANUAL_CONTRIBUTIONS_FILE", manual_path),
                patch("pipeline.run_pipeline.INDEX_DIR", index_dir),
                patch("pipeline.run_pipeline.INDEX_FILE", index_path),
                patch("pipeline.run_pipeline.PUBLIC_INDEX_FILE", public_index),
                patch("pipeline.run_pipeline.SOURCES_HEALTH_FILE", health_path),
                patch("pipeline.run_pipeline.PUBLIC_SOURCES_HEALTH_FILE", public_health),
                patch("pipeline.run_pipeline.STATISTICS_FILE", statistics_path),
                patch("pipeline.run_pipeline.PUBLIC_STATISTICS_FILE", public_statistics),
                patch("pipeline.run_pipeline.REGIONAL_STATISTICS_FILE", regional_statistics_path),
                patch("pipeline.run_pipeline.PUBLIC_REGIONAL_STATISTICS_FILE", public_regional_statistics),
                patch("pipeline.run_pipeline.collect_from_source", return_value=statistical_items),
                patch("pipeline.run_pipeline.process_raw_item", return_value=None),
            ):
                run()

            health = json.loads(health_path.read_text(encoding="utf-8"))
            public_health_data = json.loads(public_health.read_text(encoding="utf-8"))
            self.assertEqual(public_health_data, health)
            source_health = health["sources"][0]
            self.assertEqual(source_health["status"], "warning")
            self.assertEqual(source_health["stage"], "collecte_statistique_partielle")
            self.assertEqual(source_health["statistics_configured"], 2)
            self.assertEqual(source_health["statistics_configured_indicators"], ["MEF_GDP_CONSTANT", "MEF_MISSING_TEST"])
            self.assertEqual(source_health["statistics_missing_indicators"], ["MEF_MISSING_TEST"])
            self.assertTrue(any("MEF_MISSING_TEST" in warning for warning in source_health["statistics_warnings"]))
            self.assertEqual(source_health["fetched"], 1)
            self.assertEqual(source_health["accepted"], 0)
            self.assertEqual(source_health["statistics_collected"], 1)
            self.assertEqual(source_health["regional_statistics_collected"], 1)
            self.assertEqual(source_health["statistics_indicators"], ["MEF_GDP_CONSTANT"])
            statistics = json.loads(statistics_path.read_text(encoding="utf-8"))
            self.assertEqual(statistics["indicators"][0]["indicator_code"], "MEF_GDP_CONSTANT")
            self.assertEqual(statistics["indicator_count"], 2)
            hcp_national = next(
                item for item in statistics["indicators"]
                if item["indicator_code"] == "HCP_EMO_REGIONAL_TEST"
            )
            self.assertEqual(hcp_national["pole"], "societe_developpement_humain")
            self.assertEqual(hcp_national["latest"], {"year": "T3/2026", "value": 41.8, "quality_flag": "standard"})
            self.assertEqual(hcp_national["collection_status"], "collected")
            self.assertTrue(public_statistics.exists())
            regional = json.loads(regional_statistics_path.read_text(encoding="utf-8"))
            self.assertEqual(regional["series_count"], 1)
            self.assertEqual(regional["series"][0]["geography_code"], "MAR")
            self.assertTrue(public_regional_statistics.exists())



    def test_bam_ckan_xlsx_parser_extracts_horizontal_monthly_series(self):
        import io
        import zipfile
        from pipeline.collectors import _xlsx_read_rows, _bam_ckan_series_from_rows

        sheet = """<?xml version="1.0" encoding="UTF-8"?>
        <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
          <sheetData>
            <row r="1">
              <c r="A1" t="inlineStr"><is><t>Indicateur</t></is></c>
              <c r="B1" t="inlineStr"><is><t>Décembre 2024</t></is></c>
              <c r="C1" t="inlineStr"><is><t>Janvier 2025</t></is></c>
              <c r="D1" t="inlineStr"><is><t>Février 2025</t></is></c>
            </row>
            <row r="2">
              <c r="A2" t="inlineStr"><is><t>Masse monétaire M3 (MDH)</t></is></c>
              <c r="B2"><v>1000</v></c><c r="C2"><v>1010,5</v></c><c r="D2"><v>1020</v></c>
            </row>
          </sheetData>
        </worksheet>"""
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w") as archive:
            archive.writestr("xl/worksheets/sheet1.xml", sheet)
        rows = _xlsx_read_rows(buffer.getvalue())
        items = _bam_ckan_series_from_rows(
            rows,
            {"title": "Agrégats de monnaie", "notes": "Séries officielles mensuelles"},
            {"url": "https://data.gov.ma/resource.xlsx", "name": "Agregats_Aout_2026.xlsx"},
        )
        self.assertEqual(len(items), 1)
        series = items[0]["statistics_series"]
        self.assertEqual(series["indicator_code"], "BAM_CKAN_AGR_GATS_DE_MONNAIE_FEUILLE_1_MASSE_MON_TAIRE_M3_MDH")
        self.assertEqual(series["sheet_name"], "Feuille 1")
        self.assertEqual(series["latest"], {"year": "2025-02", "value": 1020.0})
        self.assertEqual(len(series["history"]), 3)
        self.assertEqual(series["unit_fr"], "MDH")
        self.assertEqual(series["source_url"], "https://data.gov.ma/resource.xlsx")

    def test_xlsx_reader_preserves_worksheet_names(self):
        import io
        import zipfile
        from pipeline.collectors import _xlsx_read_sheets

        workbook = """<?xml version="1.0" encoding="UTF-8"?>
        <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
                  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
          <sheets>
            <sheet name="Actif" sheetId="1" r:id="rId1"/>
            <sheet name="Passif" sheetId="2" r:id="rId2"/>
          </sheets>
        </workbook>"""
        relationships = """<?xml version="1.0" encoding="UTF-8"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
          <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
        </Relationships>"""
        sheet_one = """<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>
          <row r="1"><c r="A1" t="inlineStr"><is><t>Actif total</t></is></c></row>
        </sheetData></worksheet>"""
        sheet_two = """<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>
          <row r="1"><c r="A1" t="inlineStr"><is><t>Passif total</t></is></c></row>
        </sheetData></worksheet>"""
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w") as archive:
            archive.writestr("xl/workbook.xml", workbook)
            archive.writestr("xl/_rels/workbook.xml.rels", relationships)
            archive.writestr("xl/worksheets/sheet1.xml", sheet_one)
            archive.writestr("xl/worksheets/sheet2.xml", sheet_two)

        sheets = _xlsx_read_sheets(buffer.getvalue())
        self.assertEqual([name for name, _ in sheets], ["Actif", "Passif"])
        self.assertEqual(sheets[0][1][0][0], "Actif total")
        self.assertEqual(sheets[1][1][0][0], "Passif total")

    def test_bam_ckan_collector_discovers_and_downloads_latest_xlsx(self):
        from pipeline.collectors import collect_bank_al_maghrib_ckan

        package_payload = {
            "success": True,
            "result": {"results": [{
                "title": "Agrégats de monnaie",
                "name": "agregats-de-monnaie",
                "notes": "Historique des agrégats",
                "resources": [{
                    "format": "XLSX", "state": "active",
                    "created": "2026-11-02T09:00:00",
                    "url": "https://data.gov.ma/resource.xlsx",
                    "name": "Agregats_Aout_2026.xlsx",
                }],
            }]},
        }
        with patch("pipeline.collectors._fetch_text", return_value=json.dumps(package_payload)), patch(
            "pipeline.collectors._fetch_bytes", return_value=b"PK-test"
        ) as download, patch(
            "pipeline.collectors._xlsx_read_sheets",
            return_value=[("Feuille monétaire", [
                ["Indicateur", "Décembre 2024", "Janvier 2025", "Février 2025"],
                ["Masse monétaire M3 (MDH)", "1000", "1010", "1020"],
            ])],
        ):
            items = collect_bank_al_maghrib_ckan({
                "api_base": "https://data.gov.ma/data/api/3/action",
                "organization": "bank-al-maghrib",
                "max_datasets": 43,
            })
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["statistics_series"]["latest"]["value"], 1020.0)
        self.assertEqual(items[0]["statistics_series"]["sheet_name"], "Feuille monétaire")
        self.assertIn("FEUILLE_MON_TAIRE", items[0]["statistics_series"]["indicator_code"])
        download.assert_called_once_with(
            "https://data.gov.ma/resource.xlsx", timeout=30, max_bytes=8000000
        )

    def test_bam_ckan_period_and_number_parsers_handle_french_values(self):
        from pipeline.collectors import _bam_ckan_period, _bam_ckan_number
        self.assertEqual(_bam_ckan_period("Août 2026"), "2026-08")
        self.assertEqual(_bam_ckan_period("2026-T3"), "2026-T3")
        self.assertEqual(_bam_ckan_period("31/08/2026"), "2026-08")
        self.assertEqual(_bam_ckan_period("2098"), None)
        self.assertEqual(_bam_ckan_period("2026"), "2026")
        self.assertEqual(_bam_ckan_number("1 234,56"), 1234.56)
        self.assertEqual(_bam_ckan_number("(25,5)"), -25.5)
        self.assertIsNone(_bam_ckan_number("—"))



    def test_hcp_emo_mobile_listing_accepts_desktop_article_links(self):
        from pipeline.collectors import collect_hcp_labour_statistics

        listing = """
        <html><body>
          <a href="https://www.hcp.ma/Situation-du-marche-du-travail-au-Maroc-au-troisieme-trimestre-2026_a4364.html">
            Lire la suite
          </a>
        </body></html>
        """
        detail = """
        <html><head>
          <meta property="og:title" content="Situation du marché du travail au Maroc au troisième trimestre 2026" />
          <meta property="article:published_time" content="2026-11-03T08:00:00+01:00" />
        </head><body>
          <p>Au troisième trimestre 2026, la main-d’œuvre s’établit à 11,7 millions de personnes, tandis que le nombre de personnes en emploi contre revenu atteint 10,5 millions.</p>
          <p>Le taux composite de la sous-utilisation de la main-d’œuvre atteint 19,6%. Le taux de chômage strict s’établit à 10,5%.</p>
          <p>Le taux de chômage strict s’élève respectivement à 30,5% et 16,7% pour ces deux catégories.</p>
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
        values = {item["statistics_series"]["indicator_code"]: item["statistics_series"]["latest"]["value"] for item in items}
        self.assertEqual(values["HCP_EMO_UNEMPLOYMENT"], 10.5)
        self.assertEqual(values["HCP_EMO_UNDERUTILIZATION"], 19.6)
        self.assertEqual(values["HCP_EMO_YOUTH_UNEMPLOYMENT"], 30.5)
        self.assertEqual(values["HCP_EMO_WOMEN_UNEMPLOYMENT"], 16.7)
        self.assertEqual(items[0]["statistics_series"]["latest"]["year"], "T3/2026")



    def test_bam_ckan_parser_finds_vertical_table_below_title_rows_and_unit_hint(self):
        from pipeline.collectors import _bam_ckan_series_from_rows

        rows = [
            ["Bank Al-Maghrib"],
            ["Compte de patrimoine"],
            ["En millions de dirhams"],
            ["Période", "Actif total", "Passif total"],
            ["2024", "1000", "990"],
            ["2025", "1100", "1080"],
            ["2026", "1200", "1180"],
        ]
        items = _bam_ckan_series_from_rows(
            rows,
            {"title": "Compte de patrimoine des banques", "notes": "Données annuelles"},
            {"url": "https://data.gov.ma/banques.xlsx", "name": "banques.xlsx"},
        )
        self.assertEqual(len(items), 2)
        self.assertEqual(items[0]["statistics_series"]["latest"], {"year": "2026", "value": 1200.0})
        self.assertEqual(items[0]["statistics_series"]["unit_fr"], "MDH")
        self.assertEqual(items[1]["statistics_series"]["latest"]["value"], 1180.0)



    def test_previous_bam_statistics_filter_impossible_years_and_footnote_units(self):
        from pipeline.run_pipeline import _is_valid_statistics_series

        valid = {
            "indicator_code": "BAM_CKAN_COMPTE_ACTIF",
            "unit_fr": "MDH",
            "latest": {"year": "2026-08", "value": 100.0},
            "history": [{"year": "2025-08", "value": 90.0}],
        }
        impossible_year = {
            **valid,
            "latest": {"year": "2098", "value": 100.0},
        }
        footnote_unit = {
            **valid,
            "unit_fr": "*",
        }
        unknown_unit = {
            **valid,
            "unit_fr": "Unité non précisée",
        }
        non_finite = {
            **valid,
            "latest": {"year": "2026-08", "value": float("inf")},
        }
        invalid_month = {
            **valid,
            "latest": {"year": "2026-13", "value": 100.0},
        }
        duplicate_periods = {
            **valid,
            "history": [{"year": "2026-08", "value": 90.0}],
            "latest": {"year": "2026-08", "value": 100.0},
        }
        non_bam = {
            "indicator_code": "NY.GDP.MKTP.CD",
            "latest": {"year": "2098", "value": 100.0},
        }
        self.assertTrue(_is_valid_statistics_series(valid))
        self.assertFalse(_is_valid_statistics_series(impossible_year))
        self.assertFalse(_is_valid_statistics_series(footnote_unit))
        self.assertFalse(_is_valid_statistics_series(unknown_unit))
        self.assertFalse(_is_valid_statistics_series(non_finite))
        self.assertFalse(_is_valid_statistics_series(invalid_month))
        self.assertFalse(_is_valid_statistics_series(duplicate_periods))
        self.assertTrue(_is_valid_statistics_series(non_bam))



    def test_bam_monia_csv_fallback_parses_official_export_and_history(self):
        from pipeline.collectors import collect_bank_al_maghrib

        csv_payload = """Indice MONIA;Volume JJ;Date de référence;Date de publication
2,195;12709;25/11/2026;26/11/2026
2,139;13888;24/11/2026;25/11/2026
2,169;13200;23/11/2026;24/11/2026
"""
        page_url = "https://www.bkam.ma/Marches/Principaux-indicateurs/Marche-monetaire/Indice-monia-moroccan-overnight-index-average"
        csv_url = "https://www.bkam.ma/export/blockcsv/example"
        with patch("pipeline.collectors._fetch_text", return_value=csv_payload) as fetch:
            items = collect_bank_al_maghrib({
                "id": "bank_al_maghrib_monia",
                "name": "Bank Al-Maghrib — Indice MONIA",
                "statistics_pages": [{
                    "kind": "monia",
                    "url": page_url,
                    "csv_url": csv_url,
                }],
            })
        self.assertEqual(len(items), 2)
        series = {item["statistics_series"]["indicator_code"]: item["statistics_series"] for item in items}
        self.assertEqual(series["BAM_MONIA_RATE"]["latest"], {"year": "2026-11-25", "value": 2.195})
        self.assertEqual(series["BAM_MONIA_RATE"]["previous"], {"year": "2026-11-24", "value": 2.139})
        self.assertEqual(series["BAM_MONIA_VOLUME"]["latest"]["value"], 12709.0)
        self.assertEqual(series["BAM_MONIA_RATE"]["unit_fr"], "%")
        self.assertEqual(fetch.call_args.kwargs["referer"], page_url)
        self.assertEqual(fetch.call_args.args[0], csv_url)



if __name__ == "__main__":
    unittest.main()
