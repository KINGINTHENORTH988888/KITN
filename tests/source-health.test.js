import test from "node:test";
import assert from "node:assert/strict";
import { getSourceHealthFreshness, isSourceHealthStale, SOURCE_HEALTH_STALE_AFTER_MS } from "../src/source-health.js";

test("source health report is fresh at the 24-hour boundary", () => {
  const now = Date.parse("2026-11-28T12:00:00Z");
  const updatedAt = new Date(now - SOURCE_HEALTH_STALE_AFTER_MS).toISOString();
  assert.equal(isSourceHealthStale(updatedAt, now), false);
});

test("source health report becomes stale after 24 hours", () => {
  const now = Date.parse("2026-11-28T12:00:00Z");
  const updatedAt = new Date(now - SOURCE_HEALTH_STALE_AFTER_MS - 1).toISOString();
  assert.equal(isSourceHealthStale(updatedAt, now), true);
});

test("invalid and future source report timestamps are not marked stale", () => {
  const now = Date.parse("2026-11-28T12:00:00Z");
  assert.equal(isSourceHealthStale("not-a-date", now), false);
  assert.equal(isSourceHealthStale(new Date(now + 60_000).toISOString(), now), false);
});

test("missing or invalid timestamps have unknown freshness", () => {
  assert.equal(getSourceHealthFreshness(undefined, Date.parse("2026-11-28T12:00:00Z")), "unknown");
  assert.equal(getSourceHealthFreshness("not-a-date", Date.parse("2026-11-28T12:00:00Z")), "unknown");
});

test("a timestamp too far in the future has unknown freshness", () => {
  const now = Date.parse("2026-11-28T12:00:00Z");
  assert.equal(getSourceHealthFreshness(new Date(now + 6 * 60 * 1000).toISOString(), now), "unknown");
  assert.equal(getSourceHealthFreshness(new Date(now + 4 * 60 * 1000).toISOString(), now), "fresh");
});
