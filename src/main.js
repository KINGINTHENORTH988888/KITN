import "./style.css";

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
    { id: "all", label: "Tous les espaces" },
    { id: "veille", label: "Actualité & veille" },
    { id: "science", label: "Articles scientifiques" },
    { id: "chiffres", label: "Maroc en chiffres" },
    { id: "academy", label: "Concours & Academy" },
    { id: "bibliotheque", label: "Bibliothèque" },
    { id: "contribuer", label: "Contribution manuelle" }
  ],
  ar: [
    { id: "all", label: "كل الفضاءات" },
    { id: "veille", label: "الأخبار والرصد" },
    { id: "science", label: "المقالات العلمية" },
    { id: "chiffres", label: "المغرب بالأرقام" },
    { id: "academy", label: "المباريات والأكاديمية" },
    { id: "bibliotheque", label: "المكتبة الوثائقية" },
    { id: "contribuer", label: "إضافة يدوية" }
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
      title: "Concours DGSN — Sécurité & ordre public",
      sheet: "Police de proximité, coopération sécuritaire, digitalisation des services et protection des droits.",
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
      title: "IRAT — Administration territoriale & gouvernance",
      sheet: "Déconcentration administrative, régionalisation avancée, coordination locale et politiques publiques.",
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
      title: "Concours administratifs — Finances & réformes",
      sheet: "Budgétisation axée sur la performance, protection sociale, transition numérique et service public.",
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
      title: "مباريات الأمن الوطني — الأمن والنظام العام",
      sheet: "شرطة القرب، التعاون الأمني، رقمنة الخدمات وحماية الحقوق.",
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
      title: "الإدارة الترابية والحكامة",
      sheet: "اللاتمركز الإداري، الجهوية المتقدمة، التنسيق المحلي والسياسات العمومية.",
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
      title: "المباريات الإدارية — المالية والإصلاحات",
      sheet: "الميزانية المبنية على النجاعة، الحماية الاجتماعية، التحول الرقمي والمرفق العام.",
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
    concours: "Concours / Ressource"
  },
  ar: {
    publication_scientifique: "منشور علمي",
    statistique: "إحصائية / مجموعة بيانات",
    rapport: "تقرير",
    rapport_institutionnel: "تقرير مؤسساتي",
    document_juridique: "وثيقة قانونية",
    article: "مقال",
    article_presse: "مقال صحفي",
    concours: "مباراة / مورد"
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
    { num: "02", title: "Structurer plutôt qu'empiler", text: "Classer chaque notice par pôle, type de document et date pour retrouver l'essentiel vite." },
    { num: "03", title: "Relier l'analyse au terrain", text: "Lire les transformations du Maroc à travers leurs effets concrets sur l'économie et la société." }
  ],
  ar: [
    { num: "01", title: "التحقق قبل الاستنتاج", text: "مقاطعة المصادر الأكاديمية والمؤسساتية والإحصائية قبل اعتماد أي معطى." },
    { num: "02", title: "الهيكلة بدل التكديس", text: "تصنيف كل مادة حسب القطب ونوع الوثيقة والتاريخ للوصول السريع إلى الجوهر." },
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
    eyebrow: "Centre de veille & de connaissances · De l'information à la maîtrise",
    heroTitle: "Comprendre le Maroc. <span>Anticiper</span> ses transformations.",
    heroIntro: "Une plateforme indépendante pour suivre les évolutions du Maroc, explorer les travaux de recherche, consulter les chiffres clés et préparer les concours.",
    heroPrimary: "Explorer les espaces ↗",
    heroSecondary: "Découvrir KITN →",
    heroNote: "UNE LECTURE STRUCTURÉE DU MAROC",
    card1Top: "01 / MAROC",
    card1Map: "MA",
    card2Top: "KNOWLEDGE / 2026",
    card2Cap: "<strong>Information</strong> → Connaissance",
    chip: "✦ De l'information à la maîtrise",
    themesEyebrow: "Les grands enjeux",
    themesTitle: "Explorer par thématique",
    themesSub: "Des sujets essentiels, organisés pour aller au-delà de l'actualité et comprendre les dynamiques de fond.",
    openPole: "Filtrer les notices de ce pôle →",
    activePoleBanner: "Filtre actif sur le pôle :",
    allPoles: "Tous les pôles",
    allPolesSelect: "Tous les pôles (6)",
    academyEyebrow: "KITN Academy",
    academyTitle: "Apprendre avec méthode, pas dans la précipitation.",
    academyText: "Des repères clairs, des synthèses structurées et des QCM pour approfondir les grands dossiers et préparer les concours.",
    academyBtn: "Ouvrir l'espace Concours & Academy →",
    academySheetLabel: "Fiche de révision",
    academyQuizLabel: "QCM d'entraînement",
    academyPageTop: "KITN",
    academyPageTitle: "Academy",
    academyPageSub: "Méthode & repères",
    methodEyebrow: "Notre approche",
    methodTitle: "La connaissance commence par une bonne question.",
    methodText: "KITN privilégie la clarté, la vérification et la mise en perspective plutôt que le bruit informationnel.",
    researchEyebrow: "Espaces dédiés & Index documentaire",
    researchTitle: "Navigation par espace & notices",
    searchPlaceholder: "Rechercher par titre, auteur, pôle, type ou résumé...",
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
    noAbstract: "Résumé non fourni par la source.",
    detailsBtn: "Fiche détaillée",
    noResults: "Aucune notice ne correspond à votre recherche ou à cet espace.",
    sourceLink: "Consulter la source ↗",
    pdfLink: "PDF ↗",
    closeBtn: "Fermer",
    labelAuthor: "Auteurs",
    labelDate: "Date de publication",
    labelPole: "Pôle",
    labelStatus: "Statut éditorial",
    labelType: "Type de document",
    labelDocLang: "Langue",
    labelConfidence: "Fiabilité",
    labelScore: "Score",
    labelDoi: "DOI",
    labelAbstract: "Résumé",
    statusValid: "Vérifié",
    statusReview: "À vérifier",
    manualTitle: "Studio de contribution manuelle (local)",
    manualSub: "Ajoutez manuellement une actualité, un article, une statistique, un concours ou un document de référence. Exportez ensuite le JSON pour l'intégrer au dépôt.",
    manualLabelTitle: "Titre *",
    manualLabelType: "Type",
    manualLabelPole: "Pôle principal",
    manualLabelDate: "Date (YYYY-MM-DD)",
    manualLabelUrl: "Lien source (URL)",
    manualLabelResume: "Résumé / Note",
    manualAddBtn: "Ajouter à la base locale",
    manualExportBtn: "Exporter contributions JSON",
    manualClearBtn: "Vider contributions locales",
    manualAddedMsg: "Notice ajoutée localement et visible dans l'index.",
    footerCopy: "© 2026 KITN — De l'information à la maîtrise."
  },
  ar: {
    langBtn: "Français",
    menuBtn: "القائمة",
    navThemes: "المحاور",
    navAcademy: "أكاديمية KITN",
    navMethod: "المنهجية",
    navResearch: "الفضاءات والفهرس",
    eyebrow: "مركز الرصد والمعرفة · من المعلومة إلى التمكن",
    heroTitle: "فهم المغرب. <span>واستشراف</span> تحولاته.",
    heroIntro: "منصة مستقلة لمتابعة تطورات المغرب واستكشاف الأبحاث والاطلاع على الأرقام والمباريات.",
    heroPrimary: "استكشاف الفضاءات ↗",
    heroSecondary: "اكتشف KITN ←",
    heroNote: "قراءة مهيكلة للمغرب",
    card1Top: "01 / المغرب",
    card1Map: "MA",
    card2Top: "المعرفة / 2026",
    card2Cap: "<strong>المعلومة</strong> ← المعرفة",
    chip: "✦ من المعلومة إلى التمكن",
    themesEyebrow: "القضايا الكبرى",
    themesTitle: "الاستكشاف حسب المحور",
    themesSub: "مواضيع أساسية منظمة لتجاوز الأخبار اليومية وفهم الديناميات العميقة.",
    openPole: "تصفية المواد حسب هذا القطب ←",
    activePoleBanner: "تصفية نشطة حسب القطب:",
    allPoles: "كل الأقطاب",
    allPolesSelect: "كل الأقطاب (6)",
    academyEyebrow: "أكاديمية KITN",
    academyTitle: "التعلم بمنهجية، لا بتسرع.",
    academyText: "معالم واضحة وملخصات مهيكلة واختبارات لتعميق الملفات الكبرى والاستعداد للمباريات.",
    academyBtn: "فتح فضاء المباريات والأكاديمية ←",
    academySheetLabel: "بطاقة مراجعة",
    academyQuizLabel: "اختبار تفاعلي",
    academyPageTop: "KITN",
    academyPageTitle: "Academy",
    academyPageSub: "المنهجية والمعالم",
    methodEyebrow: "مقاربتنا",
    methodTitle: "المعرفة تبدأ بسؤال جيد.",
    methodText: "تُقدّم KITN الوضوح والتحقق والربط السياقي بدل ضجيج المعلومات.",
    researchEyebrow: "الفضاءات المتخصصة والفهرس الوثائقي",
    researchTitle: "التنقل حسب الفضاء والمواد",
    searchPlaceholder: "ابحث بالعنوان أو المؤلف أو القطب أو نوع الوثيقة...",
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
    noAbstract: "الملخص غير متوفر في المصدر.",
    detailsBtn: "بطاقة تفصيلية",
    noResults: "لا توجد مواد مطابقة لبحثك أو لهذا الفضاء.",
    sourceLink: "عرض المصدر ↗",
    pdfLink: "ملف PDF ↗",
    closeBtn: "إغلاق",
    labelAuthor: "المؤلفون",
    labelDate: "تاريخ النشر",
    labelPole: "القطب",
    labelStatus: "الحالة التحريرية",
    labelType: "نوع الوثيقة",
    labelDocLang: "اللغة",
    labelConfidence: "الموثوقية",
    labelScore: "النتيجة",
    labelDoi: "المعرّف DOI",
    labelAbstract: "الملخص",
    statusValid: "متحقق منه",
    statusReview: "للمراجعة",
    manualTitle: "فضاء الإضافة اليدوية (محلي)",
    manualSub: "أضف يدوياً خبراً أو مقالاً أو إحصائية أو مباراة أو وثيقة مرجعية ثم صدّر ملف JSON.",
    manualLabelTitle: "العنوان *",
    manualLabelType: "النوع",
    manualLabelPole: "القطب الرئيسي",
    manualLabelDate: "التاريخ (YYYY-MM-DD)",
    manualLabelUrl: "رابط المصدر (URL)",
    manualLabelResume: "الملخص / ملاحظة",
    manualAddBtn: "إضافة إلى القاعدة المحلية",
    manualExportBtn: "تصدير الإضافات JSON",
    manualClearBtn: "مسح الإضافات المحلية",
    manualAddedMsg: "تمت إضافة المادة محلياً وظهرت في الفهرس.",
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
let searchQuery = "";
let futureDatesOnly = false;
let favoritesOnly = false;
let favorites = loadJsonStorage(FAVORITES_KEY, []);
let manualItems = loadJsonStorage(MANUAL_ITEMS_KEY, []);
let activeModalItem = null;
let remoteItems = [];
let indexItems = [];

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

function rebuildCombinedIndex() {
  const seen = new Set();
  const merged = [];
  for (const item of [...manualItems, ...remoteItems]) {
    const keys = getDedupeKeys(item);
    if (!keys.length || keys.some((k) => seen.has(k))) continue;
    keys.forEach((k) => seen.add(k));
    merged.push(item);
  }
  indexItems = merged;
}

function matchesSpace(item, space) {
  if (!space || space === "all") return true;
  const t = String(item.type_document || "").toLowerCase();
  const p = String(item.pole || "").toLowerCase();
  if (space === "science") return t === "publication_scientifique" || p === "recherche_scientifique";
  if (space === "chiffres") return t === "statistique" || p === "economie_finances_publiques";
  if (space === "academy") return t === "concours" || p === "institutions_gouvernance" || p === "securite_affaires_interieures";
  if (space === "bibliotheque") return ["rapport", "rapport_institutionnel", "document_juridique", "statistique", "publication_scientifique"].includes(t);
  if (space === "veille") return true;
  return true;
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
  futureDatesOnly = false;
  favoritesOnly = false;
  render();
}

function getFilteredItems() {
  const q = searchQuery.trim().toLowerCase();
  const list = indexItems.filter((item) => {
    if (!matchesSpace(item, activeSpace)) return false;
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
    const pole = (item.pole || "").toLowerCase();
    const poleLabel = formatPole(item.pole).toLowerCase();
    const docType = (item.type_document || "").toLowerCase();
    const docTypeLabel = formatDocType(item.type_document).toLowerCase();
    const resume = (item.resume || "").toLowerCase();

    return (
      title.includes(q) ||
      authors.includes(q) ||
      pole.includes(q) ||
      poleLabel.includes(q) ||
      docType.includes(q) ||
      docTypeLabel.includes(q) ||
      resume.includes(q)
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

function renderModal() {
  const existing = document.getElementById("notice-modal");
  if (existing) existing.remove();
  if (!activeModalItem) return;

  const c = COPY[lang];
  const item = activeModalItem;
  const authorsText = Array.isArray(item.auteurs) && item.auteurs.length
    ? item.auteurs.join(", ")
    : (lang === "ar" ? "مؤلف غير مذكور" : "Auteur non renseigné");
  const resumeText = item.resume && String(item.resume).trim()
    ? item.resume
    : c.noAbstract;
  const statusLabel = item.statut_validation === "valide" && !isFutureDate(item)
    ? c.statusValid
    : c.statusReview;

  const safeUrl = isSafeHttpUrl(item.url_publication) ? item.url_publication.trim() : "";
  const safePdf = isSafeHttpUrl(item.pdf_direct) ? item.pdf_direct.trim() : "";

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
        <div><dt>${escapeHtml(c.labelDate)}</dt><dd>${escapeHtml(item.date_publication || "—")}</dd></div>
        <div><dt>${escapeHtml(c.labelPole)}</dt><dd>${escapeHtml(formatPole(item.pole) || "—")}</dd></div>
        <div><dt>${escapeHtml(c.labelStatus)}</dt><dd>${escapeHtml(statusLabel)}</dd></div>
        ${item.langue_originale ? `<div><dt>${escapeHtml(c.labelDocLang)}</dt><dd>${escapeHtml(formatDocLang(item.langue_originale))}</dd></div>` : ""}
        ${item.confiance_classification ? `<div><dt>${escapeHtml(c.labelConfidence)}</dt><dd>${escapeHtml(formatConfidence(item.confiance_classification))}</dd></div>` : ""}
        ${typeof item.score_pertinence === "number" ? `<div><dt>${escapeHtml(c.labelScore)}</dt><dd>${escapeHtml(String(item.score_pertinence))}</dd></div>` : ""}
        ${item.doi ? `<div><dt>${escapeHtml(c.labelDoi)}</dt><dd>${escapeHtml(item.doi)}</dd></div>` : ""}
      </dl>
      <div class="modal-resume">
        <strong>${escapeHtml(c.labelAbstract)}</strong>
        <p>${escapeHtml(resumeText)}</p>
      </div>
      <div class="result-actions">
        ${safeUrl ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.sourceLink)}</a>` : ""}
        ${safePdf ? `<a href="${escapeHtml(safePdf)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.pdfLink)}</a>` : ""}
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
      const authorsText = Array.isArray(item.auteurs) && item.auteurs.length
        ? item.auteurs.join(", ")
        : (lang === "ar" ? "مؤلف غير مذكور" : "Auteur non renseigné");
      const metaLeft = escapeHtml(item.date_publication || "");
      const metaRight = escapeHtml(formatDocType(item.type_document) || formatPole(item.pole) || "");
      const futureFlag = isFutureDate(item)
        ? `<span class="flag-warn">${escapeHtml(COPY[lang].futureBadge)}</span>`
        : (item.statut_validation === "a_verifier"
            ? `<span class="flag-warn">${escapeHtml(COPY[lang].unverifiedBadge)}</span>`
            : "");
      const resumeSnippet = item.resume && String(item.resume).trim()
        ? `<p class="result-resume">${escapeHtml(item.resume)}</p>`
        : "";
      const safePdf = isSafeHttpUrl(item.pdf_direct) ? item.pdf_direct.trim() : "";
      const safeUrl = isSafeHttpUrl(item.url_publication) ? item.url_publication.trim() : "";
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
          ${futureFlag}
          <h3>${escapeHtml(item.titre_original || "")}</h3>
          <p class="result-authors">${escapeHtml(authorsText)}</p>
          ${resumeSnippet}
          <div class="result-actions">
            ${sourceHtml}
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
  const c = COPY[lang];
  const themes = THEMES[lang];
  const principles = PRINCIPLES[lang];
  const tracks = ACADEMY_TRACKS[lang];
  const spaces = SPACES[lang];
  const activeTheme = themes[selectedThemeIndex] || themes[0];
  const activeTrack = tracks[selectedAcademyIndex] || tracks[0];
  const allPoleKeys = Object.keys(POLE_LABELS[lang]);
  const availableTypes = [...new Set(indexItems.map((it) => it.type_document).filter(Boolean))];
  const availableConfidence = [...new Set(indexItems.map((it) => it.confiance_classification).filter(Boolean))];
  const availableDocLangs = [...new Set(indexItems.map((it) => it.langue_originale).filter(Boolean))];

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

  const app = document.getElementById("app");
  if (!app) return;

  const isCorrect = selectedQuizOption === activeTrack.answer;

  app.innerHTML = `
    <header class="topbar">
      <a href="#" class="brand">
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
        <button type="button" class="menu-toggle" id="menu-toggle" aria-expanded="${mobileMenuOpen}">${c.menuBtn}</button>
        <button type="button" class="lang" id="lang-toggle">${c.langBtn}</button>
      </div>
    </header>

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
        </div>
        <div>
          <span class="mini-label">${escapeHtml(c.academyQuizLabel)}</span>
          <p class="quiz-question">${escapeHtml(activeTrack.question)}</p>
          <div class="quiz-options">
            ${activeTrack.options.map((opt, oIdx) => `
              <button type="button" class="quiz-opt ${selectedQuizOption === oIdx ? "is-selected" : ""}" data-quiz-opt="${oIdx}">${escapeHtml(opt)}</button>
            `).join("")}
          </div>
          ${selectedQuizOption !== null ? `
            <p class="quiz-feedback ${isCorrect ? "is-ok" : "is-ko"}">
              ${escapeHtml(activeTrack.correction)}
            </p>
          ` : ""}
        </div>
      </div>
    </section>

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

    <section class="section" id="research">
      <div class="section-head">
        <div>
          <span class="eyebrow">${c.researchEyebrow}</span>
          <h2>${c.researchTitle}</h2>
        </div>
        <span class="count-badge" id="index-count">0</span>
      </div>

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
              <span>${escapeHtml(c.manualLabelUrl)}</span>
              <input type="url" id="m-url" placeholder="https://..." />
            </label>
          </div>
          <label class="manual-resume-field">
            <span>${escapeHtml(c.manualLabelResume)}</span>
            <textarea id="m-resume" rows="3"></textarea>
          </label>
          <div class="manual-actions">
            <button type="submit" class="btn primary">${escapeHtml(c.manualAddBtn)}</button>
            <button type="button" class="link-btn" id="manual-export">${escapeHtml(c.manualExportBtn)}</button>
            <button type="button" class="link-btn" id="manual-clear">${escapeHtml(c.manualClearBtn)}</button>
          </div>
          <p class="manual-status" id="manual-status"></p>
        </form>
      ` : ""}

      <div id="active-pole-banner" class="pole-banner" style="display:none;"></div>

      <div class="filters-bar">
        <input type="search" id="search-input" placeholder="${escapeHtml(c.searchPlaceholder)}" value="${escapeHtml(searchQuery)}" />
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
      render();
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

  document.getElementById("manual-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const titleVal = (document.getElementById("m-title")?.value || "").trim();
    if (!titleVal) return;
    const typeVal = document.getElementById("m-type")?.value || "article";
    const poleVal = document.getElementById("m-pole")?.value || "institutions_gouvernance";
    const dateVal = document.getElementById("m-date")?.value || REFERENCE_DATE;
    const urlVal = (document.getElementById("m-url")?.value || "").trim();
    const resumeVal = (document.getElementById("m-resume")?.value || "").trim();

    const newEntry = {
      id: `kitn_manual_${Date.now()}`,
      titre_original: titleVal,
      auteurs: [lang === "ar" ? "إضافة يدوية" : "Contribution manuelle"],
      date_publication: dateVal,
      date_statut: "date_confirmee",
      date_anomalie: false,
      statut_validation: "valide",
      langue_originale: lang,
      source_id: "manual_studio",
      source_nom: lang === "ar" ? "إضافة يدوية KITN" : "Contribution manuelle KITN",
      type_document: typeVal,
      pole: poleVal,
      poles_secondaires: [],
      confiance_classification: "eleve",
      score_pertinence: 90,
      url_publication: isSafeHttpUrl(urlVal) ? urlVal : null,
      doi: null,
      pdf_direct: null,
      resume: resumeVal
    };

    manualItems = [newEntry, ...manualItems];
    saveJsonStorage(MANUAL_ITEMS_KEY, manualItems);
    rebuildCombinedIndex();
    render();
    const statusEl = document.getElementById("manual-status");
    if (statusEl) statusEl.textContent = c.manualAddedMsg;
  });

  document.getElementById("manual-export")?.addEventListener("click", () => {
    exportJsonPayload(manualItems, "kitn-contributions-manuelles.json");
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
  renderResults();
}

render();
initAcademy();
initIndex();
