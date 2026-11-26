import "./style.css";

const REFERENCE_DATE = "2026-11-26";
const FAVORITES_KEY = "kitn_favorites_v1";

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
      poles: ["relations_internationales_geopolitique"],
      title: "Sécurité, territoires & géopolitique",
      desc: "Sécurité publique, prévention, territoires, ressources et enjeux stratégiques.",
      detail: "Suivi des dynamiques territoriales, des ressources, de la sécurité et du positionnement stratégique du Maroc.",
      tags: ["Territoires", "Ressources", "Géopolitique", "Sécurité"]
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
      poles: ["relations_internationales_geopolitique"],
      title: "الأمن والمجالات والجيوسياسة",
      desc: "الأمن العمومي، الوقاية، المجالات الترابية والموارد والقضايا الاستراتيجية.",
      detail: "تتبع الديناميات الترابية والموارد والأمن والموقع الاستراتيجي للمغرب.",
      tags: ["المجالات الترابية", "الموارد", "الجيوسياسة", "الأمن"]
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

const DOC_TYPES = {
  fr: {
    publication_scientifique: "Publication scientifique",
    statistique: "Statistique / Jeu de données",
    rapport: "Rapport",
    article: "Article"
  },
  ar: {
    publication_scientifique: "منشور علمي",
    statistique: "إحصائية / مجموعة بيانات",
    rapport: "تقرير",
    article: "مقال"
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
    navThemes: "Thématiques",
    navAcademy: "KITN Academy",
    navMethod: "Méthode",
    navResearch: "Recherche",
    eyebrow: "Centre de veille & de connaissances",
    heroTitle: "Comprendre le Maroc. <span>Anticiper</span> ses transformations.",
    heroIntro: "Une plateforme indépendante pour suivre les évolutions du Maroc, explorer les travaux de recherche et transformer l'information en connaissance utile.",
    heroPrimary: "Explorer la plateforme ↗",
    heroSecondary: "Découvrir KITN →",
    heroNote: "UNE LECTURE STRUCTURÉE DU MAROC",
    card1Top: "01 / MAROC",
    card1Map: "MA",
    card2Top: "KNOWLEDGE / 2026",
    card2Cap: "<strong>Information</strong> → Connaissance",
    chip: "✦ Perspective marocaine",
    themesEyebrow: "Les grands enjeux",
    themesTitle: "Explorer par thématique",
    themesSub: "Des sujets essentiels, organisés pour aller au-delà de l'actualité et comprendre les dynamiques de fond.",
    openPole: "Filtrer les notices de ce pôle →",
    allPoles: "Tous les pôles",
    academyEyebrow: "KITN Academy",
    academyTitle: "Apprendre avec méthode, pas dans la précipitation.",
    academyText: "Des repères clairs, des synthèses structurées et des ressources pour approfondir les grands dossiers et préparer les échéances exigeantes.",
    academyBtn: "Accéder à KITN Academy →",
    academyPageTop: "KITN",
    academyPageTitle: "Academy",
    academyPageSub: "Méthode & repères",
    methodEyebrow: "Notre approche",
    methodTitle: "La connaissance commence par une bonne question.",
    methodText: "KITN privilégie la clarté, la vérification et la mise en perspective plutôt que le bruit informationnel.",
    researchEyebrow: "Index documentaire",
    researchTitle: "Travaux & publications indexés",
    searchPlaceholder: "Rechercher par titre, auteur, pôle, type ou résumé...",
    allTypes: "Tous les types",
    sortNewest: "Date : plus récent",
    sortOldest: "Date : plus ancien",
    savedOnly: "Favoris uniquement",
    saveBtn: "Enregistrer",
    savedBtn: "Enregistré",
    futureOnly: "Dates postérieures au 26/11/2026 uniquement",
    futureBadge: "Date > 26/11/2026 (à vérifier)",
    noAbstract: "Résumé non fourni par la source.",
    detailsBtn: "Fiche détaillée",
    noResults: "Aucune notice ne correspond à votre recherche.",
    sourceLink: "Consulter la source ↗",
    pdfLink: "PDF ↗",
    closeBtn: "Fermer",
    labelAuthor: "Auteurs",
    labelDate: "Date de publication",
    labelPole: "Pôle",
    labelType: "Type de document",
    labelDoi: "DOI",
    labelAbstract: "Résumé",
    footerCopy: "© 2026 KITN — Centre de veille & de connaissances."
  },
  ar: {
    langBtn: "Français",
    navThemes: "المحاور",
    navAcademy: "أكاديمية KITN",
    navMethod: "المنهجية",
    navResearch: "البحث",
    eyebrow: "مركز الرصد والمعرفة",
    heroTitle: "فهم المغرب. <span>واستشراف</span> تحولاته.",
    heroIntro: "منصة مستقلة لمتابعة تطورات المغرب واستكشاف الأبحاث وتحويل المعلومة إلى معرفة مفيدة.",
    heroPrimary: "استكشاف المنصة ↗",
    heroSecondary: "اكتشف KITN ←",
    heroNote: "قراءة مهيكلة للمغرب",
    card1Top: "01 / المغرب",
    card1Map: "MA",
    card2Top: "المعرفة / 2026",
    card2Cap: "<strong>المعلومة</strong> ← المعرفة",
    chip: "✦ رؤية مغربية",
    themesEyebrow: "القضايا الكبرى",
    themesTitle: "الاستكشاف حسب المحور",
    themesSub: "مواضيع أساسية منظمة لتجاوز الأخبار اليومية وفهم الديناميات العميقة.",
    openPole: "تصفية المواد حسب هذا القطب ←",
    allPoles: "كل الأقطاب",
    academyEyebrow: "أكاديمية KITN",
    academyTitle: "التعلم بمنهجية، لا بتسرع.",
    academyText: "معالم واضحة وملخصات مهيكلة وموارد لتعميق الملفات الكبرى والاستعداد للاستحقاقات الدقيقة.",
    academyBtn: "ولوج أكاديمية KITN ←",
    academyPageTop: "KITN",
    academyPageTitle: "Academy",
    academyPageSub: "المنهجية والمعالم",
    methodEyebrow: "مقاربتنا",
    methodTitle: "المعرفة تبدأ بسؤال جيد.",
    methodText: "تُقدّم KITN الوضوح والتحقق والربط السياقي بدل ضجيج المعلومات.",
    researchEyebrow: "الفهرس الوثائقي",
    researchTitle: "الأعمال والمنشورات المفهرسة",
    searchPlaceholder: "ابحث بالعنوان أو المؤلف أو القطب أو نوع الوثيقة...",
    allTypes: "كل الأنواع",
    sortNewest: "التاريخ: الأحدث",
    sortOldest: "التاريخ: الأقدم",
    savedOnly: "المحفوظات فقط",
    saveBtn: "حفظ",
    savedBtn: "محفوظ",
    futureOnly: "التواريخ بعد 26/11/2026 فقط",
    futureBadge: "تاريخ بعد 26/11/2026 (للمراجعة)",
    noAbstract: "الملخص غير متوفر في المصدر.",
    detailsBtn: "بطاقة تفصيلية",
    noResults: "لا توجد مواد مطابقة لبحثك.",
    sourceLink: "عرض المصدر ↗",
    pdfLink: "ملف PDF ↗",
    closeBtn: "إغلاق",
    labelAuthor: "المؤلفون",
    labelDate: "تاريخ النشر",
    labelPole: "القطب",
    labelType: "نوع الوثيقة",
    labelDoi: "المعرّف DOI",
    labelAbstract: "الملخص",
    footerCopy: "© 2026 KITN — مركز الرصد والمعرفة."
  }
};

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFavorites(list) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  } catch {
    // ignore storage quota errors
  }
}

function getItemKey(item) {
  return String(item.id || item.doi || item.url_publication || item.titre_original || "");
}

let lang = "fr";
