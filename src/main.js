import "./style.css";
import { filterStatisticsHistory, getLocalizedStatisticField, getStatisticsCategory } from "./statistics.js";
import { buildRegionalStatisticsModel } from "./regional-statistics.js";
import { matchesSearchQuery, normalizeSearchText } from "./search.js";
import { getPageSlice } from "./pagination.js";
import { getSourceHealthFreshness } from "./source-health.js";
import { getLibraryQualitySummary } from "./library-quality.js";

const FAVORITES_KEY = "kitn_favorites_v1";
const MANUAL_ITEMS_KEY = "kitn_manual_items_v1";

function getDynamicReferenceDate() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const REFERENCE_DATE = getDynamicReferenceDate();

const SPACES = {
  fr: [
    { id: "all", label: "Accueil" },
    { id: "veille", label: "Actualité & veille" },
    { id: "science", label: "Études & recherche" },
    { id: "chiffres", label: "Maroc en chiffres" },
    { id: "academy", label: "KITN Academy" },
    { id: "bibliotheque", label: "Bibliothèque" }
  ],
  ar: [
    { id: "all", label: "الرئيسية" },
    { id: "veille", label: "الأخبار والرصد" },
    { id: "science", label: "الدراسات والبحث" },
    { id: "chiffres", label: "المغرب بالأرقام" },
    { id: "academy", label: "أكاديمية KITN" },
    { id: "bibliotheque", label: "المكتبة الوثائقية" }
  ]
};

const SPACE_DESCRIPTIONS = {
  fr: {
    chiffres: "Explorer les indicateurs nationaux, suivre leur évolution et comparer les régions à partir de données documentées.",
    veille: "Suivre les actualités et les institutions, repérer les évolutions importantes et contrôler la fraîcheur des sources.",
    science: "Retrouver des publications, consulter leurs résumés et DOI, puis explorer les travaux par thème et discipline.",
    bibliotheque: "Consulter rapports, études et documents de référence avec des repères sur leur date, leur source et leur qualité.",
    academy: "Suivre des parcours de préparation, étudier des leçons structurées et s'entraîner avec des QCM expliqués."
  },
  ar: {
    chiffres: "استكشاف المؤشرات الوطنية وتتبع تطورها ومقارنة الجهات انطلاقاً من بيانات موثقة.",
    veille: "متابعة الأخبار والمؤسسات ورصد التحولات المهمة والتحقق من حداثة المصادر.",
    science: "البحث عن المنشورات العلمية وقراءة ملخصاتها ومعرفات DOI واستكشاف الدراسات حسب الموضوع والتخصص.",
    bibliotheque: "الاطلاع على التقارير والدراسات والوثائق المرجعية مع معلومات عن التاريخ والمصدر والجودة.",
    academy: "اتباع مسارات للتحضير ودراسة دروس منظمة والتدرب عبر أسئلة متعددة الخيارات مع شروحات."
  }
};
const THEMES = {
  fr: [
    {
      num: "01",
      symbol: "⌘",
      poles: ["institutions_gouvernance"],
      title: "Institutions & gouvernance",
      desc: "Politiques publiques, institutions, administration et réformes.",
      detail: "Analyse des politiques publiques, de l'action administrative, de la décentralisation et de la gouvernance institutionnelle au Maroc.",
      tags: ["Politiques publiques", "Gouvernance", "Administration", "Réformes"]
    },
    {
      num: "02",
      symbol: "◎",
      poles: ["economie_finances_publiques", "societe_developpement_humain"],
      title: "Économie & société",
      desc: "Indicateurs, emploi, développement humain et mutations sociales.",
      detail: "Lecture des dynamiques économiques, chaînes de valeur, finances publiques, développement humain et mutations sociales.",
      tags: ["Économie", "Finances publiques", "Société & développement humain", "Mutations sociales"]
    },
    {
      num: "03",
      symbol: "⊕",
      poles: ["securite_affaires_interieures", "relations_internationales_geopolitique"],
      title: "Sécurité, territoires & géopolitique",
      desc: "Sécurité publique, prévention, territoires, ressources et enjeux stratégiques.",
      detail: "Suivi des affaires intérieures, de la sécurité publique, des dynamiques territoriales et du positionnement stratégique du Maroc.",
      tags: ["Sécurité & affaires intérieures", "Territoires", "Géopolitique", "Ressources"]
    },
    {
      num: "04",
      symbol: "✧",
      poles: ["recherche_scientifique"],
      title: "Recherche & études",
      desc: "Publications académiques, jeux de données et analyses de fond.",
      detail: "Indexation des travaux scientifiques, études sectorielles et données de référence sur le Maroc.",
      tags: ["Publications", "Données", "Études", "Veille"]
    }
  ],
  ar: [
    {
      num: "01",
      symbol: "⌘",
      poles: ["institutions_gouvernance"],
      title: "المؤسسات والحكامة",
      desc: "السياسات العمومية، المؤسسات، الإدارة والإصلاحات.",
      detail: "تحليل السياسات العمومية والعمل الإداري واللامركزية والحكامة المؤسساتية في المغرب.",
      tags: ["السياسات العمومية", "الحكامة", "الإدارة", "الإصلاحات"]
    },
    {
      num: "02",
      symbol: "◎",
      poles: ["economie_finances_publiques", "societe_developpement_humain"],
      title: "الاقتصاد والمجتمع",
      desc: "المؤشرات، الشغل، التنمية البشرية والتحولات الاجتماعية.",
      detail: "قراءة الديناميات الاقتصادية وسلاسل القيمة والمالية العمومية والتنمية البشرية والتحولات الاجتماعية.",
      tags: ["الاقتصاد", "المالية العمومية", "المجتمع والتنمية البشرية", "التحولات الاجتماعية"]
    },
    {
      num: "03",
      symbol: "⊕",
      poles: ["securite_affaires_interieures", "relations_internationales_geopolitique"],
      title: "الأمن والمجالات والجيوسياسة",
      desc: "الأمن العمومي، الوقاية، المجالات الترابية والموارد والقضايا الاستراتيجية.",
      detail: "تتبع الشؤون الداخلية والأمن العمومي والديناميات الترابية والموقع الاستراتيجي للمغرب.",
      tags: ["الأمن والشؤون الداخلية", "المجالات الترابية", "الجيوسياسة", "الموارد"]
    },
    {
      num: "04",
      symbol: "✧",
      poles: ["recherche_scientifique"],
      title: "البحث والدراسات",
      desc: "منشورات أكاديمية، قواعد بيانات وتحليلات معمقة.",
      detail: "فهرسة الأعمال العلمية والدراسات القطاعية والبيانات المرجعية حول المغرب.",
      tags: ["منشورات", "بيانات", "دراسات", "رصد"]
    }
  ]
};

const POLE_LABELS = {
  fr: {
    institutions_gouvernance: "Institutions & gouvernance",
    economie_finances_publiques: "Économie & finances publiques",
    societe_developpement_humain: "Société & développement humain",
    relations_internationales_geopolitique: "Relations internationales & géopolitique",
    securite_affaires_interieures: "Sécurité & affaires intérieures",
    recherche_scientifique: "Recherche scientifique"
  },
  ar: {
    institutions_gouvernance: "المؤسسات والحكامة",
    economie_finances_publiques: "الاقتصاد والمالية العمومية",
    societe_developpement_humain: "المجتمع والتنمية البشرية",
    relations_internationales_geopolitique: "العلاقات الدولية والجيوسياسة",
    securite_affaires_interieures: "الأمن والشؤون الداخلية",
    recherche_scientifique: "البحث العلمي"
  }
};

const ACADEMY_TRACKS = {
  fr: [
    {
      id: "dgsn",
      label: "DGSN",
      level: "Supérieur / Cadres",
      domain: "Sécurité publique & ordre public",
      deadline: "Session annuelle — selon annonce officielle",
      title: "Concours DGSN — Sécurité & ordre public",
      sheet: "Police de proximité, coopération sécuritaire, digitalisation des services et protection des droits.",
      methodology: "Structurer l'analyse autour du cadre juridique, de la prévention de proximité et de la coordination territoriale.",
      past_topics: ["La police de proximité et la confiance citoyenne"],
      question: "Quel principe résume le mieux la doctrine moderne de sécurité publique au Maroc ?",
      options: [
        "La prévention, la proximité citoyenne et la légalité",
        "L'isolement administratif des services",
        "L'absence de coordination territoriale"
      ],
      answer: 0,
      correction: "La sécurité moderne repose sur la prévention, la proximité avec le citoyen, l'efficacité opérationnelle et le respect de la loi."
    },
    {
      id: "irat",
      label: "IRAT",
      level: "Administrateurs / Cadres territoriaux",
      domain: "Administration territoriale & gouvernance",
      deadline: "Session annuelle — selon annonce officielle",
      title: "IRAT — Administration territoriale & gouvernance",
      sheet: "Déconcentration administrative, régionalisation avancée, coordination locale et politiques publiques.",
      methodology: "Croiser le cadre de la déconcentration, les collectivités territoriales et la cohérence locale.",
      past_topics: ["La déconcentration administrative au service des politiques territoriales"],
      question: "Quel levier renforce l'efficacité de l'action publique au niveau territorial ?",
      options: [
        "La déconcentration et la convergence des programmes locaux",
        "La multiplication des procédures sans coordination",
        "L'absence d'évaluation des politiques publiques"
      ],
      answer: 0,
      correction: "La déconcentration administrative et la cohérence territoriale permettent de mieux adapter les politiques publiques aux réalités locales."
    },
    {
      id: "admin",
      label: "Concours admin",
      level: "Administration publique",
      domain: "Finances publiques & réformes",
      deadline: "Selon annonces Emploi Public & ministères",
      title: "Concours administratifs — Finances & réformes",
      sheet: "Budgétisation axée sur la performance, protection sociale, transition numérique et service public.",
      methodology: "Analyser l'enjeu stratégique, le dispositif budgétaire/juridique et l'impact sur l'usager.",
      past_topics: ["Performance de la dépense publique et qualité du service"],
      question: "Que vise principalement la réforme de la gestion publique axée sur les résultats ?",
      options: [
        "L'efficacité de la dépense, la redevabilité et la qualité du service",
        "La suppression du contrôle budgétaire",
        "La réduction de la transparence"
      ],
      answer: 0,
      correction: "La gestion axée sur les résultats lie les moyens engagés aux objectifs et à l'impact réel pour l'usager."
    }
  ],
  ar: [
    {
      id: "dgsn",
      label: "الأمن الوطني DGSN",
      level: "أطر عليا / أمني",
      domain: "الأمن العمومي والنظام العام",
      deadline: "حسب الإعلان الرسمي للمباراة",
      title: "مباريات الأمن الوطني — الأمن والنظام العام",
      sheet: "شرطة القرب، التعاون الأمني، رقمنة الخدمات وحماية الحقوق.",
      methodology: "هيكلة التحليل حول الإطار القانوني والوقاية القريبة والتنسيق الترابي.",
      past_topics: ["شرطة القرب وتعزيز الثقة مع المواطن"],
      question: "ما المبدأ الذي يلخص بأفضل شكل المقاربة الحديثة للأمن العمومي بالمغرب؟",
      options: [
        "الوقاية والقرب من المواطن واحترام القانون",
        "انغلاق المصالح الإدارية",
        "غياب التنسيق الترابي"
      ],
      answer: 0,
      correction: "يرتكز العمل الأمني الحديث على الوقاية والقرب من المواطن والنجاعة الميدانية وسيادة القانون."
    },
    {
      id: "irat",
      label: "الإدارة الترابية IRAT",
      level: "أطر الإدارة الترابية",
      domain: "الإدارة الترابية والحكامة",
      deadline: "حسب الإعلان الرسمي للمباراة",
      title: "الإدارة الترابية والحكامة",
      sheet: "اللاتمركز الإداري، الجهوية المتقدمة، التنسيق المحلي والسياسات العمومية.",
      methodology: "الربط بين ميثاق اللاتمركز وأدوار الجماعات الترابية والتقائية السياسات العمومية.",
      past_topics: ["اللاتمركز الإداري في خدمة انسجام السياسات الترابية"],
      question: "ما الآلية التي تعزز نجاعة العمل العمومي على المستوى الترابي؟",
      options: [
        "اللاتمركز وتكامل البرامج المحلية",
        "تعدد المساطر دون تنسيق",
        "غياب تقييم السياسات العمومية"
      ],
      answer: 0,
      correction: "يساعد اللاتمركز الإداري والالتقائية الترابية على ملاءمة السياسات العمومية مع خصوصيات كل مجال."
    },
    {
      id: "admin",
      label: "المباريات الإدارية",
      level: "الإدارة العمومية",
      domain: "المالية العمومية والإصلاحات",
      deadline: "حسب إعلانات التشغيل العمومي والوزارات",
      title: "المباريات الإدارية — المالية والإصلاحات",
      sheet: "الميزانية المبنية على النجاعة، الحماية الاجتماعية، التحول الرقمي والمرفق العام.",
      methodology: "تحديد الرهان الاستراتيجي وتحليل الآلية المالية أو التنظيمية والأثر على المرتفق.",
      past_topics: ["نجاعة الإنفاق العمومي وجودة الخدمة المقدمة للمرتفق"],
      question: "ما الهدف الأساسي لإصلاح التدبير العمومي القائم على النتائج؟",
      options: [
        "نجاعة الإنفاق والمساءلة وجودة الخدمة للمرتفق",
        "إلغاء المراقبة الميزانياتية",
        "تقليص الشفافية"
      ],
      answer: 0,
      correction: "يربط التدبير القائم على النتائج الاعتمادات المرصودة بالأهداف والأثر الفعلي على المواطن."
    }
  ]
};

const DOC_TYPES = {
  fr: {
    publication_scientifique: "Publication scientifique",
    statistique: "Statistique / Jeu de données",
    rapport: "Rapport",
    rapport_institutionnel: "Rapport institutionnel",
    document_juridique: "Document juridique",
    article: "Article",
    article_presse: "Article de presse",
    concours: "Concours / Ressource",
    ressource_pedagogique: "Ressource pédagogique"
  },
  ar: {
    publication_scientifique: "منشور علمي",
    statistique: "إحصائية / مجموعة بيانات",
    rapport: "تقرير",
    rapport_institutionnel: "تقرير مؤسساتي",
    document_juridique: "وثيقة قانونية",
    article: "مقال",
    article_presse: "مقال صحفي",
    concours: "مباراة / مورد",
    ressource_pedagogique: "مورد بيداغوجي"
  }
};

const CONFIDENCE_LABELS = {
  fr: {
    eleve: "Confiance élevée",
    moyen: "Confiance moyenne",
    faible: "Confiance faible"
  },
  ar: {
    eleve: "موثوقية عالية",
    moyen: "موثوقية متوسطة",
    faible: "موثوقية منخفضة"
  }
};

const LANG_LABELS = {
  fr: {
    fr: "Français",
    en: "Anglais",
    ar: "Arabe"
  },
  ar: {
    fr: "الفرنسية",
    en: "الإنجليزية",
    ar: "العربية"
  }
};

const PRINCIPLES = {
  fr: [
    { num: "01", title: "Vérifier avant de conclure", text: "Croiser les sources académiques, institutionnelles et statistiques avant de retenir un fait." },
    { num: "02", title: "Structurer plutôt qu'empiler", text: "Classer chaque notice par espace, pôle, type de document et date pour retrouver l'essentiel vite." },
    { num: "03", title: "Relier l'analyse au terrain", text: "Lire les transformations du Maroc à travers leurs effets concrets sur l'économie et la société." }
  ],
  ar: [
    { num: "01", title: "التحقق قبل الاستنتاج", text: "مقاطعة المصادر الأكاديمية والمؤسساتية والإحصائية قبل اعتماد أي معطى." },
    { num: "02", title: "الهيكلة بدل التكديس", text: "تصنيف كل مادة حسب الفضاء والقطب ونوع الوثيقة والتاريخ للوصول السريع إلى الجوهر." },
    { num: "03", title: "ربط التحليل بالواقع", text: "قراءة تحولات المغرب عبر آثارها الملموسة على الاقتصاد والمجتمع." }
  ]
};

