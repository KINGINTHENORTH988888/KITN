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
