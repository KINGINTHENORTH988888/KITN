import './style.css'

const copy = {
  fr: {
    nav: ['Explorer', 'Thématiques', 'Recherche', 'KITN Academy'],
    eyebrow: 'CENTRE DE VEILLE & DE CONNAISSANCES',
    title: 'Comprendre le Maroc.<br><span>Anticiper ses transformations.</span>',
    intro: 'Une plateforme indépendante pour suivre les évolutions du Maroc, explorer les travaux de recherche et transformer l’information en connaissance utile.',
    explore: 'Explorer la plateforme',
    discover: 'Découvrir KITN',
    signal: 'UNE LECTURE STRUCTURÉE DU MAROC',
    sections: 'Explorer par thématique',
    sectionsIntro: 'Des sujets essentiels, organisés pour aller au-delà de l’actualité et comprendre les dynamiques de fond.',
    themes: [
      {
        num: '01',
        title: 'Institutions & gouvernance',
        desc: 'Politiques publiques, institutions, administration et réformes.',
        focus: 'Action publique, modernisation administrative, finances publiques, décentralisation et cadres juridiques au Maroc.',
        tags: ['Politiques publiques', 'Administration', 'Réformes', 'Gouvernance']
      },
      {
        num: '02',
        title: 'Économie & société',
        desc: 'Indicateurs, emploi, développement humain et mutations sociales.',
        focus: 'Croissance, pouvoir d’achat, emploi, investissement, données statistiques (HCP) et dynamiques sociales.',
        tags: ['Macroéconomie', 'Emploi', 'Indicateurs', 'Mutations sociales']
      },
      {
        num: '03',
        title: 'Sécurité & territoires',
        desc: 'Sécurité publique, prévention, territoires et cohésion sociale.',
        focus: 'Sécurité intérieure, aménagement du territoire, cohésion sociale, enjeux territoriaux et prévention.',
        tags: ['Sécurité publique', 'Territoires', 'Prévention', 'Cohésion']
      },
      {
        num: '04',
        title: 'Recherche & études',
        desc: 'Articles scientifiques, rapports, mémoires et publications.',
        focus: 'Notes d’analyse, rapports institutionnels, travaux académiques et publications de référence.',
        tags: ['Rapports', 'Études', 'Publications', 'Analyse']
      }
    ],
    academy: 'KITN ACADEMY',
    academyTitle: 'Préparer les concours avec méthode.',
    academyText: 'Des fiches de révision structurées, des sujets de dissertation, des QCM et des ressources pour construire une préparation solide.',
    academyLink: 'Accéder à l’Academy',
    method: 'NOTRE APPROCHE',
    methodTitle: 'Moins de bruit.<br>Plus de compréhension.',
    methodText: 'KITN privilégie la pertinence, la traçabilité des sources et la mise en contexte. Chaque ressource doit aider à mieux comprendre un enjeu marocain.',
    principles: [
      {
        title: 'Sources identifiables',
        detail: 'Chaque notice indique clairement l’institution, le centre de recherche, l’archive ou le média d’origine afin de savoir d’où vient l’information.'
      },
      {
        title: 'Liens directs et vérifiés',
        detail: 'Chaque ressource vise un accès direct vers le document ou la page d’origine, avec contrôle réel de la destination plutôt qu’un lien trompeur.'
      },
      {
        title: 'Sélection centrée sur le Maroc',
        detail: 'Les contenus, études et outils de préparation sont filtrés et organisés autour des réalités, politiques publiques et concours au Maroc.'
      }
    ],
    footer: 'Une plateforme de veille, de recherche et de transmission des connaissances.',
    language: 'العربية'
  },
  ar: {
    nav: ['استكشف', 'المواضيع', 'البحث', 'أكاديمية KITN'],
    eyebrow: 'منصة للرصد والمعرفة',
    title: 'افهم المغرب.<br><span>واستشرف تحولاته.</span>',
    intro: 'منصة مستقلة لمتابعة تحولات المغرب، واستكشاف الأبحاث والدراسات، وتحويل المعلومات إلى معرفة مفيدة.',
    explore: 'استكشف المنصة',
    discover: 'اكتشف KITN',
    signal: 'قراءة منظمة للتحولات في المغرب',
    sections: 'استكشف حسب الموضوع',
    sectionsIntro: 'مواضيع أساسية منظمة لفهم التحولات العميقة وتجاوز مجرد متابعة الأخبار.',
    themes: [
      {
        num: '01',
        title: 'المؤسسات والحكامة',
        desc: 'السياسات العمومية والمؤسسات والإدارة والإصلاحات.',
        focus: 'العمل العمومي، تحديث الإدارة، المالية العمومية، اللاتمركز والإطارات القانونية بالمغرب.',
        tags: ['السياسات العمومية', 'الإدارة', 'الإصلاحات', 'الحكامة']
      },
      {
        num: '02',
        title: 'الاقتصاد والمجتمع',
        desc: 'المؤشرات والتشغيل والتنمية البشرية والتحولات الاجتماعية.',
        focus: 'النمو، القدرة الشرائية، التشغيل، الاستثمار، المعطيات الإحصائية والديناميات الاجتماعية.',
        tags: ['الاقتصاد الكلي', 'التشغيل', 'المؤشرات', 'التحولات الاجتماعية']
      },
      {
        num: '03',
        title: 'الأمن والمجالات الترابية',
        desc: 'الأمن العام والوقاية والمجالات الترابية والتماسك الاجتماعي.',
        focus: 'الأمن الداخلي، التهيئة المجالية، التماسك الاجتماعي، القضايا الترابية والوقاية.',
        tags: ['الأمن العام', 'المجالات الترابية', 'الوقاية', 'التماسك']
      },
      {
        num: '04',
        title: 'البحث والدراسات',
        desc: 'مقالات علمية وتقارير وأطروحات ومنشورات.',
        focus: 'أوراق تحليلية، تقارير مؤسساتية، أعمال أكاديمية ومنشورات مرجعية.',
        tags: ['تقارير', 'دراسات', 'منشورات', 'تحليل']
      }
    ],
    academy: 'أكاديمية KITN',
    academyTitle: 'استعد للمباريات بمنهجية واضحة.',
    academyText: 'ملخصات منظمة ومواضيع إنشائية وأسئلة متعددة الاختيارات وموارد لبناء استعداد متين.',
    academyLink: 'اكتشف الأكاديمية',
    method: 'منهجيتنا',
    methodTitle: 'ضجيج أقل.<br>فهم أعمق.',
    methodText: 'تعطي KITN الأولوية لمدى صلة المحتوى بالموضوع، ووضوح المصادر، ووضع المعلومات في سياقها.',
    principles: [
      {
        title: 'مصادر واضحة',
        detail: 'تُبيّن كل مادة الجهة أو المؤسسة أو المنصة الأصلية بوضوح لتتبع مصدر المعلومة بدقة.'
      },
      {
        title: 'روابط مباشرة وموثوقة',
        detail: 'نعتمد توجيهًا مباشرًا نحو الوثيقة أو الصفحة الأصلية مع التحقق الفعلي من سلامة الوجهة.'
      },
      {
        title: 'اختيار يركز على المغرب',
        detail: 'تُنتقى المواد والدراسات وأدوات الاستعداد وتُنظّم حول القضايا والسياسات العمومية والمباريات بالمغرب.'
      }
    ],
    footer: 'منصة للرصد والبحث ونقل المعرفة.',
    language: 'Français'
  }
}