const COPY = {
  fr: {
    langBtn: "العربية",
    menuBtn: "Menu",
    navThemes: "Thématiques",
    navAcademy: "KITN Academy",
    navMethod: "Méthode",
    navResearch: "Espaces & Index",
    backPortalBtn: "← Retour au portail",
    eyebrow: "Plateforme marocaine de veille stratégique, recherche, données & concours",
    heroTitle: "Comprendre le Maroc. <span>Anticiper</span> ses transformations.",
    heroIntro: "De l'information à la maîtrise : un outil structuré pour la veille stratégique, les publications scientifiques, les indicateurs du Maroc, la bibliothèque documentaire et la préparation aux concours.",
    heroPrimary: "Accéder aux espaces ↗",
    heroSecondary: "Découvrir la méthode →",
    heroNote: "DE L'INFORMATION À LA MAÎTRISE · MAROC",
    card1Top: "01 / MAROC",
    card1Map: "MA",
    card2Top: "KITN / 2026",
    card2Cap: "<strong>Information</strong> → Maîtrise",
    chip: "✦ De l'information à la maîtrise",
    hubTitle: "Accès direct par espace",
    hubSub: "Chaque rubrique dispose de son périmètre, de ses repères et de son filtrage dédié.",
    openSpaceBtn: "Ouvrir l'espace →",
    statTotal: "Notices visibles",
    statScience: "Articles scientifiques",
    statStats: "Chiffres & données",
    statLibrary: "Bibliothèque & rapports",
    statWatch: "Actualité & veille",
    themesEyebrow: "Les grands enjeux",
    themesTitle: "Explorer par thématique",
    themesSub: "Des sujets essentiels, organisés pour aller au-delà de l'actualité et comprendre les dynamiques de fond.",
    openPole: "Filtrer les notices de ce pôle →",
    activePoleBanner: "Filtre actif sur le pôle :",
    allPoles: "Tous les pôles",
    allPolesSelect: "Tous les pôles (6)",
    academyEyebrow: "KITN Academy & Concours",
    academyTitle: "Apprendre avec méthode, pas dans la précipitation.",
    academyText: "Conditions, échéances, anciens sujets, méthodologie, fiches de révision et QCM pour préparer les concours.",
    academyLevelLabel: "Profil / Niveau",
    academyDomainLabel: "Domaine",
    academyDeadlineLabel: "Échéance / Repère",
    academySheetLabel: "Fiche de révision",
    academyMethodLabel: "Méthodologie & anciens sujets",
    academyObjectivesLabel: "Compétences à maîtriser",
    academyPlanLabel: "Parcours de révision conseillé",
    academyExplanationLabel: "Pourquoi chaque réponse ?",
    academyLessonsLabel: "Cours et mises en pratique",
    academyConceptsLabel: "Notions essentielles",
    academyExampleLabel: "Exemple marocain",
    academyEssayLabel: "Sujet de réflexion",
    academyExerciseLabel: "Exercice d’application",
    academyGuidanceLabel: "Pistes de correction",
    academyQuizLabel: "QCM d'entraînement",
    methodEyebrow: "Notre approche",
    methodTitle: "La connaissance commence par une bonne question.",
    methodText: "KITN privilégie la clarté, la vérification, le respect des droits d'auteur et la mise en perspective.",
    researchEyebrow: "Espaces dédiés & Index documentaire",
    researchTitle: "Navigation par espace & notices",
    searchPlaceholder: "Rechercher par titre, auteur, institution, mot-clé, pôle ou résumé...",
    dateFromLabel: "Du",
    dateToLabel: "Au",
    allTypes: "Tous les types",
    allConfidence: "Toutes confiances",
    allDocLangs: "Toutes langues",
    sortNewest: "Date : plus récent",
    sortOldest: "Date : plus ancien",
    sortScore: "Pertinence : score décroissant",
    resetFilters: "Réinitialiser",
    exportJson: "Exporter JSON",
    savedOnly: "Favoris uniquement",
    saveBtn: "Enregistrer",
    savedBtn: "Enregistré",
    futureOnly: "Dates futures à vérifier uniquement",
    futureBadge: "Date future (à vérifier)",
    unverifiedBadge: "À vérifier",
    archivedBadge: "Archivé",
    noAbstract: "Résumé non fourni par la source.",
    detailsBtn: "Fiche détaillée",
    noResults: "Aucune notice ne correspond à votre recherche ou à cet espace.",
    sourceLink: "Consulter la source ↗",
    pdfLink: "PDF / Texte intégral ↗",
    closeBtn: "Fermer",
    labelAuthor: "Auteurs",
    labelVenue: "Revue / Institution",
    labelKeywords: "Mots-clés",
    labelDate: "Date de publication",
    labelCollected: "Collecté le",
    labelUpdated: "Mis à jour le",
    labelPole: "Pôle",
    labelSpace: "Espace",
    labelStatus: "Statut éditorial",
    labelType: "Type de document",
    labelDocLang: "Langue",
    labelConfidence: "Fiabilité",
    labelScore: "Score",
    labelDoi: "DOI",
    labelAnalysis: "Analyse stratégique",
    labelAbstract: "Résumé",
    statusValid: "Vérifié / Publié",
    statusReview: "À vérifier",
    statusArchived: "Archivé",
    validateBtn: "Valider",
    archiveBtn: "Archiver",
    deleteBtn: "Supprimer",
    manualTitle: "Espace d'administration & contributions (synchronisable avec data/manual_contributions.json)",
    manualSub: "Ajoutez, validez, archivez ou supprimez des contenus, puis exportez/importez le JSON pour le synchroniser dans data/manual_contributions.json via Git.",
    manualLabelTitle: "Titre *",
    manualLabelType: "Type",
    manualLabelSpace: "Espace cible",
    manualLabelPole: "Pôle principal",
    manualLabelDate: "Date (YYYY-MM-DD)",
    manualLabelVenue: "Revue / Institution",
    manualLabelKeywords: "Mots-clés (séparés par virgule)",
    manualLabelUrl: "Lien source (URL)",
    manualLabelPdf: "Lien PDF / Texte intégral (URL)",
    manualLabelResume: "Résumé / Note",
    manualLabelAnalysis: "Analyse stratégique (optionnel)",
    manualAddBtn: "Publier dans la base locale",
    manualExportBtn: "Exporter contributions JSON",
    manualImportBtn: "Importer JSON",
    manualClearBtn: "Vider contributions locales",
    manualAddedMsg: "Contribution enregistrée localement et intégrée dans l'index.",
    manualImportedMsg: "Contributions JSON importées avec succès.",
    manualInvalidJsonMsg: "Fichier JSON invalide : attendu { \"items\": [...] } ou [...].",
    footerCopy: "© 2026 KITN — De l'information à la maîtrise."
  },
  ar: {
    langBtn: "Français",
    menuBtn: "القائمة",
    navThemes: "المحاور",
    navAcademy: "أكاديمية KITN",
    navMethod: "المنهجية",
    navResearch: "الفضاءات والفهرس",
    backPortalBtn: "العودة إلى البوابة →",
    eyebrow: "المنصة المغربية للرصد الاستراتيجي والبحث والبيانات والمباريات",
    heroTitle: "فهم المغرب. <span>واستشراف</span> تحولاته.",
    heroIntro: "من المعلومة إلى التمكن: أداة مهيكلة للرصد الاستراتيجي والمنشورات العلمية والمؤشرات المغربية والمكتبة الوثائقية والاستعداد للمباريات.",
    heroPrimary: "الولوج إلى الفضاءات ↗",
    heroSecondary: "اكتشف المنهجية ←",
    heroNote: "من المعلومة إلى التمكن · المغرب",
    card1Top: "01 / المغرب",
    card1Map: "MA",
    card2Top: "KITN / 2026",
    card2Cap: "<strong>المعلومة</strong> ← التمكن",
    chip: "✦ من المعلومة إلى التمكن",
    hubTitle: "وصول مباشر حسب الفضاء",
    hubSub: "لكل فضاء اختصاصه ومعالمه وآليات التصفية الخاصة به.",
    openSpaceBtn: "فتح الفضاء ←",
    statTotal: "المواد المتاحة",
    statScience: "المقالات العلمية",
    statStats: "الأرقام والبيانات",
    statLibrary: "المكتبة والتقارير",
    statWatch: "الأخبار والرصد",
    themesEyebrow: "القضايا الكبرى",
    themesTitle: "الاستكشاف حسب المحور",
    themesSub: "مواضيع أساسية منظمة لتجاوز الأخبار اليومية وفهم الديناميات العميقة.",
    openPole: "تصفية المواد حسب هذا القطب ←",
    activePoleBanner: "تصفية نشطة حسب القطب:",
    allPoles: "كل الأقطاب",
    allPolesSelect: "كل الأقطاب (6)",
    academyEyebrow: "أكاديمية KITN والمباريات",
    academyTitle: "التعلم بمنهجية، لا بتسرع.",
    academyText: "شروط الترشيح والآجال والمواضيع السابقة والمنهجية وبطاقات المراجعة والاختبارات للاستعداد للمباريات.",
    academyLevelLabel: "الإطار / المستوى",
    academyDomainLabel: "المجال",
    academyDeadlineLabel: "الآجال / معلم",
    academySheetLabel: "بطاقة مراجعة",
    academyMethodLabel: "المنهجية والمواضيع السابقة",
    academyObjectivesLabel: "الكفاءات المطلوب إتقانها",
    academyPlanLabel: "مسار المراجعة المقترح",
    academyExplanationLabel: "تفسير كل اختيار",
    academyLessonsLabel: "دروس وتطبيقات",
    academyConceptsLabel: "مفاهيم أساسية",
    academyExampleLabel: "مثال من السياق المغربي",
    academyEssayLabel: "موضوع للتفكير",
    academyExerciseLabel: "تمرين تطبيقي",
    academyGuidanceLabel: "عناصر للتصحيح",
    academyQuizLabel: "اختبار تفاعلي",
    methodEyebrow: "مقاربتنا",
    methodTitle: "المعرفة تبدأ بسؤال جيد.",
    methodText: "تُقدّم KITN الوضوح والتحقق واحترام حقوق النشر والربط السياقي.",
    researchEyebrow: "الفضاءات المتخصصة والفهرس الوثائقي",
    researchTitle: "التنقل حسب الفضاء والمواد",
    searchPlaceholder: "ابحث بالعنوان أو المؤلف أو المؤسسة أو الكلمات المفتاحية أو القطب...",
    dateFromLabel: "من",
    dateToLabel: "إلى",
    allTypes: "كل الأنواع",
    allConfidence: "كل مستويات الموثوقية",
    allDocLangs: "كل اللغات",
    sortNewest: "التاريخ: الأحدث",
    sortOldest: "التاريخ: الأقدم",
    sortScore: "الملاءمة: الأعلى أولاً",
    resetFilters: "إعادة الضبط",
    exportJson: "تصدير JSON",
    savedOnly: "المحفوظات فقط",
    saveBtn: "حفظ",
    savedBtn: "محفوظ",
    futureOnly: "التواريخ المستقبلية للمراجعة فقط",
    futureBadge: "تاريخ مستقبلي (للمراجعة)",
    unverifiedBadge: "للمراجعة",
    archivedBadge: "مؤرشف",
    noAbstract: "الملخص غير متوفر في المصدر.",
    detailsBtn: "بطاقة تفصيلية",
    noResults: "لا توجد مواد مطابقة لبحثك أو لهذا الفضاء.",
    sourceLink: "عرض المصدر ↗",
    pdfLink: "ملف PDF / النص الكامل ↗",
    closeBtn: "إغلاق",
    labelAuthor: "المؤلفون",
    labelVenue: "المجلة / المؤسسة",
    labelKeywords: "الكلمات المفتاحية",
    labelDate: "تاريخ النشر",
    labelCollected: "تاريخ الجمع",
    labelUpdated: "تاريخ التحديث",
    labelPole: "القطب",
    labelSpace: "الفضاء",
    labelStatus: "الحالة التحريرية",
    labelType: "نوع الوثيقة",
    labelDocLang: "اللغة",
    labelConfidence: "الموثوقية",
    labelScore: "النتيجة",
    labelDoi: "المعرّف DOI",
    labelAnalysis: "تحليل استراتيجي",
    labelAbstract: "الملخص",
    statusValid: "متحقق منه / منشور",
    statusReview: "للمراجعة",
    statusArchived: "مؤرشف",
    validateBtn: "اعتماد",
    archiveBtn: "أرشفة",
    deleteBtn: "حذف",
    manualTitle: "فضاء الإدارة والمساهمات (متزامن مع data/manual_contributions.json)",
    manualSub: "أضف أو اعتمد أو أرشف أو احذف المحتويات ثم صدّر أو استورد JSON لمزامنته مع data/manual_contributions.json عبر Git.",
    manualLabelTitle: "العنوان *",
    manualLabelType: "النوع",
    manualLabelSpace: "الفضاء المستهدف",
    manualLabelPole: "القطب الرئيسي",
    manualLabelDate: "التاريخ (YYYY-MM-DD)",
    manualLabelVenue: "المجلة / المؤسسة",
    manualLabelKeywords: "الكلمات المفتاحية (مفصولة بفاصلة)",
    manualLabelUrl: "رابط المصدر (URL)",
    manualLabelPdf: "رابط PDF / النص الكامل (URL)",
    manualLabelResume: "الملخص / ملاحظة",
    manualLabelAnalysis: "تحليل استراتيجي (اختياري)",
    manualAddBtn: "نشر في القاعدة المحلية",
    manualExportBtn: "تصدير المساهمات JSON",
    manualImportBtn: "استيراد JSON",
    manualClearBtn: "مسح المساهمات المحلية",
    manualAddedMsg: "تم تسجيل المساهمة محلياً وإدراجها في الفهرس.",
    manualImportedMsg: "تم استيراد المساهمات JSON بنجاح.",
    manualInvalidJsonMsg: "ملف JSON غير صالح: المتوقع { \"items\": [...] } أو [...].",
    footerCopy: "© 2026 KITN — من المعلومة إلى التمكن."
  }
};

function loadJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : fallback;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function saveJsonStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

