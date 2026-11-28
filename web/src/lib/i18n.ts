export type Lang = 'fr' | 'ar';

export const POLE_LABELS: Record<string, { fr: string; ar: string }> = {
  institutions_gouvernance: {
    fr: 'Institutions & Gouvernance',
    ar: 'المؤسسات والحكامة'
  },
  economie_finances_publiques: {
    fr: 'Économie & Finances Publiques',
    ar: 'الاقتصاد والمالية العمومية'
  },
  relations_internationales_geopolitique: {
    fr: 'Relations Internationales & Géopolitique',
    ar: 'العلاقات الدولية والجغرافيا السياسية'
  },
  securite_affaires_interieures: {
    fr: 'Sécurité & Affaires Intérieures',
    ar: 'الأمن والشؤون الداخلية'
  },
  societe_developpement_humain: {
    fr: 'Société & Développement Humain',
    ar: 'المجتمع والتنمية البشرية'
  },
  recherche_scientifique: {
    fr: 'Recherche Scientifique & Études',
    ar: 'البحث العلمي والدراسات'
  }
};

export const DOC_TYPE_LABELS: Record<string, { fr: string; ar: string }> = {
  publication_scientifique: {
    fr: 'Publication scientifique',
    ar: 'منشور علمي'
  },
  rapport_institutionnel: {
    fr: 'Rapport institutionnel',
    ar: 'تقرير مؤسساتي'
  },
  document_juridique: {
    fr: 'Document juridique',
    ar: 'وثيقة قانونية'
  },
  statistique: {
    fr: 'Donnée & Statistique',
    ar: 'معطيات وإحصائيات'
  }
};

