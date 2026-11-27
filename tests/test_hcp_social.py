import unittest
from unittest.mock import patch

from pipeline.hcp_social import parse_hcp_social_indicators
from pipeline.collectors import collect_hcp_social_indicators


HCP_SOCIAL_FIXTURE = """
Tableau 1.1 : Population selon le milieu de résidence
Milieu 2004 2014 2024
Urbain 16 464 20 432 23 110
Rural 13 428 13 416 13 718
Ensemble 29 892 33 848 36 828
Source : HCP RGPH
Tableau 1.4 : Taux d’urbanisation
Région 1994 2004 2014 2024
Taux d’urbanisation 51,4 55,1 60,4 62,8
Tableau 1.20 : Taux de fécondité et ISF
Age 1994 2004 2014 2024
ISF (enfants/femme) 3,3 2,5 2,22 1,97
Tableau 2.20 : Taux de chômage. National
Indicateurs 2015 2016 2017 2018 2019 2020 2021 2023 2024
Selon le sexe
Ensemble 9,7 9,4 10,2 9,5 9,2 11,9 12,3 13,0 13,3
Hommes 9,4 8,9 8,8 8,1 7,8 10,7 10,9 11,5 11,6
Tableau 3.23 : Taux net de scolarisation au primaire
Indicateurs 2009/10 2014/15 2017/18 2018/19 2019/20 2023/24 2024/25
Urbain
Total 97,2 90,6 96,3 96,9 96,6 103,9 94,3
Rural
Total 91,4 95,1 102,1 103,5 104,2 123,2 105,9
National
Total 94,4 92,6 98,8 99,7 99,9 111,6 99,1
Tableau 3.38 : Taux brut de scolarisation au secondaire qualifiant
Indicateurs 2009/10 2014/15 2017/18 2018/19 2019/20 2023/24 2024/25
Urbain
Total 42,7 49,2 50,4 52,1 55,1 66,5 69,3
Rural
Total 4,6 9,7 11,0 12,2 14,0 24,5 30,0
National
Total 44,3 54,0 55,5 55,9 57,5 68,5 73,0
Tableau 4.35 : Quotient de mortalité infanto-juvénile
Année 2004 2011 2018
Ensemble 47,0 30,5 22,2
Urbain 38,0 25,4 18,8
Rural 69,0 35,0 26,0
Tableau 6.23 : Indice de Gini par région
Région 2001 2014 2022
Ensemble 0,406 0,395 0,405
"""


class HcpSocialIndicatorsTests(unittest.TestCase):
    def test_parser_extracts_eight_explicit_national_series(self):
        series, warnings = parse_hcp_social_indicators(HCP_SOCIAL_FIXTURE)

        self.assertEqual(len(series), 8)
        self.assertEqual(warnings, [])
        by_code = {item["indicator_code"]: item for item in series}

        self.assertEqual(
            by_code["HCP_SOCIAL_POPULATION"]["history"],
            [
                {"year": "2004", "value": 29892.0},
                {"year": "2014", "value": 33848.0},
                {"year": "2024", "value": 36828.0},
            ],
        )
        self.assertEqual(by_code["HCP_SOCIAL_URBANIZATION"]["latest"]["value"], 62.8)
        self.assertEqual(by_code["HCP_SOCIAL_FERTILITY"]["latest"]["value"], 1.97)
        self.assertEqual(by_code["HCP_SOCIAL_UNEMPLOYMENT"]["latest"]["value"], 13.3)
        self.assertEqual(by_code["HCP_SOCIAL_PRIMARY_NET_SCHOOLING"]["latest"]["value"], 99.1)
        self.assertEqual(by_code["HCP_SOCIAL_UPPER_SECONDARY_GROSS_SCHOOLING"]["latest"]["value"], 73.0)
        self.assertEqual(by_code["HCP_SOCIAL_UNDER5_MORTALITY"]["latest"]["value"], 22.2)
        self.assertEqual(by_code["HCP_SOCIAL_GINI"]["latest"]["value"], 0.405)
        self.assertTrue(all(item["pole"] == "societe_developpement_humain" for item in series))
        self.assertTrue(all(item["label_ar"] and item["label_ar"] != item["label_fr"] for item in series))
        self.assertTrue(all(item["description_ar"] and item["description_ar"] != item["description_fr"] for item in series))
        self.assertTrue(all(item["unit_ar"] for item in series))
        self.assertEqual(by_code["HCP_SOCIAL_UNEMPLOYMENT"]["label_ar"], "معدل البطالة الوطني")
        self.assertEqual(by_code["HCP_SOCIAL_POPULATION"]["unit_ar"], "ألف نسمة")

    def test_parser_does_not_publish_a_table_with_mismatched_years_and_values(self):
        text = """
        Tableau 1.1 : Population
        Milieu 2004 2014 2024
        Ensemble 29 892 33 848
        """
        series, warnings = parse_hcp_social_indicators(text)

        self.assertEqual(series, [])
        self.assertTrue(any("2 valeurs détectées pour 3 périodes" in warning for warning in warnings))

    def test_collector_emits_statistical_items_and_preserves_diagnostics(self):
        class FakePage:
            def extract_text(self, extraction_mode=None):
                return HCP_SOCIAL_FIXTURE

        class FakeReader:
            def __init__(self, stream):
                self.pages = [FakePage()]

        with patch("pipeline.collectors._fetch_pdf_bytes", return_value=b"%PDF"):
            with patch("pipeline.collectors.PdfReader", FakeReader):
                items = collect_hcp_social_indicators({
                    "url": "https://www.hcp.ma/file/248623/",
                    "referer": "https://www.hcp.ma/downloads/",
                })

        statistical_items = [item for item in items if item.get("statistics_series")]
        self.assertEqual(len(statistical_items), 8)
        self.assertTrue(all(item["pole"] == "societe_developpement_humain" for item in statistical_items))
        self.assertEqual(statistical_items[0]["statistics_series"]["source_url"], "https://www.hcp.ma/file/248623/")


if __name__ == "__main__":
    unittest.main()