function normalizeTitleKey(title) {
  return String(title || "")
    .toLowerCase()
    .replaceAll(/[^\p{L}\p{N}\s]+/gu, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}

function normalizeUrlKey(url) {
  if (!url) return "";
  try {
    const u = new URL(String(url).trim());
    return `${u.hostname.toLowerCase()}${u.pathname.replace(/\/+$/, "").toLowerCase()}`;
  } catch {
    return String(url).trim().toLowerCase();
  }
}

function getDedupeKeys(item) {
  const keys = [];
  if (item.id) keys.push(`id:${String(item.id).trim().toLowerCase()}`);
  if (item.doi) {
    const d = String(item.doi)
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\/(dx\.)?doi\.org\//, "");
    if (d) keys.push(`doi:${d}`);
  }
  const normUrl = normalizeUrlKey(item.url_publication);
  if (normUrl) keys.push(`url:${normUrl}`);
  const normTitle = normalizeTitleKey(item.titre_original);
  const datePrefix = String(item.date_publication || "").slice(0, 10);
  if (normTitle) keys.push(`title:${normTitle}|${datePrefix}`);
  return keys;
}

function getItemKey(item) {
  return getDedupeKeys(item)[0] || String(item.titre_original || "");
}

function resolveItemSpace(item) {
  if (item?.espace) return String(item.espace);
  const t = String(item?.type_document || "").toLowerCase();
  const p = String(item?.pole || "").toLowerCase();
  if (t === "concours" || t === "ressource_pedagogique") return "academy";
  if (t === "publication_scientifique" || p === "recherche_scientifique") return "science";
  if (t === "statistique") return "chiffres";
  if (["rapport", "rapport_institutionnel", "document_juridique"].includes(t)) return "bibliotheque";
  return "veille";
}

let lang = "fr";
let activeSpace = "all";
let mobileMenuOpen = false;
let mobileOpenSubmenu = "";
let selectedThemeIndex = 0;
let selectedPolesFilter = null;
let activePoleLabel = "";
let selectedSinglePoleFilter = "";
let selectedTypeFilter = "";
let selectedConfidenceFilter = "";
let selectedDocLangFilter = "";
let dateFromFilter = "";
let dateToFilter = "";
let sortOrder = "newest";
let selectedPrincipleIndex = 0;
let selectedAcademyIndex = 0;
let quizAnswers = {};
let selectedQuizQuestionIndex = 0;
let searchQuery = "";
let scienceAuthorFilter = "";
let scienceDisciplineFilter = "";
let scienceYearFilter = "";
let futureDatesOnly = false;
let favoritesOnly = false;
let resultsPage = 1;
let lastResultsFilterKey = "";
const RESULTS_PAGE_SIZE = 24;
let favorites = loadJsonStorage(FAVORITES_KEY, []);
let manualItems = loadJsonStorage(MANUAL_ITEMS_KEY, []);
let statusOverrides = {};
let activeModalItem = null;
let activeArticleId = null;
let remoteItems = [];
let indexItems = [];
let statisticsData = null;
let regionalStatisticsData = null;
let sourceHealthData = null;
let regionalIndicatorCode = "HCP_EMO_REGIONAL_STRICT_UNEMPLOYMENT";
let regionalResidenceScope = "all";
let statisticsCategory = "all";
let statisticsSearch = "";
let statisticsRange = "all";
let statisticsView = "national";

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function isSafeHttpUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function getDoiUrl(doi) {
  const value = String(doi || "").trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  if (!/^10\.\d{4,9}\/\S+$/i.test(value)) return "";
  return "https://doi.org/" + value.split("/").map(encodeURIComponent).join("/");
}

function isFutureDate(item) {
  if (item && item.date_anomalie === true) return true;
  if (item && item.date_statut === "date_future_a_verifier") return true;
  const clean = String(item?.date_publication || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return false;
  return clean > REFERENCE_DATE;
}

function matchesDateRange(item) {
  if (!dateFromFilter && !dateToFilter) return true;
  const rawDate = String(item?.date_publication || "").trim();
  if (!rawDate) return false;
  const comparable = rawDate.slice(0, 10);
  if (dateFromFilter && comparable < dateFromFilter) return false;
  if (dateToFilter && comparable > dateToFilter) return false;
  return true;
}

function formatPole(poleCode) {
  if (!poleCode) return "";
  return POLE_LABELS[lang]?.[poleCode] || poleCode;
}

function formatDocType(type) {
  if (!type) return "";
  return DOC_TYPES[lang]?.[type] || type;
}

function formatConfidence(conf) {
  if (!conf) return "";
  return CONFIDENCE_LABELS[lang]?.[conf] || conf;
}

function formatDocLang(code) {
  if (!code) return "";
  return LANG_LABELS[lang]?.[code] || code.toUpperCase();
}

function getEffectiveStatus(item) {
  const k = getItemKey(item);
  if (statusOverrides[k]) return statusOverrides[k];
  return item.statut_validation || "valide";
}

function setItemStatus(item, nextStatus) {
  const k = getItemKey(item);
  if (!k) return;
  statusOverrides[k] = nextStatus;
  if (item.origine === "manuel" || String(item.id || "").startsWith("kitn_manual_")) {
    manualItems = manualItems.map((m) => (getItemKey(m) === k ? { ...m, statut_validation: nextStatus } : m));
    saveJsonStorage(MANUAL_ITEMS_KEY, manualItems);
  }
  rebuildCombinedIndex();
  renderResults();
  if (activeModalItem && getItemKey(activeModalItem) === k) {
    activeModalItem = { ...activeModalItem, statut_validation: nextStatus };
    renderModal();
  }
}

function deleteManualItem(item) {
  const k = getItemKey(item);
  manualItems = manualItems.filter((m) => getItemKey(m) !== k);
  saveJsonStorage(MANUAL_ITEMS_KEY, manualItems);
  rebuildCombinedIndex();
  renderResults();
  if (activeModalItem && getItemKey(activeModalItem) === k) {
    activeModalItem = null;
    renderModal();
  }
}

function rebuildCombinedIndex() {
  const seen = new Set();
  const merged = [];
  for (const item of [...manualItems, ...remoteItems]) {
    const keys = getDedupeKeys(item);
    if (!keys.length || keys.some((k) => seen.has(k))) continue;
    keys.forEach((k) => seen.add(k));
    const st = statusOverrides[keys[0]] || item.statut_validation || "valide";
    merged.push({ ...item, statut_validation: st });
  }
  indexItems = merged;
}

function matchesSpace(item, space) {
  if (!space || space === "all") return true;
  if (space === "contribuer") return item.origine === "manuel" || String(item.id || "").startsWith("kitn_manual_");
  const itemSpace = resolveItemSpace(item);
  return itemSpace === space;
}

function toggleFavorite(item) {
  const key = getItemKey(item);
  if (!key) return;
  if (favorites.includes(key)) {
    favorites = favorites.filter((k) => k !== key);
  } else {
    favorites = [...favorites, key];
  }
  saveJsonStorage(FAVORITES_KEY, favorites);
  renderResults();
}

function resetAllFilters() {
  activeSpace = "all";
  selectedPolesFilter = null;
  activePoleLabel = "";
  selectedSinglePoleFilter = "";
  selectedTypeFilter = "";
  selectedConfidenceFilter = "";
  selectedDocLangFilter = "";
  dateFromFilter = "";
  dateToFilter = "";
  sortOrder = "newest";
  searchQuery = "";
  scienceAuthorFilter = "";
  scienceDisciplineFilter = "";
  scienceYearFilter = "";
  futureDatesOnly = false;
  favoritesOnly = false;
  render();
}

function getFilteredItems() {
  const q = searchQuery.trim();
  const authorQuery = scienceAuthorFilter.trim();
  const disciplineQuery = scienceDisciplineFilter.trim();
  const list = indexItems.filter((item) => {
    if (!matchesSpace(item, activeSpace)) return false;
    if (activeSpace === "science") {
      const authorsForFilter = Array.isArray(item.auteurs) ? item.auteurs.join(" ") : "";
      const disciplineText = [
        ...(Array.isArray(item.mots_cles) ? item.mots_cles : []),
        item.pole || "",
        item.revue_ou_institution || "",
        item.titre_original || "",
        item.resume || ""
      ].join(" ");
      if (authorQuery && !matchesSearchQuery(authorsForFilter, authorQuery)) return false;
      if (disciplineQuery && !matchesSearchQuery(disciplineText, disciplineQuery)) return false;
      if (scienceYearFilter && String(item.date_publication || "").slice(0, 4) !== scienceYearFilter) return false;
    }
    const matchesThemePoles = !selectedPolesFilter || selectedPolesFilter.includes(item.pole);
    if (!matchesThemePoles) return false;
    if (selectedSinglePoleFilter && item.pole !== selectedSinglePoleFilter) return false;
    if (selectedTypeFilter && item.type_document !== selectedTypeFilter) return false;
    if (selectedConfidenceFilter && item.confiance_classification !== selectedConfidenceFilter) return false;
    if (selectedDocLangFilter && item.langue_originale !== selectedDocLangFilter) return false;
    if (!matchesDateRange(item)) return false;
    if (futureDatesOnly) {
      if (!isFutureDate(item)) return false;
    } else if (isFutureDate(item)) {
      return false;
    }
    if (favoritesOnly && !favorites.includes(getItemKey(item))) return false;
    if (!q) return true;

    const searchable = [
      item.titre_original || "",
      ...(Array.isArray(item.auteurs) ? item.auteurs : []),
      item.revue_ou_institution || "",
      item.source_nom || "",
      item.doi || "",
      ...(Array.isArray(item.mots_cles) ? item.mots_cles : []),
      item.pole || "",
      formatPole(item.pole),
      item.type_document || "",
      formatDocType(item.type_document),
      item.resume || "",
      item.analyse_strategique || ""
    ].join(" ");
    return matchesSearchQuery(searchable, q);
  });

  return list.sort((a, b) => {
    if (sortOrder === "score") {
      return (Number(b.score_pertinence) || 0) - (Number(a.score_pertinence) || 0);
    }
    const da = String(a.date_publication || "");
    const db = String(b.date_publication || "");
    return sortOrder === "oldest" ? da.localeCompare(db) : db.localeCompare(da);
  });
}

function exportJsonPayload(items, filename) {
  const payload = {
    exported_at: new Date().toISOString(),
    total: items.length,
    items
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}


function formatStatisticValue(indicator, value) {
  const divisor = Number(indicator.scale_divisor) || 1;
  const precision = Number.isInteger(indicator.precision) ? indicator.precision : 1;
  const scaled = Number(value) / divisor;
  return new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-MA", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  }).format(scaled);
}

function renderStatisticsDashboard() {
  const allIndicators = Array.isArray(statisticsData?.indicators) ? statisticsData.indicators : [];
  const isAr = lang === "ar";
  const categoryLabels = {
    economie_finances_publiques: isAr ? "الاقتصاد والمالية العمومية" : "Économie & finances publiques",
    societe_developpement_humain: isAr ? "المجتمع والتنمية البشرية" : "Société & développement humain"
  };
  const totalObservations = allIndicators.reduce((sum, indicator) =>
    sum + (Array.isArray(indicator.history) ? indicator.history.length : 0), 0);
  const sourceCount = new Set(allIndicators.map((item) => item.source_name).filter(Boolean)).size;
  const overview = `
    <div class="stats-overview" aria-label="${isAr ? "ملخص البيانات" : "Aperçu des données"}">
      <article class="stats-overview-card"><span>${isAr ? "مؤشرات متاحة" : "Indicateurs disponibles"}</span><strong>${allIndicators.length.toLocaleString(isAr ? "ar-MA" : "fr-MA")}</strong></article>
      <article class="stats-overview-card"><span>${isAr ? "ملاحظات تاريخية" : "Observations historiques"}</span><strong>${totalObservations.toLocaleString(isAr ? "ar-MA" : "fr-MA")}</strong></article>
      <article class="stats-overview-card"><span>${isAr ? "مصادر مسماة" : "Sources identifiées"}</span><strong>${sourceCount.toLocaleString(isAr ? "ar-MA" : "fr-MA")}</strong></article>
    </div>`;
  const heading = isAr ? "المؤشرات الاقتصادية والاجتماعية للمغرب" : "Indicateurs économiques et sociaux du Maroc";
  const intro = isAr
    ? "سلاسل تاريخية موثقة، مع سنة القياس والوحدة والمصدر."
    : "Séries historiques documentées, avec année de référence, unité et source.";
  const viewTabs = `
    <div class="stats-view-tabs" role="tablist" aria-label="${isAr ? "نوع البيانات الإحصائية" : "Vue des données statistiques"}">
      <button type="button" class="stats-view-tab ${statisticsView === "national" ? "is-active" : ""}" data-stat-view="national" aria-pressed="${statisticsView === "national"}">${isAr ? "المؤشرات الوطنية" : "Indicateurs nationaux"}</button>
      <button type="button" class="stats-view-tab ${statisticsView === "regional" ? "is-active" : ""}" data-stat-view="regional" aria-pressed="${statisticsView === "regional"}">${isAr ? "المقارنة الجهوية" : "Comparaison régionale"}</button>
    </div>`;
  if (statisticsView === "regional") {
    return `${viewTabs}${renderRegionalStatisticsDashboard()}`;
  }
  const empty = isAr ? "ستظهر البيانات الإحصائية بعد عملية الجمع القادمة." : "Les données statistiques seront disponibles après la prochaine collecte.";
  const normalizedSearch = normalizeSearchText(statisticsSearch);
  const filteredIndicators = allIndicators.filter((indicator) => {
    const category = getStatisticsCategory(indicator);
    if (statisticsCategory === "unclassified" ? Boolean(category) : statisticsCategory !== "all" && category !== statisticsCategory) return false;
    if (!normalizedSearch) return true;
    const searchable = normalizeSearchText([indicator.label_fr, indicator.label_ar, getLocalizedStatisticField(indicator, "label", "ar"), indicator.description_fr, indicator.description_ar, getLocalizedStatisticField(indicator, "description", "ar"), indicator.source_name, indicator.unit_fr, indicator.unit_ar, getLocalizedStatisticField(indicator, "unit", "ar"), indicator.indicator_code].filter(Boolean).join(" "));
    return searchable.includes(normalizedSearch);
  });
  const categoryControls = [
    { id: "all", label: isAr ? "جميع المؤشرات" : "Tous les indicateurs" },
    { id: "economie_finances_publiques", label: categoryLabels.economie_finances_publiques },
    { id: "societe_developpement_humain", label: categoryLabels.societe_developpement_humain },
    { id: "unclassified", label: isAr ? "غير مصنفة" : "À classer" }
  ];
  const rangeControls = [
    { id: "5", label: isAr ? "5 سنوات" : "5 ans" },
    { id: "10", label: isAr ? "10 سنوات" : "10 ans" },
    { id: "all", label: isAr ? "كامل السلسلة" : "Toute la série" }
  ];
  const controls = `
    <div class="stats-controls">
      <label class="stats-search-wrap"><span>${isAr ? "البحث في المؤشرات" : "Rechercher un indicateur"}</span><input type="search" data-stat-search value="${escapeHtml(statisticsSearch)}" placeholder="${isAr ? "مثلاً: البطالة، السكان، التضخم..." : "Ex. : chômage, population, inflation…"}" autocomplete="off"></label>
      <div class="stats-filter-group" role="group" aria-label="${isAr ? "تصنيف المؤشرات" : "Filtrer les indicateurs"}">
        ${categoryControls.map((item) => `<button type="button" class="stats-filter-btn ${statisticsCategory === item.id ? "is-active" : ""}" data-stat-category="${item.id}" aria-pressed="${statisticsCategory === item.id}">${escapeHtml(item.label)}</button>`).join("")}
      </div>
      <div class="stats-filter-group stats-range-group" role="group" aria-label="${isAr ? "الفترة الزمنية" : "Période historique"}">
        ${rangeControls.map((item) => `<button type="button" class="stats-filter-btn ${statisticsRange === item.id ? "is-active" : ""}" data-stat-range="${item.id}" aria-pressed="${statisticsRange === item.id}">${escapeHtml(item.label)}</button>`).join("")}
      </div>
    </div>`;
  if (!allIndicators.length) {
    return `${viewTabs}<section class="stats-dashboard"><div class="stats-heading"><div><span class="mini-label">${isAr ? "بيانات رسمية" : "DONNÉES OFFICIELLES"}</span><h3>${heading}</h3><p>${intro}</p></div></div><p class="empty-results">${empty}</p></section>`;
  }
  const cards = filteredIndicators.map((indicator) => {
    const allHistory = Array.isArray(indicator.history) ? indicator.history : [];
    const referenceDate = statisticsData?.generated_at;
    const validHistory = filterStatisticsHistory(allHistory, "all", referenceDate);
    const history = filterStatisticsHistory(validHistory, statisticsRange, referenceDate);
    const validLatest = filterStatisticsHistory(indicator.latest ? [indicator.latest] : [], "all", referenceDate)[0] || null;
    const validPrevious = filterStatisticsHistory(indicator.previous ? [indicator.previous] : [], "all", referenceDate)[0] || null;
    const latest = validHistory[validHistory.length - 1] || validLatest;
    const previous = validHistory.length > 1 ? validHistory[validHistory.length - 2] : validPrevious;
    const latestNumeric = Number(latest?.value);
    const previousNumeric = Number(previous?.value);
    const hasComparableValues = Boolean(
      latest && previous && Number.isFinite(latestNumeric) && Number.isFinite(previousNumeric)
    );
    const delta = hasComparableValues
      ? (indicator.change_mode === "absolute"
          ? latestNumeric - previousNumeric
          : (previousNumeric !== 0
              ? ((latestNumeric - previousNumeric) / Math.abs(previousNumeric)) * 100
              : null))
      : null;
    const numericValues = history.map((point) => Number(point.value)).filter(Number.isFinite);
    const min = numericValues.length ? Math.min(...numericValues) : 0;
    const max = numericValues.length ? Math.max(...numericValues) : 1;
    const range = max - min || Math.max(Math.abs(max) * 0.08, 1);
    const coords = history.map((point, index) => {
      const x = history.length <= 1 ? 50 : 6 + (index / (history.length - 1)) * 88;
      const y = 49 - ((Number(point.value) - min) / range) * 38;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    const lastPoint = coords ? coords.split(" ").at(-1).split(",") : ["50","49"];
    const label = isAr ? getLocalizedStatisticField(indicator, "label", "ar") : indicator.label_fr;
    const description = isAr ? getLocalizedStatisticField(indicator, "description", "ar") : indicator.description_fr;
    const methodologyNote = isAr
      ? (indicator.methodology_note_ar || indicator.methodology_note_fr)
      : indicator.methodology_note_fr;
    const unit = isAr ? getLocalizedStatisticField(indicator, "unit", "ar") : indicator.unit_fr;
    const deltaPrecision = Number.isInteger(indicator.precision) ? indicator.precision : 1;
    const formattedDelta = delta === null ? "" : new Intl.NumberFormat(isAr ? "ar-MA" : "fr-MA", {maximumFractionDigits:deltaPrecision}).format(delta);
    const comparisonLabel = isAr
      ? (indicator.comparison_label_ar || (indicator.change_mode === "absolute" ? "مقارنة بالفترة السابقة" : "مقارنة بالسنة السابقة"))
      : (indicator.comparison_label_fr || (indicator.change_mode === "absolute" ? "par rapport à la période précédente" : "par rapport à l'année précédente"));
    const changeUnit = indicator.change_mode === "absolute" ? (indicator.change_unit || "") : "%";
    const changeText = delta === null ? (isAr ? "لا توجد مقارنة سابقة" : "Pas de comparaison précédente")
      : `${delta > 0 ? "+" : ""}${formattedDelta}${changeUnit ? ` ${changeUnit}` : ""} ${comparisonLabel}`;
    const sourceUrl = isSafeHttpUrl(indicator.source_url) ? indicator.source_url : "";
    const sourceLabel = indicator.source_name || (isAr ? "مصدر مؤسساتي غير محدد" : "Source institutionnelle non précisée");
    const collectionDate = indicator.last_successful_collection_at
      ? String(indicator.last_successful_collection_at).slice(0, 10)
      : "";
    const collectionLabel = collectionDate
      ? (isAr
          ? (indicator.collection_status === "carried_forward" ? "آخر جمع معروف" : "تاريخ الجمع")
          : (indicator.collection_status === "carried_forward" ? "dernière collecte connue" : "collectée le"))
      : "";
    const historyRows = history.map((point) => `
      <tr><th scope="row">${escapeHtml(String(point.year))}</th><td>${escapeHtml(formatStatisticValue(indicator, point.value))} ${escapeHtml(unit || "")}</td></tr>
    `).join("");
    const chartTitle = isAr ? "التطور التاريخي للمؤشر" : "Évolution historique de l'indicateur";
    return `
      <article class="stat-card">
        <div class="stat-card-top"><span>${escapeHtml(label)}</span><span class="stat-year">${escapeHtml(String(latest?.year || "—"))}</span></div>
        <div class="stat-value">${escapeHtml(latest ? formatStatisticValue(indicator, latest.value) : "—")}<small>${escapeHtml(unit || "")}</small></div>
        <p class="stat-description">${escapeHtml(description || "")}</p>
        ${methodologyNote ? `<p class="stat-methodology-note">${escapeHtml(methodologyNote)}</p>` : ""}
        <div class="stat-trend"><span>${escapeHtml(changeText)}</span></div>
        <svg class="stat-sparkline" viewBox="0 0 100 64" role="img" aria-label="${escapeHtml(chartTitle)}">
          <line x1="5" y1="11" x2="95" y2="11" class="stat-chart-grid"></line>
          <line x1="5" y1="30" x2="95" y2="30" class="stat-chart-grid"></line>
          <line x1="5" y1="49" x2="95" y2="49" class="stat-chart-grid"></line>
          ${coords ? `<polyline points="${coords}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline><circle cx="${lastPoint[0]}" cy="${lastPoint[1]}" r="3" fill="currentColor"></circle>` : ""}
        </svg>
        <div class="stat-chart-years"><span>${history.length ? escapeHtml(String(history[0].year)) : "—"}</span><span>${history.length ? escapeHtml(String(history[history.length - 1].year)) : "—"}</span></div>
        <details class="stat-history">
          <summary>${isAr ? "عرض البيانات التاريخية" : "Voir les valeurs historiques"}</summary>
          <div class="stat-history-table-wrap"><table class="stat-history-table"><tbody>${historyRows}</tbody></table></div>
        </details>
        <div class="stat-card-foot"><span>${escapeHtml(sourceLabel)}${indicator.last_updated ? ` · ${isAr ? "تحديث المصدر" : "date indiquée par la source"} ${escapeHtml(indicator.last_updated)}` : ""}${collectionDate ? ` · ${collectionLabel} ${escapeHtml(collectionDate)}` : ""}</span>${sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">${isAr ? "السلسلة الأصلية" : "Série originale"} ↗</a>` : ""}</div>
      </article>`;
  }).join("");
  const updateDate = statisticsData.generated_at ? String(statisticsData.generated_at).slice(0,10) : "";
  const emptyFiltered = isAr ? "لا توجد مؤشرات في هذا التصنيف." : "Aucun indicateur dans cette catégorie.";
  return `
    ${viewTabs}
    <section class="stats-dashboard">
      ${overview}
      <div class="stats-heading"><div><span class="mini-label">${isAr ? "بيانات رسمية" : "DONNÉES OFFICIELLES"}</span><h3>${heading}</h3><p>${intro}</p></div><span class="stats-updated">${isAr ? "تاريخ إنشاء ملف البيانات" : "Fichier statistique généré le"} : ${escapeHtml(updateDate)}</span></div>
      ${controls}
      <div class="stats-results-meta">${isAr ? "المؤشرات المعروضة" : "Indicateurs affichés"} : <strong>${filteredIndicators.length.toLocaleString(isAr ? "ar-MA" : "fr-MA")}</strong> / ${allIndicators.length.toLocaleString(isAr ? "ar-MA" : "fr-MA")}</div>
      <div class="stats-grid">${cards || `<p class="empty-results">${emptyFiltered}</p>`}</div>
      <p class="stats-source-note">${isAr ? "تاريخ إنشاء الملف لا يعني بالضرورة أن كل مؤشر قد حُيّن. الفترات المعروضة هي الفترات الفعلية للقيم المتاحة." : "La date de génération du fichier ne correspond pas nécessairement à la date de la dernière observation. Les périodes affichées correspondent aux valeurs réellement disponibles."}</p>
    </section>`;
}

function renderRegionalStatisticsDashboard() {
  const isAr = lang === "ar";
  const model = buildRegionalStatisticsModel(
    regionalStatisticsData,
    regionalIndicatorCode,
    regionalResidenceScope
  );
  const title = isAr ? "المقارنة الإحصائية بين الجهات" : "Comparaison statistique entre les régions";
  const intro = isAr
    ? "استكشف المؤشرات الاجتماعية والاقتصادية حسب الجهة والفترة، مع التمييز بين الوسط الحضري والقروي عند توفر البيانات."
    : "Explorez les indicateurs sociaux et économiques par région et par période, avec distinction urbain/rural lorsque les données le permettent.";
  if (!model.available) {
    return `<section class="regional-stats-dashboard">
      <div class="stats-heading"><div><span class="mini-label">${isAr ? "بيانات جهوية" : "DONNÉES TERRITORIALES"}</span><h3>${title}</h3><p>${intro}</p></div></div>
      <p class="regional-empty">${isAr
        ? "بيانات المندوبية السامية للتخطيط الجهوية غير متوفرة بعد في مجموعة البيانات المنشورة. تم اختبار آلية الاستخراج، لكن الجمع الفعلي والنشر ما زالا بحاجة إلى التحقق."
        : "Les séries régionales HCP ne sont pas encore présentes dans le jeu de données publié. Leur extraction est couverte par des tests, mais la collecte réelle et la publication restent à valider."}</p>
    </section>`;
  }

  regionalIndicatorCode = model.activeIndicatorCode;
  regionalResidenceScope = model.activeScope;
  const indicatorOptions = model.indicatorOptions.map((item) =>
    `<option value="${escapeHtml(item.code)}" ${item.code === model.activeIndicatorCode ? "selected" : ""}>${escapeHtml(isAr ? item.labelAr : item.labelFr)}</option>`
  ).join("");
  const scopeLabels = {
    all: isAr ? "المجموع" : "Ensemble",
    urban: isAr ? "حضري" : "Urbain",
    rural: isAr ? "قروي" : "Rural"
  };
  const scopeButtons = model.availableScopes.map((scope) =>
    `<button type="button" class="stats-filter-btn ${scope === model.activeScope ? "is-active" : ""}" data-regional-scope="${scope}" aria-pressed="${scope === model.activeScope}">${scopeLabels[scope] || scope}</button>`
  ).join("");
  const latestPeriodIndex = model.periods.length - 1;
  const latestRanking = model.rows
    .filter((row) => row.geographyCode !== "MAR")
    .map((row) => ({ ...row, latestPoint: row.points[latestPeriodIndex] }))
    .filter((row) => row.latestPoint && row.latestPoint.value !== null && row.latestPoint.value !== undefined && Number.isFinite(Number(row.latestPoint.value)))
    .sort((a, b) => Number(b.latestPoint.value) - Number(a.latestPoint.value));
  const rankingMax = Math.max(0, ...latestRanking.map((row) => Number(row.latestPoint.value)));
  const rankingMarkup = latestRanking.length
    ? '<div class="regional-ranking" aria-label="' + (isAr ? "ترتيب الجهات حسب آخر قيمة متاحة" : "Classement régional pour la dernière période") + '">' +
      '<div class="regional-ranking-heading"><h4>' + (isAr ? "ترتيب الجهات" : "Classement des régions") + '</h4><span>' + escapeHtml(model.latestPeriod) + '</span></div>' +
      '<ol>' + latestRanking.map((row) => {
        const value = Number(row.latestPoint.value);
        const width = rankingMax > 0 ? Math.max(2, value / rankingMax * 100) : 0;
        const formatted = new Intl.NumberFormat(isAr ? "ar-MA" : "fr-MA", { maximumFractionDigits: 1 }).format(value);
        return '<li><span class="regional-ranking-name">' + escapeHtml(isAr ? row.nameAr : row.nameFr) + '</span><span class="regional-ranking-track"><span style="width:' + width.toFixed(2) + '%"></span></span><strong>' + escapeHtml(formatted) + '</strong></li>';
      }).join("") + '</ol></div>'
    : "";
  const rows = model.rows.map((row) => {
    const cells = row.points.map((point) => {
      if (!point) return "<td>—</td>";
      if (point.value === null || point.value === undefined) {
        const missing = point.quality_flag === "insufficient_significance" ? "ps"
          : point.quality_flag === "not_available" ? "."
          : point.quality_flag === "unrecognized" ? "?"
          : "—";
        const label = point.quality_flag === "insufficient_significance"
          ? (isAr ? "غير دال إحصائياً بما يكفي" : "Insuffisamment significatif")
          : point.quality_flag === "not_available"
            ? (isAr ? "غير متاح" : "Non disponible")
            : (isAr ? "قيد التحقق" : "À vérifier");
        return `<td><span class="regional-quality" title="${label}">${missing}</span></td>`;
      }
      const value = new Intl.NumberFormat(isAr ? "ar-MA" : "fr-MA", { maximumFractionDigits: 1 }).format(Number(point.value));
      const marker = point.quality_flag === "medium_significance"
        ? `<sup class="regional-quality" title="${isAr ? "دلالة إحصائية متوسطة" : "Significativité moyenne"}">ms</sup>`
        : point.quality_flag === "estimated"
          ? `<sup class="regional-quality" title="${isAr ? "قيمة مقدّرة" : "Valeur estimée"}">*</sup>`
          : "";
      return `<td>${escapeHtml(value)}${marker}</td>`;
    }).join("");
    return `<tr><th scope="row">${escapeHtml(isAr ? row.nameAr : row.nameFr)}</th>${cells}</tr>`;
  }).join("");
  const sourceUrl = isSafeHttpUrl(model.sourceUrl) ? model.sourceUrl : "";
  const regionalUnit = isAr ? model.unitAr : model.unitFr;
  const updateDate = model.lastSuccessfulCollectionAt
    ? String(model.lastSuccessfulCollectionAt).slice(0, 10)
    : (model.generatedAt ? String(model.generatedAt).slice(0, 10) : "");
  const collectionLabel = model.collectionStatus === "carried_forward"
    ? (isAr ? "بيانات محفوظة منذ آخر جمع ناجح" : "Données conservées depuis la dernière collecte réussie")
    : model.collectionStatus === "manual_verified"
      ? (isAr ? "بيانات موثقة من المصدر" : "Données vérifiées dans la source")
      : model.collectionStatus === "partial"
        ? (isAr ? "تحديث جزئي للسلاسل" : "Mise à jour partielle des séries")
        : (isAr ? "آخر جمع ناجح" : "Dernière collecte réussie");
  const methodologyNote = isAr ? model.methodologyNoteAr : model.methodologyNoteFr;
  const methodologyText = methodologyNote || (isAr
    ? "تنبيه منهجي: لا ينبغي وصل نتائج EMO 2026 مباشرة بالسلاسل القديمة للبحث الوطني حول التشغيل."
    : "Précaution méthodologique : les résultats EMO 2026 ne doivent pas être raccordés directement aux anciennes séries ENE.");
  return `<section class="regional-stats-dashboard">
    <div class="stats-heading"><div><span class="mini-label">${isAr ? "بيانات جهوية" : "DONNÉES TERRITORIALES"}</span><h3>${title}</h3><p>${intro}</p></div><span class="stats-updated">${escapeHtml(collectionLabel)} : ${escapeHtml(updateDate || "—")}</span></div>
    <div class="regional-controls">
      <label><span>${isAr ? "المؤشر" : "Indicateur"}</span><select data-regional-indicator aria-label="${isAr ? "اختيار المؤشر" : "Choisir un indicateur"}">${indicatorOptions}</select></label>
      <div class="stats-filter-group" role="group" aria-label="${isAr ? "مجال الإقامة" : "Milieu de résidence"}">${scopeButtons}</div>
    </div>
    <div class="regional-coverage" aria-live="polite">
      <div><span>${isAr ? "الجهات المغطاة" : "Régions couvertes"}</span><strong>${model.regionalCount}/12</strong></div>
      <div><span>${isAr ? "قيم الفترة الأخيرة" : "Valeurs disponibles"}</span><strong>${model.latestAvailableCount}/${model.regionalCount}</strong></div>
      <div><span>${isAr ? "قيم غير متاحة" : "Valeurs manquantes"}</span><strong>${model.latestMissingCount}</strong></div>
      <p>${isAr ? "الفترة الأخيرة" : "Dernière période"} : <strong>${escapeHtml(model.latestPeriod || "—")}</strong></p>
    </div>
    ${rankingMarkup}
    <div class="regional-table-wrap"><table class="regional-table">
      <thead><tr><th scope="col">${isAr ? "الجهة" : "Région"}</th>${model.periods.map((period) => `<th scope="col">${escapeHtml(period)}${regionalUnit ? ` (${escapeHtml(regionalUnit)})` : ""}</th>`).join("")}</tr></thead>
      <tbody>${rows || `<tr><td colspan="${model.periods.length + 1}">${isAr ? "لا توجد بيانات متاحة." : "Aucune observation disponible."}</td></tr>`}</tbody>
    </table></div>
    <p class="regional-legend">${isAr
      ? "ms: دلالة إحصائية متوسطة · *: قيمة مقدّرة · ps: غير دال إحصائياً بما يكفي · .: غير متاح."
      : "ms : significativité moyenne · * : valeur estimée · ps : résultat insuffisamment significatif · . : valeur non disponible."}</p>
    <p class="regional-methodology-note">${escapeHtml(methodologyText)}</p>
    <div class="stat-card-foot"><span>${escapeHtml(isAr ? model.sourceNameAr : model.sourceName)} · ${model.rows.length} ${isAr ? (model.rows.some((row) => row.geographyCode === "MAR") ? "جهة ومجموع وطني" : "جهة") : "lignes géographiques"}</span>${sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">${isAr ? "المصدر الأصلي" : "Document HCP original"}${model.sourcePage ? (isAr ? " · الصفحة " : " · p. ") + model.sourcePage : ""} ↗</a>` : ""}</div>
  </section>`;
}

function renderGlobalSearchOverview() {
  const isAr = lang === "ar";
  const spaces = [
    {id:"chiffres",label:isAr ? "المغرب بالأرقام" : "Maroc en chiffres"},
    {id:"veille",label:isAr ? "الرصد" : "Veille"},
    {id:"science",label:isAr ? "الدراسات والبحث" : "Études & recherche"},
    {id:"bibliotheque",label:isAr ? "المكتبة" : "Bibliothèque"},
    {id:"academy",label:isAr ? "الأكاديمية" : "Academy"}
  ];
  const visible = indexItems.filter((item) => !isFutureDate(item));
  const cards = spaces.map((space) => {
    const count = visible.filter((item) => matchesSpace(item,space.id)).length;
    return '<button type="button" class="global-search-space" data-space-id="' + space.id + '"><strong>' + count.toLocaleString(isAr ? "ar-MA" : "fr-MA") + '</strong><span>' + escapeHtml(space.label) + '</span></button>';
  }).join("");
  return '<section class="global-search-overview"><div class="global-search-copy"><span class="mini-label">' + (isAr ? "بحث موحد" : "EXPLORATION TRANSVERSALE") + '</span><h3>' + (isAr ? "ابحث عبر جميع مجالات KITN" : "Une recherche à travers tout KITN") + '</h3><p>' + (isAr ? "ابحث في العناوين والملخصات والمؤلفين والمؤسسات والكلمات المفتاحية والمراجع. يمكنك تضييق النتائج حسب المجال." : "Interrogez les titres, résumés, auteurs, institutions, mots-clés et références, puis affinez par espace.") + '</p></div><div class="global-search-spaces">' + cards + '</div><p class="global-search-note">' + (isAr ? "الأعداد تخص المواد المفهرسة والمتاحة حالياً، قبل تطبيق كلمات البحث." : "Volumes des notices actuellement indexées et non exclues, avant application de votre recherche.") + '</p></section>';
}
function renderWatchDashboard() {
  const isAr = lang === "ar";
  const watchItems = indexItems.filter((item) => matchesSpace(item, "veille") && !isFutureDate(item));
  const reviewedItems = watchItems.filter((item) => getEffectiveStatus(item) === "valide");
  const reviewItems = watchItems.filter((item) => getEffectiveStatus(item) === "a_verifier");
  const poleCards = [
    { id: "institutions_gouvernance", title: isAr ? "المؤسسات والحكامة" : "Institutions & gouvernance", desc: isAr ? "الإصلاحات والسياسات العمومية والعمل المؤسساتي." : "Réformes, politiques publiques et action institutionnelle." },
    { id: "economie_finances_publiques", title: isAr ? "الاقتصاد والمالية العمومية" : "Économie & finances publiques", desc: isAr ? "الميزانية والاقتصاد والأسواق والمالية العمومية." : "Budget, conjoncture, marchés et finances publiques." },
    { id: "societe_developpement_humain", title: isAr ? "المجتمع والتنمية البشرية" : "Société & développement humain", desc: isAr ? "التشغيل والتعليم والصحة والتحولات الاجتماعية." : "Emploi, éducation, santé et mutations sociales." },
    { id: "securite_affaires_interieures", title: isAr ? "الأمن والشؤون الداخلية" : "Sécurité & affaires intérieures", desc: isAr ? "الأمن والوقاية والشؤون الترابية." : "Sécurité, prévention et affaires territoriales." },
    { id: "relations_internationales_geopolitique", title: isAr ? "العلاقات الدولية والجيوسياسة" : "Relations internationales & géopolitique", desc: isAr ? "العلاقات الخارجية والتوازنات الإقليمية." : "Relations extérieures et équilibres régionaux." }
  ];
  const cards = poleCards.map((pole) => {
    const count = watchItems.filter((item) => item.pole === pole.id || (Array.isArray(item.poles_secondaires) && item.poles_secondaires.includes(pole.id))).length;
    return '<button type="button" class="watch-topic-card" data-pole-shortcut="' + pole.id + '">' +
      '<span class="watch-topic-count">' + count.toLocaleString(isAr ? "ar-MA" : "fr-MA") + '</span>' +
      '<strong>' + escapeHtml(pole.title) + '</strong><span>' + escapeHtml(pole.desc) + '</span>' +
      '<span class="watch-topic-link">' + (isAr ? "استكشف الملفات" : "Explorer les notices") + ' ↗</span></button>';
  }).join("");
  const types = new Map();
  watchItems.forEach((item) => {
    const key = item.type_document || "non_classe";
    types.set(key, (types.get(key) || 0) + 1);
  });
  const topTypes = [...types.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const typeLabels = topTypes.map(([type, count]) => '<span class="watch-type-chip">' + escapeHtml(formatDocType(type) || (isAr ? "غير مصنف" : "Non classé")) + ' <strong>' + count + '</strong></span>').join("");
  const sourceRows = Array.isArray(sourceHealthData?.sources) ? sourceHealthData.sources : [];
  const enabledSources = sourceRows.filter((source) => source.enabled !== false);
  const sourceOk = enabledSources.filter((source) => source.status === "ok").length;
  const sourceAttention = enabledSources.filter((source) => source.status === "warning" || source.status === "error").length;
  const sourceTimestamp = sourceHealthData?.updated_at ? Date.parse(sourceHealthData.updated_at) : Number.NaN;
  const sourceDate = Number.isFinite(sourceTimestamp)
    ? new Intl.DateTimeFormat(isAr ? "ar-MA" : "fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(sourceTimestamp))
    : "";
  const sourceFreshness = getSourceHealthFreshness(sourceHealthData?.updated_at);
  const sourceStaleNotice = sourceFreshness === "stale"
    ? '<p class="watch-source-stale" role="status">' + (isAr
      ? "تنبيه: تقرير المصادر أقدم من 24 ساعة؛ تحقق من آخر تشغيل لعملية الجمع قبل اعتبار هذه الحالة حديثة."
      : "Attention : ce rapport date de plus de 24 heures. Vérifiez la dernière exécution du pipeline avant de considérer cet état comme récent.") + '</p>'
    : sourceFreshness === "unknown"
      ? '<p class="watch-source-stale" role="status">' + (isAr
        ? "تعذر التحقق من تاريخ التقرير؛ قد تكون حالة المصادر غير محدثة."
        : "Date du rapport absente ou invalide : impossible de confirmer la fraîcheur de l’état des sources.") + '</p>'
      : "";
  const sourceAttentionItems = enabledSources.filter((source) =>
    source.status === "warning" || source.status === "error"
  );
  const sourceAttentionMarkup = sourceAttentionItems.length
    ? '<div class="watch-source-issues"><h5>' + (isAr ? "مصادر تحتاج إلى متابعة" : "Sources à examiner") + '</h5><ul>' +
      sourceAttentionItems.map((source) => {
        const failed = source.status === "error";
        const statusLabel = failed
          ? (isAr ? "فشل الجمع" : "Échec de collecte")
          : (isAr ? "نتيجة جزئية" : "Résultat partiel");
        const detail = String(source.error || source.message || "").trim();
        const fetched = Number(source.fetched || 0);
        const accepted = Number(source.accepted || 0);
        const counts = (isAr ? "تم فحص " : "Examinés : ") + fetched + (isAr ? " · مقبولة " : " · retenus : ") + accepted;
        return '<li class="watch-source-issue ' + (failed ? "is-error" : "is-warning") + '">' +
          '<div class="watch-source-issue-heading"><strong>' + escapeHtml(source.source_name || source.source_id || (isAr ? "مصدر غير معروف" : "Source inconnue")) + '</strong><span>' + statusLabel + '</span></div>' +
          '<small>' + escapeHtml(counts) + '</small>' +
          (detail ? '<p>' + escapeHtml(detail.slice(0, 220)) + '</p>' : "") +
          '</li>';
      }).join("") +
      '</ul></div>'
    : '<p class="watch-source-all-ok">' + (isAr ? "لا توجد مصادر مفعلة تحتاج إلى متابعة في آخر تقرير." : "Aucune source activée en anomalie dans le dernier rapport.") + '</p>';
  const sourceHealthMarkup = sourceRows.length
    ? '<section class="watch-source-health" aria-label="' + (isAr ? "حالة مصادر الرصد" : "État des sources de veille") + '">' +
      '<div class="watch-source-heading"><div><span class="mini-label">' + (isAr ? "شفافية الجمع" : "TRANSPARENCE DE LA COLLECTE") + '</span><h4>' + (isAr ? "حالة مصادر المعلومات" : "État des sources d’information") + '</h4></div><span class="watch-source-updated">' + (isAr ? "آخر تحديث" : "Dernière mise à jour") + (sourceDate ? " · " + escapeHtml(sourceDate) : "") + '</span></div>' +
      '<div class="watch-source-metrics"><div><strong>' + sourceOk + '/' + enabledSources.length + '</strong><span>' + (isAr ? "مصادر تعمل" : "sources opérationnelles") + '</span></div><div><strong>' + sourceAttention + '</strong><span>' + (isAr ? "مصادر تحتاج إلى متابعة" : "sources à surveiller") + '</span></div><div><strong>' + Number(sourceHealthData.total_fetched || 0).toLocaleString(isAr ? "ar-MA" : "fr-MA") + '</strong><span>' + (isAr ? "عناصر جرى فحصها" : "éléments examinés") + '</span></div></div>' +
      '<p>' + (isAr ? "تعكس هذه الحالة آخر تقرير آلي متاح، ولا تعني أن جميع المصادر الخارجية متاحة في الوقت الفعلي." : "Cet état reflète le dernier rapport automatisé disponible ; il ne garantit pas la disponibilité en temps réel de chaque site externe.") + '</p>' + sourceStaleNotice + sourceAttentionMarkup + '</section>'
    : '<p class="watch-source-unavailable">' + (isAr ? "تقرير حالة المصادر غير متاح حالياً." : "Le rapport d’état des sources n’est pas disponible pour le moment.") + '</p>';
  return '<section class="watch-dashboard">' +
    '<div class="watch-intro"><div><span class="mini-label">' + (isAr ? "رصد متعدد المجالات" : "VEILLE MULTITHÉMATIQUE") + '</span>' +
    '<h3>' + (isAr ? "متابعة المستجدات وفهمها" : "Suivre les évolutions, comprendre les enjeux") + '</h3>' +
    '<p>' + (isAr ? "استكشف المحتوى المفهرس حسب المجالات. كل بطاقة تفتح notices المطابقة ويمكنك مواصلة التصفية والبحث." : "Parcourez les notices indexées par grand domaine. Chaque rubrique ouvre les contenus correspondants, avec les filtres et la recherche documentaire.") + '</p></div>' +
    '<div class="watch-total"><strong>' + watchItems.length.toLocaleString(isAr ? "ar-MA" : "fr-MA") + '</strong><span>' + (isAr ? "مادة مفهرسة" : "notices indexées") + '</span></div></div>' +
    '<div class="watch-quality-row"><span>' + (isAr ? "تم التحقق" : "Validées") + ' <strong>' + reviewedItems.length + '</strong></span><span>' + (isAr ? "تحتاج إلى المراجعة" : "À vérifier") + ' <strong>' + reviewItems.length + '</strong></span><span>' + (isAr ? "أنواع الوثائق الأكثر حضوراً" : "Types documentaires les plus présents") + '</span>' + typeLabels + '</div>' +
    '<div class="watch-topic-grid">' + cards + '</div>' +
    sourceHealthMarkup +
    '<p class="watch-footnote">' + (isAr ? "الأعداد تمثل les notices actuellement indexées dans KITN، وليست قياساً شاملاً لكل الأخبار المنشورة." : "Les volumes correspondent aux notices actuellement indexées dans KITN ; ils ne représentent pas un recensement exhaustif de toute l’actualité.") + '</p>' +
    '</section>';
}

function renderLibraryDirectory() {
  const isAr = lang === "ar";
  const sourceDefinitions = [
    {name:"Cour des comptes",desc:isAr ? "تقارير الرقابة وتقييم السياسات العمومية والمالية." : "Rapports de contrôle, audits et évaluations des politiques publiques.",url:"https://www.courdescomptes.ma/publications/",id:"cour_des_comptes_maroc"},
    {name:"CESE",desc:isAr ? "آراء ودراسات وتقارير اقتصادية واجتماعية وبيئية." : "Avis, études et rapports économiques, sociaux et environnementaux.",url:"https://www.cese.ma/",id:"cese_maroc"},
    {name:"IRES",desc:isAr ? "دراسات استراتيجية وتقارير موضوعاتية واستشرافية." : "Études stratégiques, rapports thématiques et prospectifs.",url:"https://www.ires.ma/fr/publications",id:"ires_maroc"},
    {name:"HCP",desc:isAr ? "دراسات وتقارير ومنشورات إحصائية رسمية." : "Études, rapports et publications statistiques officielles.",url:"https://www.hcp.ma/",id:"hcp_maroc"},
    {name:isAr ? "مساهمة KITN" : "Contribution KITN",desc:isAr ? "وثائق ومساهمات أضيفت يدوياً إلى الفهرس." : "Documents et contributions ajoutés manuellement à l’index.",url:"",id:"manual_studio"}
  ];
  const docs = indexItems.filter((item) => matchesSpace(item, "bibliotheque") && !isFutureDate(item));
  const sourceCount = new Set(docs.map((item) => item.source_id).filter(Boolean)).size;
  const libraryQuality = getLibraryQualitySummary(docs);
  const withPdf = libraryQuality.withPdf;
  const withAbstract = libraryQuality.withAbstract;
  const countFor = (id) => docs.filter((item) => item.source_id === id).length;
  const latest = [...docs].sort((a,b) => String(b.date_publication || "").localeCompare(String(a.date_publication || ""))).slice(0,4);
  const typeCounts = new Map();
  docs.forEach((item) => {
    const type = item.type_document || "non_classe";
    typeCounts.set(type,(typeCounts.get(type)||0)+1);
  });
  const typeChips = [...typeCounts.entries()].sort((a,b)=>b[1]-a[1]).map(([type,count]) =>
    '<span class="library-type-chip">' + escapeHtml(formatDocType(type) || type) + '<strong>' + count + '</strong></span>'
  ).join("");
  const sourceCards = sourceDefinitions.map((item) => {
    const count = countFor(item.id);
    return '<article class="library-source-card"><div class="library-source-meta"><span>' + escapeHtml(item.name) + '</span><span>' + count + ' ' + (isAr ? "مفهرس" : "indexé(s)") + '</span></div><p>' + escapeHtml(item.desc) + '</p>' + (item.url ? '<a href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener noreferrer">' + (isAr ? "فتح المصدر الرسمي" : "Ouvrir le portail officiel") + ' ↗</a>' : '<span class="library-internal-source">' + (isAr ? "مصدر داخلي" : "Source interne KITN") + '</span>') + '</article>';
  }).join("");
  const recentMarkup = latest.length ? latest.map((item) =>
    '<button type="button" class="library-recent-item" data-open-home-item="' + escapeHtml(getItemKey(item)) + '">' +
    '<span>' + escapeHtml(item.date_publication || "—") + ' · ' + escapeHtml(formatDocType(item.type_document) || "") + '</span>' +
    '<strong>' + escapeHtml(item.titre_original || (isAr ? "وثيقة" : "Document sans titre")) + '</strong>' +
    '<small>' + escapeHtml(item.source_nom || "") + '</small></button>'
  ).join("") : '<p class="empty-results">' + (isAr ? "لا توجد وثائق متاحة حالياً." : "Aucun document disponible pour le moment.") + '</p>';
  return '<section class="library-directory">' +
    '<div class="library-overview"><div><span class="mini-label">' + (isAr ? "مركز الوثائق" : "CENTRE DOCUMENTAIRE") + '</span><h3>' + (isAr ? "المعرفة والتقارير والمراجع" : "Connaissances, rapports et références") + '</h3><p>' + (isAr ? "استكشف الوثائق المفهرسة والمصادر المؤسسية الأصلية. الأرقام تعكس المحتوى المتاح حالياً في KITN." : "Explorez les documents indexés et les portails institutionnels d’origine. Les chiffres décrivent uniquement le contenu actuellement disponible dans KITN.") + '</p></div></div>' +
    '<div class="library-metrics"><div><strong>' + libraryQuality.total + '</strong><span>' + (isAr ? "وثيقة مفهرسة" : "documents indexés") + '</span></div><div><strong>' + sourceCount + '</strong><span>' + (isAr ? "مصادر ممثلة" : "sources représentées") + '</span></div><div><strong>' + withPdf + '</strong><span>' + (isAr ? "روابط PDF مباشرة" : "liens PDF directs") + '</span></div><div><strong>' + withAbstract + '</strong><span>' + (isAr ? "ملخص متاح" : "résumés disponibles") + '</span></div><div><strong>' + libraryQuality.needsReview + '</strong><span>' + (isAr ? "وثائق تحتاج إلى التحقق" : "documents à vérifier") + '</span></div></div>' +
    (libraryQuality.missingDate ? '<p class="library-scope-note">' + (isAr ? "تنبيه: " + libraryQuality.missingDate + " وثيقة دون تاريخ نشر محدد." : "Transparence : " + libraryQuality.missingDate + " document(s) sans date de publication renseignée.") + '</p>' : "") +
    '<div class="library-shelf"><div class="library-section-heading"><h4>' + (isAr ? "أنواع الوثائق" : "Collections documentaires") + '</h4><span>' + typeCounts.size + ' ' + (isAr ? "أنواع" : "types") + '</span></div><div class="library-type-list">' + typeChips + '</div></div>' +
    '<div class="library-shelf"><div class="library-section-heading"><h4>' + (isAr ? "أحدث الوثائق المفهرسة" : "Derniers documents indexés") + '</h4><span>' + (isAr ? "حسب تاريخ النشر" : "Par date de publication") + '</span></div><div class="library-recent-list">' + recentMarkup + '</div></div>' +
    '<div class="library-shelf"><div class="library-section-heading"><h4>' + (isAr ? "مصادر ومؤسسات مرجعية" : "Institutions & fonds documentaires") + '</h4><span>' + (isAr ? "الوصول إلى المصادر الأصلية" : "Accès aux sources originales") + '</span></div><div class="library-source-grid">' + sourceCards + '</div></div>' +
    '<p class="library-scope-note">' + (isAr ? "قد تحتوي بوابات المؤسسات على وثائق إضافية غير مفهرسة في KITN. يظل المصدر الأصلي مرجع النشر." : "Les portails institutionnels peuvent proposer d’autres documents qui ne sont pas encore indexés dans KITN. La source originale reste la référence de publication.") + '</p>' +
    '</section>';
}

function renderArticlePage(item) {
  const isAr = lang === "ar";
  const title = item.titre_original || (isAr ? "منشور" : "Publication");
  const abstract = String(item.resume || "").trim();
  const analysis = String(item.analyse_strategique || "").trim();
  const sourceUrl = isSafeHttpUrl(item.url_publication) ? item.url_publication.trim() : "";
  const pdfUrl = isSafeHttpUrl(item.pdf_direct) ? item.pdf_direct.trim() : "";
  const doiUrl = getDoiUrl(item.doi);
  const authors = Array.isArray(item.auteurs) && item.auteurs.length
    ? item.auteurs.join(", ")
    : (isAr ? "المؤلف غير محدد" : "Auteur non renseigné");
  return `
    <article class="article-reading section">
      <button type="button" class="article-back link-btn" data-space-id="all">← ${isAr ? "العودة إلى KITN" : "Retour à KITN"}</button>
      <div class="article-reading-header">
        <span class="mini-label">${escapeHtml(formatDocType(item.type_document) || formatPole(item.pole) || (isAr ? "منشور" : "Publication"))}</span>
        <h1>${escapeHtml(title)}</h1>
        <p class="article-reading-lead">${escapeHtml(authors)} · ${escapeHtml(item.date_publication || "—")}</p>
        <p class="article-reading-source">${escapeHtml(item.revue_ou_institution || item.source_nom || (isAr ? "المصدر غير محدد" : "Source non précisée"))}</p>
      </div>
      <div class="article-reading-body">
        <section>
          <h2>${isAr ? "الملخص المتاح" : "Résumé disponible"}</h2>
          <p>${escapeHtml(abstract || (isAr ? "لم تقدم قاعدة البيانات ملخصاً لهذا المنشور بعد." : "Aucun résumé n'est actuellement disponible dans les données de KITN pour cette publication."))}</p>
        </section>
        ${analysis ? `<section><h2>${isAr ? "قراءة تحليلية" : "Éclairage analytique"}</h2><p>${escapeHtml(analysis)}</p></section>` : ""}
        <aside class="article-rights-note">
          ${isAr
            ? "تعرض KITN هنا البيانات الوصفية والملخص المتاح. لا يُنشر النص الكامل إلا إذا كانت حقوق إعادة النشر أو رخصة المصدر تسمح بذلك."
            : "KITN présente ici les métadonnées et le résumé disponible. Le texte intégral ne sera reproduit que si les droits ou la licence de la source l'autorisent."}
        </aside>
        <section class="article-citation">
          <h2>${isAr ? "المصدر والمراجع" : "Source et références"}</h2>
          <p><strong>${escapeHtml(authors)}</strong>. ${escapeHtml(title)}. ${escapeHtml(item.revue_ou_institution || item.source_nom || "")}. ${escapeHtml(item.date_publication || "")}.</p>
          ${item.doi ? `<p>DOI : ${doiUrl ? `<a href="${escapeHtml(doiUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.doi)}</a>` : escapeHtml(item.doi)}</p>` : ""}
          <div class="result-actions">
            ${sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">${isAr ? "المنشور الأصلي" : "Publication originale"} ↗</a>` : ""}
            ${pdfUrl ? `<a href="${escapeHtml(pdfUrl)}" target="_blank" rel="noopener noreferrer">${isAr ? "وثيقة PDF" : "Document PDF"} ↗</a>` : ""}
          </div>
        </section>
      </div>
    </article>`;
}

function renderModal() {
  const existing = document.getElementById("notice-modal");
  if (existing) existing.remove();
  if (!activeModalItem) return;

  const c = COPY[lang];
  const item = activeModalItem;
  const st = getEffectiveStatus(item);
  const authorsText = Array.isArray(item.auteurs) && item.auteurs.length
    ? item.auteurs.join(", ")
    : (lang === "ar" ? "مؤلف غير مذكور" : "Auteur non renseigné");
  const keywordsText = Array.isArray(item.mots_cles) && item.mots_cles.length
    ? item.mots_cles.join(" · ")
    : "";
  const resumeText = item.resume && String(item.resume).trim()
    ? item.resume
    : c.noAbstract;
  const statusLabel = st === "archive"
    ? c.statusArchived
    : (st === "valide" && !isFutureDate(item) ? c.statusValid : c.statusReview);

  const safeUrl = isSafeHttpUrl(item.url_publication) ? item.url_publication.trim() : "";
  const safePdf = isSafeHttpUrl(item.pdf_direct) ? item.pdf_direct.trim() : "";
  const doiUrl = getDoiUrl(item.doi);
  const isManual = item.origine === "manuel" || String(item.id || "").startsWith("kitn_manual_");

  const modal = document.createElement("div");
  modal.id = "notice-modal";
  modal.className = "modal-backdrop";
  modal.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true">
      <div class="modal-head">
        <span>${escapeHtml(formatDocType(item.type_document) || formatPole(item.pole) || "")}</span>
        <button type="button" class="modal-close" id="close-modal">${escapeHtml(c.closeBtn)} ✕</button>
      </div>
      <h3>${escapeHtml(item.titre_original || "")}</h3>
      ${isFutureDate(item) ? `<span class="flag-warn">${escapeHtml(c.futureBadge)}</span>` : ""}
      <dl class="modal-meta">
        <div><dt>${escapeHtml(c.labelAuthor)}</dt><dd>${escapeHtml(authorsText)}</dd></div>
        ${item.revue_ou_institution || item.source_nom ? `<div><dt>${escapeHtml(c.labelVenue)}</dt><dd>${escapeHtml(item.revue_ou_institution || item.source_nom)}</dd></div>` : ""}
        <div><dt>${escapeHtml(c.labelDate)}</dt><dd>${escapeHtml(item.date_publication || "—")}</dd></div>
        ${item.collecte_le ? `<div><dt>${escapeHtml(c.labelCollected)}</dt><dd>${escapeHtml(String(item.collecte_le).slice(0, 10))}</dd></div>` : ""}
        ${item.mis_a_jour_le ? `<div><dt>${escapeHtml(c.labelUpdated)}</dt><dd>${escapeHtml(String(item.mis_a_jour_le).slice(0, 10))}</dd></div>` : ""}
        <div><dt>${escapeHtml(c.labelPole)}</dt><dd>${escapeHtml(formatPole(item.pole) || "—")}</dd></div>
        <div><dt>${escapeHtml(c.labelStatus)}</dt><dd>${escapeHtml(statusLabel)}</dd></div>
        ${item.langue_originale ? `<div><dt>${escapeHtml(c.labelDocLang)}</dt><dd>${escapeHtml(formatDocLang(item.langue_originale))}</dd></div>` : ""}
        ${item.confiance_classification ? `<div><dt>${escapeHtml(c.labelConfidence)}</dt><dd>${escapeHtml(formatConfidence(item.confiance_classification))}</dd></div>` : ""}
        ${typeof item.score_pertinence === "number" ? `<div><dt>${escapeHtml(c.labelScore)}</dt><dd>${escapeHtml(String(item.score_pertinence))}</dd></div>` : ""}
        ${item.doi ? `<div><dt>${escapeHtml(c.labelDoi)}</dt><dd>${doiUrl ? `<a href="${escapeHtml(doiUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.doi)}</a>` : escapeHtml(item.doi)} ${item.doi_statut === "invalide" ? `<span class="flag-warn">${lang === "ar" ? "معرّف غير صالح — للتحقق" : "Identifiant invalide — à vérifier"}</span>` : ""}</dd></div>` : ""}
        ${keywordsText ? `<div><dt>${escapeHtml(c.labelKeywords)}</dt><dd>${escapeHtml(keywordsText)}</dd></div>` : ""}
      </dl>
      <div class="modal-resume">
        <strong>${escapeHtml(c.labelAbstract)}</strong>
        <p>${escapeHtml(resumeText)}</p>
      </div>
      ${item.analyse_strategique ? `
        <div class="modal-resume">
          <strong>${escapeHtml(c.labelAnalysis)}</strong>
          <p>${escapeHtml(item.analyse_strategique)}</p>
        </div>
      ` : ""}
      <div class="result-actions">
        ${safeUrl ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.sourceLink)}</a>` : ""}
        ${doiUrl ? `<a href="${escapeHtml(doiUrl)}" target="_blank" rel="noopener noreferrer">DOI ↗</a>` : ""}
        ${safePdf ? `<a href="${escapeHtml(safePdf)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.pdfLink)}</a>` : ""}
        <button type="button" class="link-btn" id="modal-validate-btn">${escapeHtml(c.validateBtn)}</button>
        <button type="button" class="link-btn" id="modal-archive-btn">${escapeHtml(c.archiveBtn)}</button>
        ${isManual ? `<button type="button" class="link-btn" id="modal-delete-btn">${escapeHtml(c.deleteBtn)}</button>` : ""}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.getElementById("close-modal")?.addEventListener("click", () => {
    activeModalItem = null;
    renderModal();
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      activeModalItem = null;
      renderModal();
    }
  });
  document.getElementById("modal-validate-btn")?.addEventListener("click", () => setItemStatus(item, "valide"));
  document.getElementById("modal-archive-btn")?.addEventListener("click", () => setItemStatus(item, "archive"));
  document.getElementById("modal-delete-btn")?.addEventListener("click", () => deleteManualItem(item));
}

function renderResults() {
  const container = document.getElementById("results-grid");
  const countBadge = document.getElementById("index-count");
  const poleBanner = document.getElementById("active-pole-banner");
  if (!container || !countBadge) return;

  const filterKey = JSON.stringify([
    activeSpace, searchQuery, selectedPolesFilter, selectedSinglePoleFilter,
    selectedTypeFilter, selectedConfidenceFilter, selectedDocLangFilter,
    dateFromFilter, dateToFilter, sortOrder, futureDatesOnly, favoritesOnly,
    favoritesOnly ? favorites : []
  ]);
  if (filterKey !== lastResultsFilterKey) {
    resultsPage = 1;
    lastResultsFilterKey = filterKey;
  }
  const filtered = getFilteredItems();
  const pagination = getPageSlice(filtered, resultsPage, RESULTS_PAGE_SIZE);
  resultsPage = pagination.page;
  const pageItems = pagination.items;
  const globalQuery = normalizeSearchText(searchQuery);
  const globalStatisticMatches = activeSpace === "all" && globalQuery
    ? (Array.isArray(statisticsData?.indicators) ? statisticsData.indicators : []).filter((indicator) => {
        const searchable = normalizeSearchText([indicator.label_fr, indicator.label_ar, getLocalizedStatisticField(indicator, "label", "ar"), indicator.description_fr, indicator.description_ar, getLocalizedStatisticField(indicator, "description", "ar"), indicator.source_name, indicator.unit_fr, indicator.unit_ar, getLocalizedStatisticField(indicator, "unit", "ar"), indicator.indicator_code].filter(Boolean).join(" "));
        return matchesSearchQuery(searchable, globalQuery);
      }).slice(0, 12)
    : [];
  const combinedCount = filtered.length + globalStatisticMatches.length;
  const suffix = lang === "ar" ? " نتيجة" : combinedCount > 1 ? " résultats" : " résultat";
  countBadge.textContent = `${combinedCount}${suffix}`;

  if (poleBanner) {
    if (selectedPolesFilter && activePoleLabel) {
      poleBanner.innerHTML = `
        <span>${escapeHtml(COPY[lang].activePoleBanner)} <strong>${escapeHtml(activePoleLabel)}</strong></span>
        <button type="button" class="link-btn" id="clear-pole-inline">${escapeHtml(COPY[lang].allPoles)} ✕</button>
      `;
      poleBanner.style.display = "flex";
      document.getElementById("clear-pole-inline")?.addEventListener("click", () => {
        selectedPolesFilter = null;
        activePoleLabel = "";
        renderResults();
      });
    } else {
      poleBanner.style.display = "none";
      poleBanner.innerHTML = "";
    }
  }

  if (!filtered.length && !globalStatisticMatches.length) {
    container.innerHTML = `<p class="empty-results">${escapeHtml(COPY[lang].noResults)}</p>`;
    return;
  }

  const documentResultsHtml = pageItems
    .map((item, idx) => {
      const isSaved = favorites.includes(getItemKey(item));
      const st = getEffectiveStatus(item);
      const authorsText = Array.isArray(item.auteurs) && item.auteurs.length
        ? item.auteurs.join(", ")
        : (lang === "ar" ? "مؤلف غير مذكور" : "Auteur non renseigné");
      const venueText = item.revue_ou_institution || item.source_nom || "";
      const metaLeft = escapeHtml(item.date_publication || "");
      const spaceLabels = { chiffres: lang === "ar" ? "المغرب بالأرقام" : "Maroc en chiffres", veille: lang === "ar" ? "الرصد" : "Veille", science: lang === "ar" ? "الدراسات والبحث" : "Études & recherche", bibliotheque: lang === "ar" ? "المكتبة" : "Bibliothèque", academy: "Academy" };
      const itemSpaceLabel = spaceLabels[resolveItemSpace(item)] || "";
      const metaRight = escapeHtml(activeSpace === "all" ? itemSpaceLabel + " · " + (formatDocType(item.type_document) || formatPole(item.pole) || "") : (formatDocType(item.type_document) || formatPole(item.pole) || ""));
      const statusFlag = st === "archive"
        ? `<span class="flag-warn">${escapeHtml(COPY[lang].archivedBadge)}</span>`
        : (isFutureDate(item)
            ? `<span class="flag-warn">${escapeHtml(COPY[lang].futureBadge)}</span>`
            : (st === "a_verifier"
                ? `<span class="flag-warn">${escapeHtml(COPY[lang].unverifiedBadge)}</span>`
                : ""));
      const resumeSnippet = item.resume && String(item.resume).trim()
        ? `<p class="result-resume">${escapeHtml(item.resume)}</p>`
        : "";
      const safePdf = isSafeHttpUrl(item.pdf_direct) ? item.pdf_direct.trim() : "";
      const safeUrl = isSafeHttpUrl(item.url_publication) ? item.url_publication.trim() : "";
      const doiUrl = getDoiUrl(item.doi);
      const doiHtml = doiUrl
        ? `<a href="${escapeHtml(doiUrl)}" target="_blank" rel="noopener noreferrer">DOI ↗</a>`
        : "";
      const pdfHtml = safePdf
        ? `<a href="${escapeHtml(safePdf)}" target="_blank" rel="noopener noreferrer">${escapeHtml(COPY[lang].pdfLink)}</a>`
        : "";
      const sourceHtml = safeUrl
        ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(COPY[lang].sourceLink)}</a>`
        : "";

      return `
        <article class="result-card">
          <div class="result-meta">
            <span>${metaLeft}</span>
            <span>${metaRight}</span>
          </div>
          ${statusFlag}
          <h3>${escapeHtml(item.titre_original || "")}</h3>
          <p class="result-authors">${escapeHtml(authorsText)}${venueText ? ` · ${escapeHtml(venueText)}` : ""}</p>
          ${resumeSnippet}
          <div class="result-actions">
            ${sourceHtml}
            ${doiHtml}
            ${pdfHtml}
            <button type="button" class="link-btn" data-open-index="${idx}">${escapeHtml(COPY[lang].detailsBtn)}</button>
            <button type="button" class="fav-btn ${isSaved ? "is-saved" : ""}" data-fav-index="${idx}">${isSaved ? "★ " : "☆ "}${escapeHtml(isSaved ? COPY[lang].savedBtn : COPY[lang].saveBtn)}</button>
          </div>
        </article>
      `;
    })
    .join("");
  const statisticResultsHtml = globalStatisticMatches.length
    ? `<section class="global-stat-results"><div class="global-stat-results-heading"><span class="mini-label">${lang === "ar" ? "نتائج إحصائية" : "INDICATEURS STATISTIQUES"}</span><strong>${lang === "ar" ? "بيانات المغرب" : "Les données du Maroc"}</strong></div>${globalStatisticMatches.map((indicator) => {
        const label = lang === "ar" ? (getLocalizedStatisticField(indicator, "label", "ar") || indicator.indicator_code) : (indicator.label_fr || indicator.label_ar || indicator.indicator_code);
        const description = lang === "ar" ? getLocalizedStatisticField(indicator, "description", "ar") : (indicator.description_fr || indicator.description_ar || "");
        const unit = lang === "ar" ? getLocalizedStatisticField(indicator, "unit", "ar") : (indicator.unit_fr || indicator.unit_ar || "");
        const latest = indicator.latest && indicator.latest.value !== null && indicator.latest.value !== undefined
          ? formatStatisticValue(indicator, indicator.latest.value) + (unit ? " " + unit : "")
          : "";
        return `<button type="button" class="global-stat-result" data-global-stat="${escapeHtml(indicator.indicator_code || "")}"><span class="global-stat-result-type">${lang === "ar" ? "مؤشر إحصائي" : "Indicateur statistique"} · ${escapeHtml(indicator.indicator_code || "")}</span><strong>${escapeHtml(label)}</strong>${description ? `<span>${escapeHtml(description)}</span>` : ""}<small>${escapeHtml(indicator.source_name || "")}${latest ? " · " + escapeHtml(latest) : ""}</small></button>`;
      }).join("")}</section>`
    : "";
  const paginationHtml = pagination.pageCount > 1
    ? `<nav class="results-pagination" aria-label="${lang === "ar" ? "التنقل بين صفحات النتائج" : "Pagination des résultats"}">
        <button type="button" class="link-btn" data-results-page="${pagination.page - 1}" ${pagination.page <= 1 ? "disabled" : ""}>${lang === "ar" ? "السابق" : "Précédent"}</button>
        <span aria-live="polite">${lang === "ar" ? "صفحة" : "Page"} <strong>${pagination.page}</strong> / ${pagination.pageCount} <small>· ${pagination.startIndex + 1}–${pagination.endIndex} / ${pagination.total}</small></span>
        <button type="button" class="link-btn" data-results-page="${pagination.page + 1}" ${pagination.page >= pagination.pageCount ? "disabled" : ""}>${lang === "ar" ? "التالي" : "Suivant"}</button>
      </nav>`
    : "";
  container.innerHTML = documentResultsHtml + statisticResultsHtml + paginationHtml;

  container.querySelectorAll("[data-results-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const requestedPage = Number(btn.getAttribute("data-results-page"));
      if (!Number.isInteger(requestedPage)) return;
      resultsPage = requestedPage;
      renderResults();
      container.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  });

  container.querySelectorAll("[data-global-stat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const code = btn.getAttribute("data-global-stat") || "";
      const indicator = (Array.isArray(statisticsData?.indicators) ? statisticsData.indicators : []).find((item) => item.indicator_code === code);
      if (!indicator) return;
      activeSpace = "chiffres";
      statisticsView = "national";
      statisticsCategory = "all";
      statisticsSearch = code;
      window.history.pushState({ kitnSpace: "chiffres" }, "", SPACE_PATHS.chiffres);
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  container.querySelectorAll("[data-open-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-open-index"));
      activeModalItem = pageItems[i] || null;
      renderModal();
    });
  });

  container.querySelectorAll("[data-fav-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-fav-index"));
      if (pageItems[i]) toggleFavorite(pageItems[i]);
    });
  });
}

function render() {
  // Local contribution tools are not a public navigation space; keep old sessions safe.
  if (activeSpace === "contribuer") activeSpace = "all";
  const c = COPY[lang];
  const themes = THEMES[lang];
  const principles = PRINCIPLES[lang];
  const tracks = ACADEMY_TRACKS[lang];
  const spaces = SPACES[lang];
  const activeTheme = themes[selectedThemeIndex] || themes[0];
  const activeTrack = tracks[selectedAcademyIndex] || tracks[0];
  const quizQuestions = Array.isArray(activeTrack.questions) && activeTrack.questions.length
    ? activeTrack.questions
    : [{ question: activeTrack.question, options: activeTrack.options, answer: activeTrack.answer, correction: activeTrack.correction }];
  const activeQuizQuestion = quizQuestions[Math.min(selectedQuizQuestionIndex, quizQuestions.length - 1)];
  const quizAnswerKey = `${activeTrack.id}:${selectedQuizQuestionIndex}`;
  const selectedQuizOption = Object.prototype.hasOwnProperty.call(quizAnswers, quizAnswerKey)
    ? quizAnswers[quizAnswerKey]
    : null;
  const quizAnsweredCount = quizQuestions.filter((_, qIdx) =>
    Object.prototype.hasOwnProperty.call(quizAnswers, `${activeTrack.id}:${qIdx}`)
  ).length;
  const quizCorrectCount = quizQuestions.filter((question, qIdx) =>
    Object.prototype.hasOwnProperty.call(quizAnswers, `${activeTrack.id}:${qIdx}`)
    && quizAnswers[`${activeTrack.id}:${qIdx}`] === question.answer
  ).length;
  const activeSpaceObj = spaces.find((s) => s.id === activeSpace) || spaces[0];
  const activeArticleItem = activeArticleId ? indexItems.find((item) => getItemKey(item) === activeArticleId) || null : null;
  document.title = activeArticleItem
    ? `${activeArticleItem.titre_original || "Publication"} | KITN`
    : activeSpace === "all"
      ? "KITN — De l'information à la maîtrise"
      : `${activeSpaceObj.label} | KITN`;
  const isDedicatedSpace = activeSpace !== "all";
  const allPoleKeys = Object.keys(POLE_LABELS[lang]);
  const availableTypes = [...new Set(indexItems.map((it) => it.type_document).filter(Boolean))];
  const availableConfidence = [...new Set(indexItems.map((it) => it.confiance_classification).filter(Boolean))];
  const availableDocLangs = [...new Set(indexItems.map((it) => it.langue_originale).filter(Boolean))];
  const scienceItems = indexItems.filter((it) => resolveItemSpace(it) === "science");
  const scienceYears = [...new Set(scienceItems
    .map((it) => String(it.date_publication || "").slice(0, 4))
    .filter((year) => /^\d{4}$/.test(year)))]
    .sort((a, b) => b.localeCompare(a));
  const scienceWithAbstract = scienceItems.filter((it) => String(it.resume || "").trim()).length;
  const scienceWithDoi = scienceItems.filter((it) => getDoiUrl(it.doi)).length;
  const scienceNeedsReview = scienceItems.filter((it) => isFutureDate(it) || it.statut_validation === "a_verifier").length;
  const scienceFutureDateCount = scienceItems.filter((it) => isFutureDate(it)).length;

  const visibleItems = indexItems.filter((it) => !isFutureDate(it));
  const scienceVisibleCount = visibleItems.filter((it) => resolveItemSpace(it) === "science").length;
  const scienceCount = scienceVisibleCount;
  const statsCount = visibleItems.filter((it) => resolveItemSpace(it) === "chiffres").length;
  const libraryCount = visibleItems.filter((it) => resolveItemSpace(it) === "bibliotheque").length;
  const watchCount = visibleItems.filter((it) => resolveItemSpace(it) === "veille").length;
  const hubCards = spaces.filter((s) => s.id !== "all");

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

  const app = document.getElementById("app");
  if (!app) return;

  const isCorrect = selectedQuizOption === activeQuizQuestion.answer;

  app.innerHTML = `
    <header class="topbar">
      <a href="#" class="brand" id="brand-home">
        <span class="brand-mark">K</span>
        <span>KITN<span class="brand-dot">.</span></span>
      </a>
      <nav class="nav ${mobileMenuOpen ? "is-open" : ""}" id="main-nav" aria-label="${lang === "ar" ? "التنقل الرئيسي" : "Navigation principale"}">
        <button type="button" class="nav-link ${activeSpace === "all" ? "is-active" : ""}" data-space-id="all">${lang === "ar" ? "الرئيسية" : "Accueil"}</button>
        <div class="nav-group ${mobileOpenSubmenu === "chiffres" ? "is-open" : ""}">
          <button type="button" class="nav-link nav-parent ${activeSpace === "chiffres" ? "is-active" : ""}" data-space-id="chiffres" data-mobile-submenu="chiffres" aria-expanded="${mobileOpenSubmenu === "chiffres"}" aria-controls="nav-submenu-chiffres">${lang === "ar" ? "المغرب بالأرقام" : "Maroc en chiffres"} <span aria-hidden="true">⌄</span></button>
          <div class="nav-dropdown" id="nav-submenu-chiffres">
            <button type="button" data-space-id="chiffres">${lang === "ar" ? "المؤشرات الوطنية" : "Indicateurs nationaux"}</button>
            <button type="button" data-space-id="chiffres" data-stat-view-shortcut="regional">${lang === "ar" ? "المقارنة الجهوية" : "Comparaison régionale"}</button>
            <button type="button" data-space-id="chiffres" data-stat-category-shortcut="economie_finances_publiques">${lang === "ar" ? "الاقتصاد والمالية" : "Économie & finances publiques"}</button>
            <button type="button" data-space-id="chiffres" data-stat-category-shortcut="societe_developpement_humain">${lang === "ar" ? "المجتمع والتنمية" : "Société & développement humain"}</button>
          </div>
        </div>
        <div class="nav-group ${mobileOpenSubmenu === "veille" ? "is-open" : ""}">
          <button type="button" class="nav-link nav-parent ${activeSpace === "veille" ? "is-active" : ""}" data-space-id="veille" data-mobile-submenu="veille" aria-expanded="${mobileOpenSubmenu === "veille"}" aria-controls="nav-submenu-veille">${lang === "ar" ? "الرصد" : "Veille"} <span aria-hidden="true">⌄</span></button>
          <div class="nav-dropdown" id="nav-submenu-veille">
            <button type="button" data-space-id="veille">${lang === "ar" ? "الأخبار والمؤسسات" : "Actualités & institutions"}</button>
            <button type="button" data-space-id="veille" data-pole-shortcut="institutions_gouvernance">${lang === "ar" ? "المؤسسات والحكامة" : "Institutions & gouvernance"}</button>
            <button type="button" data-space-id="veille" data-pole-shortcut="securite_affaires_interieures">${lang === "ar" ? "الأمن والشؤون الداخلية" : "Sécurité & affaires intérieures"}</button>
          </div>
        </div>
        <div class="nav-group ${mobileOpenSubmenu === "science" ? "is-open" : ""}">
          <button type="button" class="nav-link nav-parent ${activeSpace === "science" ? "is-active" : ""}" data-space-id="science" data-mobile-submenu="science" aria-expanded="${mobileOpenSubmenu === "science"}" aria-controls="nav-submenu-science">${lang === "ar" ? "الدراسات والبحث" : "Études & recherche"} <span aria-hidden="true">⌄</span></button>
          <div class="nav-dropdown" id="nav-submenu-science">
            <button type="button" data-space-id="science">${lang === "ar" ? "المنشورات العلمية" : "Publications scientifiques"}</button>
            <button type="button" data-space-id="science" data-pole-shortcut="recherche_scientifique">${lang === "ar" ? "البحث العلمي" : "Recherche scientifique"}</button>
          </div>
        </div>
        <button type="button" class="nav-link ${activeSpace === "bibliotheque" ? "is-active" : ""}" data-space-id="bibliotheque">${lang === "ar" ? "المكتبة" : "Bibliothèque"}</button>
        <button type="button" class="nav-link ${activeSpace === "academy" ? "is-active" : ""}" data-space-id="academy">KITN Academy</button>
      </nav>
      <div class="topbar-actions">
        ${isDedicatedSpace ? `<button type="button" class="lang" id="back-portal-top">${escapeHtml(c.backPortalBtn)}</button>` : ""}
        <button type="button" class="menu-toggle" id="menu-toggle" aria-expanded="${mobileMenuOpen}" aria-controls="main-nav">${c.menuBtn}</button>
        <button type="button" class="lang" id="lang-toggle">${c.langBtn}</button>
      </div>
    </header>

    ${activeArticleItem ? renderArticlePage(activeArticleItem) : ""}
    ${!isDedicatedSpace ? `
      <section class="hero">
        <div class="hero-orb orb-one"></div>
        <div>
          <span class="eyebrow"><span class="eyebrow-dot"></span>${c.eyebrow}</span>
          <h1>${c.heroTitle}</h1>
          <p class="hero-intro">${c.heroIntro}</p>
          <div class="hero-actions">
            <button type="button" class="btn primary" data-space-id="chiffres">${c.heroPrimary}</button>
            <button type="button" class="text-link" data-space-id="veille">${c.heroSecondary}</button>
          </div>
          <div class="hero-note">
            <span class="note-line"></span>
            <span>${c.heroNote}</span>
          </div>
        </div>

        <div class="hero-art">
          <div class="art-card card-back">
            <div class="art-top">
              <span>${c.card1Top}</span>
              <span class="live-dot"></span>
            </div>
            <div class="art-lines">
              <i></i>
              <i style="width:72%"></i>
              <i style="width:86%"></i>
            </div>
            <div class="art-map">
              <span>${c.card1Map}</span>
              <span class="map-shape"></span>
            </div>
          </div>

          <div class="art-card card-front">
            <div class="art-top"><span>${c.card2Top}</span></div>
            <div class="art-number">01 <span>→</span> 04</div>
            <div class="art-caption">${c.card2Cap}</div>
            <div class="art-bars">
              <i></i><i></i><i></i><i></i><i></i><i></i>
            </div>
          </div>

          <div class="floating-chip">${c.chip}</div>
        </div>
      </section>

      <section class="section" id="portal-hub">
        <div class="section-head">
          <div>
            <span class="eyebrow">${escapeHtml(c.hubTitle)}</span>
            <h2>${escapeHtml(c.hubTitle)}</h2>
          </div>
          <p>${escapeHtml(c.hubSub)}</p>
        </div>

        <div class="principles-grid">
          <div class="principle-card is-active">
            <span>${visibleItems.length}</span>
            <h3>${escapeHtml(c.statTotal)}</h3>
          </div>
          <div class="principle-card">
            <span>${scienceCount}</span>
            <h3>${escapeHtml(c.statScience)}</h3>
          </div>
          <div class="principle-card">
            <span>${statsCount}</span>
            <h3>${escapeHtml(c.statStats)}</h3>
          </div>
          <div class="principle-card">
            <span>${libraryCount}</span>
            <h3>${escapeHtml(c.statLibrary)}</h3>
          </div>
          <div class="principle-card">
            <span>${watchCount}</span>
            <h3>${escapeHtml(c.statWatch)}</h3>
          </div>
        </div>

        <div class="themes-grid">
          ${hubCards.map((sp) => `
            <div class="theme-card ${activeSpace === sp.id ? "is-active" : ""}">
              <h3>${escapeHtml(sp.label)}</h3>
              <button type="button" class="link-btn" data-jump-space="${sp.id}">${escapeHtml(c.openSpaceBtn)}</button>
            </div>
          `).join("")}
        </div>
      </section>

      <section class="section" id="themes">
        <div class="section-head">
          <div>
            <span class="eyebrow">${c.themesEyebrow}</span>
            <h2>${c.themesTitle}</h2>
          </div>
          <p>${c.themesSub}</p>
        </div>

        <div class="themes-grid">
          ${themes.map((th, i) => `
            <button type="button" class="theme-card ${i === selectedThemeIndex ? "is-active" : ""}" data-theme-idx="${i}">
              <div class="theme-top">
                <span>${th.num}</span>
                <span>${th.symbol}</span>
              </div>
              <h3>${escapeHtml(th.title)}</h3>
              <p>${escapeHtml(th.desc)}</p>
            </button>
          `).join("")}
        </div>

        <div class="theme-detail">
          <div>
            <h3>${escapeHtml(activeTheme.title)}</h3>
            <p>${escapeHtml(activeTheme.detail)}</p>
            <div class="theme-tags">
              ${activeTheme.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
            </div>
          </div>
          <button type="button" class="btn primary" id="filter-by-theme">${escapeHtml(c.openPole)}</button>
        </div>
      </section>
    ` : ""}

    ${activeSpace === "all" ? `
      <section class="section home-spaces">
        <div class="section-head">
          <div><span class="eyebrow">${lang === "ar" ? "استكشف KITN" : "EXPLORER KITN"}</span><h2>${lang === "ar" ? "خمسة فضاءات موضوعاتية لاستكشاف المغرب" : "Cinq espaces thématiques pour explorer le Maroc"}</h2></div>
          <p>${lang === "ar" ? "كل مساحة لها محتواها وأدواتها الخاصة." : "Des espaces indépendants, chacun organisé autour d'un besoin précis."}</p>
        </div>
        <div class="home-space-grid">
          ${spaces.filter((sp) => !["all", "contribuer"].includes(sp.id)).map((sp) => `
            <button type="button" class="home-space-card" data-space-id="${sp.id}">
              <span class="home-space-mark">${({ chiffres: "01", veille: "02", science: "03", bibliotheque: "04", academy: "05" })[sp.id] || "•"}</span>
              <strong>${escapeHtml(sp.label)}</strong>
              <p>${escapeHtml(SPACE_DESCRIPTIONS[lang][sp.id] || "")}</p>
              <span>${lang === "ar" ? "اكتشف المساحة" : "Explorer cet espace"} ↗</span>
            </button>
          `).join("")}
        </div>
      </section>
    ` : ""}
    ${activeSpace === "academy" ? `
      <section class="section" id="academy">
        <div class="section-head">
          <div>
            <span class="eyebrow">${c.academyEyebrow}</span>
            <h2>${c.academyTitle}</h2>
          </div>
          <p>${c.academyText}</p>
        </div>

        <div class="academy-tabs">
          ${tracks.map((tr, idx) => `
            <button type="button" class="tab-btn ${idx === selectedAcademyIndex ? "is-active" : ""}" data-academy-idx="${idx}">${escapeHtml(tr.label)}</button>
          `).join("")}
        </div>

        <div class="academy-card">
          <div>
            <span class="mini-label">${escapeHtml(c.academySheetLabel)}</span>
            <h3>${escapeHtml(activeTrack.title)}</h3>
            <p>${escapeHtml(activeTrack.sheet)}</p>
            ${activeTrack.level ? `<p><strong>${escapeHtml(c.academyLevelLabel)} :</strong> ${escapeHtml(activeTrack.level)}</p>` : ""}
            ${activeTrack.domain ? `<p><strong>${escapeHtml(c.academyDomainLabel)} :</strong> ${escapeHtml(activeTrack.domain)}</p>` : ""}
            ${activeTrack.deadline ? `<p><strong>${escapeHtml(c.academyDeadlineLabel)} :</strong> ${escapeHtml(activeTrack.deadline)}</p>` : ""}
            ${activeTrack.methodology ? `<p><strong>${escapeHtml(c.academyMethodLabel)} :</strong> ${escapeHtml(activeTrack.methodology)}</p>` : ""}
            ${Array.isArray(activeTrack.past_topics) && activeTrack.past_topics.length ? `<p>${escapeHtml(activeTrack.past_topics.join(" · "))}</p>` : ""}
            ${Array.isArray(activeTrack.learning_objectives) && activeTrack.learning_objectives.length ? `<div class="academy-learning-block"><h4>${escapeHtml(c.academyObjectivesLabel)}</h4><ul>${activeTrack.learning_objectives.map((objective) => `<li>${escapeHtml(objective)}</li>`).join("")}</ul></div>` : ""}
            ${Array.isArray(activeTrack.study_plan) && activeTrack.study_plan.length ? `<div class="academy-learning-block"><h4>${escapeHtml(c.academyPlanLabel)}</h4><ol>${activeTrack.study_plan.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol></div>` : ""}
            ${Array.isArray(activeTrack.lessons) && activeTrack.lessons.length ? `
              <section class="academy-course-section" aria-label="${escapeHtml(c.academyLessonsLabel)}">
                <h3>${escapeHtml(c.academyLessonsLabel)}</h3>
                ${activeTrack.lessons.map((lesson, lessonIndex) => `
                  <article class="academy-lesson">
                    <span class="mini-label">${lang === "ar" ? "الوحدة" : "Module"} ${lessonIndex + 1}</span>
                    <h4>${escapeHtml(lesson.title)}</h4>
                    <p class="academy-lesson-summary">${escapeHtml(lesson.summary)}</p>
                    <div class="academy-lesson-part">
                      <h5>${escapeHtml(c.academyConceptsLabel)}</h5>
                      <dl>${lesson.concepts.map(([term, definition]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(definition)}</dd></div>`).join("")}</dl>
                    </div>
                    <div class="academy-lesson-part">
                      <h5>${escapeHtml(c.academyExampleLabel)}</h5>
                      <p>${escapeHtml(lesson.example)}</p>
                    </div>
                    <div class="academy-lesson-part">
                      <h5>${escapeHtml(c.academyEssayLabel)}</h5>
                      <p>${escapeHtml(lesson.essay)}</p>
                    </div>
                    <div class="academy-lesson-part">
                      <h5>${escapeHtml(c.academyExerciseLabel)}</h5>
                      <p>${escapeHtml(lesson.exercise)}</p>
                    </div>
                    <details class="academy-guidance">
                      <summary>${escapeHtml(c.academyGuidanceLabel)}</summary>
                      <p>${escapeHtml(lesson.guidance)}</p>
                    </details>
                  </article>
                `).join("")}
              </section>
            ` : ""}
          </div>
          <div>
            <span class="mini-label">${escapeHtml(c.academyQuizLabel)}</span>
            <div class="quiz-question-nav" aria-label="${lang === "ar" ? "اختيار السؤال" : "Choisir une question"}">
              ${quizQuestions.map((question, qIdx) => `
                <button type="button" class="quiz-step ${qIdx === selectedQuizQuestionIndex ? "is-active" : ""} ${Object.prototype.hasOwnProperty.call(quizAnswers, `${activeTrack.id}:${qIdx}`) ? "is-answered" : ""}" data-quiz-question="${qIdx}" aria-current="${qIdx === selectedQuizQuestionIndex ? "step" : "false"}" aria-label="${lang === "ar" ? "السؤال" : "Question"} ${qIdx + 1}">${qIdx + 1}</button>
              `).join("")}
            </div>
            <p class="quiz-progress">${lang === "ar" ? "السؤال" : "Question"} ${Math.min(selectedQuizQuestionIndex + 1, quizQuestions.length)} / ${quizQuestions.length} · ${lang === "ar" ? "الإجابات" : "Réponses"} ${quizAnsweredCount} / ${quizQuestions.length} · ${lang === "ar" ? "الصحيحة" : "Bonnes réponses"} ${quizCorrectCount}</p>
            <p class="quiz-question">${escapeHtml(activeQuizQuestion.question)}</p>
            <div class="quiz-options">
              ${activeQuizQuestion.options.map((opt, oIdx) => `
                <button type="button" class="quiz-opt ${selectedQuizOption === oIdx ? "is-selected" : ""}" data-quiz-opt="${oIdx}" aria-pressed="${selectedQuizOption === oIdx}">${escapeHtml(opt)}</button>
              `).join("")}
            </div>
            ${selectedQuizOption !== null ? `
              <div class="quiz-feedback ${isCorrect ? "is-ok" : "is-ko"}">
                <p>${escapeHtml(activeQuizQuestion.correction)}</p>
                ${Array.isArray(activeQuizQuestion.option_explanations) && activeQuizQuestion.option_explanations.length ? `
                  <div class="quiz-explanations">
                    <strong>${escapeHtml(c.academyExplanationLabel)}</strong>
                    <ul>${activeQuizQuestion.option_explanations.map((explanation, optionIndex) => `<li class="${optionIndex === activeQuizQuestion.answer ? "is-correct" : "is-distractor"}"><span>${optionIndex === activeQuizQuestion.answer ? "✓" : "•"}</span> ${escapeHtml(explanation)}</li>`).join("")}</ul>
                  </div>
                ` : ""}
              </div>
            ` : ""}
          </div>
        </div>
      </section>
    ` : ""}

    ${false ? `
      <section class="section" id="method">
        <div class="section-head">
          <div>
            <span class="eyebrow">${c.methodEyebrow}</span>
            <h2>${c.methodTitle}</h2>
          </div>
          <p>${c.methodText}</p>
        </div>

        <div class="principles-grid">
          ${principles.map((pr, idx) => `
            <button type="button" class="principle-card ${idx === selectedPrincipleIndex ? "is-active" : ""}" data-principle-idx="${idx}">
              <span>${pr.num}</span>
              <h3>${escapeHtml(pr.title)}</h3>
              <p>${escapeHtml(pr.text)}</p>
            </button>
          `).join("")}
        </div>
      </section>
    ` : ""}

    ${isDedicatedSpace ? `
    <section class="section" id="research">
      <div class="section-head">
        <div>
          <span class="eyebrow">${escapeHtml(isDedicatedSpace ? activeSpaceObj.label : c.researchEyebrow)}</span>
          <h2>${escapeHtml(isDedicatedSpace ? activeSpaceObj.label : c.researchTitle)}</h2>
        </div>
        <span class="count-badge" id="index-count">0</span>
      </div>

      ${activeSpace === "chiffres" ? renderStatisticsDashboard() : ""}
      ${activeSpace === "all" ? renderGlobalSearchOverview() : ""}
      ${activeSpace === "bibliotheque" ? renderLibraryDirectory() : ""}
      ${activeSpace === "veille" ? renderWatchDashboard() : ""}

      ${activeSpace === "contribuer" ? `
        <form class="manual-form" id="manual-form">
          <h3>${escapeHtml(c.manualTitle)}</h3>
          <p>${escapeHtml(c.manualSub)}</p>
          <div class="manual-grid">
            <label>
              <span>${escapeHtml(c.manualLabelTitle)}</span>
              <input type="text" id="m-title" required />
            </label>
            <label>
              <span>${escapeHtml(c.manualLabelType)}</span>
              <select id="m-type">
                ${Object.entries(DOC_TYPES[lang]).map(([k, lbl]) => `<option value="${k}">${escapeHtml(lbl)}</option>`).join("")}
              </select>
            </label>
            <label>
              <span>${escapeHtml(c.manualLabelSpace)}</span>
              <select id="m-space">
                ${spaces.filter((s) => !["all", "contribuer"].includes(s.id)).map((s) => `<option value="${s.id}">${escapeHtml(s.label)}</option>`).join("")}
              </select>
            </label>
            <label>
              <span>${escapeHtml(c.manualLabelPole)}</span>
              <select id="m-pole">
                ${allPoleKeys.map((pk) => `<option value="${pk}">${escapeHtml(formatPole(pk))}</option>`).join("")}
              </select>
            </label>
            <label>
              <span>${escapeHtml(c.manualLabelDate)}</span>
              <input type="date" id="m-date" value="${REFERENCE_DATE}" />
            </label>
            <label>
              <span>${escapeHtml(c.manualLabelVenue)}</span>
              <input type="text" id="m-venue" />
            </label>
            <label>
              <span>${escapeHtml(c.manualLabelKeywords)}</span>
              <input type="text" id="m-keywords" />
            </label>
            <label>
              <span>${escapeHtml(c.manualLabelUrl)}</span>
              <input type="url" id="m-url" placeholder="https://..." />
            </label>
            <label>
              <span>${escapeHtml(c.manualLabelPdf)}</span>
              <input type="url" id="m-pdf" placeholder="https://..." />
            </label>
          </div>
          <label class="manual-resume-field">
            <span>${escapeHtml(c.manualLabelResume)}</span>
            <textarea id="m-resume" rows="3"></textarea>
          </label>
          <label class="manual-resume-field">
            <span>${escapeHtml(c.manualLabelAnalysis)}</span>
            <textarea id="m-analysis" rows="2"></textarea>
          </label>
          <div class="manual-actions">
            <button type="submit" class="btn primary">${escapeHtml(c.manualAddBtn)}</button>
            <button type="button" class="link-btn" id="manual-export">${escapeHtml(c.manualExportBtn)}</button>
            <label class="link-btn">
              <span>${escapeHtml(c.manualImportBtn)}</span>
              <input type="file" id="manual-import-file" accept=".json,application/json" style="display:none;" />
            </label>
            <button type="button" class="link-btn" id="manual-clear">${escapeHtml(c.manualClearBtn)}</button>
          </div>
          <p class="manual-status" id="manual-status"></p>
        </form>
      ` : ""}

      <div id="active-pole-banner" class="pole-banner" style="display:none;"></div>

      ${activeSpace === "science" ? `
        <div class="science-search-panel">
          <div class="science-metrics">
            <div><strong>${scienceVisibleCount}</strong><span>${lang === "ar" ? "منشور متاح" : "publications visibles"}</span></div>
            <div><strong>${scienceWithAbstract}</strong><span>${lang === "ar" ? "ملخص متاح" : "résumés disponibles"}</span></div>
            <div><strong>${scienceWithDoi}</strong><span>DOI</span></div>
            <div><strong>${scienceNeedsReview}</strong><span>${lang === "ar" ? "تحتاج إلى التحقق" : "à vérifier"}</span></div>
          </div>
          <p class="science-quality-note">${lang === "ar"
            ? `${scienceItems.length} منشور مفهرس إجمالاً · ${scienceFutureDateCount} بتاريخ مستقبلي مستبعد مؤقتاً · ${scienceItems.length - scienceWithAbstract} دون ملخص · ${scienceItems.filter((it) => !Array.isArray(it.auteurs) || !it.auteurs.length).length} دون مؤلف محدد`
            : `${scienceItems.length} publications indexées au total · ${scienceFutureDateCount} avec une date future temporairement exclues · ${scienceItems.length - scienceWithAbstract} sans résumé · ${scienceItems.filter((it) => !Array.isArray(it.auteurs) || !it.auteurs.length).length} sans auteur renseigné`}</p>
          <div class="science-specific-filters">
            <label>
              <span>${lang === "ar" ? "الباحث / المؤلف" : "Auteur / chercheur"}</span>
              <input type="search" id="science-author-input" value="${escapeHtml(scienceAuthorFilter)}" placeholder="${lang === "ar" ? "ابحث عن اسم المؤلف" : "Nom d'un auteur"}" />
            </label>
            <label>
              <span>${lang === "ar" ? "التخصص / الكلمات المفتاحية" : "Discipline / mots-clés"}</span>
              <input type="search" id="science-discipline-input" value="${escapeHtml(scienceDisciplineFilter)}" placeholder="${lang === "ar" ? "اقتصاد، أمن، حكامة..." : "Économie, sécurité, gouvernance..."}" />
            </label>
            <label>
              <span>${lang === "ar" ? "سنة النشر" : "Année de publication"}</span>
              <select id="science-year-select">
                <option value="">${lang === "ar" ? "كل السنوات" : "Toutes les années"}</option>
                ${scienceYears.map((year) => `<option value="${year}" ${scienceYearFilter === year ? "selected" : ""}>${year}</option>`).join("")}
              </select>
            </label>
          </div>
        </div>
      ` : ""}
      <div class="filters-bar">
        <input type="search" id="search-input" placeholder="${escapeHtml(activeSpace === "science" ? (lang === "ar" ? "ابحث بعنوان المنشور أو الملخص..." : "Rechercher un titre, un résumé, une revue...") : c.searchPlaceholder)}" value="${escapeHtml(searchQuery)}" />
        <label class="date-range-field">
          <span>${escapeHtml(c.dateFromLabel)}</span>
          <input type="date" id="date-from-input" value="${escapeHtml(dateFromFilter)}" />
        </label>
        <label class="date-range-field">
          <span>${escapeHtml(c.dateToLabel)}</span>
          <input type="date" id="date-to-input" value="${escapeHtml(dateToFilter)}" />
        </label>
        <select id="pole-select">
          <option value="">${escapeHtml(c.allPolesSelect)}</option>
          ${allPoleKeys.map((pk) => `<option value="${pk}" ${selectedSinglePoleFilter === pk ? "selected" : ""}>${escapeHtml(formatPole(pk))}</option>`).join("")}
        </select>
        <select id="type-select">
          <option value="">${escapeHtml(c.allTypes)}</option>
          ${availableTypes.map((dt) => `<option value="${dt}" ${selectedTypeFilter === dt ? "selected" : ""}>${escapeHtml(formatDocType(dt))}</option>`).join("")}
        </select>
        <select id="conf-select">
          <option value="">${escapeHtml(c.allConfidence)}</option>
          ${availableConfidence.map((cf) => `<option value="${cf}" ${selectedConfidenceFilter === cf ? "selected" : ""}>${escapeHtml(formatConfidence(cf))}</option>`).join("")}
        </select>
        <select id="lang-doc-select">
          <option value="">${escapeHtml(c.allDocLangs)}</option>
          ${availableDocLangs.map((dl) => `<option value="${dl}" ${selectedDocLangFilter === dl ? "selected" : ""}>${escapeHtml(formatDocLang(dl))}</option>`).join("")}
        </select>
        <select id="sort-select">
          <option value="newest" ${sortOrder === "newest" ? "selected" : ""}>${escapeHtml(c.sortNewest)}</option>
          <option value="oldest" ${sortOrder === "oldest" ? "selected" : ""}>${escapeHtml(c.sortOldest)}</option>
          <option value="score" ${sortOrder === "score" ? "selected" : ""}>${escapeHtml(c.sortScore)}</option>
        </select>
      </div>

      <div class="filters-secondary">
        <label class="check-pill">
          <input type="checkbox" id="fav-only" ${favoritesOnly ? "checked" : ""} />
          <span>${escapeHtml(c.savedOnly)} (${favorites.length})</span>
        </label>
        <label class="check-pill">
          <input type="checkbox" id="future-only" ${futureDatesOnly ? "checked" : ""} />
          <span>${escapeHtml(c.futureOnly)}</span>
        </label>
        <button type="button" class="link-btn" id="reset-filters">${escapeHtml(c.resetFilters)}</button>
        <button type="button" class="link-btn" id="export-json">${escapeHtml(c.exportJson)}</button>
      </div>

      <div id="results-grid" class="results-grid"></div>
    </section>
    ` : `
    <section class="section home-discovery">
      <div class="section-head">
        <div><span class="eyebrow">${lang === "ar" ? "آخر المستجدات" : "À LA UNE"}</span><h2>${lang === "ar" ? "مختارات من الرصد" : "Une sélection pour commencer"}</h2></div>
        <p>${lang === "ar" ? "اكتشف أحدث الموارد داخل فضاءات KITN." : "Quelques publications récentes, sans surcharger votre espace d'accueil."}</p>
      </div>
      <div class="home-featured-grid">
        ${visibleItems.slice(0, 3).map((item) => `
          <article class="home-featured-card">
            <span class="mini-label">${escapeHtml(formatDocType(item.type_document) || formatPole(item.pole) || (lang === "ar" ? "منشور" : "Publication"))}</span>
            <h3>${escapeHtml(item.titre_original || "")}</h3>
            <p>${escapeHtml(String(item.resume || "").slice(0, 180))}${String(item.resume || "").length > 180 ? "…" : ""}</p>
            <button type="button" class="link-btn" data-open-home-item="${escapeHtml(getItemKey(item))}">${lang === "ar" ? "قراءة التفاصيل" : "Lire la suite"}</button>
          </article>
        `).join("")}
      </div>
    </section>
    `}

    <footer class="footer">
      <span>${escapeHtml(c.footerCopy)}</span>
    </footer>
  `;
  document.body.classList.toggle("is-article-view", Boolean(activeArticleItem));

  document.getElementById("brand-home")?.addEventListener("click", (e) => {
    e.preventDefault();
    activeSpace = "all";
    activeArticleId = null;
    window.history.pushState({ kitnSpace: "all" }, "", SPACE_PATHS.all);
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.getElementById("back-portal-top")?.addEventListener("click", () => {
    activeSpace = "all";
    activeArticleId = null;
    window.history.pushState({ kitnSpace: "all" }, "", SPACE_PATHS.all);
    render();
  });

  document.getElementById("lang-toggle")?.addEventListener("click", () => {
    lang = lang === "fr" ? "ar" : "fr";
    render();
  });

  document.getElementById("menu-toggle")?.addEventListener("click", () => {
    mobileMenuOpen = !mobileMenuOpen;
    render();
    // render() rebuilds the header; return keyboard focus to the replacement button.
    document.getElementById("menu-toggle")?.focus();
  });

  

  document.querySelectorAll("[data-jump-space]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeSpace = btn.getAttribute("data-jump-space") || "all";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  document.querySelectorAll("[data-theme-idx]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedThemeIndex = Number(btn.getAttribute("data-theme-idx")) || 0;
      render();
    });
  });

  document.getElementById("filter-by-theme")?.addEventListener("click", () => {
    const th = THEMES[lang][selectedThemeIndex] || THEMES[lang][0];
    selectedPolesFilter = th.poles;
    activePoleLabel = th.title;
    renderResults();
    document.getElementById("research")?.scrollIntoView({ behavior: "smooth" });
  });

  document.querySelectorAll("[data-academy-idx]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedAcademyIndex = Number(btn.getAttribute("data-academy-idx")) || 0;
      selectedQuizQuestionIndex = 0;
      render();
    });
  });

  document.querySelectorAll("[data-quiz-question]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedQuizQuestionIndex = Number(btn.getAttribute("data-quiz-question")) || 0;
      render();
    });
  });

  document.querySelectorAll("[data-quiz-opt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const trackId = ACADEMY_TRACKS[lang][selectedAcademyIndex]?.id || "default";
      quizAnswers[`${trackId}:${selectedQuizQuestionIndex}`] = Number(btn.getAttribute("data-quiz-opt"));
      render();
    });
  });

  document.querySelectorAll("[data-principle-idx]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedPrincipleIndex = Number(btn.getAttribute("data-principle-idx")) || 0;
      render();
    });
  });

  document.querySelectorAll("[data-space-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mobileSubmenu = btn.getAttribute("data-mobile-submenu");
      if (mobileSubmenu && window.matchMedia("(max-width: 820px)").matches) {
        mobileOpenSubmenu = mobileOpenSubmenu === mobileSubmenu ? "" : mobileSubmenu;
        render();
        document.querySelectorAll("[data-mobile-submenu]").forEach((item) => {
          if (item.getAttribute("data-mobile-submenu") === mobileSubmenu) item.focus();
        });
        return;
      }
      activeSpace = btn.getAttribute("data-space-id") || "all";
      activeArticleId = null;
      if (btn.hasAttribute("data-stat-view-shortcut")) statisticsView = "regional";
      if (btn.hasAttribute("data-stat-category-shortcut")) statisticsCategory = btn.getAttribute("data-stat-category-shortcut");
      if (btn.hasAttribute("data-pole-shortcut")) {
        selectedSinglePoleFilter = btn.getAttribute("data-pole-shortcut");
        selectedPolesFilter = null;
        activePoleLabel = "";
      }
      window.history.pushState({ kitnSpace: activeSpace }, "", SPACE_PATHS[activeSpace] || "/");
      mobileMenuOpen = false;
      mobileOpenSubmenu = "";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
  document.querySelectorAll("[data-open-home-item]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-open-home-item");
      activeArticleId = key;
      activeSpace = "all";
      window.history.pushState({ kitnArticle: key }, "", "/publication/" + encodeURIComponent(key));
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
  document.querySelectorAll("[data-stat-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      statisticsView = btn.getAttribute("data-stat-view") === "regional" ? "regional" : "national";
      render();
    });
  });

  document.querySelector("[data-stat-search]")?.addEventListener("change", (event) => {
    statisticsSearch = event.target.value || "";
    render();
  });

  document.querySelectorAll("[data-stat-category]").forEach((btn) => {
    btn.addEventListener("click", () => {
      statisticsCategory = btn.getAttribute("data-stat-category") || "all";
      render();
    });
  });

  document.querySelectorAll("[data-stat-range]").forEach((btn) => {
    btn.addEventListener("click", () => {
      statisticsRange = btn.getAttribute("data-stat-range") || "all";
      render();
    });
  });

  document.querySelector("[data-regional-indicator]")?.addEventListener("change", (event) => {
    regionalIndicatorCode = event.target.value || "";
    render();
  });
  document.querySelectorAll("[data-regional-scope]").forEach((btn) => {
    btn.addEventListener("click", () => {
      regionalResidenceScope = btn.getAttribute("data-regional-scope") || "all";
      render();
    });
  });

  document.getElementById("manual-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const titleVal = (document.getElementById("m-title")?.value || "").trim();
    if (!titleVal) return;
    const typeVal = document.getElementById("m-type")?.value || "article";
    const spaceVal = document.getElementById("m-space")?.value || "veille";
    const poleVal = document.getElementById("m-pole")?.value || "institutions_gouvernance";
    const dateVal = document.getElementById("m-date")?.value || REFERENCE_DATE;
    const venueVal = (document.getElementById("m-venue")?.value || "").trim();
    const keywordsVal = (document.getElementById("m-keywords")?.value || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const urlVal = (document.getElementById("m-url")?.value || "").trim();
    const pdfVal = (document.getElementById("m-pdf")?.value || "").trim();
    const resumeVal = (document.getElementById("m-resume")?.value || "").trim();
    const analysisVal = (document.getElementById("m-analysis")?.value || "").trim();
    const nowIso = new Date().toISOString();

    const newEntry = {
      id: `kitn_manual_${Date.now()}`,
      titre_original: titleVal,
      auteurs: [lang === "ar" ? "إضافة يدوية" : "Contribution manuelle"],
      revue_ou_institution: venueVal || (lang === "ar" ? "إضافة يدوية KITN" : "Contribution manuelle KITN"),
      mots_cles: keywordsVal,
      date_publication: dateVal,
      collecte_le: nowIso,
      mis_a_jour_le: nowIso,
      date_statut: "date_confirmee",
      date_anomalie: false,
      statut_validation: "valide",
      langue_originale: lang,
      source_id: "manual_studio",
      source_nom: lang === "ar" ? "إضافة يدوية KITN" : "Contribution manuelle KITN",
      type_document: typeVal,
      espace: spaceVal,
      pole: poleVal,
      poles_secondaires: [],
      confiance_classification: "eleve",
      score_pertinence: 90,
      url_publication: isSafeHttpUrl(urlVal) ? urlVal : null,
      doi: null,
      pdf_direct: isSafeHttpUrl(pdfVal) ? pdfVal : null,
      texte_integral_disponible: Boolean(isSafeHttpUrl(pdfVal)),
      resume: resumeVal,
      analyse_strategique: analysisVal,
      origine: "manuel"
    };

    manualItems = [newEntry, ...manualItems];
    saveJsonStorage(MANUAL_ITEMS_KEY, manualItems);
    rebuildCombinedIndex();
    render();
    const statusEl = document.getElementById("manual-status");
    if (statusEl) statusEl.textContent = c.manualAddedMsg;
  });

  document.getElementById("manual-export")?.addEventListener("click", () => {
    exportJsonPayload(manualItems, "manual_contributions.json");
  });

  document.getElementById("manual-import-file")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    const statusEl = document.getElementById("manual-status");
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const incoming = Array.isArray(parsed)
        ? parsed
        : (Array.isArray(parsed?.items) ? parsed.items : null);
      if (!incoming) {
        if (statusEl) statusEl.textContent = c.manualInvalidJsonMsg;
        return;
      }
      const normalized = incoming
        .filter((x) => x && typeof x === "object" && (x.titre_original || x.title))
        .map((x, idx) => ({
          ...x,
          id: x.id || `kitn_manual_imp_${Date.now()}_${idx}`,
          titre_original: x.titre_original || x.title,
          origine: "manuel"
        }));
      manualItems = [...normalized, ...manualItems];
      saveJsonStorage(MANUAL_ITEMS_KEY, manualItems);
      rebuildCombinedIndex();
      render();
      const afterStatus = document.getElementById("manual-status");
      if (afterStatus) afterStatus.textContent = c.manualImportedMsg;
    } catch {
      if (statusEl) statusEl.textContent = c.manualInvalidJsonMsg;
    }
  });

  document.getElementById("manual-clear")?.addEventListener("click", () => {
    manualItems = [];
    saveJsonStorage(MANUAL_ITEMS_KEY, manualItems);
    rebuildCombinedIndex();
    render();
  });

  document.getElementById("search-input")?.addEventListener("input", (e) => {
    searchQuery = e.target.value || "";
    renderResults();
  });

  document.getElementById("science-author-input")?.addEventListener("input", (e) => {
    scienceAuthorFilter = e.target.value || "";
    renderResults();
  });

  document.getElementById("science-discipline-input")?.addEventListener("input", (e) => {
    scienceDisciplineFilter = e.target.value || "";
    renderResults();
  });

  document.getElementById("science-year-select")?.addEventListener("change", (e) => {
    scienceYearFilter = e.target.value || "";
    renderResults();
  });

  document.getElementById("date-from-input")?.addEventListener("change", (e) => {
    dateFromFilter = e.target.value || "";
    renderResults();
  });

  document.getElementById("date-to-input")?.addEventListener("change", (e) => {
    dateToFilter = e.target.value || "";
    renderResults();
  });

  document.getElementById("pole-select")?.addEventListener("change", (e) => {
    selectedSinglePoleFilter = e.target.value || "";
    selectedPolesFilter = null;
    activePoleLabel = "";
    renderResults();
  });

  document.getElementById("type-select")?.addEventListener("change", (e) => {
    selectedTypeFilter = e.target.value || "";
    renderResults();
  });

  document.getElementById("conf-select")?.addEventListener("change", (e) => {
    selectedConfidenceFilter = e.target.value || "";
    renderResults();
  });

  document.getElementById("lang-doc-select")?.addEventListener("change", (e) => {
    selectedDocLangFilter = e.target.value || "";
    renderResults();
  });

  document.getElementById("sort-select")?.addEventListener("change", (e) => {
    sortOrder = e.target.value || "newest";
    renderResults();
  });

  document.getElementById("fav-only")?.addEventListener("change", (e) => {
    favoritesOnly = Boolean(e.target.checked);
    renderResults();
  });

  document.getElementById("future-only")?.addEventListener("change", (e) => {
    futureDatesOnly = Boolean(e.target.checked);
    renderResults();
  });

  document.getElementById("reset-filters")?.addEventListener("click", resetAllFilters);
  document.getElementById("export-json")?.addEventListener("click", () => {
    exportJsonPayload(getFilteredItems(), "kitn-export.json");
  });

  renderResults();
  renderModal();
}

