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
    article: "Article"
  },
  ar: {
    publication_scientifique: "منشور علمي",
    statistique: "إحصائية / مجموعة بيانات",
    rapport: "تقرير",
    article: "مقال"
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
    activePoleBanner: "Filtre actif sur le pôle :",
    allPoles: "Tous les pôles",
    academyEyebrow: "KITN Academy",
    academyTitle: "Apprendre avec méthode, pas dans la précipitation.",
    academyText: "Des repères clairs, des synthèses structurées et des ressources pour approfondir les grands dossiers et préparer les échéances exigeantes.",
    academyBtn: "Explorer les ressources documentaires →",
    academySheetLabel: "Fiche de révision",
    academyQuizLabel: "QCM d'entraînement",
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
    allConfidence: "Toutes confiances",
    sortNewest: "Date : plus récent",
    sortOldest: "Date : plus ancien",
    sortScore: "Pertinence : score décroissant",
    resetFilters: "Réinitialiser",
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
    labelConfidence: "Fiabilité",
    labelScore: "Score",
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
    activePoleBanner: "تصفية نشطة حسب القطب:",
    allPoles: "كل الأقطاب",
    academyEyebrow: "أكاديمية KITN",
    academyTitle: "التعلم بمنهجية، لا بتسرع.",
    academyText: "معالم واضحة وملخصات مهيكلة وموارد لتعميق الملفات الكبرى والاستعداد للاستحقاقات الدقيقة.",
    academyBtn: "استعراض الموارد الوثائقية ←",
    academySheetLabel: "بطاقة مراجعة",
    academyQuizLabel: "اختبار تفاعلي",
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
    allConfidence: "كل مستويات الموثوقية",
    sortNewest: "التاريخ: الأحدث",
    sortOldest: "التاريخ: الأقدم",
    sortScore: "الملاءمة: الأعلى أولاً",
    resetFilters: "إعادة الضبط",
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
    labelConfidence: "الموثوقية",
    labelScore: "النتيجة",
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
let selectedThemeIndex = 0;
let selectedPolesFilter = null;
let activePoleLabel = "";
let selectedTypeFilter = "";
let selectedConfidenceFilter = "";
let sortOrder = "newest";
let selectedPrincipleIndex = 0;
let selectedAcademyIndex = 0;
let selectedQuizOption = null;
let searchQuery = "";
let futureDatesOnly = false;
let favoritesOnly = false;
let favorites = loadFavorites();
let activeModalItem = null;
let indexItems = [];

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function isFutureDate(item) {
  if (item && item.date_anomalie === true) return true;
  const clean = String(item?.date_publication || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return false;
  return clean > REFERENCE_DATE;
}

function formatDocType(type) {
  if (!type) return "";
  return DOC_TYPES[lang]?.[type] || type;
}

function formatConfidence(conf) {
  if (!conf) return "";
  return CONFIDENCE_LABELS[lang]?.[conf] || conf;
}

function toggleFavorite(item) {
  const key = getItemKey(item);
  if (!key) return;
  if (favorites.includes(key)) {
    favorites = favorites.filter((k) => k !== key);
  } else {
    favorites = [...favorites, key];
  }
  saveFavorites(favorites);
  renderResults();
}

function resetAllFilters() {
  selectedPolesFilter = null;
  activePoleLabel = "";
  selectedTypeFilter = "";
  selectedConfidenceFilter = "";
  sortOrder = "newest";
  searchQuery = "";
  futureDatesOnly = false;
  favoritesOnly = false;
  render();
}

function getFilteredItems() {
  const q = searchQuery.trim().toLowerCase();
  const list = indexItems.filter((item) => {
    const matchesPole = !selectedPolesFilter || selectedPolesFilter.includes(item.pole);
    if (!matchesPole) return false;
    if (selectedTypeFilter && item.type_document !== selectedTypeFilter) return false;
    if (selectedConfidenceFilter && item.confiance_classification !== selectedConfidenceFilter) return false;
    if (futureDatesOnly && !isFutureDate(item)) return false;
    if (favoritesOnly && !favorites.includes(getItemKey(item))) return false;
    if (!q) return true;

    const title = (item.titre_original || "").toLowerCase();
    const authors = Array.isArray(item.auteurs) ? item.auteurs.join(" ").toLowerCase() : "";
    const pole = (item.pole || "").toLowerCase();
    const docType = (item.type_document || "").toLowerCase();
    const docTypeLabel = formatDocType(item.type_document).toLowerCase();
    const resume = (item.resume || "").toLowerCase();

    return (
      title.includes(q) ||
      authors.includes(q) ||
      pole.includes(q) ||
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

  const modal = document.createElement("div");
  modal.id = "notice-modal";
  modal.className = "modal-backdrop";
  modal.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true">
      <div class="modal-head">
        <span>${escapeHtml(formatDocType(item.type_document) || item.pole || "")}</span>
        <button type="button" class="modal-close" id="close-modal">${escapeHtml(c.closeBtn)} ✕</button>
      </div>
      <h3>${escapeHtml(item.titre_original || "")}</h3>
      ${isFutureDate(item) ? `<span class="flag-warn">${escapeHtml(c.futureBadge)}</span>` : ""}
      <dl class="modal-meta">
        <div><dt>${escapeHtml(c.labelAuthor)}</dt><dd>${escapeHtml(authorsText)}</dd></div>
        <div><dt>${escapeHtml(c.labelDate)}</dt><dd>${escapeHtml(item.date_publication || "—")}</dd></div>
        <div><dt>${escapeHtml(c.labelPole)}</dt><dd>${escapeHtml(item.pole || "—")}</dd></div>
        ${item.confiance_classification ? `<div><dt>${escapeHtml(c.labelConfidence)}</dt><dd>${escapeHtml(formatConfidence(item.confiance_classification))}</dd></div>` : ""}
        ${typeof item.score_pertinence === "number" ? `<div><dt>${escapeHtml(c.labelScore)}</dt><dd>${escapeHtml(String(item.score_pertinence))}</dd></div>` : ""}
        ${item.doi ? `<div><dt>${escapeHtml(c.labelDoi)}</dt><dd>${escapeHtml(item.doi)}</dd></div>` : ""}
      </dl>
      <div class="modal-resume">
        <strong>${escapeHtml(c.labelAbstract)}</strong>
        <p>${escapeHtml(resumeText)}</p>
      </div>
      <div class="result-actions">
        ${item.url_publication ? `<a href="${escapeHtml(item.url_publication)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.sourceLink)}</a>` : ""}
        ${item.pdf_direct ? `<a href="${escapeHtml(item.pdf_direct)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.pdfLink)}</a>` : ""}
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
      const metaRight = escapeHtml(formatDocType(item.type_document) || item.pole || "");
      const futureFlag = isFutureDate(item)
        ? `<span class="flag-warn">${escapeHtml(COPY[lang].futureBadge)}</span>`
        : "";
      const resumeSnippet = item.resume && String(item.resume).trim()
        ? `<p class="result-resume">${escapeHtml(item.resume)}</p>`
        : "";
      const pdfHtml = item.pdf_direct
        ? `<a href="${escapeHtml(item.pdf_direct)}" target="_blank" rel="noopener noreferrer">${escapeHtml(COPY[lang].pdfLink)}</a>`
        : "";
      const sourceHtml = item.url_publication
        ? `<a href="${escapeHtml(item.url_publication)}" target="_blank" rel="noopener noreferrer">${escapeHtml(COPY[lang].sourceLink)}</a>`
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
  const activeTheme = themes[selectedThemeIndex] || themes[0];
  const activePrinciple = principles[selectedPrincipleIndex] || principles[0];
  const activeTrack = tracks[selectedAcademyIndex] || tracks[0];
  const availableTypes = [...new Set(indexItems.map((it) => it.type_document).filter(Boolean))];
  const availableConfidence = [...new Set(indexItems.map((it) => it.confiance_classification).filter(Boolean))];

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <header class="topbar">
      <a href="#" class="brand">
        <span class="brand-mark">K</span>
        <span>KITN<span class="brand-dot">.</span></span>
      </a>
      <nav class="nav">
        <a href="#themes">${c.navThemes}</a>
        <a href="#academy">${c.navAcademy}</a>
        <a href="#method">${c.navMethod}</a>
        <a href="#research">${c.navResearch}</a>
      </nav>
      <button type="button" class="lang" id="lang-toggle">${c.langBtn}</button>
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

      <div class="theme-grid">
        ${themes
          .map(
            (t, i) => `
          <button type="button" class="theme-card ${i === selectedThemeIndex ? "is-selected" : ""}" data-theme-index="${i}">
            <div class="theme-top">
              <span>${t.num}</span>
              <span>${t.symbol}</span>
            </div>
            <div class="theme-icon">${t.symbol}</div>
            <h3>${escapeHtml(t.title)}</h3>
            <p>${escapeHtml(t.desc)}</p>
          </button>
        `
          )
          .join("")}
      </div>

      <div class="theme-panel">
        <div class="theme-panel-top">
          <strong>${activeTheme.num} — ${escapeHtml(activeTheme.title)}</strong>
          <div>
            <a href="#research" id="filter-by-theme">${c.openPole}</a>
            ${selectedPolesFilter ? ` · <a href="#research" id="reset-pole-filter">${c.allPoles}</a>` : ""}
          </div>
        </div>
        <p>${escapeHtml(activeTheme.detail)}</p>
        <div class="theme-tags">
          ${activeTheme.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
        </div>
      </div>
    </section>

    <section class="academy" id="academy">
      <div>
        <span class="eyebrow light">${c.academyEyebrow}</span>
        <h2>${c.academyTitle}</h2>
        <p>${c.academyText}</p>

        <div class="academy-tabs">
          ${tracks
            .map(
              (tr, i) => `
            <button type="button" class="academy-tab ${i === selectedAcademyIndex ? "is-active" : ""}" data-academy-index="${i}">
              ${escapeHtml(tr.label)}
            </button>
          `
            )
            .join("")}
        </div>

        <div class="academy-box">
          <strong>${escapeHtml(activeTrack.title)}</strong>
          <p class="academy-sheet"><b>${escapeHtml(c.academySheetLabel)} :</b> ${escapeHtml(activeTrack.sheet)}</p>
          <div class="academy-quiz">
            <div class="quiz-q">${escapeHtml(c.academyQuizLabel)} : ${escapeHtml(activeTrack.question)}</div>
            <div class="quiz-options">
              ${activeTrack.options
                .map((opt, idx) => {
                  const picked = selectedQuizOption === idx;
                  const isCorrect = idx === activeTrack.answer;
                  const stateClass = selectedQuizOption === null
                    ? ""
                    : isCorrect
                      ? "is-correct"
                      : picked
                        ? "is-wrong"
                        : "";
                  return `
                    <button type="button" class="quiz-opt ${stateClass}" data-quiz-opt="${idx}">
                      ${escapeHtml(opt)}
                    </button>
                  `;
                })
                .join("")}
            </div>
            ${
              selectedQuizOption !== null
                ? `<p class="quiz-correction">${escapeHtml(activeTrack.correction)}</p>`
                : ""
            }
          </div>
        </div>

        <a href="#research" class="btn white">${c.academyBtn}</a>
      </div>
      <div class="academy-visual">
        <div class="book book-one"></div>
        <div class="book book-two"></div>
        <div class="book-page">
          <span>${c.academyPageTop}</span>
          <b>${c.academyPageTitle}</b>
          <small>${c.academyPageSub}</small>
          <div class="page-lines"></div>
        </div>
      </div>
    </section>

    <section class="section method" id="method">
      <div>
        <span class="eyebrow">${c.methodEyebrow}</span>
        <h2>${c.methodTitle}</h2>
      </div>
      <div class="method-right">
        <p>${c.methodText}</p>
        <ul class="principle-list">
          ${principles
            .map(
              (p, i) => `
            <li>
              <button type="button" class="principle-btn ${i === selectedPrincipleIndex ? "is-active" : ""}" data-principle-index="${i}">
                <span>${p.num}</span>
                <strong>${escapeHtml(p.title)}</strong>
                <span>${i === selectedPrincipleIndex ? "−" : "+"}</span>
              </button>
            </li>
          `
            )
            .join("")}
        </ul>
        <div class="principle-box">
          <strong>${escapeHtml(activePrinciple.title)}</strong>
          <p>${escapeHtml(activePrinciple.text)}</p>
        </div>
      </div>
    </section>

    <section class="section" id="research">
      <div class="research-head">
        <div>
          <span class="eyebrow">${c.researchEyebrow}</span>
          <h2>${c.researchTitle}</h2>
        </div>
        <span class="index-badge" id="index-count">0</span>
      </div>

      <div class="active-pole-banner" id="active-pole-banner" style="display:none;"></div>

      <div class="search-bar-wrap">
        <input
          type="search"
          id="search-input"
          class="search-input"
          placeholder="${escapeHtml(c.searchPlaceholder)}"
          value="${escapeHtml(searchQuery)}"
        />
        <div class="filter-controls">
          <select id="type-filter" class="filter-select">
            <option value="">${escapeHtml(c.allTypes)}</option>
            ${availableTypes
              .map(
                (t) => `<option value="${escapeHtml(t)}" ${selectedTypeFilter === t ? "selected" : ""}>${escapeHtml(formatDocType(t))}</option>`
              )
              .join("")}
          </select>
          <select id="confidence-filter" class="filter-select">
            <option value="">${escapeHtml(c.allConfidence)}</option>
            ${availableConfidence
              .map(
                (cf) => `<option value="${escapeHtml(cf)}" ${selectedConfidenceFilter === cf ? "selected" : ""}>${escapeHtml(formatConfidence(cf))}</option>`
              )
              .join("")}
          </select>
          <select id="sort-order" class="filter-select">
            <option value="newest" ${sortOrder === "newest" ? "selected" : ""}>${escapeHtml(c.sortNewest)}</option>
            <option value="oldest" ${sortOrder === "oldest" ? "selected" : ""}>${escapeHtml(c.sortOldest)}</option>
            <option value="score" ${sortOrder === "score" ? "selected" : ""}>${escapeHtml(c.sortScore)}</option>
          </select>
          <button type="button" class="reset-btn" id="reset-filters-btn">${escapeHtml(c.resetFilters)}</button>
        </div>
        <div class="filter-checks-row">
          <label class="filter-check">
            <input type="checkbox" id="favorites-toggle" ${favoritesOnly ? "checked" : ""} />
            <span>${escapeHtml(c.savedOnly)} (${favorites.length})</span>
          </label>
          <label class="filter-check">
            <input type="checkbox" id="future-dates-toggle" ${futureDatesOnly ? "checked" : ""} />
            <span>${escapeHtml(c.futureOnly)}</span>
          </label>
        </div>
      </div>

      <div class="results-grid" id="results-grid"></div>
    </section>

    <footer>
      <span>${c.footerCopy}</span>
      <span>kitn.pages.dev</span>
    </footer>
  `;

  document.getElementById("lang-toggle")?.addEventListener("click", () => {
    lang = lang === "fr" ? "ar" : "fr";
    selectedQuizOption = null;
    render();
  });

  document.querySelectorAll("[data-theme-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedThemeIndex = Number(btn.getAttribute("data-theme-index"));
      render();
    });
  });

  document.getElementById("filter-by-theme")?.addEventListener("click", () => {
    selectedPolesFilter = activeTheme.poles;
    activePoleLabel = activeTheme.title;
    renderResults();
  });

  document.getElementById("reset-pole-filter")?.addEventListener("click", () => {
    selectedPolesFilter = null;
    activePoleLabel = "";
    renderResults();
  });

  document.querySelectorAll("[data-academy-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedAcademyIndex = Number(btn.getAttribute("data-academy-index"));
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

  document.querySelectorAll("[data-principle-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedPrincipleIndex = Number(btn.getAttribute("data-principle-index"));
      render();
    });
  });

  const input = document.getElementById("search-input");
  input?.addEventListener("input", (e) => {
    searchQuery = e.target.value || "";
    renderResults();
  });

  document.getElementById("type-filter")?.addEventListener("change", (e) => {
    selectedTypeFilter = e.target.value || "";
    renderResults();
  });

  document.getElementById("confidence-filter")?.addEventListener("change", (e) => {
    selectedConfidenceFilter = e.target.value || "";
    renderResults();
  });

  document.getElementById("sort-order")?.addEventListener("change", (e) => {
    sortOrder = e.target.value || "newest";
    renderResults();
  });

  document.getElementById("reset-filters-btn")?.addEventListener("click", () => {
    resetAllFilters();
  });

  document.getElementById("favorites-toggle")?.addEventListener("change", (e) => {
    favoritesOnly = Boolean(e.target.checked);
    renderResults();
  });

  document.getElementById("future-dates-toggle")?.addEventListener("change", (e) => {
    futureDatesOnly = Boolean(e.target.checked);
    renderResults();
  });

  renderResults();
  renderModal();
}

async function loadSearchIndex() {
  try {
    const res = await fetch("/data/index/search-index.json", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.items)) {
      indexItems = data.items;
    } else if (Array.isArray(data)) {
      indexItems = data;
    }
    render();
  } catch (err) {
    console.error("Erreur chargement search-index.json :", err);
  }
}

render();
loadSearchIndex();
