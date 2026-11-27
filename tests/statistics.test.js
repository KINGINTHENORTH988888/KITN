import test from "node:test";
import assert from "node:assert/strict";

import {
  filterStatisticsHistory,
  getStatisticsCategory,
  parseStatisticsPeriod,
} from "../src/statistics.js";

test("category filtering uses the stable pole before a descriptive category label", () => {
  assert.equal(
    getStatisticsCategory({ pole: "economie_finances_publiques", category: "Monétaire et financier" }),
    "economie_finances_publiques",
  );
  assert.equal(
    getStatisticsCategory({ pole: "societe_developpement_humain", category: "Emploi" }),
    "societe_developpement_humain",
  );
  assert.equal(getStatisticsCategory({ category: "Monétaire et financier" }), "");
});

test("statistical periods support annual, monthly, quarterly and daily formats", () => {
  assert.equal(parseStatisticsPeriod("2024")?.toISOString(), "2024-01-01T00:00:00.000Z");
  assert.equal(parseStatisticsPeriod("2024-09")?.toISOString(), "2024-09-01T00:00:00.000Z");
  assert.equal(parseStatisticsPeriod("2026-T3")?.toISOString(), "2026-07-01T00:00:00.000Z");
  assert.equal(parseStatisticsPeriod("T3/2026")?.toISOString(), "2026-07-01T00:00:00.000Z");
  assert.equal(parseStatisticsPeriod("2026-11-27")?.toISOString(), "2026-11-27T00:00:00.000Z");
});

test("today and yesterday labels are anchored to the generated statistics date", () => {
  assert.equal(parseStatisticsPeriod("Aujourd'hui", "2026-11-27T04:00:00Z")?.toISOString(), "2026-11-27T00:00:00.000Z");
  assert.equal(parseStatisticsPeriod("Veille", "2026-11-27T04:00:00Z")?.toISOString(), "2026-11-26T00:00:00.000Z");
});

test("five-year range filters by calendar period, not by number of observations", () => {
  const history = [
    { year: "2021-11-26", value: 1 },
    { year: "2021-11-27", value: 2 },
    { year: "2022-11-27", value: 3 },
    { year: "2026-11-27", value: 4 },
  ];
  assert.deepEqual(
    filterStatisticsHistory(history, "5", "2026-11-27T04:00:00Z"),
    history.slice(1),
  );
});

test("daily series retain five calendar years rather than only five daily observations", () => {
  const history = Array.from({ length: 2200 }, (_, index) => {
    const date = new Date(Date.UTC(2020, 0, 1 + index));
    return { year: date.toISOString().slice(0, 10), value: index };
  });
  const filtered = filterStatisticsHistory(history, "5", "2026-11-27T04:00:00Z");
  assert.ok(filtered.length > 1800);
  assert.ok(filtered.length < history.length);
  assert.equal(filtered.at(-1).year, history.at(-1).year);
});

test("legacy histories with no parseable periods remain visible", () => {
  const history = [{ year: "Période inconnue", value: 1 }];
  assert.deepEqual(filterStatisticsHistory(history, "5", "2026-11-27"), history);
});
