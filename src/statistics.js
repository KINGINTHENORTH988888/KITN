const ECONOMY_POLE = "economie_finances_publiques";
const SOCIETY_POLE = "societe_developpement_humain";
const VALID_CATEGORIES = new Set([ECONOMY_POLE, SOCIETY_POLE]);

function validUtcDate(year, month = 1, day = 1) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) return null;
  return date;
}

function parsePeriodDate(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  let match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return validUtcDate(Number(match[1]), Number(match[2]), Number(match[3]));

  match = raw.match(/^(\d{4})-(\d{2})$/);
  if (match) return validUtcDate(Number(match[1]), Number(match[2]), 1);

  match = raw.match(/^(\d{4})-T([1-4])$/i)
    || raw.match(/^T([1-4])[-/](\d{4})$/i)
    || raw.match(/^T([1-4])\/(\d{4})$/i);
  if (match) {
    const year = Number(match[1].length === 4 ? match[1] : match[2]);
    const quarter = Number(match[1].length === 4 ? match[2] : match[1]);
    return validUtcDate(year, (quarter - 1) * 3 + 1, 1);
  }

  match = raw.match(/^(\d{4})$/);
  if (match) return validUtcDate(Number(match[1]), 1, 1);

  match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) return validUtcDate(Number(match[3]), Number(match[2]), Number(match[1]));

  return null;
}

function anchorDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return validUtcDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  }
  const raw = String(value ?? "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return validUtcDate(Number(match[1]), Number(match[2]), Number(match[3]));
  return new Date();
}

export function getStatisticsCategory(indicator) {
  const candidates = [indicator?.pole, indicator?.category_code, indicator?.category]
    .map((value) => String(value ?? "").trim().toLowerCase());
  const direct = candidates.find((value) => VALID_CATEGORIES.has(value));
  if (direct) return direct;

  // Older series may have a descriptive category instead of the stable pole code.
  const descriptive = candidates[2].normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/societe|emploi|population|education|sante|pauvrete|developpement humain/.test(descriptive)) {
    return SOCIETY_POLE;
  }
  if (/economie|financ|monetaire|budget|pib|inflation|prix|dette|recette|change|credit/.test(descriptive)) {
    return ECONOMY_POLE;
  }
  return "";
}

export function parseStatisticsPeriod(value) {
  return parsePeriodDate(value);
}

export function getStatisticsHistory(indicator) {
  const byPeriod = new Map();
  const history = Array.isArray(indicator?.history) ? indicator.history : [];
  for (const point of [...history, indicator?.previous, indicator?.latest]) {
    if (!point || point.year === undefined || point.year === null || point.value === undefined || point.value === null) continue;
    byPeriod.set(String(point.year), point);
  }
  return [...byPeriod.values()].sort((a, b) => {
    const dateA = parsePeriodDate(a.year);
    const dateB = parsePeriodDate(b.year);
    if (dateA && dateB) return dateA - dateB;
    if (dateA) return -1;
    if (dateB) return 1;
    return String(a.year).localeCompare(String(b.year));
  });
}

export function filterStatisticsHistory(history, range = "all", referenceDate = null) {
  if (!Array.isArray(history)) return [];

  const anchor = anchorDate(referenceDate);
  const years = Number(range);
  const useCalendarWindow = range !== "all" && [5, 10].includes(years);
  const cutoff = new Date(anchor);
  if (useCalendarWindow) cutoff.setUTCFullYear(cutoff.getUTCFullYear() - years);

  const dated = history.map((point, index) => ({
    point,
    index,
    date: parsePeriodDate(point?.year),
  }));
  const hasParseablePeriods = dated.some((entry) => entry.date);
  if (!hasParseablePeriods) return history;

  return dated
    .filter(({ date }) => {
      if (!date) return !useCalendarWindow;
      if (date > anchor) return false;
      return !useCalendarWindow || date >= cutoff;
    })
    .sort((a, b) => {
      if (a.date && b.date) return a.date - b.date || a.index - b.index;
      if (a.date) return -1;
      if (b.date) return 1;
      return a.index - b.index;
    })
    .map(({ point }) => point);
}
