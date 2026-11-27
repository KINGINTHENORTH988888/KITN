const ECONOMY_POLE = "economie_finances_publiques";
const SOCIETY_POLE = "societe_developpement_humain";

export function getStatisticsCategory(indicator) {
  const pole = String(indicator?.pole || indicator?.category_code || "").trim();
  if (pole === ECONOMY_POLE || pole === SOCIETY_POLE) return pole;

  const legacyCategory = String(indicator?.category || "").trim();
  if (legacyCategory === ECONOMY_POLE || legacyCategory === SOCIETY_POLE) return legacyCategory;

  return "";
}

function utcDate(year, month = 1, day = 1) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
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
  if (!Array.isArray(history) || range === "all") return Array.isArray(history) ? history : [];

  const years = Number(range);
  if (![5, 10].includes(years)) return history;

  const anchor = anchorAsDate(referenceDate);
  const cutoff = new Date(anchor);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - years);

  const datedPoints = history
    .map((point) => ({ point, date: parseStatisticsPeriod(point?.year, anchor) }))
    .filter((entry) => entry.date);

  // If a legacy series has no interpretable periods, preserve its history rather
  // than silently hiding every observation behind a misleading empty chart.
  if (!datedPoints.length) return history;

  return datedPoints
    .filter((entry) => entry.date >= cutoff)
    .map((entry) => entry.point);
}