export const UI_TEXT = {
  fr: {
    brandSub: 'Veille Stratégique & Académique • Maroc',
    navHome: 'Accueil',
    navWatch: 'Veille',
    navLibrary: 'Bibliothèque',
    navAcademy: 'KITN Academy',
    navFavorites: 'Favoris',
    switchLang: 'العربية',
    heroBadge: 'OBSERVATOIRE ANALYTIQUE • MAROC',
    heroTitle: 'Comprendre le Maroc. Structurer la décision.',
    heroDesc:
      'Plateforme bilingue zéro-coût dédiée au suivi documentaire, à l’analyse stratégique et à la préparation académique et institutionnelle sur le Maroc.',
    ctaWatch: 'Accéder à la veille',
    ctaAcademy: 'Explorer KITN Academy',
    statTotal: 'Publications indexées',
    statPoles: 'Pôles thématiques',
    statSources: 'Sources vérifiées',
    statUpdated: 'Dernière mise à jour',
    polesTitle: 'Les 6 pôles d’analyse',
    polesSubtitle: 'Classement automatisé et hiérarchisé selon la pertinence stratégique liée au Maroc.',
    recentTitle: 'Dernières publications relevées',
    viewAll: 'Voir tout le catalogue',
    searchPlaceholder: 'Rechercher un titre, auteur, mot-clé ou thème...',
    filterPole: 'Pôle',
    filterType: 'Type de document',
    filterLang: 'Langue',
    filterSource: 'Source',
    filterMonth: 'Mois',
    filterScore: 'Score pertinence min.',
    filterAccess: 'Accès document',
    filterSort: 'Tri',
    allOption: 'Tous',
    pdfOrVerified: 'PDF direct ou lien vérifié',
    sortRecent: 'Plus récents',
    sortRelevance: 'Pertinence Maroc',
    resultsCount: 'résultat(s)',
    resetFilters: 'Réinitialiser les filtres',
    openSource: 'Consulter la source',
    openPdf: 'Télécharger le PDF',
    saveFav: 'Enregistrer',
    savedFav: 'Enregistré',
    noResults: 'Aucune publication ne correspond aux critères sélectionnés.',
    healthTitle: 'État des sources d’information',
    healthDesc: 'Suivi des sources activées et de leur présence dans le dernier rapport de collecte.',
    healthActive: 'Sources activées',
    healthOperational: 'Opérationnelles',
    healthAttention: 'À surveiller',
    healthUnverified: 'Non vérifiées',
    healthReportDate: 'Dernier rapport',
    healthReportFresh: 'Rapport récent',
    healthReportStale: 'Rapport ancien',
    healthReportUnknown: 'Date inconnue',
    healthShowSources: 'Afficher le détail des sources',
    healthStatusOk: 'Opérationnelle',
    healthStatusWarning: 'Avertissement',
    healthStatusError: 'Échec de collecte',
    healthStatusUnknown: 'Non vérifiée',
    healthNoReportDetail: 'Aucune ligne pour cette source dans le dernier rapport : son exécution n’est pas démontrée.',
    healthFetched: 'Examinés',
    healthAccepted: 'Retenus',
    favTitle: 'Mes favoris enregistrés',
    favDesc: 'Retrouvez ici les publications et fiches marquées localement sur votre navigateur.',
    favEmpty: 'Aucun favori enregistré pour le moment.',
    academyTitle: 'KITN Academy',
    academyDesc:
      'Modules structurés de méthode, gouvernance publique, économie marocaine et analyse de politiques publiques.',
    ficheTitle: 'Fiche analytique',
    ficheBack: 'Retour à la veille',
    ficheRelevance: 'Justification pertinence Maroc',
    ficheLinkStatus: 'État du lien',
    ficheAuthors: 'Auteurs',
    ficheDate: 'Date de publication',
    ficheSource: 'Source',
    ficheDoi: 'Identifiant DOI',
    ficheAbstract: 'Résumé / Extrait',
    noAbstract: 'Résumé non fourni par la source d’origine ; consulter la publication complète via le lien officiel.'
  },
  ar: {
    brandSub: 'رصد استراتيجي وأكاديمي • المغرب',
    navHome: 'الرئيسية',
    navWatch: 'الرصد',
    navLibrary: 'المكتبة',
    navAcademy: 'أكاديمية KITN',
    navFavorites: 'المفضلة',
    switchLang: 'Français',
    heroBadge: 'منصة تحليلية • المغرب',
    heroTitle: 'فهم المغرب. هيكلة القرار.',
    heroDesc:
      'منصة ثنائية اللغة مجانية بالكامل مخصصة للرصد الوثائقي والتحليل الاستراتيجي والتحضير الأكاديمي والمؤسساتي حول المغرب.',
    ctaWatch: 'الولوج إلى الرصد',
    ctaAcademy: 'استكشاف أكاديمية KITN',
    statTotal: 'المنشورات المفهرسة',
    statPoles: 'الأقطاب الموضوعاتية',
    statSources: 'المصادر المعتمدة',
    statUpdated: 'آخر تحديث',
    polesTitle: 'الأقطاب الستة للتحليل',
    polesSubtitle: 'تصنيف آلي ومرتب حسب الصلة الاستراتيجية بالمغرب.',
    recentTitle: 'أحدث المنشورات المرصودة',
    viewAll: 'عرض كامل الفهرس',
    searchPlaceholder: 'ابحث بالعنوان أو المؤلف أو الكلمة المفتاحية...',
    filterPole: 'القطب',
    filterType: 'نوع الوثيقة',
    filterLang: 'اللغة',
    filterSource: 'المصدر',
    filterMonth: 'الشهر',
    filterScore: 'الحد الأدنى للملاءمة',
    filterAccess: 'توفر الوثيقة',
    filterSort: 'الترتيب',
    allOption: 'الكل',
    pdfOrVerified: 'ملف PDF مباشر أو رابط متحقق',
    sortRecent: 'الأحدث',
    sortRelevance: 'الملاءمة للمغرب',
    resultsCount: 'نتيجة',
    resetFilters: 'إعادة ضبط المرشحات',
    openSource: 'فتح المصدر',
    openPdf: 'تحميل PDF',
    saveFav: 'حفظ',
    savedFav: 'محفوظ',
    noResults: 'لا توجد منشورات مطابقة للمعايير المحددة.',
    healthTitle: 'حالة مصادر المعلومات',
    healthDesc: 'تتبع المصادر المفعّلة وظهورها في آخر تقرير لجمع البيانات.',
    healthActive: 'المصادر المفعّلة',
    healthOperational: 'تعمل بشكل سليم',
    healthAttention: 'مصادر تستوجب المتابعة',
    healthUnverified: 'غير متحقق منها',
    healthReportDate: 'آخر تقرير',
    healthReportFresh: 'تقرير حديث',
    healthReportStale: 'تقرير قديم',
    healthReportUnknown: 'تاريخ غير معروف',
    healthShowSources: 'عرض تفاصيل المصادر',
    healthStatusOk: 'يعمل بشكل سليم',
    healthStatusWarning: 'تنبيه',
    healthStatusError: 'فشل الجمع',
    healthStatusUnknown: 'غير متحقق منه',
    healthNoReportDetail: 'لا يوجد سجل لهذا المصدر في آخر تقرير؛ ولا يمكن إثبات تنفيذ عملية الجمع.',
    healthFetched: 'تم فحصها',
    healthAccepted: 'تم الاحتفاظ بها',
    favTitle: 'العناصر المحفوظة في المفضلة',
    favDesc: 'تجد هنا المنشورات والملفات التي حفظتها محلياً في متصفحك.',
    favEmpty: 'لا توجد عناصر محفوظة في المفضلة حالياً.',
    academyTitle: 'أكاديمية KITN',
    academyDesc:
      'وحدات تكوينية منظمة في المنهجية والحكامة العمومية والاقتصاد المغربي وتحليل السياسات العمومية.',
    ficheTitle: 'البطاقة التحليلية',
    ficheBack: 'العودة إلى الرصد',
    ficheRelevance: 'مبررات الصلة بالمغرب',
    ficheLinkStatus: 'حالة الرابط',
    ficheAuthors: 'المؤلفون',
    ficheDate: 'تاريخ النشر',
    ficheSource: 'المصدر',
    ficheDoi: 'معرف DOI',
    ficheAbstract: 'الملخص / المقتطف',
    noAbstract: 'الملخص غير متوفر في المصدر الأصلي؛ يرجى الاطلاع على الوثيقة الكاملة عبر الرابط الرسمي.'
  }
} as const;

export function getPoleLabel(pole: string, lang: Lang): string {
  return POLE_LABELS[pole]?.[lang] || pole;
}

export function getDocTypeLabel(docType: string, lang: Lang): string {
  return DOC_TYPE_LABELS[docType]?.[lang] || docType;
}
