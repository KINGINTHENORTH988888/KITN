const ECONOMY_POLE = "economie_finances_publiques";
const SOCIETY_POLE = "societe_developpement_humain";

const HCP_SOCIAL_AR = {
  HCP_SOCIAL_POPULATION: {
    label: "السكان القانونيون",
    description: "عدد السكان القانونيين للمغرب، استنادًا إلى الإحصاءات العامة للسكان والسكنى.",
    unit: "ألف نسمة",
  },
  HCP_SOCIAL_URBANIZATION: {
    label: "معدل التمدّن",
    description: "نسبة السكان المقيمين في الوسط الحضري وفقًا لإحصاءات المندوبية السامية للتخطيط.",
    unit: "%",
  },
  HCP_SOCIAL_FERTILITY: {
    label: "مؤشر الخصوبة الإجمالي",
    description: "متوسط عدد الأطفال لكل امرأة وفقًا لإحصاءات المندوبية السامية للتخطيط.",
    unit: "طفل لكل امرأة",
  },
  HCP_SOCIAL_UNEMPLOYMENT: {
    label: "معدل البطالة الوطني",
    description: "معدل البطالة الوطني المستند إلى البحث الوطني حول التشغيل الصادر عن المندوبية السامية للتخطيط.",
    unit: "%",
  },
  HCP_SOCIAL_PRIMARY_NET_SCHOOLING: {
    label: "معدل التمدرس الصافي بالتعليم الابتدائي",
    description: "معدل التمدرس الصافي بالتعليم الابتدائي على المستوى الوطني، وفقًا لبيانات وزارة التربية الوطنية.",
    unit: "%",
  },
  HCP_SOCIAL_UPPER_SECONDARY_GROSS_SCHOOLING: {
    label: "معدل التمدرس الإجمالي بالتعليم الثانوي التأهيلي",
    description: "معدل التمدرس الإجمالي بالتعليم الثانوي التأهيلي على المستوى الوطني، وفقًا لبيانات وزارة التربية الوطنية.",
    unit: "%",
  },
  HCP_SOCIAL_UNDER5_MORTALITY: {
    label: "معدل وفيات الأطفال دون سن الخامسة",
    description: "عدد وفيات الأطفال دون سن الخامسة لكل ألف ولادة حية.",
    unit: "وفاة لكل 1,000 ولادة حية",
  },
  HCP_SOCIAL_GINI: {
    label: "معامل جيني للنفقات",
    description: "معامل جيني لقياس التفاوت في نفقات الأسر.",
    unit: "مؤشر (من 0 إلى 1)",
  },
};

export function getLocalizedStatisticField(indicator, field, language = "fr") {
  if (!indicator || !["label", "description", "unit"].includes(field)) return "";
  const french = indicator[`${field}_fr`] || "";
  const localized = indicator[`${field}_ar`] || "";
  if (language !== "ar") return french || localized;
  if (localized && localized !== french) return localized;
  return HCP_SOCIAL_AR[indicator.indicator_code]?.[field] || localized || french;
}

export function getStatisticsCategory(indicator) {
  const pole = String(indicator?.pole || indicator?.category_code || "").trim();
  if (pole === ECONOMY_POLE || pole === SOCIETY_POLE) return pole;

  const legacyCategory = String(indicator?.category || "").trim();
  if (legacyCategory === ECONOMY_POLE || legacyCategory === SOCIETY_POLE) return legacyCategory;

  return "";
}

function utcDate(year, month = 1, day = 1) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return null;
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return null;
  return date;
}

function anchorAsDate(anchor) {
  if (anchor instanceof Date && !Number.isNaN(anchor.getTime())) {
    return new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate()));
  }
  const raw = String(anchor || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return utcDate(Number(match[1]), Number(match[2]), Number(match[3]));
  return new Date();
}

export function parseStatisticsPeriod(value, anchor = null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  let match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return utcDate(Number(match[1]), Number(match[2]), Number(match[3]));

  match = raw.match(/^(\d{4})-(\d{2})$/);
  if (match) return utcDate(Number(match[1]), Number(match[2]), 1);

  match = raw.match(/^(\d{4})-T([1-4])$/i)
    || raw.match(/^T([1-4])[-/](\d{4})$/i);
  if (match) {
    const year = Number(match[1].length === 4 ? match[1] : match[2]);
    const quarter = Number(match[1].length === 4 ? match[2] : match[1]);
    return utcDate(year, (quarter - 1) * 3 + 1, 1);
  }

  match = raw.match(/^(\d{4})$/);
  if (match) return utcDate(Number(match[1]), 1, 1);

  const normalized = raw.toLocaleLowerCase("fr").replace(/[’']/g, "’");
  const base = anchorAsDate(anchor);
  if (["aujourd’hui", "aujourd'hui", "aujourdhui", "today"].includes(normalized)) return base;
  if (["veille", "hier", "yesterday"].includes(normalized)) {
    base.setUTCDate(base.getUTCDate() - 1);
    return base;
  }

  return null;
}

export function filterStatisticsHistory(history, range, referenceDate = null) {
  if (!Array.isArray(history)) return [];

  const anchor = anchorAsDate(referenceDate);
  const years = Number(range);
  const useCalendarWindow = range !== "all" && [5, 10].includes(years);
  const cutoff = new Date(anchor);
  if (useCalendarWindow) cutoff.setUTCFullYear(cutoff.getUTCFullYear() - years);

  const datedPoints = history.map((point) => ({
    point,
    date: parseStatisticsPeriod(point?.year, anchor),
  }));
  const hasParseablePeriods = datedPoints.some((entry) => entry.date);

  // Keep legacy labels when no period can be interpreted. When dates are
  // available, never expose a future observation as the latest published value.
  if (!hasParseablePeriods) return history;

  return datedPoints
    .filter((entry) => {
      if (!entry.date) return !useCalendarWindow;
      if (entry.date > anchor) return false;
      return !useCalendarWindow || entry.date >= cutoff;
    })
    .map((entry) => entry.point);
}
