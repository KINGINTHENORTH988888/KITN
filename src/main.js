import "./style.css";

const THEMES = {
  fr: [
    {
      num: "01",
      symbol: "⌘",
      pole: "institutions_gouvernance",
      title: "Institutions & gouvernance",
      desc: "Politiques publiques, institutions, administration et réformes.",
      detail: "Analyse des politiques publiques, de l'action administrative, de la décentralisation et de la gouvernance institutionnelle au Maroc.",
      tags: ["Politiques publiques", "Gouvernance", "Administration", "Réformes"]
    },
    {
      num: "02",
      symbol: "◎",
      pole: "economie_finances_publiques",
      title: "Économie & société",
      desc: "Indicateurs, emploi, développement humain et mutations sociales.",
      detail: "Lecture des dynamiques économiques, chaînes de valeur, finances publiques, transitions sectorielles et mutations sociales.",
      tags: ["Économie", "Finances publiques", "Chaînes de valeur", "Mutations sociales"]
    },
    {
      num: "03",
      symbol: "⊕",
      pole: "relations_internationales_geopolitique",
      title: "Sécurité, territoires & géopolitique",
      desc: "Sécurité publique, prévention, territoires, ressources et enjeux stratégiques.",
      detail: "Suivi des dynamiques territoriales, des ressources, de la sécurité et du positionnement stratégique du Maroc.",
      tags: ["Territoires", "Ressources", "Géopolitique", "Sécurité"]
    },
    {
      num: "04",
      symbol: "✧",
      pole: "recherche_scientifique",
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
      pole: "institutions_gouvernance",
      title: "المؤسسات والحكامة",
      desc: "السياسات العمومية، المؤسسات، الإدارة والإصلاحات.",
      detail: "تحليل السياسات العمومية والعمل الإداري واللامركزية والحكامة المؤسساتية في المغرب.",
      tags: ["السياسات العمومية", "الحكامة", "الإدارة", "الإصلاحات"]
    },
    {
      num: "02",
      symbol: "◎",
      pole: "economie_finances_publiques",
      title: "الاقتصاد والمجتمع",
      desc: "المؤشرات، الشغل، التنمية البشرية والتحولات الاجتماعية.",
      detail: "قراءة الديناميات الاقتصادية وسلاسل القيمة والمالية العمومية والتحولات الاجتماعية.",
      tags: ["الاقتصاد", "المالية العمومية", "سلاسل القيمة", "التحولات الاجتماعية"]
    },
    {
      num: "03",
      symbol: "⊕",
      pole: "relations_internationales_geopolitique",
      title: "الأمن والمجالات والجيوسياسة",
      desc: "الأمن العمومي، الوقاية، المجالات الترابية والموارد والقضايا الاستراتيجية.",
      detail: "تتبع الديناميات الترابية والموارد والأمن والموقع الاستراتيجي للمغرب.",
      tags: ["المجالات الترابية", "الموارد", "الجيوسياسة", "الأمن"]
    },
    {
      num: "04",
      symbol: "✧",
      pole: "recherche_scientifique",
      title: "البحث والدراسات",
      desc: "منشورات أكاديمية، قواعد بيانات وتحليلات معمقة.",
      detail: "فهرسة الأعمال العلمية والدراسات القطاعية والبيانات المرجعية حول المغرب.",
      tags: ["منشورات", "بيانات", "دراسات", "رصد"]
    }
  ]
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
    searchPlaceholder: "Rechercher par titre, auteur, pôle ou type de document...",
    noResults: "Aucune notice ne correspond à votre recherche.",
    sourceLink: "Consulter la source ↗",
    pdfLink: "PDF ↗",
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
    noResults: "لا توجد مواد مطابقة لبحثك.",
    sourceLink: "عرض المصدر ↗",
    pdfLink: "ملف PDF ↗",
    footerCopy: "© 2026 KITN — مركز الرصد والمعرفة."
  }
};

let lang = "fr";
let selectedThemeIndex = 0;
let selectedPoleFilter = null;
let selectedPrincipleIndex = 0;
let searchQuery = "";
let indexItems = [];

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getFilteredItems() {
  const q = searchQuery.trim().toLowerCase();
  return indexItems.filter((item) => {
    const matchesPole = !selectedPoleFilter || item.pole === selectedPoleFilter;
    if (!matchesPole) return false;
    if (!q) return true;

    const title = (item.titre_original || "").toLowerCase();
    const authors = Array.isArray(item.auteurs) ? item.auteurs.join(" ").toLowerCase() : "";
    const pole = (item.pole || "").toLowerCase();
    const docType = (item.type_document || "").toLowerCase();
    const resume = (item.resume || "").toLowerCase();

    return (
      title.includes(q) ||
      authors.includes(q) ||
      pole.includes(q) ||
      docType.includes(q) ||
      resume.includes(q)
    );
  });
}

function renderResults() {
  const container = document.getElementById("results-grid");
  const countBadge = document.getElementById("index-count");
  if (!container || !countBadge) return;

  const filtered = getFilteredItems();
  const suffix = lang === "ar" ? " مادة" : filtered.length > 1 ? " notices" : " notice";
  countBadge.textContent = `${filtered.length}${suffix}`;

  if (!filtered.length) {
    container.innerHTML = `<p class="empty-results">${escapeHtml(COPY[lang].noResults)}</p>`;
    return;
  }

  container.innerHTML = filtered
    .map((item) => {
      const authorsText = Array.isArray(item.auteurs) && item.auteurs.length
        ? item.auteurs.join(", ")
        : (lang === "ar" ? "مؤلف غير مذكور" : "Auteur non renseigné");
      const metaLeft = escapeHtml(item.date_publication || "");
      const metaRight = escapeHtml(item.type_document || item.pole || "");
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
          <h3>${escapeHtml(item.titre_original || "")}</h3>
          <p class="result-authors">${escapeHtml(authorsText)}</p>
          <div class="result-actions">
            ${sourceHtml}
            ${pdfHtml}
          </div>
        </article>
      `;
    })
    .join("");
}

function render() {
  const c = COPY[lang];
  const themes = THEMES[lang];
  const principles = PRINCIPLES[lang];
  const activeTheme = themes[selectedThemeIndex] || themes[0];
  const activePrinciple = principles[selectedPrincipleIndex] || principles[0];

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
            ${selectedPoleFilter ? ` · <a href="#research" id="reset-pole-filter">${c.allPoles}</a>` : ""}
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

      <div class="search-bar-wrap">
        <input
          type="search"
          id="search-input"
          class="search-input"
          placeholder="${escapeHtml(c.searchPlaceholder)}"
          value="${escapeHtml(searchQuery)}"
        />
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
    render();
  });

  document.querySelectorAll("[data-theme-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedThemeIndex = Number(btn.getAttribute("data-theme-index"));
      render();
    });
  });

  document.getElementById("filter-by-theme")?.addEventListener("click", () => {
    selectedPoleFilter = activeTheme.pole;
    renderResults();
  });

  document.getElementById("reset-pole-filter")?.addEventListener("click", () => {
    selectedPoleFilter = null;
    renderResults();
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

  renderResults();
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
    renderResults();
  } catch (err) {
    console.error("Erreur chargement search-index.json :", err);
  }
}

render();
loadSearchIndex();