let lang = 'fr'
let activePrinciple = 0
let activeTheme = 0
const app = document.querySelector('#app')

function render() {
  const t = copy[lang]
  const currentPrinciple = t.principles[activePrinciple] || t.principles[0]
  const currentTheme = t.themes[activeTheme] || t.themes[0]

  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'

  app.innerHTML = `
<header class="topbar">
  <a class="brand" href="#"><span class="brand-mark">K</span><span>KITN<span class="brand-dot">.</span></span></a>
  <nav class="nav">${t.nav.map((n, i) => `<a href="${['#explorer', '#themes', '#research', '#academy'][i]}">${n}</a>`).join('')}</nav>
  <button class="lang" id="language">${t.language}</button>
</header>
<main>
  <section class="hero" id="explorer">
    <div class="hero-orb orb-one"></div>
    <div class="hero-content">
      <div class="eyebrow"><span class="eyebrow-dot"></span>${t.eyebrow}</div>
      <h1>${t.title}</h1>
      <p class="hero-intro">${t.intro}</p>
      <div class="hero-actions">
        <a class="btn primary" href="#themes">${t.explore}<span>↗</span></a>
        <a class="text-link" href="#method">${t.discover} →</a>
      </div>
      <div class="hero-note"><span class="note-line"></span>${t.signal}</div>
    </div>
    <div class="hero-art">
      <div class="art-card card-back">
        <div class="art-top"><span>01 / MAROC</span><span>◌</span></div>
        <div class="art-lines"><i></i><i></i><i></i></div>
        <div class="art-map"><div class="map-shape"></div><b>MA</b></div>
      </div>
      <div class="art-card card-front">
        <div class="art-top"><span>KNOWLEDGE / 2026</span><span class="live-dot"></span></div>
        <div class="art-number">01<span>—</span>04</div>
        <div class="art-caption">Information<br><strong>→ Knowledge</strong></div>
        <div class="art-bars">${'<i></i>'.repeat(9)}</div>
      </div>
      <div class="floating-chip">✳ ${lang === 'fr' ? 'Perspective marocaine' : 'منظور مغربي'}</div>
    </div>
  </section>

  <section class="themes section" id="themes">
    <div class="section-head">
      <div>
        <div class="eyebrow muted">${lang === 'fr' ? 'LES GRANDS ENJEUX' : 'القضايا الرئيسية'}</div>
        <h2>${t.sections}</h2>
      </div>
      <p>${t.sectionsIntro}</p>
    </div>
    <div class="theme-grid">
      ${t.themes.map((x, i) => `
        <button type="button" class="theme-card theme-${i + 1} ${activeTheme === i ? 'is-selected' : ''}" data-theme="${i}">
          <div class="theme-top"><span>${x.num}</span><span class="theme-arrow">${activeTheme === i ? '●' : '↗'}</span></div>
          <div class="theme-icon">${['⌘', '◒', '◎', '⌕'][i]}</div>
          <h3>${x.title}</h3>
          <p>${x.desc}</p>
        </button>
      `).join('')}
    </div>
    <div class="theme-panel" id="theme-detail">
      <div class="theme-panel-top">
        <strong>${currentTheme.num} · ${currentTheme.title}</strong>
        <a href="#research">${lang === 'fr' ? 'Aller à l’espace de recherche →' : 'الانتقال إلى فضاء البحث ←'}</a>
      </div>
      <p>${currentTheme.focus}</p>
      <div class="theme-tags">
        ${currentTheme.tags.map(tag => `<span>${tag}</span>`).join('')}
      </div>
    </div>
  </section>

  <section class="academy" id="academy">
    <div class="academy-content">
      <div class="eyebrow light">${t.academy}</div>
      <h2>${t.academyTitle}</h2>
      <p>${t.academyText}</p>
      <a class="btn white" href="#research">${t.academyLink} ↗</a>
    </div>
    <div class="academy-visual">
      <div class="book book-one"></div>
      <div class="book book-two"></div>
      <div class="book-page"><span>KITN</span><b>ACADEMY</b><small>LEARN · PREPARE · SUCCEED</small><div class="page-lines"></div></div>
    </div>
  </section>

  <section class="method section" id="method">
    <div>
      <div class="eyebrow muted">${t.method}</div>
      <h2>${t.methodTitle}</h2>
    </div>
    <div class="method-right">
      <p>${t.methodText}</p>
      <ul class="principle-list">
        ${t.principles.map((p, i) => `
          <li>
            <button type="button" class="principle-btn ${activePrinciple === i ? 'is-active' : ''}" data-principle="${i}">
              <span>0${i + 1}</span>
              <strong>${p.title}</strong>
              <b>${activePrinciple === i ? '↓' : '↗'}</b>
            </button>
          </li>
        `).join('')}
      </ul>
      <div class="principle-box" id="principle-detail">
        <strong>0${activePrinciple + 1} · ${currentPrinciple.title}</strong>
        <p>${currentPrinciple.detail}</p>
      </div>
    </div>
  </section>

  <section class="research-strip" id="research">
    <span class="research-symbol">✳</span>
    <div>
      <b>${lang === 'fr' ? 'La connaissance commence par une bonne question.' : 'تبدأ المعرفة بسؤال جيد.'}</b>
      <p>KITN — De l’information à la maîtrise.</p>
    </div>
    <a href="#explorer">↑</a>
  </section>
</main>
<footer>
  <a class="brand" href="#"><span class="brand-mark">K</span><span>KITN<span class="brand-dot">.</span></span></a>
  <p>${t.footer}</p>
  <span>© 2026 KITN</span>
</footer>`

  document.querySelector('#language').addEventListener('click', () => {
    lang = lang === 'fr' ? 'ar' : 'fr'
    render()
  })

  document.querySelectorAll('.theme-card').forEach((card) => {
    card.addEventListener('click', () => {
      activeTheme = Number(card.dataset.theme)
      render()
    })
  })

  document.querySelectorAll('.principle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      activePrinciple = Number(btn.dataset.principle)
      render()
    })
  })
}

render()
