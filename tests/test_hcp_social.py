import unittest
from unittest.mock import patch

from pipeline.hcp_social import parse_hcp_social_indicators, parse_hcp_social_regional_indicators
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


HCP_SOCIAL_REGIONAL_FIXTURE = """
Tableau 6.21 : Taux de pauvreté monétaire par région (en %)
Région 2001 2014 2022
Tanger-Tétouan-Al Hoceima 11,5 2,2 2,9
Oriental 18,2 5,3 4,2
Fès-Meknès 16,5 5,2 9,0
Rabat-Salé-Kénitra 15,5 3,8 2,4
Béni Mellal-Khénifra 14,4 9,3 6,6
Casablanca-Settat 6,9 2,0 1,6
Marrakech-Safi 20,2 5,4 3,2
Draa-Tafilalet 40,3 14,6 4,9
Souss-Massa 16,7 5,1 3,6
Guelmim-Oued Noun 9,4 6,5 7,6
Laayoune-Sakia Al Hamra 3,6 0,7 0,7
Dakhla-Oued Eddahab 0,0 0,3 0,5
Source : HCP ENCDM et ENNVM
Tableau 6.21a : Taux et indice de pauvreté multidimensionnelle par région (en %)
Région 2014 2024 2014 2024
Tanger-Tétouan-Al Hoceima 5,32 2,61 13,9 7,1
Oriental 5,17 3,06 13,5 8,4
Fès-Meknès 5,28 3,32 13,7 9,0
Rabat-Salé-Kénitra 3,42 2,10 9,1 5,7
Béni Mellal-Khénifra 6,79 3,66 17,3 9,8
Casablanca-Settat 2,47 1,57 6,7 4,3
Marrakech-Safi 6,18 2,97 15,8 7,9
Draa-Tafilalet 5,77 2,94 14,4 7,7
Souss-Massa 4,23 2,07 11,2 5,7
Guelmim-Oued Noun 3,89 1,78 10,3 4,9
Laayoune-Sakia Al Hamra 1,18 0,84 3,3 2,4
Dakhla-Oued Eddahab 1,57 0,89 4,5 2,5
Source : HCP RGPH 2014 et 2024
Tableau 6.22 : Taux de vulnérabilité par région (en %)
Région 2001 2014 2022
Tanger-Tétouan-Al Hoceima 20,0 9,0 8,4
Oriental 27,4 10,4 11,9
Fès-Meknès 25,8 13,7 19,0
Rabat-Salé-Kénitra 20,5 12,9 12,8
Béni Mellal-Khénifra 24,7 17,3 24,5
Casablanca-Settat 16,6 8,9 7,9
Marrakech-Safi 29,8 13,5 11,6
Draa-Tafilalet 25,2 16,2 17,3
Souss-Massa 22,6 17,4 14,5
Guelmim-Oued Noun 11,9 13,4 10,4
Laayoune-Sakia Al Hamra 11,2 10,8 10,5
Dakhla-Oued Eddahab 0,0 0,5 2,9
Source : HCP ENCDM et ENNVM
Tableau 6.24 : Indice volumétrique de la pauvreté par région (en %)
Région 2001 2014 2022
Tanger-Tétouan-Al Hoceima 2,29 0,39 0,39
Oriental 4,98 1,11 0,90
Fès-Meknès 3,74 0,98 1,74
Rabat-Salé-Kénitra 3,03 0,57 0,33
Béni Mellal-Khénifra 3,07 1,74 1,27
Casablanca-Settat 1,37 0,27 0,21
Marrakech-Safi 4,34 0,97 0,60
Draa-Tafilalet 12,53 4,26 0,73
Souss-Massa 3,55 1,03 0,54
Guelmim-Oued Noun 2,35 0,97 1,20
Laayoune-Sakia Al Hamra 0,51 0,23 0,09
Dakhla-Oued Eddahab 0,00 0,05 0,07
Ensemble 3,47 0,94 0,67
Source : HCP ENCDM et ENNVM
Tableau 6.25 : Indice de sévérité de la pauvreté par région (en %)
Région 2001 2014 2022
Tanger-Tétouan-Al Hoceima 0,68 0,10 0,10
Oriental 2,01 0,39 0,29
Fès-Meknès 1,25 0,31 0,58
Rabat-Salé-Kénitra 0,95 0,14 0,08
Béni Mellal-Khénifra 1,01 0,49 0,35
Casablanca-Settat 0,42 0,07 0,04
Marrakech-Safi 1,45 0,25 0,18
Draa-Tafilalet 5,55 1,84 0,14
Souss-Massa 1,18 0,33 0,11
Guelmim-Oued Noun 0,94 0,25 0,34
Laayoune-Sakia Al Hamra 0,13 0,05 0,02
Dakhla-Oued Eddahab 0,00 0,01 0,01
Ensemble 1,21 0,30 0,19
Source : HCP ENCDM et ENNVM
Tableau 1.18 .a : Indice synthétique de fécondité par région
Région ISF Urbain Rural National
Tanger-Tétouan-Al Hoceima 1,84 2,41 2,01
Oriental 1,61 1,96 1,73
Fès-Meknès 1,80 2,46 2,02
Rabat-Salé-Kénitra 1,70 2,49 1,91
Béni Mellal-Khénifra 1,73 2,20 1,95
Casablanca-Settat 1,74 2,38 1,90
Marrakech-Safi 1,78 2,48 2,13
Drâa-Tafilalet 2,07 2,52 2,35
Souss-Massa 1,73 2,10 1,86
Guelmim-Oued Noun 1,90 1,85 1,89
Laayoune-Sakia El Hamra 2,17 2,19 2,17
Dakhla-Oued Eddahab 2,26 1,90 2,25
Total 1,77 2,37 1,97
Source : HCP RGPH 2024
"""


