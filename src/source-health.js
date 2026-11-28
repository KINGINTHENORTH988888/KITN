export const SOURCE_HEALTH_STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export function isSourceHealthStale(updatedAt, now = Date.now()) {
  const timestamp = Date.parse(updatedAt);
  return Number.isFinite(timestamp) && now - timestamp > SOURCE_HEALTH_STALE_AFTER_MS;
}
