(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const c of document.querySelectorAll('link[rel="modulepreload"]'))s(c);new MutationObserver(c=>{for(const o of c)if(o.type==="childList")for(const l of o.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&s(l)}).observe(document,{childList:!0,subtree:!0});function n(c){const o={};return c.integrity&&(o.integrity=c.integrity),c.referrerPolicy&&(o.referrerPolicy=c.referrerPolicy),c.crossOrigin==="use-credentials"?o.credentials="include":c.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(c){if(c.ep)return;c.ep=!0;const o=n(c);fetch(c.href,o)}})();const Ve="kitn_favorites_v1",F="kitn_manual_items_v1";function ot(){const e=new Date,a=e.getUTCFullYear(),n=String(e.getUTCMonth()+1).padStart(2,"0"),s=String(e.getUTCDate()).padStart(2,"0");return`${a}-${n}-${s}`}const oe=ot(),rt={fr:[{id:"all",label:"Portail & Vue globale"},{id:"veille",label:"Actualité & veille"},{id:"science",label:"Articles scientifiques"},{id:"chiffres",label:"Maroc en chiffres"},{id:"academy",label:"Concours & Academy"},{id:"bibliotheque",label:"Bibliothèque"},{id:"contribuer",label:"Administration & contributions"}],ar:[{id:"all",label:"البوابة والنظرة العامة"},{id:"veille",label:"الأخبار والرصد"},{id:"science",label:"المقالات العلمية"},{id:"chiffres",label:"المغرب بالأرقام"},{id:"academy",label:"المباريات والأكاديمية"},{id:"bibliotheque",label:"المكتبة الوثائقية"},{id:"contribuer",label:"الإدارة والمساهمات"}]},le={fr:[{num:"01",symbol:"⌘",poles:["institutions_gouvernance"],title:"Institutions & gouvernance",desc:"Politiques publiques, institutions, administration et réformes.",detail:"Analyse des politiques publiques, de l'action administrative, de la décentralisation et de la gouvernance institutionnelle au Maroc.",tags:["Politiques publiques","Gouvernance","Administration","Réformes"]},{num:"02",symbol:"◎",poles:["economie_finances_publiques","societe_developpement_humain"],title:"Économie & société",desc:"Indicateurs, emploi, développement humain et mutations sociales.",detail:"Lecture des dynamiques économiques, chaînes de valeur, finances publiques, développement humain et mutations sociales.",tags:["Économie","Finances publiques","Société & développement humain","Mutations sociales"]},{num:"03",symbol:"⊕",poles:["securite_affaires_interieures","relations_internationales_geopolitique"],title:"Sécurité, territoires & géopolitique",desc:"Sécurité publique, prévention, territoires, ressources et enjeux stratégiques.",detail:"Suivi des affaires intérieures, de la sécurité publique, des dynamiques territoriales et du positionnement stratégique du Maroc.",tags:["Sécurité & affaires intérieures","Territoires","Géopolitique","Ressources"]},{num:"04",symbol:"✧",poles:["recherche_scientifique"],title:"Recherche & études",desc:"Publications académiques, jeux de données et analyses de fond.",detail:"Indexation des travaux scientifiques, études sectorielles et données de référence sur le Maroc.",tags:["Publications","Données","Études","Veille"]}],ar:[{num:"01",symbol:"⌘",poles:["institutions_gouvernance"],title:"المؤسسات والحكامة",desc:"السياسات العمومية، المؤسسات، الإدارة والإصلاحات.",detail:"تحليل السياسات العمومية والعمل الإداري واللامركزية والحكامة المؤسساتية في المغرب.",tags:["السياسات العمومية","الحكامة","الإدارة","الإصلاحات"]},{num:"02",symbol:"◎",poles:["economie_finances_publiques","societe_developpement_humain"],title:"الاقتصاد والمجتمع",desc:"المؤشرات، الشغل، التنمية البشرية والتحولات الاجتماعية.",detail:"قراءة الديناميات الاقتصادية وسلاسل القيمة والمالية العمومية والتنمية البشرية والتحولات الاجتماعية.",tags:["الاقتصاد","المالية العمومية","المجتمع والتنمية البشرية","التحولات الاجتماعية"]},{num:"03",symbol:"⊕",poles:["securite_affaires_interieures","relations_internationales_geopolitique"],title:"الأمن والمجالات والجيوسياسة",desc:"الأمن العمومي، الوقاية، المجالات الترابية والموارد والقضايا الاستراتيجية.",detail:"تتبع الشؤون الداخلية والأمن العمومي والديناميات الترابية والموقع الاستراتيجي للمغرب.",tags:["الأمن والشؤون الداخلية","المجالات الترابية","الجيوسياسة","الموارد"]},{num:"04",symbol:"✧",poles:["recherche_scientifique"],title:"البحث والدراسات",desc:"منشورات أكاديمية، قواعد بيانات وتحليلات معمقة.",detail:"فهرسة الأعمال العلمية والدراسات القطاعية والبيانات المرجعية حول المغرب.",tags:["منشورات","بيانات","دراسات","رصد"]}]},Ue={fr:{institutions_gouvernance:"Institutions & gouvernance",economie_finances_publiques:"Économie & finances publiques",societe_developpement_humain:"Société & développement humain",relations_internationales_geopolitique:"Relations internationales & géopolitique",securite_affaires_interieures:"Sécurité & affaires intérieures",recherche_scientifique:"Recherche scientifique"},ar:{institutions_gouvernance:"المؤسسات والحكامة",economie_finances_publiques:"الاقتصاد والمالية العمومية",societe_developpement_humain:"المجتمع والتنمية البشرية",relations_internationales_geopolitique:"العلاقات الدولية والجيوسياسة",securite_affaires_interieures:"الأمن والشؤون الداخلية",recherche_scientifique:"البحث العلمي"}},re={fr:[{id:"dgsn",label:"DGSN",level:"Supérieur / Cadres",domain:"Sécurité publique & ordre public",deadline:"Session annuelle — selon annonce officielle",title:"Concours DGSN — Sécurité & ordre public",sheet:"Police de proximité, coopération sécuritaire, digitalisation des services et protection des droits.",methodology:"Structurer l'analyse autour du cadre juridique, de la prévention de proximité et de la coordination territoriale.",past_topics:["La police de proximité et la confiance citoyenne"],question:"Quel principe résume le mieux la doctrine moderne de sécurité publique au Maroc ?",options:["La prévention, la proximité citoyenne et la légalité","L'isolement administratif des services","L'absence de coordination territoriale"],answer:0,correction:"La sécurité moderne repose sur la prévention, la proximité avec le citoyen, l'efficacité opérationnelle et le respect de la loi."},{id:"irat",label:"IRAT",level:"Administrateurs / Cadres territoriaux",domain:"Administration territoriale & gouvernance",deadline:"Session annuelle — selon annonce officielle",title:"IRAT — Administration territoriale & gouvernance",sheet:"Déconcentration administrative, régionalisation avancée, coordination locale et politiques publiques.",methodology:"Croiser le cadre de la déconcentration, les collectivités territoriales et la cohérence locale.",past_topics:["La déconcentration administrative au service des politiques territoriales"],question:"Quel levier renforce l'efficacité de l'action publique au niveau territorial ?",options:["La déconcentration et la convergence des programmes locaux","La multiplication des procédures sans coordination","L'absence d'évaluation des politiques publiques"],answer:0,correction:"La déconcentration administrative et la cohérence territoriale permettent de mieux adapter les politiques publiques aux réalités locales."},{id:"admin",label:"Concours admin",level:"Administration publique",domain:"Finances publiques & réformes",deadline:"Selon annonces Emploi Public & ministères",title:"Concours administratifs — Finances & réformes",sheet:"Budgétisation axée sur la performance, protection sociale, transition numérique et service public.",methodology:"Analyser l'enjeu stratégique, le dispositif budgétaire/juridique et l'impact sur l'usager.",past_topics:["Performance de la dépense publique et qualité du service"],question:"Que vise principalement la réforme de la gestion publique axée sur les résultats ?",options:["L'efficacité de la dépense, la redevabilité et la qualité du service","La suppression du contrôle budgétaire","La réduction de la transparence"],answer:0,correction:"La gestion axée sur les résultats lie les moyens engagés aux objectifs et à l'impact réel pour l'usager."}],ar:[{id:"dgsn",label:"الأمن الوطني DGSN",level:"أطر عليا / أمني",domain:"الأمن العمومي والنظام العام",deadline:"حسب الإعلان الرسمي للمباراة",title:"مباريات الأمن الوطني — الأمن والنظام العام",sheet:"شرطة القرب، التعاون الأمني، رقمنة الخدمات وحماية الحقوق.",methodology:"هيكلة التحليل حول الإطار القانوني والوقاية القريبة والتنسيق الترابي.",past_topics:["شرطة القرب وتعزيز الثقة مع المواطن"],question:"ما المبدأ الذي يلخص بأفضل شكل المقاربة الحديثة للأمن العمومي بالمغرب؟",options:["الوقاية والقرب من المواطن واحترام القانون","انغلاق المصالح الإدارية","غياب التنسيق الترابي"],answer:0,correction:"يرتكز العمل الأمني الحديث على الوقاية والقرب من المواطن والنجاعة الميدانية وسيادة القانون."},{id:"irat",label:"الإدارة الترابية IRAT",level:"أطر الإدارة الترابية",domain:"الإدارة الترابية والحكامة",deadline:"حسب الإعلان الرسمي للمباراة",title:"الإدارة الترابية والحكامة",sheet:"اللاتمركز الإداري، الجهوية المتقدمة، التنسيق المحلي والسياسات العمومية.",methodology:"الربط بين ميثاق اللاتمركز وأدوار الجماعات الترابية والتقائية السياسات العمومية.",past_topics:["اللاتمركز الإداري في خدمة انسجام السياسات الترابية"],question:"ما الآلية التي تعزز نجاعة العمل العمومي على المستوى الترابي؟",options:["اللاتمركز وتكامل البرامج المحلية","تعدد المساطر دون تنسيق","غياب تقييم السياسات العمومية"],answer:0,correction:"يساعد اللاتمركز الإداري والالتقائية الترابية على ملاءمة السياسات العمومية مع خصوصيات كل مجال."},{id:"admin",label:"المباريات الإدارية",level:"الإدارة العمومية",domain:"المالية العمومية والإصلاحات",deadline:"حسب إعلانات التشغيل العمومي والوزارات",title:"المباريات الإدارية — المالية والإصلاحات",sheet:"الميزانية المبنية على النجاعة، الحماية الاجتماعية، التحول الرقمي والمرفق العام.",methodology:"تحديد الرهان الاستراتيجي وتحليل الآلية المالية أو التنظيمية والأثر على المرتفق.",past_topics:["نجاعة الإنفاق العمومي وجودة الخدمة المقدمة للمرتفق"],question:"ما الهدف الأساسي لإصلاح التدبير العمومي القائم على النتائج؟",options:["نجاعة الإنفاق والمساءلة وجودة الخدمة للمرتفق","إلغاء المراقبة الميزانياتية","تقليص الشفافية"],answer:0,correction:"يربط التدبير القائم على النتائج الاعتمادات المرصودة بالأهداف والأثر الفعلي على المواطن."}]},ze={fr:{publication_scientifique:"Publication scientifique",statistique:"Statistique / Jeu de données",rapport:"Rapport",rapport_institutionnel:"Rapport institutionnel",document_juridique:"Document juridique",article:"Article",article_presse:"Article de presse",concours:"Concours / Ressource",ressource_pedagogique:"Ressource pédagogique"},ar:{publication_scientifique:"منشور علمي",statistique:"إحصائية / مجموعة بيانات",rapport:"تقرير",rapport_institutionnel:"تقرير مؤسساتي",document_juridique:"وثيقة قانونية",article:"مقال",article_presse:"مقال صحفي",concours:"مباراة / مورد",ressource_pedagogique:"مورد بيداغوجي"}},ct={fr:{eleve:"Confiance élevée",moyen:"Confiance moyenne",faible:"Confiance faible"},ar:{eleve:"موثوقية عالية",moyen:"موثوقية متوسطة",faible:"موثوقية منخفضة"}},dt={fr:{fr:"Français",en:"Anglais",ar:"Arabe"},ar:{fr:"الفرنسية",en:"الإنجليزية",ar:"العربية"}},ut={fr:[{num:"01",title:"Vérifier avant de conclure",text:"Croiser les sources académiques, institutionnelles et statistiques avant de retenir un fait."},{num:"02",title:"Structurer plutôt qu'empiler",text:"Classer chaque notice par espace, pôle, type de document et date pour retrouver l'essentiel vite."},{num:"03",title:"Relier l'analyse au terrain",text:"Lire les transformations du Maroc à travers leurs effets concrets sur l'économie et la société."}],ar:[{num:"01",title:"التحقق قبل الاستنتاج",text:"مقاطعة المصادر الأكاديمية والمؤسساتية والإحصائية قبل اعتماد أي معطى."},{num:"02",title:"الهيكلة بدل التكديس",text:"تصنيف كل مادة حسب الفضاء والقطب ونوع الوثيقة والتاريخ للوصول السريع إلى الجوهر."},{num:"03",title:"ربط التحليل بالواقع",text:"قراءة تحولات المغرب عبر آثارها الملموسة على الاقتصاد والمجتمع."}]},v={fr:{langBtn:"العربية",menuBtn:"Menu",navThemes:"Thématiques",navAcademy:"KITN Academy",navMethod:"Méthode",navResearch:"Espaces & Index",eyebrow:"Plateforme marocaine de veille stratégique, recherche, données & concours",heroTitle:"Comprendre le Maroc. <span>Anticiper</span> ses transformations.",heroIntro:"De l'information à la maîtrise : un outil structuré pour la veille stratégique, les publications scientifiques, les indicateurs du Maroc, la bibliothèque documentaire et la préparation aux concours.",heroPrimary:"Accéder aux espaces ↗",heroSecondary:"Découvrir la méthode →",heroNote:"DE L'INFORMATION À LA MAÎTRISE · MAROC",card1Top:"01 / MAROC",card1Map:"MA",card2Top:"KITN / 2026",card2Cap:"<strong>Information</strong> → Maîtrise",chip:"✦ De l'information à la maîtrise",hubTitle:"Accès direct par espace",hubSub:"Chaque rubrique dispose de son périmètre, de ses repères et de son filtrage dédié.",openSpaceBtn:"Ouvrir l'espace →",statTotal:"Notices indexées",statScience:"Articles scientifiques",statStats:"Chiffres & données",statLibrary:"Bibliothèque & rapports",themesEyebrow:"Les grands enjeux",themesTitle:"Explorer par thématique",themesSub:"Des sujets essentiels, organisés pour aller au-delà de l'actualité et comprendre les dynamiques de fond.",openPole:"Filtrer les notices de ce pôle →",activePoleBanner:"Filtre actif sur le pôle :",allPoles:"Tous les pôles",allPolesSelect:"Tous les pôles (6)",academyEyebrow:"KITN Academy & Concours",academyTitle:"Apprendre avec méthode, pas dans la précipitation.",academyText:"Conditions, échéances, anciens sujets, méthodologie, fiches de révision et QCM pour préparer les concours.",academyLevelLabel:"Profil / Niveau",academyDomainLabel:"Domaine",academyDeadlineLabel:"Échéance / Repère",academySheetLabel:"Fiche de révision",academyMethodLabel:"Méthodologie & anciens sujets",academyQuizLabel:"QCM d'entraînement",methodEyebrow:"Notre approche",methodTitle:"La connaissance commence par une bonne question.",methodText:"KITN privilégie la clarté, la vérification, le respect des droits d'auteur et la mise en perspective.",researchEyebrow:"Espaces dédiés & Index documentaire",researchTitle:"Navigation par espace & notices",searchPlaceholder:"Rechercher par titre, auteur, institution, mot-clé, pôle ou résumé...",dateFromLabel:"Du",dateToLabel:"Au",allTypes:"Tous les types",allConfidence:"Toutes confiances",allDocLangs:"Toutes langues",sortNewest:"Date : plus récent",sortOldest:"Date : plus ancien",sortScore:"Pertinence : score décroissant",resetFilters:"Réinitialiser",exportJson:"Exporter JSON",savedOnly:"Favoris uniquement",saveBtn:"Enregistrer",savedBtn:"Enregistré",futureOnly:"Dates futures à vérifier uniquement",futureBadge:"Date future (à vérifier)",unverifiedBadge:"À vérifier",archivedBadge:"Archivé",noAbstract:"Résumé non fourni par la source.",detailsBtn:"Fiche détaillée",noResults:"Aucune notice ne correspond à votre recherche ou à cet espace.",sourceLink:"Consulter la source ↗",pdfLink:"PDF / Texte intégral ↗",closeBtn:"Fermer",labelAuthor:"Auteurs",labelVenue:"Revue / Institution",labelKeywords:"Mots-clés",labelDate:"Date de publication",labelCollected:"Collecté le",labelUpdated:"Mis à jour le",labelPole:"Pôle",labelSpace:"Espace",labelStatus:"Statut éditorial",labelType:"Type de document",labelDocLang:"Langue",labelConfidence:"Fiabilité",labelScore:"Score",labelDoi:"DOI",labelAnalysis:"Analyse stratégique",labelAbstract:"Résumé",statusValid:"Vérifié / Publié",statusReview:"À vérifier",statusArchived:"Archivé",validateBtn:"Valider",archiveBtn:"Archiver",deleteBtn:"Supprimer",manualTitle:"Espace d'administration & contributions (local)",manualSub:"Ajoutez, validez, archivez ou supprimez un article, une actualité, un concours, un document, une étude, une statistique ou une ressource pédagogique, puis exportez le JSON.",manualLabelTitle:"Titre *",manualLabelType:"Type",manualLabelSpace:"Espace cible",manualLabelPole:"Pôle principal",manualLabelDate:"Date (YYYY-MM-DD)",manualLabelVenue:"Revue / Institution",manualLabelKeywords:"Mots-clés (séparés par virgule)",manualLabelUrl:"Lien source (URL)",manualLabelPdf:"Lien PDF / Texte intégral (URL)",manualLabelResume:"Résumé / Note",manualLabelAnalysis:"Analyse stratégique (optionnel)",manualAddBtn:"Publier dans la base locale",manualExportBtn:"Exporter contributions JSON",manualClearBtn:"Vider contributions locales",manualAddedMsg:"Contribution enregistrée localement et intégrée dans l'index.",footerCopy:"© 2026 KITN — De l'information à la maîtrise."},ar:{langBtn:"Français",menuBtn:"القائمة",navThemes:"المحاور",navAcademy:"أكاديمية KITN",navMethod:"المنهجية",navResearch:"الفضاءات والفهرس",eyebrow:"المنصة المغربية للرصد الاستراتيجي والبحث والبيانات والمباريات",heroTitle:"فهم المغرب. <span>واستشراف</span> تحولاته.",heroIntro:"من المعلومة إلى التمكن: أداة مهيكلة للرصد الاستراتيجي والمنشورات العلمية والمؤشرات المغربية والمكتبة الوثائقية والاستعداد للمباريات.",heroPrimary:"الولوج إلى الفضاءات ↗",heroSecondary:"اكتشف المنهجية ←",heroNote:"من المعلومة إلى التمكن · المغرب",card1Top:"01 / المغرب",card1Map:"MA",card2Top:"KITN / 2026",card2Cap:"<strong>المعلومة</strong> ← التمكن",chip:"✦ من المعلومة إلى التمكن",hubTitle:"وصول مباشر حسب الفضاء",hubSub:"لكل فضاء اختصاصه ومعالمه وآليات التصفية الخاصة به.",openSpaceBtn:"فتح الفضاء ←",statTotal:"المواد المفهرسة",statScience:"المقالات العلمية",statStats:"الأرقام والبيانات",statLibrary:"المكتبة والتقارير",themesEyebrow:"القضايا الكبرى",themesTitle:"الاستكشاف حسب المحور",themesSub:"مواضيع أساسية منظمة لتجاوز الأخبار اليومية وفهم الديناميات العميقة.",openPole:"تصفية المواد حسب هذا القطب ←",activePoleBanner:"تصفية نشطة حسب القطب:",allPoles:"كل الأقطاب",allPolesSelect:"كل الأقطاب (6)",academyEyebrow:"أكاديمية KITN والمباريات",academyTitle:"التعلم بمنهجية، لا بتسرع.",academyText:"شروط الترشيح والآجال والمواضيع السابقة والمنهجية وبطاقات المراجعة والاختبارات للاستعداد للمباريات.",academyLevelLabel:"الإطار / المستوى",academyDomainLabel:"المجال",academyDeadlineLabel:"الآجال / معلم",academySheetLabel:"بطاقة مراجعة",academyMethodLabel:"المنهجية والمواضيع السابقة",academyQuizLabel:"اختبار تفاعلي",methodEyebrow:"مقاربتنا",methodTitle:"المعرفة تبدأ بسؤال جيد.",methodText:"تُقدّم KITN الوضوح والتحقق واحترام حقوق النشر والربط السياقي.",researchEyebrow:"الفضاءات المتخصصة والفهرس الوثائقي",researchTitle:"التنقل حسب الفضاء والمواد",searchPlaceholder:"ابحث بالعنوان أو المؤلف أو المؤسسة أو الكلمات المفتاحية أو القطب...",dateFromLabel:"من",dateToLabel:"إلى",allTypes:"كل الأنواع",allConfidence:"كل مستويات الموثوقية",allDocLangs:"كل اللغات",sortNewest:"التاريخ: الأحدث",sortOldest:"التاريخ: الأقدم",sortScore:"الملاءمة: الأعلى أولاً",resetFilters:"إعادة الضبط",exportJson:"تصدير JSON",savedOnly:"المحفوظات فقط",saveBtn:"حفظ",savedBtn:"محفوظ",futureOnly:"التواريخ المستقبلية للمراجعة فقط",futureBadge:"تاريخ مستقبلي (للمراجعة)",unverifiedBadge:"للمراجعة",archivedBadge:"مؤرشف",noAbstract:"الملخص غير متوفر في المصدر.",detailsBtn:"بطاقة تفصيلية",noResults:"لا توجد مواد مطابقة لبحثك أو لهذا الفضاء.",sourceLink:"عرض المصدر ↗",pdfLink:"ملف PDF / النص الكامل ↗",closeBtn:"إغلاق",labelAuthor:"المؤلفون",labelVenue:"المجلة / المؤسسة",labelKeywords:"الكلمات المفتاحية",labelDate:"تاريخ النشر",labelCollected:"تاريخ الجمع",labelUpdated:"تاريخ التحديث",labelPole:"القطب",labelSpace:"الفضاء",labelStatus:"الحالة التحريرية",labelType:"نوع الوثيقة",labelDocLang:"اللغة",labelConfidence:"الموثوقية",labelScore:"النتيجة",labelDoi:"المعرّف DOI",labelAnalysis:"تحليل استراتيجي",labelAbstract:"الملخص",statusValid:"متحقق منه / منشور",statusReview:"للمراجعة",statusArchived:"مؤرشف",validateBtn:"اعتماد",archiveBtn:"أرشفة",deleteBtn:"حذف",manualTitle:"فضاء الإدارة والمساهمات (محلي)",manualSub:"أضف أو اعتمد أو أرشف أو احذف مقالاً أو خبراً أو مباراة أو وثيقة أو دراسة أو إحصائية أو مورداً بيداغوجياً ثم صدّر JSON.",manualLabelTitle:"العنوان *",manualLabelType:"النوع",manualLabelSpace:"الفضاء المستهدف",manualLabelPole:"القطب الرئيسي",manualLabelDate:"التاريخ (YYYY-MM-DD)",manualLabelVenue:"المجلة / المؤسسة",manualLabelKeywords:"الكلمات المفتاحية (مفصولة بفاصلة)",manualLabelUrl:"رابط المصدر (URL)",manualLabelPdf:"رابط PDF / النص الكامل (URL)",manualLabelResume:"الملخص / ملاحظة",manualLabelAnalysis:"تحليل استراتيجي (اختياري)",manualAddBtn:"نشر في القاعدة المحلية",manualExportBtn:"تصدير المساهمات JSON",manualClearBtn:"مسح المساهمات المحلية",manualAddedMsg:"تم تسجيل المساهمة محلياً وإدراجها في الفهرس.",footerCopy:"© 2026 KITN — من المعلومة إلى التمكن."}};function Je(e,a){try{const n=localStorage.getItem(e),s=n?JSON.parse(n):a;return Array.isArray(s)?s:a}catch{return a}}function K(e,a){try{localStorage.setItem(e,JSON.stringify(a))}catch{}}function pt(e){return String(e||"").toLowerCase().replaceAll(/[^\p{L}\p{N}\s]+/gu," ").replaceAll(/\s+/g," ").trim()}function mt(e){if(!e)return"";try{const a=new URL(String(e).trim());return`${a.hostname.toLowerCase()}${a.pathname.replace(/\/+$/,"").toLowerCase()}`}catch{return String(e).trim().toLowerCase()}}function Ye(e){const a=[];if(e.id&&a.push(`id:${String(e.id).trim().toLowerCase()}`),e.doi){const o=String(e.doi).trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//,"");o&&a.push(`doi:${o}`)}const n=mt(e.url_publication);n&&a.push(`url:${n}`);const s=pt(e.titre_original),c=String(e.date_publication||"").slice(0,10);return s&&a.push(`title:${s}|${c}`),a}function y(e){return Ye(e)[0]||String(e.titre_original||"")}function X(e){if(e!=null&&e.espace)return String(e.espace);const a=String((e==null?void 0:e.type_document)||"").toLowerCase(),n=String((e==null?void 0:e.pole)||"").toLowerCase();return a==="concours"||a==="ressource_pedagogique"?"academy":a==="publication_scientifique"||n==="recherche_scientifique"?"science":a==="statistique"?"chiffres":["rapport","rapport_institutionnel","document_juridique"].includes(a)?"bibliotheque":"veille"}let r="fr",S="all",R=!1,W=0,I=null,k="",V="",U="",z="",J="",D="",P="",T="newest",Oe=0,se=0,O=null,Z="",ee=!1,te=!1,_=Je(Ve,[]),f=Je(F,[]),ae={},h=null,ce=[],C=[];function t(e=""){return String(e).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function B(e){if(!e||typeof e!="string")return!1;try{const a=new URL(e.trim());return a.protocol==="https:"||a.protocol==="http:"}catch{return!1}}function N(e){if(e&&e.date_anomalie===!0||e&&e.date_statut==="date_future_a_verifier")return!0;const a=String((e==null?void 0:e.date_publication)||"").slice(0,10);return/^\d{4}-\d{2}-\d{2}$/.test(a)?a>oe:!1}function bt(e){if(!D&&!P)return!0;const a=String((e==null?void 0:e.date_publication)||"").trim();if(!a)return!1;const n=a.slice(0,10);return!(D&&n<D||P&&n>P)}function j(e){var a;return e?((a=Ue[r])==null?void 0:a[e])||e:""}function ne(e){var a;return e?((a=ze[r])==null?void 0:a[e])||e:""}function He(e){var a;return e?((a=ct[r])==null?void 0:a[e])||e:""}function Qe(e){var a;return e?((a=dt[r])==null?void 0:a[e])||e.toUpperCase():""}function Ge(e){const a=y(e);return ae[a]?ae[a]:e.statut_validation||"valide"}function Fe(e,a){const n=y(e);n&&(ae[n]=a,(e.origine==="manuel"||String(e.id||"").startsWith("kitn_manual_"))&&(f=f.map(s=>y(s)===n?{...s,statut_validation:a}:s),K(F,f)),Y(),u(),h&&y(h)===n&&(h={...h,statut_validation:a},M()))}function vt(e){const a=y(e);f=f.filter(n=>y(n)!==a),K(F,f),Y(),u(),h&&y(h)===a&&(h=null,M())}function Y(){const e=new Set,a=[];for(const n of[...f,...ce]){const s=Ye(n);if(!s.length||s.some(o=>e.has(o)))continue;s.forEach(o=>e.add(o));const c=ae[s[0]]||n.statut_validation||"valide";a.push({...n,statut_validation:c})}C=a}function ft(e,a){if(!a||a==="all")return!0;if(a==="contribuer")return e.origine==="manuel"||String(e.id||"").startsWith("kitn_manual_");const n=X(e);return a==="veille"?n==="veille"||a===S:n===a}function ht(e){const a=y(e);a&&(_.includes(a)?_=_.filter(n=>n!==a):_=[..._,a],K(Ve,_),u())}function gt(){S="all",I=null,k="",V="",U="",z="",J="",D="",P="",T="newest",Z="",ee=!1,te=!1,b()}function We(){const e=Z.trim().toLowerCase();return C.filter(n=>{if(!ft(n,S)||!(!I||I.includes(n.pole))||V&&n.pole!==V||U&&n.type_document!==U||z&&n.confiance_classification!==z||J&&n.langue_originale!==J||!bt(n))return!1;if(ee){if(!N(n))return!1}else if(N(n))return!1;if(te&&!_.includes(y(n)))return!1;if(!e)return!0;const c=(n.titre_original||"").toLowerCase(),o=Array.isArray(n.auteurs)?n.auteurs.join(" ").toLowerCase():"",l=(n.revue_ou_institution||n.source_nom||"").toLowerCase(),m=Array.isArray(n.mots_cles)?n.mots_cles.join(" ").toLowerCase():"",g=(n.pole||"").toLowerCase(),$=j(n.pole).toLowerCase(),q=(n.type_document||"").toLowerCase(),p=ne(n.type_document).toLowerCase(),L=(n.resume||"").toLowerCase(),E=(n.analyse_strategique||"").toLowerCase();return c.includes(e)||o.includes(e)||l.includes(e)||m.includes(e)||g.includes(e)||$.includes(e)||q.includes(e)||p.includes(e)||L.includes(e)||E.includes(e)}).sort((n,s)=>{if(T==="score")return(Number(s.score_pertinence)||0)-(Number(n.score_pertinence)||0);const c=String(n.date_publication||""),o=String(s.date_publication||"");return T==="oldest"?c.localeCompare(o):o.localeCompare(c)})}function Ke(e,a){const n={exported_at:new Date().toISOString(),total:e.length,items:e},s=new Blob([JSON.stringify(n,null,2)],{type:"application/json"}),c=URL.createObjectURL(s),o=document.createElement("a");o.href=c,o.download=a,o.click(),URL.revokeObjectURL(c)}function M(){var L,E,w,x;const e=document.getElementById("notice-modal");if(e&&e.remove(),!h)return;const a=v[r],n=h,s=Ge(n),c=Array.isArray(n.auteurs)&&n.auteurs.length?n.auteurs.join(", "):r==="ar"?"مؤلف غير مذكور":"Auteur non renseigné",o=Array.isArray(n.mots_cles)&&n.mots_cles.length?n.mots_cles.join(" · "):"",l=n.resume&&String(n.resume).trim()?n.resume:a.noAbstract,m=s==="archive"?a.statusArchived:s==="valide"&&!N(n)?a.statusValid:a.statusReview,g=B(n.url_publication)?n.url_publication.trim():"",$=B(n.pdf_direct)?n.pdf_direct.trim():"",q=n.origine==="manuel"||String(n.id||"").startsWith("kitn_manual_"),p=document.createElement("div");p.id="notice-modal",p.className="modal-backdrop",p.innerHTML=`
    <div class="modal-card" role="dialog" aria-modal="true">
      <div class="modal-head">
        <span>${t(ne(n.type_document)||j(n.pole)||"")}</span>
        <button type="button" class="modal-close" id="close-modal">${t(a.closeBtn)} ✕</button>
      </div>
      <h3>${t(n.titre_original||"")}</h3>
      ${N(n)?`<span class="flag-warn">${t(a.futureBadge)}</span>`:""}
      <dl class="modal-meta">
        <div><dt>${t(a.labelAuthor)}</dt><dd>${t(c)}</dd></div>
        ${n.revue_ou_institution||n.source_nom?`<div><dt>${t(a.labelVenue)}</dt><dd>${t(n.revue_ou_institution||n.source_nom)}</dd></div>`:""}
        <div><dt>${t(a.labelDate)}</dt><dd>${t(n.date_publication||"—")}</dd></div>
        ${n.collecte_le?`<div><dt>${t(a.labelCollected)}</dt><dd>${t(String(n.collecte_le).slice(0,10))}</dd></div>`:""}
        ${n.mis_a_jour_le?`<div><dt>${t(a.labelUpdated)}</dt><dd>${t(String(n.mis_a_jour_le).slice(0,10))}</dd></div>`:""}
        <div><dt>${t(a.labelPole)}</dt><dd>${t(j(n.pole)||"—")}</dd></div>
        <div><dt>${t(a.labelStatus)}</dt><dd>${t(m)}</dd></div>
        ${n.langue_originale?`<div><dt>${t(a.labelDocLang)}</dt><dd>${t(Qe(n.langue_originale))}</dd></div>`:""}
        ${n.confiance_classification?`<div><dt>${t(a.labelConfidence)}</dt><dd>${t(He(n.confiance_classification))}</dd></div>`:""}
        ${typeof n.score_pertinence=="number"?`<div><dt>${t(a.labelScore)}</dt><dd>${t(String(n.score_pertinence))}</dd></div>`:""}
        ${n.doi?`<div><dt>${t(a.labelDoi)}</dt><dd>${t(n.doi)}</dd></div>`:""}
        ${o?`<div><dt>${t(a.labelKeywords)}</dt><dd>${t(o)}</dd></div>`:""}
      </dl>
      <div class="modal-resume">
        <strong>${t(a.labelAbstract)}</strong>
        <p>${t(l)}</p>
      </div>
      ${n.analyse_strategique?`
        <div class="modal-resume">
          <strong>${t(a.labelAnalysis)}</strong>
          <p>${t(n.analyse_strategique)}</p>
        </div>
      `:""}
      <div class="result-actions">
        ${g?`<a href="${t(g)}" target="_blank" rel="noopener noreferrer">${t(a.sourceLink)}</a>`:""}
        ${$?`<a href="${t($)}" target="_blank" rel="noopener noreferrer">${t(a.pdfLink)}</a>`:""}
        <button type="button" class="link-btn" id="modal-validate-btn">${t(a.validateBtn)}</button>
        <button type="button" class="link-btn" id="modal-archive-btn">${t(a.archiveBtn)}</button>
        ${q?`<button type="button" class="link-btn" id="modal-delete-btn">${t(a.deleteBtn)}</button>`:""}
      </div>
    </div>
  `,document.body.appendChild(p),(L=document.getElementById("close-modal"))==null||L.addEventListener("click",()=>{h=null,M()}),p.addEventListener("click",A=>{A.target===p&&(h=null,M())}),(E=document.getElementById("modal-validate-btn"))==null||E.addEventListener("click",()=>Fe(n,"valide")),(w=document.getElementById("modal-archive-btn"))==null||w.addEventListener("click",()=>Fe(n,"archive")),(x=document.getElementById("modal-delete-btn"))==null||x.addEventListener("click",()=>vt(n))}function u(){var o;const e=document.getElementById("results-grid"),a=document.getElementById("index-count"),n=document.getElementById("active-pole-banner");if(!e||!a)return;const s=We(),c=r==="ar"?" مادة":s.length>1?" notices":" notice";if(a.textContent=`${s.length}${c}`,n&&(I&&k?(n.innerHTML=`
        <span>${t(v[r].activePoleBanner)} <strong>${t(k)}</strong></span>
        <button type="button" class="link-btn" id="clear-pole-inline">${t(v[r].allPoles)} ✕</button>
      `,n.style.display="flex",(o=document.getElementById("clear-pole-inline"))==null||o.addEventListener("click",()=>{I=null,k="",u()})):(n.style.display="none",n.innerHTML="")),!s.length){e.innerHTML=`<p class="empty-results">${t(v[r].noResults)}</p>`;return}e.innerHTML=s.map((l,m)=>{const g=_.includes(y(l)),$=Ge(l),q=Array.isArray(l.auteurs)&&l.auteurs.length?l.auteurs.join(", "):r==="ar"?"مؤلف غير مذكور":"Auteur non renseigné",p=l.revue_ou_institution||l.source_nom||"",L=t(l.date_publication||""),E=t(ne(l.type_document)||j(l.pole)||""),w=$==="archive"?`<span class="flag-warn">${t(v[r].archivedBadge)}</span>`:N(l)?`<span class="flag-warn">${t(v[r].futureBadge)}</span>`:$==="a_verifier"?`<span class="flag-warn">${t(v[r].unverifiedBadge)}</span>`:"",x=l.resume&&String(l.resume).trim()?`<p class="result-resume">${t(l.resume)}</p>`:"",A=B(l.pdf_direct)?l.pdf_direct.trim():"",H=B(l.url_publication)?l.url_publication.trim():"",Q=A?`<a href="${t(A)}" target="_blank" rel="noopener noreferrer">${t(v[r].pdfLink)}</a>`:"",G=H?`<a href="${t(H)}" target="_blank" rel="noopener noreferrer">${t(v[r].sourceLink)}</a>`:"";return`
        <article class="result-card">
          <div class="result-meta">
            <span>${L}</span>
            <span>${E}</span>
          </div>
          ${w}
          <h3>${t(l.titre_original||"")}</h3>
          <p class="result-authors">${t(q)}${p?` · ${t(p)}`:""}</p>
          ${x}
          <div class="result-actions">
            ${G}
            ${Q}
            <button type="button" class="link-btn" data-open-index="${m}">${t(v[r].detailsBtn)}</button>
            <button type="button" class="fav-btn ${g?"is-saved":""}" data-fav-index="${m}">${g?"★ ":"☆ "}${t(g?v[r].savedBtn:v[r].saveBtn)}</button>
          </div>
        </article>
      `}).join(""),e.querySelectorAll("[data-open-index]").forEach(l=>{l.addEventListener("click",()=>{const m=Number(l.getAttribute("data-open-index"));h=s[m]||null,M()})}),e.querySelectorAll("[data-fav-index]").forEach(l=>{l.addEventListener("click",()=>{const m=Number(l.getAttribute("data-fav-index"));s[m]&&ht(s[m])})})}function b(){var Q,G,de,ue,pe,me,be,ve,fe,he,ge,ye,$e,_e,Le,Ee,Se,qe;const e=v[r],a=le[r],n=ut[r],s=re[r],c=rt[r],o=a[W]||a[0],l=s[se]||s[0],m=Object.keys(Ue[r]),g=[...new Set(C.map(i=>i.type_document).filter(Boolean))],$=[...new Set(C.map(i=>i.confiance_classification).filter(Boolean))],q=[...new Set(C.map(i=>i.langue_originale).filter(Boolean))],p=C.filter(i=>!N(i)),L=p.filter(i=>X(i)==="science").length,E=p.filter(i=>X(i)==="chiffres").length,w=p.filter(i=>X(i)==="bibliotheque").length,x=c.filter(i=>i.id!=="all");document.documentElement.lang=r,document.documentElement.dir=r==="ar"?"rtl":"ltr";const A=document.getElementById("app");if(!A)return;const H=O===l.answer;A.innerHTML=`
    <header class="topbar">
      <a href="#" class="brand">
        <span class="brand-mark">K</span>
        <span>KITN<span class="brand-dot">.</span></span>
      </a>
      <nav class="nav ${R?"is-open":""}" id="main-nav">
        <a href="#themes">${e.navThemes}</a>
        <a href="#academy">${e.navAcademy}</a>
        <a href="#method">${e.navMethod}</a>
        <a href="#research">${e.navResearch}</a>
      </nav>
      <div class="topbar-actions">
        <button type="button" class="menu-toggle" id="menu-toggle" aria-expanded="${R}">${e.menuBtn}</button>
        <button type="button" class="lang" id="lang-toggle">${e.langBtn}</button>
      </div>
    </header>

    <section class="hero">
      <div class="hero-orb orb-one"></div>
      <div>
        <span class="eyebrow"><span class="eyebrow-dot"></span>${e.eyebrow}</span>
        <h1>${e.heroTitle}</h1>
        <p class="hero-intro">${e.heroIntro}</p>
        <div class="hero-actions">
          <a href="#research" class="btn primary">${e.heroPrimary}</a>
          <a href="#method" class="text-link">${e.heroSecondary}</a>
        </div>
        <div class="hero-note">
          <span class="note-line"></span>
          <span>${e.heroNote}</span>
        </div>
      </div>

      <div class="hero-art">
        <div class="art-card card-back">
          <div class="art-top">
            <span>${e.card1Top}</span>
            <span class="live-dot"></span>
          </div>
          <div class="art-lines">
            <i></i>
            <i style="width:72%"></i>
            <i style="width:86%"></i>
          </div>
          <div class="art-map">
            <span>${e.card1Map}</span>
            <span class="map-shape"></span>
          </div>
        </div>

        <div class="art-card card-front">
          <div class="art-top"><span>${e.card2Top}</span></div>
          <div class="art-number">01 <span>→</span> 04</div>
          <div class="art-caption">${e.card2Cap}</div>
          <div class="art-bars">
            <i></i><i></i><i></i><i></i><i></i><i></i>
          </div>
        </div>

        <div class="floating-chip">${e.chip}</div>
      </div>
    </section>

    <section class="section" id="portal-hub">
      <div class="section-head">
        <div>
          <span class="eyebrow">${t(e.hubTitle)}</span>
          <h2>${t(e.hubTitle)}</h2>
        </div>
        <p>${t(e.hubSub)}</p>
      </div>

      <div class="principles-grid">
        <div class="principle-card is-active">
          <span>${p.length}</span>
          <h3>${t(e.statTotal)}</h3>
        </div>
        <div class="principle-card">
          <span>${L}</span>
          <h3>${t(e.statScience)}</h3>
        </div>
        <div class="principle-card">
          <span>${E}</span>
          <h3>${t(e.statStats)}</h3>
        </div>
        <div class="principle-card">
          <span>${w}</span>
          <h3>${t(e.statLibrary)}</h3>
        </div>
      </div>

      <div class="themes-grid">
        ${x.map(i=>`
          <div class="theme-card ${S===i.id?"is-active":""}">
            <h3>${t(i.label)}</h3>
            <button type="button" class="link-btn" data-jump-space="${i.id}">${t(e.openSpaceBtn)}</button>
          </div>
        `).join("")}
      </div>
    </section>

    <section class="section" id="themes">
      <div class="section-head">
        <div>
          <span class="eyebrow">${e.themesEyebrow}</span>
          <h2>${e.themesTitle}</h2>
        </div>
        <p>${e.themesSub}</p>
      </div>

      <div class="themes-grid">
        ${a.map((i,d)=>`
          <button type="button" class="theme-card ${d===W?"is-active":""}" data-theme-idx="${d}">
            <div class="theme-top">
              <span>${i.num}</span>
              <span>${i.symbol}</span>
            </div>
            <h3>${t(i.title)}</h3>
            <p>${t(i.desc)}</p>
          </button>
        `).join("")}
      </div>

      <div class="theme-detail">
        <div>
          <h3>${t(o.title)}</h3>
          <p>${t(o.detail)}</p>
          <div class="theme-tags">
            ${o.tags.map(i=>`<span>${t(i)}</span>`).join("")}
          </div>
        </div>
        <button type="button" class="btn primary" id="filter-by-theme">${t(e.openPole)}</button>
      </div>
    </section>

    <section class="section" id="academy">
      <div class="section-head">
        <div>
          <span class="eyebrow">${e.academyEyebrow}</span>
          <h2>${e.academyTitle}</h2>
        </div>
        <p>${e.academyText}</p>
      </div>

      <div class="academy-tabs">
        ${s.map((i,d)=>`
          <button type="button" class="tab-btn ${d===se?"is-active":""}" data-academy-idx="${d}">${t(i.label)}</button>
        `).join("")}
      </div>

      <div class="academy-card">
        <div>
          <span class="mini-label">${t(e.academySheetLabel)}</span>
          <h3>${t(l.title)}</h3>
          <p>${t(l.sheet)}</p>
          ${l.level?`<p><strong>${t(e.academyLevelLabel)} :</strong> ${t(l.level)}</p>`:""}
          ${l.domain?`<p><strong>${t(e.academyDomainLabel)} :</strong> ${t(l.domain)}</p>`:""}
          ${l.deadline?`<p><strong>${t(e.academyDeadlineLabel)} :</strong> ${t(l.deadline)}</p>`:""}
          ${l.methodology?`<p><strong>${t(e.academyMethodLabel)} :</strong> ${t(l.methodology)}</p>`:""}
          ${Array.isArray(l.past_topics)&&l.past_topics.length?`<p>${t(l.past_topics.join(" · "))}</p>`:""}
        </div>
        <div>
          <span class="mini-label">${t(e.academyQuizLabel)}</span>
          <p class="quiz-question">${t(l.question)}</p>
          <div class="quiz-options">
            ${l.options.map((i,d)=>`
              <button type="button" class="quiz-opt ${O===d?"is-selected":""}" data-quiz-opt="${d}">${t(i)}</button>
            `).join("")}
          </div>
          ${O!==null?`
            <p class="quiz-feedback ${H?"is-ok":"is-ko"}">
              ${t(l.correction)}
            </p>
          `:""}
        </div>
      </div>
    </section>

    <section class="section" id="method">
      <div class="section-head">
        <div>
          <span class="eyebrow">${e.methodEyebrow}</span>
          <h2>${e.methodTitle}</h2>
        </div>
        <p>${e.methodText}</p>
      </div>

      <div class="principles-grid">
        ${n.map((i,d)=>`
          <button type="button" class="principle-card ${d===Oe?"is-active":""}" data-principle-idx="${d}">
            <span>${i.num}</span>
            <h3>${t(i.title)}</h3>
            <p>${t(i.text)}</p>
          </button>
        `).join("")}
      </div>
    </section>

    <section class="section" id="research">
      <div class="section-head">
        <div>
          <span class="eyebrow">${e.researchEyebrow}</span>
          <h2>${e.researchTitle}</h2>
        </div>
        <span class="count-badge" id="index-count">0</span>
      </div>

      <div class="spaces-bar" role="tablist">
        ${c.map(i=>`
          <button type="button" class="space-tab ${S===i.id?"is-active":""}" data-space-id="${i.id}">${t(i.label)}</button>
        `).join("")}
      </div>

      ${S==="contribuer"?`
        <form class="manual-form" id="manual-form">
          <h3>${t(e.manualTitle)}</h3>
          <p>${t(e.manualSub)}</p>
          <div class="manual-grid">
            <label>
              <span>${t(e.manualLabelTitle)}</span>
              <input type="text" id="m-title" required />
            </label>
            <label>
              <span>${t(e.manualLabelType)}</span>
              <select id="m-type">
                ${Object.entries(ze[r]).map(([i,d])=>`<option value="${i}">${t(d)}</option>`).join("")}
              </select>
            </label>
            <label>
              <span>${t(e.manualLabelSpace)}</span>
              <select id="m-space">
                ${c.filter(i=>!["all","contribuer"].includes(i.id)).map(i=>`<option value="${i.id}">${t(i.label)}</option>`).join("")}
              </select>
            </label>
            <label>
              <span>${t(e.manualLabelPole)}</span>
              <select id="m-pole">
                ${m.map(i=>`<option value="${i}">${t(j(i))}</option>`).join("")}
              </select>
            </label>
            <label>
              <span>${t(e.manualLabelDate)}</span>
              <input type="date" id="m-date" value="${oe}" />
            </label>
            <label>
              <span>${t(e.manualLabelVenue)}</span>
              <input type="text" id="m-venue" />
            </label>
            <label>
              <span>${t(e.manualLabelKeywords)}</span>
              <input type="text" id="m-keywords" />
            </label>
            <label>
              <span>${t(e.manualLabelUrl)}</span>
              <input type="url" id="m-url" placeholder="https://..." />
            </label>
            <label>
              <span>${t(e.manualLabelPdf)}</span>
              <input type="url" id="m-pdf" placeholder="https://..." />
            </label>
          </div>
          <label class="manual-resume-field">
            <span>${t(e.manualLabelResume)}</span>
            <textarea id="m-resume" rows="3"></textarea>
          </label>
          <label class="manual-resume-field">
            <span>${t(e.manualLabelAnalysis)}</span>
            <textarea id="m-analysis" rows="2"></textarea>
          </label>
          <div class="manual-actions">
            <button type="submit" class="btn primary">${t(e.manualAddBtn)}</button>
            <button type="button" class="link-btn" id="manual-export">${t(e.manualExportBtn)}</button>
            <button type="button" class="link-btn" id="manual-clear">${t(e.manualClearBtn)}</button>
          </div>
          <p class="manual-status" id="manual-status"></p>
        </form>
      `:""}

      <div id="active-pole-banner" class="pole-banner" style="display:none;"></div>

      <div class="filters-bar">
        <input type="search" id="search-input" placeholder="${t(e.searchPlaceholder)}" value="${t(Z)}" />
        <label class="date-range-field">
          <span>${t(e.dateFromLabel)}</span>
          <input type="date" id="date-from-input" value="${t(D)}" />
        </label>
        <label class="date-range-field">
          <span>${t(e.dateToLabel)}</span>
          <input type="date" id="date-to-input" value="${t(P)}" />
        </label>
        <select id="pole-select">
          <option value="">${t(e.allPolesSelect)}</option>
          ${m.map(i=>`<option value="${i}" ${V===i?"selected":""}>${t(j(i))}</option>`).join("")}
        </select>
        <select id="type-select">
          <option value="">${t(e.allTypes)}</option>
          ${g.map(i=>`<option value="${i}" ${U===i?"selected":""}>${t(ne(i))}</option>`).join("")}
        </select>
        <select id="conf-select">
          <option value="">${t(e.allConfidence)}</option>
          ${$.map(i=>`<option value="${i}" ${z===i?"selected":""}>${t(He(i))}</option>`).join("")}
        </select>
        <select id="lang-doc-select">
          <option value="">${t(e.allDocLangs)}</option>
          ${q.map(i=>`<option value="${i}" ${J===i?"selected":""}>${t(Qe(i))}</option>`).join("")}
        </select>
        <select id="sort-select">
          <option value="newest" ${T==="newest"?"selected":""}>${t(e.sortNewest)}</option>
          <option value="oldest" ${T==="oldest"?"selected":""}>${t(e.sortOldest)}</option>
          <option value="score" ${T==="score"?"selected":""}>${t(e.sortScore)}</option>
        </select>
      </div>

      <div class="filters-secondary">
        <label class="check-pill">
          <input type="checkbox" id="fav-only" ${te?"checked":""} />
          <span>${t(e.savedOnly)} (${_.length})</span>
        </label>
        <label class="check-pill">
          <input type="checkbox" id="future-only" ${ee?"checked":""} />
          <span>${t(e.futureOnly)}</span>
        </label>
        <button type="button" class="link-btn" id="reset-filters">${t(e.resetFilters)}</button>
        <button type="button" class="link-btn" id="export-json">${t(e.exportJson)}</button>
      </div>

      <div id="results-grid" class="results-grid"></div>
    </section>

    <footer class="footer">
      <span>${t(e.footerCopy)}</span>
    </footer>
  `,(Q=document.getElementById("lang-toggle"))==null||Q.addEventListener("click",()=>{r=r==="fr"?"ar":"fr",b()}),(G=document.getElementById("menu-toggle"))==null||G.addEventListener("click",()=>{R=!R,b()}),document.querySelectorAll("#main-nav a").forEach(i=>{i.addEventListener("click",()=>{R=!1,b()})}),document.querySelectorAll("[data-jump-space]").forEach(i=>{i.addEventListener("click",()=>{var d;S=i.getAttribute("data-jump-space")||"all",b(),(d=document.getElementById("research"))==null||d.scrollIntoView({behavior:"smooth"})})}),document.querySelectorAll("[data-theme-idx]").forEach(i=>{i.addEventListener("click",()=>{W=Number(i.getAttribute("data-theme-idx"))||0,b()})}),(de=document.getElementById("filter-by-theme"))==null||de.addEventListener("click",()=>{var d;const i=le[r][W]||le[r][0];I=i.poles,k=i.title,u(),(d=document.getElementById("research"))==null||d.scrollIntoView({behavior:"smooth"})}),document.querySelectorAll("[data-academy-idx]").forEach(i=>{i.addEventListener("click",()=>{se=Number(i.getAttribute("data-academy-idx"))||0,O=null,b()})}),document.querySelectorAll("[data-quiz-opt]").forEach(i=>{i.addEventListener("click",()=>{O=Number(i.getAttribute("data-quiz-opt")),b()})}),document.querySelectorAll("[data-principle-idx]").forEach(i=>{i.addEventListener("click",()=>{Oe=Number(i.getAttribute("data-principle-idx"))||0,b()})}),document.querySelectorAll("[data-space-id]").forEach(i=>{i.addEventListener("click",()=>{S=i.getAttribute("data-space-id")||"all",b()})}),(ue=document.getElementById("manual-form"))==null||ue.addEventListener("submit",i=>{var Ie,we,xe,Ce,ke,De,Pe,Ne,je,Me,Re;i.preventDefault();const d=(((Ie=document.getElementById("m-title"))==null?void 0:Ie.value)||"").trim();if(!d)return;const Xe=((we=document.getElementById("m-type"))==null?void 0:we.value)||"article",Ze=((xe=document.getElementById("m-space"))==null?void 0:xe.value)||"veille",et=((Ce=document.getElementById("m-pole"))==null?void 0:Ce.value)||"institutions_gouvernance",tt=((ke=document.getElementById("m-date"))==null?void 0:ke.value)||oe,at=(((De=document.getElementById("m-venue"))==null?void 0:De.value)||"").trim(),nt=(((Pe=document.getElementById("m-keywords"))==null?void 0:Pe.value)||"").split(",").map(st=>st.trim()).filter(Boolean),Ae=(((Ne=document.getElementById("m-url"))==null?void 0:Ne.value)||"").trim(),ie=(((je=document.getElementById("m-pdf"))==null?void 0:je.value)||"").trim(),it=(((Me=document.getElementById("m-resume"))==null?void 0:Me.value)||"").trim(),lt=(((Re=document.getElementById("m-analysis"))==null?void 0:Re.value)||"").trim(),Te=new Date().toISOString();f=[{id:`kitn_manual_${Date.now()}`,titre_original:d,auteurs:[r==="ar"?"إضافة يدوية":"Contribution manuelle"],revue_ou_institution:at||(r==="ar"?"إضافة يدوية KITN":"Contribution manuelle KITN"),mots_cles:nt,date_publication:tt,collecte_le:Te,mis_a_jour_le:Te,date_statut:"date_confirmee",date_anomalie:!1,statut_validation:"valide",langue_originale:r,source_id:"manual_studio",source_nom:r==="ar"?"إضافة يدوية KITN":"Contribution manuelle KITN",type_document:Xe,espace:Ze,pole:et,poles_secondaires:[],confiance_classification:"eleve",score_pertinence:90,url_publication:B(Ae)?Ae:null,doi:null,pdf_direct:B(ie)?ie:null,texte_integral_disponible:!!B(ie),resume:it,analyse_strategique:lt,origine:"manuel"},...f],K(F,f),Y(),b();const Be=document.getElementById("manual-status");Be&&(Be.textContent=e.manualAddedMsg)}),(pe=document.getElementById("manual-export"))==null||pe.addEventListener("click",()=>{Ke(f,"kitn-contributions-manuelles.json")}),(me=document.getElementById("manual-clear"))==null||me.addEventListener("click",()=>{f=[],K(F,f),Y(),b()}),(be=document.getElementById("search-input"))==null||be.addEventListener("input",i=>{Z=i.target.value||"",u()}),(ve=document.getElementById("date-from-input"))==null||ve.addEventListener("change",i=>{D=i.target.value||"",u()}),(fe=document.getElementById("date-to-input"))==null||fe.addEventListener("change",i=>{P=i.target.value||"",u()}),(he=document.getElementById("pole-select"))==null||he.addEventListener("change",i=>{V=i.target.value||"",I=null,k="",u()}),(ge=document.getElementById("type-select"))==null||ge.addEventListener("change",i=>{U=i.target.value||"",u()}),(ye=document.getElementById("conf-select"))==null||ye.addEventListener("change",i=>{z=i.target.value||"",u()}),($e=document.getElementById("lang-doc-select"))==null||$e.addEventListener("change",i=>{J=i.target.value||"",u()}),(_e=document.getElementById("sort-select"))==null||_e.addEventListener("change",i=>{T=i.target.value||"newest",u()}),(Le=document.getElementById("fav-only"))==null||Le.addEventListener("change",i=>{te=!!i.target.checked,u()}),(Ee=document.getElementById("future-only"))==null||Ee.addEventListener("change",i=>{ee=!!i.target.checked,u()}),(Se=document.getElementById("reset-filters"))==null||Se.addEventListener("click",gt),(qe=document.getElementById("export-json"))==null||qe.addEventListener("click",()=>{Ke(We(),"kitn-export.json")}),u(),M()}async function yt(){try{const e=await fetch("/data/academy/academy.json",{cache:"no-store"});if(!e.ok)return;const a=await e.json();a!=null&&a.tracks&&typeof a.tracks=="object"&&(Array.isArray(a.tracks.fr)&&a.tracks.fr.length&&(re.fr=a.tracks.fr),Array.isArray(a.tracks.ar)&&a.tracks.ar.length&&(re.ar=a.tracks.ar),b())}catch{}}async function $t(){try{const e=await fetch("/data/index/search-index.json",{cache:"no-store"});if(e.ok){const a=await e.json();ce=Array.isArray(a==null?void 0:a.items)?a.items:[]}}catch{ce=[]}Y(),u()}b();yt();$t();
