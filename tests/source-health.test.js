import test from "node:test";
import assert from "node:assert/strict";
import {
  getEffectiveSourceStatus,
  getSourceHealthFreshness,
  isSourceHealthStale,
  reconcileSourceHealth,
  SOURCE_HEALTH_STALE_AFTER_MS
} from "../src/source-health.js";

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

test("configured active sources missing from the report remain visible as unverified", () => {
  const configured = [
    { id: "source_ok", name: "Source OK", enabled: true },
    { id: "source_missing", name: "Source absente", enabled: true },
    { id: "source_disabled", name: "Source inactive", enabled: false }
  ];
  const report = [{ source_id: "source_ok", source_name: "Source OK", status: "ok", fetched: 12, accepted: 8 }];
  const rows = reconcileSourceHealth(configured, report);

  assert.equal(rows.length, 2);
  assert.equal(rows[0].status, "ok");
  assert.equal(rows[0].reported, true);
  assert.equal(rows[1].source_id, "source_missing");
  assert.equal(rows[1].status, "unknown");
  assert.equal(rows[1].reported, false);
  assert.equal(rows[1].fetched, 0);
});

test("reported failures and warnings are preserved when reconciling", () => {
  const configured = [
    { id: "failed", name: "Source en erreur", enabled: true },
    { id: "partial", name: "Source partielle", enabled: true }
  ];
  const report = [
    { source_id: "failed", status: "error", error: "HTTP 429", fetched: 0, accepted: 0 },
    { source_id: "partial", status: "warning", message: "Données partielles", fetched: 4, accepted: 2 }
  ];
  const rows = reconcileSourceHealth(configured, report);

  assert.deepEqual(rows.map((row) => row.status), ["error", "warning"]);
  assert.equal(rows[0].error, "HTTP 429");
  assert.equal(rows[1].error, "Données partielles");
});

test("stale or unknown reports cannot present previously healthy sources as operational", () => {
  assert.equal(getEffectiveSourceStatus("ok", "stale"), "unknown");
  assert.equal(getEffectiveSourceStatus("ok", "unknown"), "unknown");
  assert.equal(getEffectiveSourceStatus("ok", "fresh"), "ok");
});

test("observed source failures and warnings remain visible even when the report is stale", () => {
  assert.equal(getEffectiveSourceStatus("error", "stale"), "error");
  assert.equal(getEffectiveSourceStatus("warning", "unknown"), "warning");
});
