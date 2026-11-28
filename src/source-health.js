export const SOURCE_HEALTH_STALE_AFTER_MS = 24 * 60 * 60 * 1000;
export const SOURCE_HEALTH_FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

export function getSourceHealthFreshness(updatedAt, now = Date.now()) {
  const timestamp = Date.parse(updatedAt);
  if (!Number.isFinite(timestamp) || timestamp > now + SOURCE_HEALTH_FUTURE_TOLERANCE_MS) {
    return "unknown";
  }
  return now - timestamp > SOURCE_HEALTH_STALE_AFTER_MS ? "stale" : "fresh";
}

export function isSourceHealthStale(updatedAt, now = Date.now()) {
  return getSourceHealthFreshness(updatedAt, now) === "stale";
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
        fetched: report ? Number(report.fetched || 0) : 0,
        accepted: report ? Number(report.accepted || 0) : 0,
        error: report?.error || report?.message || null,
        checked_at: report?.checked_at || null,
        reported: Boolean(report)
      };
    })
    .filter(Boolean);
}
