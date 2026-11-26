from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
PUBLICATIONS_DIR = DATA_DIR / "publications"
INDEX_DIR = DATA_DIR / "index"
ACADEMY_DIR = DATA_DIR / "academy"

SOURCES_FILE = DATA_DIR / "sources.json"
HEALTH_FILE = DATA_DIR / "sources-health.json"
SEARCH_INDEX_FILE = INDEX_DIR / "search-index.json"
ACADEMY_FILE = ACADEMY_DIR / "academy.json"

# Identifiant de contact requis pour les requêtes polies vers les APIs scientifiques
CONTACT_EMAIL = "kitn-veille@example.org"
USER_AGENT = f"KITN-Veille/1.0 (Maroc; mailto:{CONTACT_EMAIL})"

REQUEST_TIMEOUT = 15
MAX_RETRIES = 2
SUPPORTED_LANGUAGES = ("fr", "ar", "en", "es")

DOCUMENT_TYPES = (
    "article_presse",
    "rapport_institutionnel",
    "publication_scientifique",
    "document_juridique",
    "statistique",
    "contenu_pedagogique",
)

POLES = (
    "institutions_gouvernance",
    "economie_finances_publiques",
    "societe_developpement_humain",
    "securite_affaires_interieures",
    "recherche_scientifique",
    "relations_internationales_geopolitique",
)

MOROCCO_STRONG_SIGNALS = (
    "maroc",
    "marocain",
    "marocaine",
    "marocains",
    "marocaines",
    "morocco",
    "moroccan",
    "المغرب",
    "المغربي",
    "المغربية",
    "المغاربة",
    "rabat",
    "casablanca",
    "fès",
    "fes",
    "marrakech",
    "tanger",
    "agadir",
    "oujda",
    "laâyoune",
    "dakhla",
    "dgsn",
    "irat",
    "bank al-maghrib",
    "haut-commissariat au plan",
    "hcp",
    "tgr",
    "cour des comptes",
    "cese",
    "sgg",
    "emploi public",
    "imist",
    "prsm",
    "cnrst",
    "tanger med",
    "casablanca finance city",
    "dirham",
    "loi de finances",
    "régionalisation avancée",
    "sahara marocain",
    "المندوبية السامية للتخطيط",
    "بنك المغرب",
    "الدرهم",
    "المجلس الاقتصادي والاجتماعي",
)

POLE_KEYWORDS = {
    "institutions_gouvernance": (
        "constitution", "parlement", "gouvernement", "ministère", "administration publique",
        "collectivités territoriales", "régionalisation", "décentralisation", "gouvernance",
        "service public", "transparence", "corruption", "concours", "bulletin officiel", "décret",
        "حكامة", "الجهوية", "الإدارة", "البرلمان", "مباراة", "الجريدة الرسمية"
    ),
    "economie_finances_publiques": (
        "économie", "budget", "loi de finances", "dette publique", "fiscalité", "impôt",
        "investissement", "emploi", "chômage", "inflation", "pouvoir d'achat", "banque centrale",
        "statistiques", "conjoncture", "balance commerciale", "trésorerie",
        "اقتصاد", "المالية العمومية", "قانون المالية", "التضخم", "الاستثمار", "الشغل", "إحصاء"
    ),
    "societe_developpement_humain": (
        "éducation", "enseignement supérieur", "université", "santé publique", "protection sociale",
        "démographie", "jeunesse", "pauvreté", "migration", "développement humain", "numérique",
        "التعليم", "الصحة", "الحماية الاجتماعية", "الشباب", "الهجرة", "التنمية البشرية"
    ),
    "securite_affaires_interieures": (
        "dgsn", "sûreté nationale", "sécurité intérieure", "police", "criminalité",
        "cybersécurité", "terrorisme", "sécurité routière", "protection civile", "crise",
        "administration territoriale", "prévention", "frontières",
        "الأمن الوطني", "السلامة الطرقية", "الأمن السيبراني", "الوقاية المدنية", "الداخلية"
    ),
    "recherche_scientifique": (
        "université", "laboratoire", "chercheur", "thèse", "doctorat", "revue scientifique",
        "working paper", "étude académique", "colloque", "publication scientifique",
        "بحث علمي", "جامعة", "أطروحة", "باحث", "مجلة علمية"
    ),
    "relations_internationales_geopolitique": (
        "diplomatie", "relations internationales", "géopolitique", "coopération",
        "union européenne", "afrique", "onu", "souveraineté", "sécurité régionale",
        "الدبلوماسية", "العلاقات الدولية", "الجيوسياسة", "التعاون", "إفريقيا"
    ),
}
