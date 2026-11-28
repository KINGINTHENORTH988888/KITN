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