async function initAcademy() {
  try {
    const res = await fetch("/data/academy/academy.json", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    if (data?.tracks && typeof data.tracks === "object") {
      if (Array.isArray(data.tracks.fr) && data.tracks.fr.length) {
        ACADEMY_TRACKS.fr = data.tracks.fr;
      }
      if (Array.isArray(data.tracks.ar) && data.tracks.ar.length) {
        ACADEMY_TRACKS.ar = data.tracks.ar;
      }
      render();
    }
  } catch {
    // Fallback sur les pistes intégrées par défaut
  }
}


async function initStatistics() {
  try {
    const res = await fetch("/data/statistics.json", { cache: "no-store" });
    if (res.ok) statisticsData = await res.json();
  } catch {
    statisticsData = null;
  }
  render();
}

async function initRegionalStatistics() {
  try {
    const res = await fetch("/data/regional-statistics.json", { cache: "no-store" });
    if (res.ok) regionalStatisticsData = await res.json();
  } catch {
    regionalStatisticsData = null;
  }
  render();
}

async function initSourceHealth() {
  try {
    const res = await fetch("/data/sources-health.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Source health report unavailable");
    const data = await res.json();
    sourceHealthData = data && Array.isArray(data.sources) ? data : null;
  } catch {
    sourceHealthData = null;
  }
  if (activeSpace === "veille") render();
}

async function initIndex() {
  try {
    const res = await fetch("/data/index/search-index.json", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      remoteItems = Array.isArray(data?.items) ? data.items : [];
    }
  } catch {
    remoteItems = [];
  }
  rebuildCombinedIndex();
  // Refresh the full portal after remote data arrives so its summary counters
  // are computed from the loaded index, not the initial empty state.
  render();
}

const SPACE_PATHS = {
  all: "/",
  chiffres: "/maroc-en-chiffres",
  veille: "/veille",
  science: "/etudes-recherche",
  bibliotheque: "/bibliotheque",
  academy: "/academy"
};
function getArticleIdFromLocation() {
  const prefix = "/publication/";
  const pathname = window.location.pathname;
  if (!pathname.startsWith(prefix)) return null;
  try { return decodeURIComponent(pathname.slice(prefix.length)) || null; }
  catch { return null; }
}

function getSpaceFromLocation() {
  const currentPath = window.location.pathname;
  const pathname = currentPath.length > 1 && currentPath.endsWith("/")
    ? currentPath.slice(0, -1)
    : currentPath;
  const match = Object.entries(SPACE_PATHS).find(([, path]) => path === pathname);
  if (match) return match[0];
  const legacyHash = window.location.hash.startsWith("#/")
    ? window.location.hash.slice(2)
    : "";
  return ["all", "veille", "science", "chiffres", "academy", "bibliotheque"].includes(legacyHash)
    ? legacyHash
    : "all";
}
activeSpace = getSpaceFromLocation();
activeArticleId = getArticleIdFromLocation();
window.addEventListener("popstate", () => {
  activeSpace = getSpaceFromLocation();
  activeArticleId = getArticleIdFromLocation();
  render();
});
render();
initSourceHealth();
initAcademy();
initIndex();
initStatistics();
initRegionalStatistics();