class HcpSocialIndicatorsTests(unittest.TestCase):

    def test_parser_extracts_regional_poverty_and_fertility_series(self):
        series, warnings = parse_hcp_social_regional_indicators(HCP_SOCIAL_REGIONAL_FIXTURE)

        self.assertEqual(warnings, [])
        self.assertEqual(len(series), 108)
        self.assertEqual(len({item["geography_code"] for item in series}), 12)
        self.assertNotIn("MAR", {item["geography_code"] for item in series})

        by_key = {item["series_key"]: item for item in series}
        poverty_rate = by_key["HCP_SOCIAL_REGIONAL_MULTIDIMENSIONAL_POVERTY_RATE:all:FES_MEKNES"]
        self.assertEqual(poverty_rate["latest"], {
            "year": "2024", "value": 9.0, "quality_flag": "standard"
        })

        poverty_gap = by_key["HCP_SOCIAL_REGIONAL_POVERTY_GAP:all:GUELMIM_OUED_NOUN"]
        self.assertEqual(poverty_gap["history"][1]["value"], 0.97)
        self.assertEqual(poverty_gap["history"][1]["quality_flag"], "estimated")

        fertility_urban = by_key["HCP_SOCIAL_REGIONAL_FERTILITY:urban:FES_MEKNES"]
        fertility_rural = by_key["HCP_SOCIAL_REGIONAL_FERTILITY:rural:FES_MEKNES"]
        fertility_all = by_key["HCP_SOCIAL_REGIONAL_FERTILITY:all:FES_MEKNES"]
        self.assertEqual(fertility_urban["latest"]["value"], 1.8)
        self.assertEqual(fertility_rural["latest"]["value"], 2.46)
        self.assertEqual(fertility_all["latest"]["value"], 2.02)

        self.assertEqual(
            {item["residence_scope"] for item in series if item["indicator_code"] == "HCP_SOCIAL_REGIONAL_FERTILITY"},
            {"urban", "rural", "all"},
        )

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
