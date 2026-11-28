export const SOURCE_HEALTH_STALE_AFTER_MS = 24 * 60 * 60 * 1000;
export const SOURCE_HEALTH_FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

function parseSourceHealthTimestamp(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2}))?$/);
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, timezone] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText || 0);
  const minute = Number(minuteText || 0);
  const second = Number(secondText || 0);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));

  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day ||
    hour > 23 || minute > 59 || second > 59
  ) return null;

  if (timezone && timezone !== "Z") {
    const offset = timezone.slice(1).split(":").map(Number);
    if (offset[0] > 14 || offset[1] > 59 || (offset[0] === 14 && offset[1] !== 0)) return null;
  }
  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function getSourceHealthFreshness(updatedAt, now = Date.now()) {
  const timestamp = parseSourceHealthTimestamp(updatedAt);
  if (timestamp === null || !Number.isFinite(now) || timestamp > now + SOURCE_HEALTH_FUTURE_TOLERANCE_MS) {
    return "unknown";
  }
  return now - timestamp > SOURCE_HEALTH_STALE_AFTER_MS ? "stale" : "fresh";
}

export function isSourceHealthStale(updatedAt, now = Date.now()) {
  return getSourceHealthFreshness(updatedAt, now) === "stale";
}

function nonNegativeCount(value) {
  // JSON booleans are not counters: Number(true) would otherwise become 1.
  // Keep numeric strings for compatibility with source reports, but reject
  // empty strings and non-numeric JSON types rather than coercing them.
  if (typeof value === "boolean" || value == null) return 0;
  if (typeof value === "string" && !value.trim()) return 0;
  if (typeof value !== "number" && typeof value !== "string") return 0;
  const count = Number(value);
  return Number.isSafeInteger(count) && count > 0 ? count : 0;
}

export function reconcileSourceHealth(configuredSources, reportSources) {
  const reportById = new Map(
    (Array.isArray(reportSources) ? reportSources : [])
      .filter((source) => source && typeof source === "object")
      .map((source) => [String(source.source_id || source.id || "").trim(), source])
      .filter(([id]) => id)
  );

  return (Array.isArray(configuredSources) ? configuredSources : [])
    .filter((source) => source && typeof source === "object" && source.enabled !== false)
    .map((source) => {
      const sourceId = String(source.id || source.source_id || "").trim();
      if (!sourceId) return null;

      const report = reportById.get(sourceId);
      return {
        ...source,
        source_id: sourceId,
        source_name: source.name || source.source_name || report?.source_name || sourceId,
        enabled: true,
        status: report && ["ok", "warning", "error"].includes(report.status)
          ? report.status
          : "unknown",
        stage: report?.stage || "non_verifie",
        fetched: report ? nonNegativeCount(report.fetched) : 0,
        accepted: report ? nonNegativeCount(report.accepted) : 0,
        error: report?.error || report?.message || null,
        checked_at: report?.checked_at || null,
        reported: Boolean(report)
      };
    })
    .filter(Boolean);
}

export function getEffectiveSourceStatus(status, reportFreshness) {
  // An old or undated report cannot prove that a previously healthy source is
  // still operational. Preserve observed failures and warnings, but downgrade
  // stale "ok" results to unverified until a fresh run confirms them.
  if (status === "ok" && reportFreshness !== "fresh") return "unknown";
  return ["ok", "warning", "error", "unknown"].includes(status) ? status : "unknown";
}
