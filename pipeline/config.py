from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
PUBLIC_DIR = ROOT_DIR / "public"
SOURCES_FILE = DATA_DIR / "sources.json"
MANUAL_CONTRIBUTIONS_FILE = DATA_DIR / "manual_contributions.json"
INDEX_DIR = DATA_DIR / "index"
INDEX_FILE = INDEX_DIR / "search-index.json"
PUBLIC_INDEX_FILE = PUBLIC_DIR / "data" / "index" / "search-index.json"
SOURCES_HEALTH_FILE = DATA_DIR / "sources-health.json"
PUBLIC_SOURCES_HEALTH_FILE = PUBLIC_DIR / "data" / "sources-health.json"
STATISTICS_FILE = DATA_DIR / "statistics.json"
PUBLIC_STATISTICS_FILE = PUBLIC_DIR / "data" / "statistics.json"
REGIONAL_STATISTICS_FILE = DATA_DIR / "regional-statistics.json"
PUBLIC_REGIONAL_STATISTICS_FILE = PUBLIC_DIR / "data" / "regional-statistics.json"
ACADEMY_FILE = DATA_DIR / "academy" / "academy.json"

SUPPORTED_LANGUAGES = ("fr", "ar", "en")

DOCUMENT_TYPES = (
    "publication_scientifique",
    "statistique",
    "rapport",
    "rapport_institutionnel",
    "document_juridique",
    "article",
    "article_presse",
    "concours",
    "ressource_pedagogique",
)

POLES = (
    "institutions_gouvernance",
    "economie_finances_publiques",
    "societe_developpement_humain",
    "relations_internationales_geopolitique",
    "securite_affaires_interieures",
    "recherche_scientifique",
)

SPACES = (
    "veille",
    "science",
    "chiffres",
    "academy",
    "bibliotheque",
)

MOROCCO_STRONG_SIGNALS = (
    "maroc",
    "morocco",
    "moroccan",
    "marocain",
    "marocaine",
    "marocains",
    "marocaines",
    "المغرب",
    "مغربي",
    "مغربية",
    "rabat",
    "casablanca",
    "الدار البيضاء",
    "الرباط",
    "marrakech",
    "fès",
    "fes",
    "tanger",
    "agadir",
    "oujda",
    "laâyoune",
    "dakhla",
    "haut-commissariat au plan",
    "hcp",
    "bank al-maghrib",
    "bam",
    "cour des comptes",
    "conseil économique, social et environnemental",
    "cese",
    "dgsn",
    "irat",
    "ministère de l'intérieur",
    "finances publiques",
    "dirham",
    "mad",
    "régionalisation avancée",
    "الجهوية المتقدمة",
    "المالية العمومية",
    "المجلس الأعلى للحسابات",
    "المندوبية السامية للتخطيط",
    "بنك المغرب",
)

POLE_KEYWORDS = {
    "institutions_gouvernance": (
        "gouvernance", "institution", "institutions", "administration", "ministère",
        "parlement", "réforme", "décentralisation", "régionalisation", "service public",
        "fonction publique", "décret", "loi organique", "الحكامة", "المؤسسات",
        "الإدارة", "السياسات العمومية", "اللامركزية", "الجهوية", "المرفق العام",
        "governance",
        "public administration",
        "public service",
        "institutional reform",
        "decentralization",
        "decentralisation",
        "public policy",
    ),
    "economie_finances_publiques": (
        "économie", "économique", "finance", "finances publiques", "budget", "fiscal",
        "inflation", "croissance", "pib", "emploi", "chômage", "investissement",
        "commerce extérieur", "dirham", "banque", "dette", "الاقتصاد", "المالية العمومية",
        "الميزانية", "الضرائب", "التضخم", "النمو", "التشغيل", "البطالة", "الاستثمار",
        "economy",
        "economic growth",
        "public finance",
        "public finances",
        "fiscal policy",
        "inflation",
        "unemployment",
        "foreign investment",
        "public debt",
        "trade balance",
    ),
    "societe_developpement_humain": (
        "développement humain", "société", "social", "éducation", "santé",
        "protection sociale", "pauvreté", "inégalités", "jeunesse", "famille",
        "urbanisation", "logement", "التنمية البشرية", "المجتمع", "التربية",
        "الصحة", "الحماية الاجتماعية", "الشباب", "السكن", "التمدن",
        "human development",
        "social development",
        "social protection",
        "poverty",
        "inequality",
        "education",
        "healthcare",
        "public health",
        "youth policy",
        "housing",
    ),
    "relations_internationales_geopolitique": (
        "géopolitique", "relations internationales", "diplomatie", "coopération",
        "afrique", "méditerranée", "union européenne", "atlantique", "souveraineté",
        "frontière", "الجيوسياسة", "العلاقات الدولية", "الدبلوماسية", "التعاون",
        "إفريقيا", "المتوسط", "الاتحاد الأوروبي", "السيادة",
        "geopolitics",
        "international relations",
        "foreign policy",
        "diplomacy",
        "regional cooperation",
        "sovereignty",
        "migration policy",
    ),
    "securite_affaires_interieures": (
        "sécurité", "ordre public", "police", "dgsn", "affaires intérieures",
        "administration territoriale", "prévention", "criminalité", "protection civile",
        "cybersécurité", "territoire", "الأمن", "النظام العام", "الشرطة",
        "الشؤون الداخلية", "الإدارة الترابية", "الوقاية", "الأمن السيبراني",
        "public security",
        "law enforcement",
        "policing",
        "police reform",
        "public order",
        "crime prevention",
        "cybersecurity",
        "border security",
        "civil protection",
    ),
    "recherche_scientifique": (
        "recherche", "scientifique", "université", "académique", "étude",
        "analyse", "méthodologie", "publication", "laboratoire", "données",
        "statistique", "indicateur", "البحث العلمي", "الجامعة", "أكاديمي",
        "دراسة", "تحليل", "منشور", "بيانات", "إحصائيات", "مؤشر",
        "scientific research",
        "research study",
        "academic study",
        "empirical study",
        "research paper",
        "working paper",
        "dataset",
        "methodology",
        "survey",
    ),
}
