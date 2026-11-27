import "./style.css";
import { filterStatisticsHistory, getStatisticsCategory } from "./statistics.js";
import { buildRegionalStatisticsModel } from "./regional-statistics.js";

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
    { id: "all", label: "Portail & Vue globale" },
    { id: "veille", label: "Actualité & veille" },
    { id: "science", label: "Articles scientifiques" },
    { id: "chiffres", label: "Maroc en chiffres" },
    { id: "academy", label: "Concours & Academy" },
    { id: "bibliotheque", label: "Bibliothèque" }
  ],
  ar: [
    { id: "all", label: "البوابة والنظرة العامة" },
    { id: "veille", label: "الأخبار والرصد" },
    { id: "science", label: "المقالات العلمية" },
    { id: "chiffres", label: "المغرب بالأرقام" },
    { id: "academy", label: "المباريات والأكاديمية" },
    { id: "bibliotheque", label: "المكتبة الوثائقية" }
  ]
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
let selectedQuizOption = null;
let selectedQuizQuestionIndex = 0;
let searchQuery = "";
let scienceAuthorFilter = "";
let scienceDisciplineFilter = "";
let scienceYearFilter = "";
let futureDatesOnly = false;
let favoritesOnly = false;
let favorites = loadJsonStorage(FAVORITES_KEY, []);
let manualItems = loadJsonStorage(MANUAL_ITEMS_KEY, []);
let statusOverrides = {};
let activeModalItem = null;
let remoteItems = [];
let indexItems = [];
let statisticsData = null;
let regionalStatisticsData = null;
let regionalIndicatorCode = "HCP_EMO_REGIONAL_STRICT_UNEMPLOYMENT";
let regionalResidenceScope = "all";
let statisticsCategory = "all";
let statisticsRange = "all";

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
  const q = searchQuery.trim().toLowerCase();
  const authorQuery = scienceAuthorFilter.trim().toLowerCase();
  const disciplineQuery = scienceDisciplineFilter.trim().toLowerCase();
  const list = indexItems.filter((item) => {
    if (!matchesSpace(item, activeSpace)) return false;
    if (activeSpace === "science") {
      const authorsForFilter = Array.isArray(item.auteurs) ? item.auteurs.join(" ").toLowerCase() : "";
      const disciplineText = [
        ...(Array.isArray(item.mots_cles) ? item.mots_cles : []),
        item.pole || "",
        item.revue_ou_institution || "",
        item.titre_original || "",
        item.resume || ""
      ].join(" ").toLowerCase();
      if (authorQuery && !authorsForFilter.includes(authorQuery)) return false;
      if (disciplineQuery && !disciplineText.includes(disciplineQuery)) return false;
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

    const title = (item.titre_original || "").toLowerCase();
    const authors = Array.isArray(item.auteurs) ? item.auteurs.join(" ").toLowerCase() : "";
    const venue = (item.revue_ou_institution || item.source_nom || "").toLowerCase();
    const keywords = Array.isArray(item.mots_cles) ? item.mots_cles.join(" ").toLowerCase() : "";
    const pole = (item.pole || "").toLowerCase();
    const poleLabel = formatPole(item.pole).toLowerCase();
    const docType = (item.type_document || "").toLowerCase();
    const docTypeLabel = formatDocType(item.type_document).toLowerCase();
    const resume = (item.resume || "").toLowerCase();
    const analysis = (item.analyse_strategique || "").toLowerCase();
    const doi = (item.doi || "").toLowerCase();

    return (
      title.includes(q) ||
      authors.includes(q) ||
      venue.includes(q) ||
      doi.includes(q) ||
      keywords.includes(q) ||
      pole.includes(q) ||
      poleLabel.includes(q) ||
      docType.includes(q) ||
      docTypeLabel.includes(q) ||
      resume.includes(q) ||
      analysis.includes(q)
    );
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
  const heading = isAr ? "المؤشرات الاقتصادية والاجتماعية للمغرب" : "Indicateurs économiques et sociaux du Maroc";
  const intro = isAr
    ? "سلاسل تاريخية موثقة، مع سنة القياس والوحدة والمصدر."
    : "Séries historiques documentées, avec année de référence, unité et source.";
  const empty = isAr ? "ستظهر البيانات الإحصائية بعد عملية الجمع القادمة." : "Les données statistiques seront disponibles après la prochaine collecte.";
  const filteredIndicators = allIndicators.filter((indicator) =>
    statisticsCategory === "all" || getStatisticsCategory(indicator) === statisticsCategory
  );
  const categoryControls = [
    { id: "all", label: isAr ? "جميع المؤشرات" : "Tous les indicateurs" },
    { id: "economie_finances_publiques", label: categoryLabels.economie_finances_publiques },
    { id: "societe_developpement_humain", label: categoryLabels.societe_developpement_humain }
  ];
  const rangeControls = [
    { id: "5", label: isAr ? "5 سنوات" : "5 ans" },
    { id: "10", label: isAr ? "10 سنوات" : "10 ans" },
    { id: "all", label: isAr ? "كامل السلسلة" : "Toute la série" }
  ];
  const controls = `
    <div class="stats-controls">
      <div class="stats-filter-group" role="group" aria-label="${isAr ? "تصنيف المؤشرات" : "Filtrer les indicateurs"}">
        ${categoryControls.map((item) => `<button type="button" class="stats-filter-btn ${statisticsCategory === item.id ? "is-active" : ""}" data-stat-category="${item.id}" aria-pressed="${statisticsCategory === item.id}">${escapeHtml(item.label)}</button>`).join("")}
      </div>
      <div class="stats-filter-group stats-range-group" role="group" aria-label="${isAr ? "الفترة الزمنية" : "Période historique"}">
        ${rangeControls.map((item) => `<button type="button" class="stats-filter-btn ${statisticsRange === item.id ? "is-active" : ""}" data-stat-range="${item.id}" aria-pressed="${statisticsRange === item.id}">${escapeHtml(item.label)}</button>`).join("")}
      </div>
    </div>`;
  if (!allIndicators.length) {
    return `<section class="stats-dashboard"><div class="stats-heading"><div><span class="mini-label">${isAr ? "بيانات رسمية" : "DONNÉES OFFICIELLES"}</span><h3>${heading}</h3><p>${intro}</p></div></div><p class="empty-results">${empty}</p></section>${renderRegionalStatisticsDashboard()}`;
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
    const label = isAr ? (indicator.label_ar || indicator.label_fr) : indicator.label_fr;
    const description = isAr ? (indicator.description_ar || indicator.description_fr) : indicator.description_fr;
    const methodologyNote = isAr
      ? (indicator.methodology_note_ar || indicator.methodology_note_fr)
      : indicator.methodology_note_fr;
    const unit = isAr ? (indicator.unit_ar || indicator.unit_fr) : indicator.unit_fr;
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
    <section class="stats-dashboard">
      <div class="stats-heading"><div><span class="mini-label">${isAr ? "بيانات رسمية" : "DONNÉES OFFICIELLES"}</span><h3>${heading}</h3><p>${intro}</p></div><span class="stats-updated">${isAr ? "تاريخ إنشاء ملف البيانات" : "Fichier statistique généré le"} : ${escapeHtml(updateDate)}</span></div>
      ${controls}
      <div class="stats-grid">${cards || `<p class="empty-results">${emptyFiltered}</p>`}</div>
      <p class="stats-source-note">${isAr ? "تاريخ إنشاء الملف لا يعني بالضرورة أن كل مؤشر قد حُيّن. الفترات المعروضة هي الفترات الفعلية للقيم المتاحة." : "La date de génération du fichier ne correspond pas nécessairement à la date de la dernière observation. Les périodes affichées correspondent aux valeurs réellement disponibles."}</p>
    </section>
    ${renderRegionalStatisticsDashboard()}`;
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
    ? "بيانات بحث القوى العاملة حسب المؤشر والمجال الحضري أو القروي."
    : "Données de l’Enquête sur la main-d’œuvre, par indicateur et milieu de résidence.";
  if (!model.available) {
    return `<section class="regional-stats-dashboard">
      <div class="stats-heading"><div><span class="mini-label">${isAr ? "بيانات جهوية" : "DONNÉES TERRITORIALES"}</span><h3>${title}</h3><p>${intro}</p></div></div>
      <p class="regional-empty">${isAr
        ? "ستظهر المقارنات الجهوية بعد إدراج بيانات HCP الإقليمية في ملف البيانات المنشور."
        : "Les comparaisons régionales apparaîtront après l’intégration des séries HCP dans le prochain fichier de données publié."}</p>
    </section>`;
  }

  regionalIndicatorCode = model.activeIndicatorCode;
  regionalResidenceScope = model.activeScope;
  const indicatorLabel = model.selectedIndicator
    ? (isAr ? model.selectedIndicator.labelAr : model.selectedIndicator.labelFr)
    : "";
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
    <div class="regional-table-wrap"><table class="regional-table">
      <thead><tr><th scope="col">${isAr ? "الجهة" : "Région"}</th>${model.periods.map((period) => `<th scope="col">${escapeHtml(period)}${regionalUnit ? ` (${escapeHtml(regionalUnit)})` : ""}</th>`).join("")}</tr></thead>
      <tbody>${rows || `<tr><td colspan="${model.periods.length + 1}">${isAr ? "لا توجد بيانات متاحة." : "Aucune observation disponible."}</td></tr>`}</tbody>
    </table></div>
    <p class="regional-legend">${isAr
      ? "ms: دلالة إحصائية متوسطة · ps: غير دال إحصائياً بما يكفي · .: غير متاح."
      : "ms : significativité moyenne · ps : résultat insuffisamment significatif · . : valeur non disponible."}</p>
    <p class="regional-methodology-note">${escapeHtml(methodologyText)}</p>
    <div class="stat-card-foot"><span>${escapeHtml(isAr ? model.sourceNameAr : model.sourceName)} · ${model.rows.length} ${isAr ? "جهة ومجموع وطني" : "lignes géographiques"}</span>${sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">${isAr ? "المصدر الأصلي" : "Document HCP original"} ↗</a>` : ""}</div>
  </section>`;
}

function renderLibraryDirectory() {
  const isAr = lang === "ar";
  const items = [
    {name:"Cour des comptes",desc:isAr ? "تقارير الرقابة وتقييم السياسات العمومية والمالية." : "Rapports de contrôle, audits et évaluations des politiques publiques.",url:"https://www.courdescomptes.ma/publications/",id:"cour_des_comptes_maroc"},
    {name:"CESE",desc:isAr ? "آراء ودراسات وتقارير اقتصادية واجتماعية وبيئية." : "Avis, études et rapports économiques, sociaux et environnementaux.",url:"https://www.cese.ma/",id:"cese_maroc"},
    {name:"IRES",desc:isAr ? "دراسات استراتيجية وتقارير موضوعاتية واستشرافية." : "Études stratégiques, rapports thématiques et prospectifs.",url:"https://www.ires.ma/fr/publications",id:"ires_maroc"},
    {name:"HCP",desc:isAr ? "دراسات وتقارير ومنشورات إحصائية رسمية." : "Études, rapports et publications statistiques officielles.",url:"https://www.hcp.ma/",id:"hcp_maroc"},
    {name:isAr ? "البنك الدولي" : "Banque mondiale",desc:isAr ? "تقارير قطرية وبيانات اقتصادية واجتماعية." : "Rapports pays, données économiques et sociales.",url:"https://data.worldbank.org/country/morocco",id:"world_bank_maroc"}
  ];
  const title = isAr ? "مؤسسات ومصادر وثائقية" : "Institutions & fonds documentaires";
  const subtitle = isAr ? "بوابات رسمية للوصول إلى التقارير والدراسات الأصلية." : "Accès direct aux portails institutionnels et aux documents originaux.";
  const countFor = (id) => indexItems.filter((item) => item.source_id === id && !isFutureDate(item)).length;
  return `
    <section class="library-directory">
      <div class="stats-heading"><div><span class="mini-label">${isAr ? "مراجع موثوقة" : "SOURCES DE RÉFÉRENCE"}</span><h3>${title}</h3><p>${subtitle}</p></div></div>
      <div class="library-source-grid">${items.map((item) => `
        <article class="library-source-card"><div class="library-source-meta"><span>${escapeHtml(item.name)}</span><span>${countFor(item.id)} ${isAr ? "مفهرس" : "indexé(s)"}</span></div><p>${escapeHtml(item.desc)}</p><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${isAr ? "فتح المصدر الرسمي" : "Ouvrir le portail officiel"} ↗</a></article>
      `).join("")}</div>
    </section>`;
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

  const filtered = getFilteredItems();
  const suffix = lang === "ar" ? " مادة" : filtered.length > 1 ? " notices" : " notice";
  countBadge.textContent = `${filtered.length}${suffix}`;

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

  if (!filtered.length) {
    container.innerHTML = `<p class="empty-results">${escapeHtml(COPY[lang].noResults)}</p>`;
    return;
  }

  container.innerHTML = filtered
    .map((item, idx) => {
      const isSaved = favorites.includes(getItemKey(item));
      const st = getEffectiveStatus(item);
      const authorsText = Array.isArray(item.auteurs) && item.auteurs.length
        ? item.auteurs.join(", ")
        : (lang === "ar" ? "مؤلف غير مذكور" : "Auteur non renseigné");
      const venueText = item.revue_ou_institution || item.source_nom || "";
      const metaLeft = escapeHtml(item.date_publication || "");
      const metaRight = escapeHtml(formatDocType(item.type_document) || formatPole(item.pole) || "");
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

  container.querySelectorAll("[data-open-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-open-index"));
      activeModalItem = filtered[i] || null;
      renderModal();
    });
  });

  container.querySelectorAll("[data-fav-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-fav-index"));
      if (filtered[i]) toggleFavorite(filtered[i]);
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
  const activeSpaceObj = spaces.find((s) => s.id === activeSpace) || spaces[0];
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
      <nav class="nav ${mobileMenuOpen ? "is-open" : ""}" id="main-nav">
        <a href="#themes">${c.navThemes}</a>
        <a href="#academy">${c.navAcademy}</a>
        <a href="#method">${c.navMethod}</a>
        <a href="#research">${c.navResearch}</a>
      </nav>
      <div class="topbar-actions">
        ${isDedicatedSpace ? `<button type="button" class="lang" id="back-portal-top">${escapeHtml(c.backPortalBtn)}</button>` : ""}
        <button type="button" class="menu-toggle" id="menu-toggle" aria-expanded="${mobileMenuOpen}">${c.menuBtn}</button>
        <button type="button" class="lang" id="lang-toggle">${c.langBtn}</button>
      </div>
    </header>

    ${!isDedicatedSpace ? `
      <section class="hero">
        <div class="hero-orb orb-one"></div>
        <div>
          <span class="eyebrow"><span class="eyebrow-dot"></span>${c.eyebrow}</span>
          <h1>${c.heroTitle}</h1>
          <p class="hero-intro">${c.heroIntro}</p>
          <div class="hero-actions">
            <a href="#research" class="btn primary">${c.heroPrimary}</a>
            <a href="#method" class="text-link">${c.heroSecondary}</a>
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

    ${(!isDedicatedSpace || activeSpace === "academy") ? `
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
          </div>
          <div>
            <span class="mini-label">${escapeHtml(c.academyQuizLabel)}</span>
            <div class="quiz-question-nav" aria-label="${lang === "ar" ? "اختيار السؤال" : "Choisir une question"}">
              ${quizQuestions.map((question, qIdx) => `
                <button type="button" class="quiz-step ${qIdx === selectedQuizQuestionIndex ? "is-active" : ""}" data-quiz-question="${qIdx}" aria-label="${lang === "ar" ? "السؤال" : "Question"} ${qIdx + 1}">${qIdx + 1}</button>
              `).join("")}
            </div>
            <p class="quiz-progress">${lang === "ar" ? "السؤال" : "Question"} ${Math.min(selectedQuizQuestionIndex + 1, quizQuestions.length)} / ${quizQuestions.length}</p>
            <p class="quiz-question">${escapeHtml(activeQuizQuestion.question)}</p>
            <div class="quiz-options">
              ${activeQuizQuestion.options.map((opt, oIdx) => `
                <button type="button" class="quiz-opt ${selectedQuizOption === oIdx ? "is-selected" : ""}" data-quiz-opt="${oIdx}">${escapeHtml(opt)}</button>
              `).join("")}
            </div>
            ${selectedQuizOption !== null ? `
              <p class="quiz-feedback ${isCorrect ? "is-ok" : "is-ko"}">
                ${escapeHtml(activeQuizQuestion.correction)}
              </p>
            ` : ""}
          </div>
        </div>
      </section>
    ` : ""}

    ${!isDedicatedSpace ? `
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

    <section class="section" id="research">
      <div class="section-head">
        <div>
          <span class="eyebrow">${escapeHtml(isDedicatedSpace ? activeSpaceObj.label : c.researchEyebrow)}</span>
          <h2>${escapeHtml(isDedicatedSpace ? activeSpaceObj.label : c.researchTitle)}</h2>
        </div>
        <span class="count-badge" id="index-count">0</span>
      </div>

      ${activeSpace === "chiffres" ? renderStatisticsDashboard() : ""}
      ${activeSpace === "bibliotheque" ? renderLibraryDirectory() : ""}

      <div class="spaces-bar" role="tablist">
        ${spaces.map((sp) => `
          <button type="button" class="space-tab ${activeSpace === sp.id ? "is-active" : ""}" data-space-id="${sp.id}">${escapeHtml(sp.label)}</button>
        `).join("")}
      </div>

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

    <footer class="footer">
      <span>${escapeHtml(c.footerCopy)}</span>
    </footer>
  `;

  document.getElementById("brand-home")?.addEventListener("click", (e) => {
    e.preventDefault();
    activeSpace = "all";
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.getElementById("back-portal-top")?.addEventListener("click", () => {
    activeSpace = "all";
    render();
  });

  document.getElementById("lang-toggle")?.addEventListener("click", () => {
    lang = lang === "fr" ? "ar" : "fr";
    render();
  });

  document.getElementById("menu-toggle")?.addEventListener("click", () => {
    mobileMenuOpen = !mobileMenuOpen;
    render();
  });

  document.querySelectorAll("#main-nav a").forEach((a) => {
    a.addEventListener("click", () => {
      mobileMenuOpen = false;
      if (activeSpace !== "all") activeSpace = "all";
      render();
    });
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
      selectedQuizOption = null;
      render();
    });
  });

  document.querySelectorAll("[data-quiz-question]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedQuizQuestionIndex = Number(btn.getAttribute("data-quiz-question")) || 0;
      selectedQuizOption = null;
      render();
    });
  });

  document.querySelectorAll("[data-quiz-opt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedQuizOption = Number(btn.getAttribute("data-quiz-opt"));
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
      activeSpace = btn.getAttribute("data-space-id") || "all";
      render();
    });
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

render();
initAcademy();
initIndex();
initStatistics();
initRegionalStatistics();
