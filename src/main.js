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
    { id: "all", label: "Portail & Vue globale" },
    { id: "veille", label: "Actualité & veille" },
    { id: "science", label: "Articles scientifiques" },
    { id: "chiffres", label: "Maroc en chiffres" },
    { id: "academy", label: "Concours & Academy" },
    { id: "bibliotheque", label: "Bibliothèque" },
    { id: "contribuer", label: "Administration & contributions" }
  ],
  ar: [
    { id: "all", label: "البوابة والنظرة العامة" },
    { id: "veille", label: "الأخبار والرصد" },
    { id: "science", label: "المقالات العلمية" },
    { id: "chiffres", label: "المغرب بالأرقام" },
    { id: "academy", label: "المباريات والأكاديمية" },
    { id: "bibliotheque", label: "المكتبة الوثائقية" },
    { id: "contribuer", label: "الإدارة والمساهمات" }
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
    statTotal: "Notices indexées",
    statScience: "Articles scientifiques",
    statStats: "Chiffres & données",
    statLibrary: "Bibliothèque & rapports",
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
    statTotal: "المواد المفهرسة",
    statScience: "المقالات العلمية",
    statStats: "الأرقام والبيانات",
    statLibrary: "المكتبة والتقارير",
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
let searchQuery = "";
let futureDatesOnly = false;
let favoritesOnly = false;
let favorites = loadJsonStorage(FAVORITES_KEY, []);
let manualItems = loadJsonStorage(MANUAL_ITEMS_KEY, []);
let statusOverrides = {};
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
  if
