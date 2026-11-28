const GENERIC_TERMS = new Set([
  "2020", "2021", "2022", "2023", "2024", "2025", "2026", "2027", "2028",
  "maroc", "marocaine", "marocain", "marocaines", "marocains",
  "rapport", "rapports", "document", "documents", "publication", "publications",
  "article", "articles", "actualité", "actualite", "information", "informations",
  "analyse", "analyses", "étude", "etude", "études", "etudes", "source", "sources",
  "national", "nationale", "nationaux", "nationales", "public", "publique", "publics",
  "publiques", "ministère", "ministere", "ministères", "ministeres", "conseil",
  "président", "president", "présidence", "presidence", "institution", "institutions",
  "économique", "economique", "économiques", "economiques", "social", "sociale",
  "sociaux", "sociales", "développement", "developpement", "stratégique", "strategique",
  "stratégiques", "strategiques", "général", "general", "générale", "generale",
  "plus", "moins", "ainsi", "aussi", "avec", "dans", "pour", "entre", "après",
  "avant", "selon", "cette", "celui", "celle", "leurs", "notamment", "également",
  "egalement", "ainsi", "être", "etre", "avoir", "fait", "faire", "tout", "tous",
  "toute", "toutes", "comme", "dont", "mais", "donc", "alors", "sans", "vers",
  "chez", "depuis", "lors", "parmi", "suite", "année", "annee", "années", "annees", "rencontre", "novembre", "decembre", "janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "premier", "premiere", "deuxieme", "troisieme", "edition", "salon", "aujourdhui",
  "اليوم", "المغرب", "المغربية", "المغربي", "تقرير", "تقارير", "دراسة", "دراسات",
  "وثيقة", "وثائق", "منشور", "منشورات", "مصدر", "مصادر", "وطني", "الوطنية",
  "الوطني", "العمومي", "العمومية", "الاجتماعي", "الاقتصادي", "التنمية",
  "الرئيس", "المجلس", "وزارة", "وزير", "هذه", "هذا", "ذلك", "التي", "الذي",
  "على", "من", "إلى", "عن", "مع", "بين", "بعد", "قبل", "ضمن", "حول"
]);

function getMeaningfulTerms(item, normalizeText) {
  const toTerms = (value) => new Set(normalizeText(value).split(" ").filter((term) =>
    term.length >= 4 && !/^\d+$/.test(term) && !GENERIC_TERMS.has(term)
  ));
  const primary = toTerms([
    item?.titre_original || "",
    ...(Array.isArray(item?.mots_cles) ? item.mots_cles : [])
  ].join(" "));
  const context = toTerms([
    item?.resume || "",
    item?.analyse_strategique || ""
  ].join(" "));
  return { primary, context };
}

export function findRelatedKnowledgeItems(items, item, {
  getSpace,
  getKey,
  isFutureDate = () => false,
  normalizeText = (value) => String(value || "").toLocaleLowerCase(),
  limit = 3
} = {}) {
  if (!Array.isArray(items) || !item || !Number.isInteger(limit) || limit <= 0) return [];
  const sourceTerms = getMeaningfulTerms(item, normalizeText);
  if (!sourceTerms.primary.size && !sourceTerms.context.size) return [];
  const sourceSpace = getSpace?.(item);
  const sourceKey = getKey?.(item) ?? item;
  return items
    .filter((candidate) => candidate && (getKey?.(candidate) ?? candidate) !== sourceKey && !isFutureDate(candidate))
    .map((candidate) => {
      const candidateSpace = getSpace?.(candidate);
      const candidateTerms = getMeaningfulTerms(candidate, normalizeText);
      const sharedPrimary = [...sourceTerms.primary].filter((term) => candidateTerms.primary.has(term));
      const sharedContext = [...sourceTerms.primary].filter((term) => candidateTerms.context.has(term))
        .concat([...sourceTerms.context].filter((term) => candidateTerms.primary.has(term)));
      const sharedTerms = [...new Set([...sharedPrimary, ...sharedContext])];
      const samePole = Boolean(item.pole && candidate.pole === item.pole);
      const crossSpace = Boolean(sourceSpace && candidateSpace && candidateSpace !== sourceSpace);
      return {
        item: candidate,
        sharedTerms,
        crossSpace,
        score: sharedPrimary.length * 4 + sharedContext.length + (samePole ? 2 : 0) + (crossSpace ? 8 : 0)
      };
    })
    .filter((entry) => entry.sharedTerms.length > 0 && (entry.sharedTerms.length >= 2 || entry.sharedTerms.some((term) => term.length >= 7)))
    .sort((a, b) =>
      Number(b.crossSpace) - Number(a.crossSpace) ||
      b.score - a.score ||
      String(b.item.date_publication || "").localeCompare(String(a.item.date_publication || ""))
    )
    .slice(0, limit);
}
