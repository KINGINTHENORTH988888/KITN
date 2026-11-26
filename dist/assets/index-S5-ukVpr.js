(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))l(o);new MutationObserver(o=>{for(const c of o)if(c.type==="childList")for(const s of c.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&l(s)}).observe(document,{childList:!0,subtree:!0});function i(o){const c={};return o.integrity&&(c.integrity=o.integrity),o.referrerPolicy&&(c.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?c.credentials="include":o.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function l(o){if(o.ep)return;o.ep=!0;const c=i(o);fetch(o.href,c)}})();const Te="kitn_favorites_v1",X="kitn_manual_items_v1";function De(){const e=new Date,a=e.getUTCFullYear(),i=String(e.getUTCMonth()+1).padStart(2,"0"),l=String(e.getUTCDate()).padStart(2,"0");return`${a}-${i}-${l}`}const Z=De(),Ne={fr:[{id:"all",label:"Tous les espaces"},{id:"veille",label:"Actualité & veille"},{id:"science",label:"Articles scientifiques"},{id:"chiffres",label:"Maroc en chiffres"},{id:"academy",label:"Concours & Academy"},{id:"bibliotheque",label:"Bibliothèque"},{id:"contribuer",label:"Contribution manuelle"}],ar:[{id:"all",label:"كل الفضاءات"},{id:"veille",label:"الأخبار والرصد"},{id:"science",label:"المقالات العلمية"},{id:"chiffres",label:"المغرب بالأرقام"},{id:"academy",label:"المباريات والأكاديمية"},{id:"bibliotheque",label:"المكتبة الوثائقية"},{id:"contribuer",label:"إضافة يدوية"}]},Q={fr:[{num:"01",symbol:"⌘",poles:["institutions_gouvernance"],title:"Institutions & gouvernance",desc:"Politiques publiques, institutions, administration et réformes.",detail:"Analyse des politiques publiques, de l'action administrative, de la décentralisation et de la gouvernance institutionnelle au Maroc.",tags:["Politiques publiques","Gouvernance","Administration","Réformes"]},{num:"02",symbol:"◎",poles:["economie_finances_publiques","societe_developpement_humain"],title:"Économie & société",desc:"Indicateurs, emploi, développement humain et mutations sociales.",detail:"Lecture des dynamiques économiques, chaînes de valeur, finances publiques, développement humain et mutations sociales.",tags:["Économie","Finances publiques","Société & développement humain","Mutations sociales"]},{num:"03",symbol:"⊕",poles:["securite_affaires_interieures","relations_internationales_geopolitique"],title:"Sécurité, territoires & géopolitique",desc:"Sécurité publique, prévention, territoires, ressources et enjeux stratégiques.",detail:"Suivi des affaires intérieures, de la sécurité publique, des dynamiques territoriales et du positionnement stratégique du Maroc.",tags:["Sécurité & affaires intérieures","Territoires","Géopolitique","Ressources"]},{num:"04",symbol:"✧",poles:["recherche_scientifique"],title:"Recherche & études",desc:"Publications académiques, jeux de données et analyses de fond.",detail:"Indexation des travaux scientifiques, études sectorielles et données de référence sur le Maroc.",tags:["Publications","Données","Études","Veille"]}],ar:[{num:"01",symbol:"⌘",poles:["institutions_gouvernance"],title:"المؤسسات والحكامة",desc:"السياسات العمومية، المؤسسات، الإدارة والإصلاحات.",detail:"تحليل السياسات العمومية والعمل الإداري واللامركزية والحكامة المؤسساتية في المغرب.",tags:["السياسات العمومية","الحكامة","الإدارة","الإصلاحات"]},{num:"02",symbol:"◎",poles:["economie_finances_publiques","societe_developpement_humain"],title:"الاقتصاد والمجتمع",desc:"المؤشرات، الشغل، التنمية البشرية والتحولات الاجتماعية.",detail:"قراءة الديناميات الاقتصادية وسلاسل القيمة والمالية العمومية والتنمية البشرية والتحولات الاجتماعية.",tags:["الاقتصاد","المالية العمومية","المجتمع والتنمية البشرية","التحولات الاجتماعية"]},{num:"03",symbol:"⊕",poles:["securite_affaires_interieures","relations_internationales_geopolitique"],title:"الأمن والمجالات والجيوسياسة",desc:"الأمن العمومي، الوقاية، المجالات الترابية والموارد والقضايا الاستراتيجية.",detail:"تتبع الشؤون الداخلية والأمن العمومي والديناميات الترابية والموقع الاستراتيجي للمغرب.",tags:["الأمن والشؤون الداخلية","المجالات الترابية","الجيوسياسة","الموارد"]},{num:"04",symbol:"✧",poles:["recherche_scientifique"],title:"البحث والدراسات",desc:"منشورات أكاديمية، قواعد بيانات وتحليلات معمقة.",detail:"فهرسة الأعمال العلمية والدراسات القطاعية والبيانات المرجعية حول المغرب.",tags:["منشورات","بيانات","دراسات","رصد"]}]},qe={fr:{institutions_gouvernance:"Institutions & gouvernance",economie_finances_publiques:"Économie & finances publiques",societe_developpement_humain:"Société & développement humain",relations_internationales_geopolitique:"Relations internationales & géopolitique",securite_affaires_interieures:"Sécurité & affaires intérieures",recherche_scientifique:"Recherche scientifique"},ar:{institutions_gouvernance:"المؤسسات والحكامة",economie_finances_publiques:"الاقتصاد والمالية العمومية",societe_developpement_humain:"المجتمع والتنمية البشرية",relations_internationales_geopolitique:"العلاقات الدولية والجيوسياسة",securite_affaires_interieures:"الأمن والشؤون الداخلية",recherche_scientifique:"البحث العلمي"}},ee={fr:[{id:"dgsn",label:"DGSN",title:"Concours DGSN — Sécurité & ordre public",sheet:"Police de proximité, coopération sécuritaire, digitalisation des services et protection des droits.",question:"Quel principe résume le mieux la doctrine moderne de sécurité publique au Maroc ?",options:["La prévention, la proximité citoyenne et la légalité","L'isolement administratif des services","L'absence de coordination territoriale"],answer:0,correction:"La sécurité moderne repose sur la prévention, la proximité avec le citoyen, l'efficacité opérationnelle et le respect de la loi."},{id:"irat",label:"IRAT",title:"IRAT — Administration territoriale & gouvernance",sheet:"Déconcentration administrative, régionalisation avancée, coordination locale et politiques publiques.",question:"Quel levier renforce l'efficacité de l'action publique au niveau territorial ?",options:["La déconcentration et la convergence des programmes locaux","La multiplication des procédures sans coordination","L'absence d'évaluation des politiques publiques"],answer:0,correction:"La déconcentration administrative et la cohérence territoriale permettent de mieux adapter les politiques publiques aux réalités locales."},{id:"admin",label:"Concours admin",title:"Concours administratifs — Finances & réformes",sheet:"Budgétisation axée sur la performance, protection sociale, transition numérique et service public.",question:"Que vise principalement la réforme de la gestion publique axée sur les résultats ?",options:["L'efficacité de la dépense, la redevabilité et la qualité du service","La suppression du contrôle budgétaire","La réduction de la transparence"],answer:0,correction:"La gestion axée sur les résultats lie les moyens engagés aux objectifs et à l'impact réel pour l'usager."}],ar:[{id:"dgsn",label:"الأمن الوطني DGSN",title:"مباريات الأمن الوطني — الأمن والنظام العام",sheet:"شرطة القرب، التعاون الأمني، رقمنة الخدمات وحماية الحقوق.",question:"ما المبدأ الذي يلخص بأفضل شكل المقاربة الحديثة للأمن العمومي بالمغرب؟",options:["الوقاية والقرب من المواطن واحترام القانون","انغلاق المصالح الإدارية","غياب التنسيق الترابي"],answer:0,correction:"يرتكز العمل الأمني الحديث على الوقاية والقرب من المواطن والنجاعة الميدانية وسيادة القانون."},{id:"irat",label:"الإدارة الترابية IRAT",title:"الإدارة الترابية والحكامة",sheet:"اللاتمركز الإداري، الجهوية المتقدمة، التنسيق المحلي والسياسات العمومية.",question:"ما الآلية التي تعزز نجاعة العمل العمومي على المستوى الترابي؟",options:["اللاتمركز وتكامل البرامج المحلية","تعدد المساطر دون تنسيق","غياب تقييم السياسات العمومية"],answer:0,correction:"يساعد اللاتمركز الإداري والالتقائية الترابية على ملاءمة السياسات العمومية مع خصوصيات كل مجال."},{id:"admin",label:"المباريات الإدارية",title:"المباريات الإدارية — المالية والإصلاحات",sheet:"الميزانية المبنية على النجاعة، الحماية الاجتماعية، التحول الرقمي والمرفق العام.",question:"ما الهدف الأساسي لإصلاح التدبير العمومي القائم على النتائج؟",options:["نجاعة الإنفاق والمساءلة وجودة الخدمة للمرتفق","إلغاء المراقبة الميزانياتية","تقليص الشفافية"],answer:0,correction:"يربط التدبير القائم على النتائج الاعتمادات المرصودة بالأهداف والأثر الفعلي على المواطن."}]},Se={fr:{publication_scientifique:"Publication scientifique",statistique:"Statistique / Jeu de données",rapport:"Rapport",rapport_institutionnel:"Rapport institutionnel",document_juridique:"Document juridique",article:"Article",article_presse:"Article de presse",concours:"Concours / Ressource"},ar:{publication_scientifique:"منشور علمي",statistique:"إحصائية / مجموعة بيانات",rapport:"تقرير",rapport_institutionnel:"تقرير مؤسساتي",document_juridique:"وثيقة قانونية",article:"مقال",article_presse:"مقال صحفي",concours:"مباراة / مورد"}},Re={fr:{eleve:"Confiance élevée",moyen:"Confiance moyenne",faible:"Confiance faible"},ar:{eleve:"موثوقية عالية",moyen:"موثوقية متوسطة",faible:"موثوقية منخفضة"}},Me={fr:{fr:"Français",en:"Anglais",ar:"Arabe"},ar:{fr:"الفرنسية",en:"الإنجليزية",ar:"العربية"}},Oe={fr:[{num:"01",title:"Vérifier avant de conclure",text:"Croiser les sources académiques, institutionnelles et statistiques avant de retenir un fait."},{num:"02",title:"Structurer plutôt qu'empiler",text:"Classer chaque notice par pôle, type de document et date pour retrouver l'essentiel vite."},{num:"03",title:"Relier l'analyse au terrain",text:"Lire les transformations du Maroc à travers leurs effets concrets sur l'économie et la société."}],ar:[{num:"01",title:"التحقق قبل الاستنتاج",text:"مقاطعة المصادر الأكاديمية والمؤسساتية والإحصائية قبل اعتماد أي معطى."},{num:"02",title:"الهيكلة بدل التكديس",text:"تصنيف كل مادة حسب القطب ونوع الوثيقة والتاريخ للوصول السريع إلى الجوهر."},{num:"03",title:"ربط التحليل بالواقع",text:"قراءة تحولات المغرب عبر آثارها الملموسة على الاقتصاد والمجتمع."}]},b={fr:{langBtn:"العربية",menuBtn:"Menu",navThemes:"Thématiques",navAcademy:"KITN Academy",navMethod:"Méthode",navResearch:"Espaces & Index",eyebrow:"Centre de veille & de connaissances · De l'information à la maîtrise",heroTitle:"Comprendre le Maroc. <span>Anticiper</span> ses transformations.",heroIntro:"Une plateforme indépendante pour suivre les évolutions du Maroc, explorer les travaux de recherche, consulter les chiffres clés et préparer les concours.",heroPrimary:"Explorer les espaces ↗",heroSecondary:"Découvrir KITN →",heroNote:"UNE LECTURE STRUCTURÉE DU MAROC",card1Top:"01 / MAROC",card1Map:"MA",card2Top:"KNOWLEDGE / 2026",card2Cap:"<strong>Information</strong> → Connaissance",chip:"✦ De l'information à la maîtrise",themesEyebrow:"Les grands enjeux",themesTitle:"Explorer par thématique",themesSub:"Des sujets essentiels, organisés pour aller au-delà de l'actualité et comprendre les dynamiques de fond.",openPole:"Filtrer les notices de ce pôle →",activePoleBanner:"Filtre actif sur le pôle :",allPoles:"Tous les pôles",allPolesSelect:"Tous les pôles (6)",academyEyebrow:"KITN Academy",academyTitle:"Apprendre avec méthode, pas dans la précipitation.",academyText:"Des repères clairs, des synthèses structurées et des QCM pour approfondir les grands dossiers et préparer les concours.",academyBtn:"Ouvrir l'espace Concours & Academy →",academySheetLabel:"Fiche de révision",academyQuizLabel:"QCM d'entraînement",academyPageTop:"KITN",academyPageTitle:"Academy",academyPageSub:"Méthode & repères",methodEyebrow:"Notre approche",methodTitle:"La connaissance commence par une bonne question.",methodText:"KITN privilégie la clarté, la vérification et la mise en perspective plutôt que le bruit informationnel.",researchEyebrow:"Espaces dédiés & Index documentaire",researchTitle:"Navigation par espace & notices",searchPlaceholder:"Rechercher par titre, auteur, pôle, type ou résumé...",allTypes:"Tous les types",allConfidence:"Toutes confiances",allDocLangs:"Toutes langues",sortNewest:"Date : plus récent",sortOldest:"Date : plus ancien",sortScore:"Pertinence : score décroissant",resetFilters:"Réinitialiser",exportJson:"Exporter JSON",savedOnly:"Favoris uniquement",saveBtn:"Enregistrer",savedBtn:"Enregistré",futureOnly:"Dates futures à vérifier uniquement",futureBadge:"Date future (à vérifier)",unverifiedBadge:"À vérifier",noAbstract:"Résumé non fourni par la source.",detailsBtn:"Fiche détaillée",noResults:"Aucune notice ne correspond à votre recherche ou à cet espace.",sourceLink:"Consulter la source ↗",pdfLink:"PDF ↗",closeBtn:"Fermer",labelAuthor:"Auteurs",labelDate:"Date de publication",labelPole:"Pôle",labelStatus:"Statut éditorial",labelType:"Type de document",labelDocLang:"Langue",labelConfidence:"Fiabilité",labelScore:"Score",labelDoi:"DOI",labelAbstract:"Résumé",statusValid:"Vérifié",statusReview:"À vérifier",manualTitle:"Studio de contribution manuelle (local)",manualSub:"Ajoutez manuellement une actualité, un article, une statistique, un concours ou un document de référence. Exportez ensuite le JSON pour l'intégrer au dépôt.",manualLabelTitle:"Titre *",manualLabelType:"Type",manualLabelPole:"Pôle principal",manualLabelDate:"Date (YYYY-MM-DD)",manualLabelUrl:"Lien source (URL)",manualLabelResume:"Résumé / Note",manualAddBtn:"Ajouter à la base locale",manualExportBtn:"Exporter contributions JSON",manualClearBtn:"Vider contributions locales",manualAddedMsg:"Notice ajoutée localement et visible dans l'index.",footerCopy:"© 2026 KITN — De l'information à la maîtrise."},ar:{langBtn:"Français",menuBtn:"القائمة",navThemes:"المحاور",navAcademy:"أكاديمية KITN",navMethod:"المنهجية",navResearch:"الفضاءات والفهرس",eyebrow:"مركز الرصد والمعرفة · من المعلومة إلى التمكن",heroTitle:"فهم المغرب. <span>واستشراف</span> تحولاته.",heroIntro:"منصة مستقلة لمتابعة تطورات المغرب واستكشاف الأبحاث والاطلاع على الأرقام والمباريات.",heroPrimary:"استكشاف الفضاءات ↗",heroSecondary:"اكتشف KITN ←",heroNote:"قراءة مهيكلة للمغرب",card1Top:"01 / المغرب",card1Map:"MA",card2Top:"المعرفة / 2026",card2Cap:"<strong>المعلومة</strong> ← المعرفة",chip:"✦ من المعلومة إلى التمكن",themesEyebrow:"القضايا الكبرى",themesTitle:"الاستكشاف حسب المحور",themesSub:"مواضيع أساسية منظمة لتجاوز الأخبار اليومية وفهم الديناميات العميقة.",openPole:"تصفية المواد حسب هذا القطب ←",activePoleBanner:"تصفية نشطة حسب القطب:",allPoles:"كل الأقطاب",allPolesSelect:"كل الأقطاب (6)",academyEyebrow:"أكاديمية KITN",academyTitle:"التعلم بمنهجية، لا بتسرع.",academyText:"معالم واضحة وملخصات مهيكلة واختبارات لتعميق الملفات الكبرى والاستعداد للمباريات.",academyBtn:"فتح فضاء المباريات والأكاديمية ←",academySheetLabel:"بطاقة مراجعة",academyQuizLabel:"اختبار تفاعلي",academyPageTop:"KITN",academyPageTitle:"Academy",academyPageSub:"المنهجية والمعالم",methodEyebrow:"مقاربتنا",methodTitle:"المعرفة تبدأ بسؤال جيد.",methodText:"تُقدّم KITN الوضوح والتحقق والربط السياقي بدل ضجيج المعلومات.",researchEyebrow:"الفضاءات المتخصصة والفهرس الوثائقي",researchTitle:"التنقل حسب الفضاء والمواد",searchPlaceholder:"ابحث بالعنوان أو المؤلف أو القطب أو نوع الوثيقة...",allTypes:"كل الأنواع",allConfidence:"كل مستويات الموثوقية",allDocLangs:"كل اللغات",sortNewest:"التاريخ: الأحدث",sortOldest:"التاريخ: الأقدم",sortScore:"الملاءمة: الأعلى أولاً",resetFilters:"إعادة الضبط",exportJson:"تصدير JSON",savedOnly:"المحفوظات فقط",saveBtn:"حفظ",savedBtn:"محفوظ",futureOnly:"التواريخ المستقبلية للمراجعة فقط",futureBadge:"تاريخ مستقبلي (للمراجعة)",unverifiedBadge:"للمراجعة",noAbstract:"الملخص غير متوفر في المصدر.",detailsBtn:"بطاقة تفصيلية",noResults:"لا توجد مواد مطابقة لبحثك أو لهذا الفضاء.",sourceLink:"عرض المصدر ↗",pdfLink:"ملف PDF ↗",closeBtn:"إغلاق",labelAuthor:"المؤلفون",labelDate:"تاريخ النشر",labelPole:"القطب",labelStatus:"الحالة التحريرية",labelType:"نوع الوثيقة",labelDocLang:"اللغة",labelConfidence:"الموثوقية",labelScore:"النتيجة",labelDoi:"المعرّف DOI",labelAbstract:"الملخص",statusValid:"متحقق منه",statusReview:"للمراجعة",manualTitle:"فضاء الإضافة اليدوية (محلي)",manualSub:"أضف يدوياً خبراً أو مقالاً أو إحصائية أو مباراة أو وثيقة مرجعية ثم صدّر ملف JSON.",manualLabelTitle:"العنوان *",manualLabelType:"النوع",manualLabelPole:"القطب الرئيسي",manualLabelDate:"التاريخ (YYYY-MM-DD)",manualLabelUrl:"رابط المصدر (URL)",manualLabelResume:"الملخص / ملاحظة",manualAddBtn:"إضافة إلى القاعدة المحلية",manualExportBtn:"تصدير الإضافات JSON",manualClearBtn:"مسح الإضافات المحلية",manualAddedMsg:"تمت إضافة المادة محلياً وظهرت في الفهرس.",footerCopy:"© 2026 KITN — من المعلومة إلى التمكن."}};function Ae(e,a){try{const i=localStorage.getItem(e),l=i?JSON.parse(i):a;return Array.isArray(l)?l:a}catch{return a}}function te(e,a){try{localStorage.setItem(e,JSON.stringify(a))}catch{}}function Y(e){return String(e.id||e.doi||e.url_publication||e.titre_original||"")}let r="fr",B="all",S=!1,j=0,_=null,L="",w="",C="",k="",P="",$="newest",G=0,W=0,A=null,F="",U=!1,K=!1,v=Ae(Te,[]),g=Ae(X,[]),x=null,ae=[],I=[];function t(e=""){return String(e).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function D(e){if(!e||typeof e!="string")return!1;try{const a=new URL(e.trim());return a.protocol==="https:"||a.protocol==="http:"}catch{return!1}}function J(e){if(e&&e.date_anomalie===!0||e&&e.date_statut==="date_future_a_verifier")return!0;const a=String((e==null?void 0:e.date_publication)||"").slice(0,10);return/^\d{4}-\d{2}-\d{2}$/.test(a)?a>Z:!1}function E(e){var a;return e?((a=qe[r])==null?void 0:a[e])||e:""}function z(e){var a;return e?((a=Se[r])==null?void 0:a[e])||e:""}function xe(e){var a;return e?((a=Re[r])==null?void 0:a[e])||e:""}function Be(e){var a;return e?((a=Me[r])==null?void 0:a[e])||e.toUpperCase():""}function ne(){const e=new Set,a=[];for(const i of[...g,...ae]){const l=Y(i);!l||e.has(l)||(e.add(l),a.push(i))}I=a}function je(e,a){if(!a||a==="all")return!0;const i=String(e.type_document||"").toLowerCase(),l=String(e.pole||"").toLowerCase();return a==="science"?i==="publication_scientifique"||l==="recherche_scientifique":a==="chiffres"?i==="statistique"||l==="economie_finances_publiques":a==="academy"?i==="concours"||l==="institutions_gouvernance"||l==="securite_affaires_interieures":a==="bibliotheque"?["rapport","rapport_institutionnel","document_juridique","statistique","publication_scientifique"].includes(i):!0}function Fe(e){const a=Y(e);a&&(v.includes(a)?v=v.filter(i=>i!==a):v=[...v,a],te(Te,v),m())}function Ue(){B="all",_=null,L="",w="",C="",k="",P="",$="newest",F="",U=!1,K=!1,f()}function Ie(){const e=F.trim().toLowerCase();return I.filter(i=>{if(!je(i,B)||!(!_||_.includes(i.pole))||w&&i.pole!==w||C&&i.type_document!==C||k&&i.confiance_classification!==k||P&&i.langue_originale!==P||U&&!J(i)||K&&!v.includes(Y(i)))return!1;if(!e)return!0;const o=(i.titre_original||"").toLowerCase(),c=Array.isArray(i.auteurs)?i.auteurs.join(" ").toLowerCase():"",s=(i.pole||"").toLowerCase(),d=E(i.pole).toLowerCase(),p=(i.type_document||"").toLowerCase(),h=z(i.type_document).toLowerCase(),y=(i.resume||"").toLowerCase();return o.includes(e)||c.includes(e)||s.includes(e)||d.includes(e)||p.includes(e)||h.includes(e)||y.includes(e)}).sort((i,l)=>{if($==="score")return(Number(l.score_pertinence)||0)-(Number(i.score_pertinence)||0);const o=String(i.date_publication||""),c=String(l.date_publication||"");return $==="oldest"?o.localeCompare(c):c.localeCompare(o)})}function Ee(e,a){const i={exported_at:new Date().toISOString(),total:e.length,items:e},l=new Blob([JSON.stringify(i,null,2)],{type:"application/json"}),o=URL.createObjectURL(l),c=document.createElement("a");c.href=o,c.download=a,c.click(),URL.revokeObjectURL(o)}function V(){var h;const e=document.getElementById("notice-modal");if(e&&e.remove(),!x)return;const a=b[r],i=x,l=Array.isArray(i.auteurs)&&i.auteurs.length?i.auteurs.join(", "):r==="ar"?"مؤلف غير مذكور":"Auteur non renseigné",o=i.resume&&String(i.resume).trim()?i.resume:a.noAbstract,c=i.statut_validation==="valide"&&!J(i)?a.statusValid:a.statusReview,s=D(i.url_publication)?i.url_publication.trim():"",d=D(i.pdf_direct)?i.pdf_direct.trim():"",p=document.createElement("div");p.id="notice-modal",p.className="modal-backdrop",p.innerHTML=`
    <div class="modal-card" role="dialog" aria-modal="true">
      <div class="modal-head">
        <span>${t(z(i.type_document)||E(i.pole)||"")}</span>
        <button type="button" class="modal-close" id="close-modal">${t(a.closeBtn)} ✕</button>
      </div>
      <h3>${t(i.titre_original||"")}</h3>
      ${J(i)?`<span class="flag-warn">${t(a.futureBadge)}</span>`:""}
      <dl class="modal-meta">
        <div><dt>${t(a.labelAuthor)}</dt><dd>${t(l)}</dd></div>
        <div><dt>${t(a.labelDate)}</dt><dd>${t(i.date_publication||"—")}</dd></div>
        <div><dt>${t(a.labelPole)}</dt><dd>${t(E(i.pole)||"—")}</dd></div>
        <div><dt>${t(a.labelStatus)}</dt><dd>${t(c)}</dd></div>
        ${i.langue_originale?`<div><dt>${t(a.labelDocLang)}</dt><dd>${t(Be(i.langue_originale))}</dd></div>`:""}
        ${i.confiance_classification?`<div><dt>${t(a.labelConfidence)}</dt><dd>${t(xe(i.confiance_classification))}</dd></div>`:""}
        ${typeof i.score_pertinence=="number"?`<div><dt>${t(a.labelScore)}</dt><dd>${t(String(i.score_pertinence))}</dd></div>`:""}
        ${i.doi?`<div><dt>${t(a.labelDoi)}</dt><dd>${t(i.doi)}</dd></div>`:""}
      </dl>
      <div class="modal-resume">
        <strong>${t(a.labelAbstract)}</strong>
        <p>${t(o)}</p>
      </div>
      <div class="result-actions">
        ${s?`<a href="${t(s)}" target="_blank" rel="noopener noreferrer">${t(a.sourceLink)}</a>`:""}
        ${d?`<a href="${t(d)}" target="_blank" rel="noopener noreferrer">${t(a.pdfLink)}</a>`:""}
      </div>
    </div>
  `,document.body.appendChild(p),(h=document.getElementById("close-modal"))==null||h.addEventListener("click",()=>{x=null,V()}),p.addEventListener("click",y=>{y.target===p&&(x=null,V())})}function m(){var c;const e=document.getElementById("results-grid"),a=document.getElementById("index-count"),i=document.getElementById("active-pole-banner");if(!e||!a)return;const l=Ie(),o=r==="ar"?" مادة":l.length>1?" notices":" notice";if(a.textContent=`${l.length}${o}`,i&&(_&&L?(i.innerHTML=`
        <span>${t(b[r].activePoleBanner)} <strong>${t(L)}</strong></span>
        <button type="button" class="link-btn" id="clear-pole-inline">${t(b[r].allPoles)} ✕</button>
      `,i.style.display="flex",(c=document.getElementById("clear-pole-inline"))==null||c.addEventListener("click",()=>{_=null,L="",m()})):(i.style.display="none",i.innerHTML="")),!l.length){e.innerHTML=`<p class="empty-results">${t(b[r].noResults)}</p>`;return}e.innerHTML=l.map((s,d)=>{const p=v.includes(Y(s)),h=Array.isArray(s.auteurs)&&s.auteurs.length?s.auteurs.join(", "):r==="ar"?"مؤلف غير مذكور":"Auteur non renseigné",y=t(s.date_publication||""),N=t(z(s.type_document)||E(s.pole)||""),H=J(s)?`<span class="flag-warn">${t(b[r].futureBadge)}</span>`:s.statut_validation==="a_verifier"?`<span class="flag-warn">${t(b[r].unverifiedBadge)}</span>`:"",R=s.resume&&String(s.resume).trim()?`<p class="result-resume">${t(s.resume)}</p>`:"",T=D(s.pdf_direct)?s.pdf_direct.trim():"",q=D(s.url_publication)?s.url_publication.trim():"",M=T?`<a href="${t(T)}" target="_blank" rel="noopener noreferrer">${t(b[r].pdfLink)}</a>`:"",O=q?`<a href="${t(q)}" target="_blank" rel="noopener noreferrer">${t(b[r].sourceLink)}</a>`:"";return`
        <article class="result-card">
          <div class="result-meta">
            <span>${y}</span>
            <span>${N}</span>
          </div>
          ${H}
          <h3>${t(s.titre_original||"")}</h3>
          <p class="result-authors">${t(h)}</p>
          ${R}
          <div class="result-actions">
            ${O}
            ${M}
            <button type="button" class="link-btn" data-open-index="${d}">${t(b[r].detailsBtn)}</button>
            <button type="button" class="fav-btn ${p?"is-saved":""}" data-fav-index="${d}">${p?"★ ":"☆ "}${t(p?b[r].savedBtn:b[r].saveBtn)}</button>
          </div>
        </article>
      `}).join(""),e.querySelectorAll("[data-open-index]").forEach(s=>{s.addEventListener("click",()=>{const d=Number(s.getAttribute("data-open-index"));x=l[d]||null,V()})}),e.querySelectorAll("[data-fav-index]").forEach(s=>{s.addEventListener("click",()=>{const d=Number(s.getAttribute("data-fav-index"));l[d]&&Fe(l[d])})})}function f(){var R,T,q,M,O,ie,se,le,re,oe,ce,ue,de,pe,me,fe;const e=b[r],a=Q[r],i=Oe[r],l=ee[r],o=Ne[r],c=a[j]||a[0];i[G]||i[0];const s=l[W]||l[0],d=Object.keys(qe[r]),p=[...new Set(I.map(n=>n.type_document).filter(Boolean))],h=[...new Set(I.map(n=>n.confiance_classification).filter(Boolean))],y=[...new Set(I.map(n=>n.langue_originale).filter(Boolean))];document.documentElement.lang=r,document.documentElement.dir=r==="ar"?"rtl":"ltr";const N=document.getElementById("app");if(!N)return;const H=A===s.answer;N.innerHTML=`
    <header class="topbar">
      <a href="#" class="brand">
        <span class="brand-mark">K</span>
        <span>KITN<span class="brand-dot">.</span></span>
      </a>
      <nav class="nav ${S?"is-open":""}" id="main-nav">
        <a href="#themes">${e.navThemes}</a>
        <a href="#academy">${e.navAcademy}</a>
        <a href="#method">${e.navMethod}</a>
        <a href="#research">${e.navResearch}</a>
      </nav>
      <div class="topbar-actions">
        <button type="button" class="menu-toggle" id="menu-toggle" aria-expanded="${S}">${e.menuBtn}</button>
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

    <section class="section" id="themes">
      <div class="section-head">
        <div>
          <span class="eyebrow">${e.themesEyebrow}</span>
          <h2>${e.themesTitle}</h2>
        </div>
        <p>${e.themesSub}</p>
      </div>

      <div class="themes-grid">
        ${a.map((n,u)=>`
          <button type="button" class="theme-card ${u===j?"is-active":""}" data-theme-idx="${u}">
            <div class="theme-top">
              <span>${n.num}</span>
              <span>${n.symbol}</span>
            </div>
            <h3>${t(n.title)}</h3>
            <p>${t(n.desc)}</p>
          </button>
        `).join("")}
      </div>

      <div class="theme-detail">
        <div>
          <h3>${t(c.title)}</h3>
          <p>${t(c.detail)}</p>
          <div class="theme-tags">
            ${c.tags.map(n=>`<span>${t(n)}</span>`).join("")}
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
        ${l.map((n,u)=>`
          <button type="button" class="tab-btn ${u===W?"is-active":""}" data-academy-idx="${u}">${t(n.label)}</button>
        `).join("")}
      </div>

      <div class="academy-card">
        <div>
          <span class="mini-label">${t(e.academySheetLabel)}</span>
          <h3>${t(s.title)}</h3>
          <p>${t(s.sheet)}</p>
        </div>
        <div>
          <span class="mini-label">${t(e.academyQuizLabel)}</span>
          <p class="quiz-question">${t(s.question)}</p>
          <div class="quiz-options">
            ${s.options.map((n,u)=>`
              <button type="button" class="quiz-opt ${A===u?"is-selected":""}" data-quiz-opt="${u}">${t(n)}</button>
            `).join("")}
          </div>
          ${A!==null?`
            <p class="quiz-feedback ${H?"is-ok":"is-ko"}">
              ${t(s.correction)}
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
        ${i.map((n,u)=>`
          <button type="button" class="principle-card ${u===G?"is-active":""}" data-principle-idx="${u}">
            <span>${n.num}</span>
            <h3>${t(n.title)}</h3>
            <p>${t(n.text)}</p>
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
        ${o.map(n=>`
          <button type="button" class="space-tab ${B===n.id?"is-active":""}" data-space-id="${n.id}">${t(n.label)}</button>
        `).join("")}
      </div>

      ${B==="contribuer"?`
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
                ${Object.entries(Se[r]).map(([n,u])=>`<option value="${n}">${t(u)}</option>`).join("")}
              </select>
            </label>
            <label>
              <span>${t(e.manualLabelPole)}</span>
              <select id="m-pole">
                ${d.map(n=>`<option value="${n}">${t(E(n))}</option>`).join("")}
              </select>
            </label>
            <label>
              <span>${t(e.manualLabelDate)}</span>
              <input type="date" id="m-date" value="${Z}" />
            </label>
            <label>
              <span>${t(e.manualLabelUrl)}</span>
              <input type="url" id="m-url" placeholder="https://..." />
            </label>
          </div>
          <label class="manual-resume-field">
            <span>${t(e.manualLabelResume)}</span>
            <textarea id="m-resume" rows="3"></textarea>
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
        <input type="search" id="search-input" placeholder="${t(e.searchPlaceholder)}" value="${t(F)}" />
        <select id="pole-select">
          <option value="">${t(e.allPolesSelect)}</option>
          ${d.map(n=>`<option value="${n}" ${w===n?"selected":""}>${t(E(n))}</option>`).join("")}
        </select>
        <select id="type-select">
          <option value="">${t(e.allTypes)}</option>
          ${p.map(n=>`<option value="${n}" ${C===n?"selected":""}>${t(z(n))}</option>`).join("")}
        </select>
        <select id="conf-select">
          <option value="">${t(e.allConfidence)}</option>
          ${h.map(n=>`<option value="${n}" ${k===n?"selected":""}>${t(xe(n))}</option>`).join("")}
        </select>
        <select id="lang-doc-select">
          <option value="">${t(e.allDocLangs)}</option>
          ${y.map(n=>`<option value="${n}" ${P===n?"selected":""}>${t(Be(n))}</option>`).join("")}
        </select>
        <select id="sort-select">
          <option value="newest" ${$==="newest"?"selected":""}>${t(e.sortNewest)}</option>
          <option value="oldest" ${$==="oldest"?"selected":""}>${t(e.sortOldest)}</option>
          <option value="score" ${$==="score"?"selected":""}>${t(e.sortScore)}</option>
        </select>
      </div>

      <div class="filters-secondary">
        <label class="check-pill">
          <input type="checkbox" id="fav-only" ${K?"checked":""} />
          <span>${t(e.savedOnly)} (${v.length})</span>
        </label>
        <label class="check-pill">
          <input type="checkbox" id="future-only" ${U?"checked":""} />
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
  `,(R=document.getElementById("lang-toggle"))==null||R.addEventListener("click",()=>{r=r==="fr"?"ar":"fr",f()}),(T=document.getElementById("menu-toggle"))==null||T.addEventListener("click",()=>{S=!S,f()}),document.querySelectorAll("#main-nav a").forEach(n=>{n.addEventListener("click",()=>{S=!1,f()})}),document.querySelectorAll("[data-theme-idx]").forEach(n=>{n.addEventListener("click",()=>{j=Number(n.getAttribute("data-theme-idx"))||0,f()})}),(q=document.getElementById("filter-by-theme"))==null||q.addEventListener("click",()=>{var u;const n=Q[r][j]||Q[r][0];_=n.poles,L=n.title,m(),(u=document.getElementById("research"))==null||u.scrollIntoView({behavior:"smooth"})}),document.querySelectorAll("[data-academy-idx]").forEach(n=>{n.addEventListener("click",()=>{W=Number(n.getAttribute("data-academy-idx"))||0,A=null,f()})}),document.querySelectorAll("[data-quiz-opt]").forEach(n=>{n.addEventListener("click",()=>{A=Number(n.getAttribute("data-quiz-opt")),f()})}),document.querySelectorAll("[data-principle-idx]").forEach(n=>{n.addEventListener("click",()=>{G=Number(n.getAttribute("data-principle-idx"))||0,f()})}),document.querySelectorAll("[data-space-id]").forEach(n=>{n.addEventListener("click",()=>{B=n.getAttribute("data-space-id")||"all",f()})}),(M=document.getElementById("manual-form"))==null||M.addEventListener("submit",n=>{var he,ye,ge,$e,_e,Le;n.preventDefault();const u=(((he=document.getElementById("m-title"))==null?void 0:he.value)||"").trim();if(!u)return;const we=((ye=document.getElementById("m-type"))==null?void 0:ye.value)||"article",Ce=((ge=document.getElementById("m-pole"))==null?void 0:ge.value)||"institutions_gouvernance",ke=(($e=document.getElementById("m-date"))==null?void 0:$e.value)||Z,be=(((_e=document.getElementById("m-url"))==null?void 0:_e.value)||"").trim(),Pe=(((Le=document.getElementById("m-resume"))==null?void 0:Le.value)||"").trim();g=[{id:`kitn_manual_${Date.now()}`,titre_original:u,auteurs:[r==="ar"?"إضافة يدوية":"Contribution manuelle"],date_publication:ke,date_statut:"date_confirmee",date_anomalie:!1,statut_validation:"valide",langue_originale:r,source_id:"manual_studio",source_nom:r==="ar"?"إضافة يدوية KITN":"Contribution manuelle KITN",type_document:we,pole:Ce,poles_secondaires:[],confiance_classification:"eleve",score_pertinence:90,url_publication:D(be)?be:null,doi:null,pdf_direct:null,resume:Pe},...g],te(X,g),ne(),f();const ve=document.getElementById("manual-status");ve&&(ve.textContent=e.manualAddedMsg)}),(O=document.getElementById("manual-export"))==null||O.addEventListener("click",()=>{Ee(g,"kitn-contributions-manuelles.json")}),(ie=document.getElementById("manual-clear"))==null||ie.addEventListener("click",()=>{g=[],te(X,g),ne(),f()}),(se=document.getElementById("search-input"))==null||se.addEventListener("input",n=>{F=n.target.value||"",m()}),(le=document.getElementById("pole-select"))==null||le.addEventListener("change",n=>{w=n.target.value||"",_=null,L="",m()}),(re=document.getElementById("type-select"))==null||re.addEventListener("change",n=>{C=n.target.value||"",m()}),(oe=document.getElementById("conf-select"))==null||oe.addEventListener("change",n=>{k=n.target.value||"",m()}),(ce=document.getElementById("lang-doc-select"))==null||ce.addEventListener("change",n=>{P=n.target.value||"",m()}),(ue=document.getElementById("sort-select"))==null||ue.addEventListener("change",n=>{$=n.target.value||"newest",m()}),(de=document.getElementById("fav-only"))==null||de.addEventListener("change",n=>{K=!!n.target.checked,m()}),(pe=document.getElementById("future-only"))==null||pe.addEventListener("change",n=>{U=!!n.target.checked,m()}),(me=document.getElementById("reset-filters"))==null||me.addEventListener("click",Ue),(fe=document.getElementById("export-json"))==null||fe.addEventListener("click",()=>{Ee(Ie(),"kitn-export.json")}),m(),V()}async function Ke(){try{const e=await fetch("/data/academy/academy.json",{cache:"no-store"});if(!e.ok)return;const a=await e.json();a!=null&&a.tracks&&typeof a.tracks=="object"&&(Array.isArray(a.tracks.fr)&&a.tracks.fr.length&&(ee.fr=a.tracks.fr),Array.isArray(a.tracks.ar)&&a.tracks.ar.length&&(ee.ar=a.tracks.ar),f())}catch{}}async function Je(){try{const e=await fetch("/data/index/search-index.json",{cache:"no-store"});if(e.ok){const a=await e.json();ae=Array.isArray(a==null?void 0:a.items)?a.items:[]}}catch{ae=[]}ne(),m()}f();Ke();Je();
