import unittest
from pathlib import Path
from unittest.mock import patch

from pipeline.hcp_regional import HCP_EMO_REGIONS, HCP_EMO_REGIONAL_INDICATORS, parse_hcp_emo_regional_tables
from pipeline.run_pipeline import _merge_regional_statistics_series
from pipeline.collectors import _extract_hcp_emo_regional_statistics


class HcpEmoRegionalParserTests(unittest.TestCase):
    def test_parses_all_regions_and_national_total_for_a_regional_table(self):
        extracted = """
        Indicateurs T1/2026 T2/2026 T3/2026
        Ensemble
        Taux de participation à la main-d’œuvre (%)
        Tanger-Tétouan-Al Hoceima 46,4 46,8 45,5
        Oriental 37,0 36,6 35,7
        Fès-Meknès 38,5 40,0 39,3
        Rabat-Salé-Kénitra 42,6 42,2 40,9
        Béni Mellal-Khénifra 39,3 40,2 40,7
        Casablanca-Settat 45,6 46,7 47,0
        Marrakech-Safi 42,2 43,1 42,4
        Drâa-Tafilalet 31,1 30,5 30,2
        Souss-Massa 38,8 37,6 37,5
        Guelmim-Oued Noun 37,2 40,8 38,6
        Laâyoune-Sakia El Hamra 43,1 39,7 41,7
        Dakhla-Oued Ed-Dahab 63,9 59,2 64,7
        Ensemble 41,8 42,2 41,8
        """

        series = parse_hcp_emo_regional_tables(
            extracted,
            source_url="https://www.hcp.ma/attachment/2928207/",
            published_date="2026-11-03",
        )

        self.assertEqual(len(series), 13)
        dakhla = next(item for item in series if item["geography_code"] == "DAKHLA_OUED_ED_DAHAB")
        self.assertEqual(dakhla["residence_scope"], "all")
        self.assertEqual(dakhla["history"][-1]["year"], "T3/2026")
        self.assertEqual(dakhla["latest"]["value"], 64.7)
        self.assertEqual(dakhla["source_page"], 1)
        self.assertEqual(dakhla["geography_name_ar"], "الداخلة-وادي الذهب")
        self.assertEqual(dakhla["label_ar"], "معدل المشاركة في القوى العاملة")
        national = next(item for item in series if item["geography_code"] == "MAR")
        self.assertEqual(national["history"][-1]["value"], 41.8)
        self.assertEqual(national["geography_name_ar"], "المجموع الوطني")
        self.assertTrue(national["methodology_note_ar"])

    def test_preserves_medium_and_insufficient_significance_flags(self):
        extracted = """
        Indicateurs T1/2026 T2/2026 T3/2026
        Rural
        Taux de chômage strict (%)
        Tanger-Tétouan-Al Hoceima 3,6ᵐˢ 1,8ᵐˢ 2,7ᵐˢ
        Oriental 9,4 9,7 11,1
        Fès-Meknès 8,2 4,0 10,8
        Rabat-Salé-Kénitra 5,2ᵐˢ ps 3,6ᵐˢ
        Ensemble 6,1 5,4 6,9
        """

        series = parse_hcp_emo_regional_tables(
            extracted,
            source_url="https://www.hcp.ma/attachment/2928207/",
        )
        tanger = next(item for item in series if item["geography_code"] == "TANGER_TETOUAN_AL_HOCEIMA")
        rabat = next(item for item in series if item["geography_code"] == "RABAT_SALE_KENITRA")

        self.assertEqual(tanger["residence_scope"], "rural")
        self.assertEqual(tanger["history"][0]["quality_flag"], "medium_significance")
        self.assertEqual(rabat["history"][1]["value"], None)
        self.assertEqual(rabat["history"][1]["quality_flag"], "insufficient_significance")

    def test_latest_period_is_not_replaced_by_an_older_significant_value(self):
        extracted = """
        Indicateurs T1/2026 T2/2026 T3/2026
        Rural
        Taux de chômage strict (%)
        Rabat-Salé-Kénitra 5,2ᵐˢ 5,0 3,6ᵐˢ
        Drâa-Tafilalet 9,4 8,3 ps
        """

        series = parse_hcp_emo_regional_tables(
            extracted,
            source_url="https://www.hcp.ma/attachment/2928207/",
        )
        draa = next(item for item in series if item["geography_code"] == "DRAA_TAFILALET")

        self.assertEqual(draa["history"][-2]["value"], 8.3)
        self.assertIsNone(draa["latest"]["value"])
        self.assertEqual(draa["latest"]["quality_flag"], "insufficient_significance")

    def test_preserves_unavailable_values_instead_of_turning_them_into_zero(self):
        extracted = """
        Indicateurs T1/2026 T2/2026 T3/2026
        Urbain
        Taux d’emploi contre revenu (%)
        Laâyoune-Sakia El Hamra . . .
        Dakhla-Oued Ed-Dahab . . .
        Ensemble 35,5 36,3 36,0
        """

        series = parse_hcp_emo_regional_tables(
            extracted,
            source_url="https://www.hcp.ma/attachment/2928207/",
        )
        laayoune = next(item for item in series if item["geography_code"] == "LAAYOUNE_SAKIA_EL_HAMRA")

        self.assertEqual(laayoune["history"][0]["value"], None)
        self.assertEqual(laayoune["history"][0]["quality_flag"], "not_available")
        self.assertEqual(laayoune["latest"]["value"], None)

    def test_parses_all_regional_tables_from_official_t3_2026_pdf_text_fixture(self):
        from pathlib import Path

        fixture_path = Path(__file__).parent / "fixtures" / "hcp_emo_t3_2026_regional_tables.txt"
        extracted = fixture_path.read_text(encoding="utf-8")
        series = parse_hcp_emo_regional_tables(
            extracted,
            source_url="https://www.hcp.ma/attachment/2928207/",
            published_date="2026-11-03",
        )

        self.assertEqual(len(series), 234)
        self.assertEqual({item["residence_scope"] for item in series}, {"all", "urban", "rural"})
        self.assertEqual(len({item["indicator_code"] for item in series}), 6)
        self.assertEqual(len({item["geography_code"] for item in series}), 13)
        national_employment = next(
            item for item in series
            if item["indicator_code"] == "HCP_EMO_REGIONAL_EMPLOYMENT_RATE"
            and item["geography_code"] == "MAR"
            and item["residence_scope"] == "all"
        )
        self.assertEqual(
            [(point["year"], point["value"]) for point in national_employment["history"]],
            [("T1/2026", 37.3), ("T2/2026", 38.2), ("T3/2026", 37.4)],
        )
        self.assertTrue(any(point["quality_flag"] == "insufficient_significance"
                            for item in series for point in item["history"]))
        self.assertTrue(any(point["quality_flag"] == "medium_significance"
                            for item in series for point in item["history"]))

    def test_pdf_attachment_reader_uses_the_official_attachment_and_parses_its_tables(self):
        fixture_path = Path(__file__).parent / "fixtures" / "hcp_emo_t3_2026_regional_tables.txt"
        extracted = fixture_path.read_text(encoding="utf-8")

        class FakePage:
            def extract_text(self, extraction_mode=None):
                return extracted

        class FakeReader:
            def __init__(self, stream):
                self.pages = [FakePage()]

        article_url = "https://m.hcp.ma/report.html"
        with patch("pipeline.collectors._fetch_pdf_bytes", return_value=b"%PDF") as fetch_bytes:
            with patch("pipeline.collectors.PdfReader", FakeReader):
                series, warnings = _extract_hcp_emo_regional_statistics(
                    ["/attachment/2928207/"],
                    article_url,
                    "2026-11-03",
                )

        self.assertEqual(len(series), 234)
        self.assertEqual(warnings, [])
        fetch_bytes.assert_called_once_with(
            "https://m.hcp.ma/attachment/2928207/",
            referer=article_url,
        )

    def test_partial_pdf_extraction_is_not_reported_as_complete_at_200_series(self):
        fixture_path = Path(__file__).parent / "fixtures" / "hcp_emo_t3_2026_regional_tables.txt"
        extracted = fixture_path.read_text(encoding="utf-8")
        complete_fixture_series = parse_hcp_emo_regional_tables(
            extracted,
            source_url="https://www.hcp.ma/attachment/2928207/",
            published_date="2026-11-03",
        )

        class FakePage:
            def extract_text(self, extraction_mode=None):
                return extracted

        class FakeReader:
            def __init__(self, stream):
                self.pages = [FakePage()]

        with patch("pipeline.collectors._fetch_pdf_bytes", return_value=b"%PDF") as fetch_bytes:
            with patch("pipeline.collectors.PdfReader", FakeReader):
                with patch(
                    "pipeline.collectors.parse_hcp_emo_regional_tables",
                    return_value=complete_fixture_series[:200],
                ):
                    series, warnings = _extract_hcp_emo_regional_statistics(
                        ["/attachment/2928207/"],
                        "https://www.hcp.ma/emo-2026.html",
                        "2026-11-03",
                    )

        self.assertEqual(len(series), 200)
        self.assertEqual(len(warnings), 1)
        self.assertIn("200 séries uniques sur 234 attendues", warnings[0])
        self.assertIn("34 combinaisons manquantes", warnings[0])
        fetch_bytes.assert_called_once()

    def test_pipeline_merge_keeps_earlier_quarters_and_replaces_revised_periods(self):
        existing = {
            "id": "HCP_EMO_REGIONAL_TEST:all:MAR",
            "series_key": "HCP_EMO_REGIONAL_TEST:all:MAR",
            "history": [
                {"year": "T1/2026", "value": 41.8, "quality_flag": "standard"},
                {"year": "T2/2026", "value": 42.2, "quality_flag": "standard"},
            ],
        }
        incoming = {
            "id": "HCP_EMO_REGIONAL_TEST:all:MAR",
            "series_key": "HCP_EMO_REGIONAL_TEST:all:MAR",
            "history": [
                {"year": "T2/2026", "value": 42.3, "quality_flag": "standard"},
                {"year": "T3/2026", "value": 41.8, "quality_flag": "standard"},
            ],
        }

        merged = _merge_regional_statistics_series(
            existing, incoming, "2026-11-27T14:00:00Z"
        )

        self.assertEqual(
            [(point["year"], point["value"]) for point in merged["history"]],
            [("T1/2026", 41.8), ("T2/2026", 42.3), ("T3/2026", 41.8)],
        )
        self.assertEqual(merged["latest"]["year"], "T3/2026")
        self.assertEqual(merged["collection_status"], "collected")

    def test_pipeline_merge_rejects_non_numeric_regional_values(self):
        incoming = {
            "id": "HCP_EMO_REGIONAL_TEST:all:MAR",
            "series_key": "HCP_EMO_REGIONAL_TEST:all:MAR",
            "history": [{"year": "T3/2026", "value": "41,8"}],
        }
        self.assertIsNone(
            _merge_regional_statistics_series(None, incoming, "2026-11-27T14:00:00Z")
        )

    def test_ignores_pages_without_a_supported_period_header_or_indicator(self):
        self.assertEqual(
            parse_hcp_emo_regional_tables(
                "Taux de chômage strict 10,5%",
                source_url="https://www.hcp.ma/attachment/2928207/",
            ),
            [],
        )


    def test_pdf_page_breaks_are_preserved_when_parsing_multiple_regional_tables(self):
        class FakePage:
            def __init__(self, text):
                self.text = text

            def extract_text(self, extraction_mode=None):
                return self.text

        class FakeReader:
            def __init__(self, _stream):
                rows = "\n".join(
                    f"{region_name} 40,0 41,0 42,0"
                    for region_name, _region_code in HCP_EMO_REGIONS
                )
                total = "Ensemble 40,0 41,0 42,0"
                self.pages = []
                for scope in ("all", "urban", "rural"):
                    scope_label = {"all": "National", "urban": "Urbain", "rural": "Rural"}[scope]
                    for _code, label, _pattern in HCP_EMO_REGIONAL_INDICATORS:
                        self.pages.append(FakePage(
                            "Indicateurs T1/2026 T2/2026 T3/2026\n"
                            f"{scope_label}\n{label} (%)\n{rows}\n{total}"
                        ))

        with patch("pipeline.collectors._fetch_pdf_bytes", return_value=b"%PDF-test"):
            with patch("pipeline.collectors.PdfReader", side_effect=FakeReader):
                series, warnings = _extract_hcp_emo_regional_statistics(
                    ["https://www.hcp.ma/attachment/2928207/"],
                    "https://www.hcp.ma/emo-2026.html",
                    "2026-11-03",
                )

        self.assertEqual(warnings, [])
        self.assertEqual(len(series), 234)
        self.assertEqual({item["residence_scope"] for item in series}, {"all", "urban", "rural"})
        self.assertEqual(len({item["indicator_code"] for item in series}), 6)

if __name__ == "__main__":
    unittest.main()
