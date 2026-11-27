import test from "node:test";
import assert from "node:assert/strict";

import {
  filterStatisticsHistory,
  getStatisticsCategory,
  getStatisticsHistory,
  parseStatisticsPeriod,
} from "../src/statistics.js";

test("recognizes the stable economy and society poles before descriptive categories", () => {
  assert.equal(
    getStatisticsCategory({ pole: "economie_finances_publiques", category: "Monétaire et financier" }),
    "economie_finances_publiques",
  );
  assert.equal(
    getStatisticsCategory({ pole: "societe_developpement_humain", category: "Emploi" }),
    "societe_developpement_humain",
  );
  assert.equal(getStatisticsCategory({ category: "Marché des changes" }), "economie_finances_publiques");
  assert.equal(getStatisticsCategory({ category: "Population et emploi" }), "societe_developpement_humain");
  assert.equal(getStatisticsCategory({ category: "Domaine inconnu" }), "");
});

test("parses annual, monthly, daily and quarterly periods", () => {
  assert.equal(parseStatisticsPeriod("2024")?.toISOString(), "2024-01-01T00:00:00.000Z");
  assert.equal(parseStatisticsPeriod("2024-09")?.toISOString(), "2024-09-01T00:00:00.000Z");
  assert.equal(parseStatisticsPeriod("2024-09-17")?.toISOString(), "2024-09-17T00:00:00.000Z");
  assert.equal(parseStatisticsPeriod("2026-T3")?.toISOString(), "2026-07-01T00:00:00.000Z");
  assert.equal(parseStatisticsPeriod("T3/2026")?.toISOString(), "2026-07-01T00:00:00.000Z");
  assert.equal(parseStatisticsPeriod("31/12/2025")?.toISOString(), "2025-12-31T00:00:00.000Z");
  assert.equal(parseStatisticsPeriod("2026-13"), null);
});

test("five-year filter is a calendar window, not the last five observations", () => {
  const daily = [
    { year: "2021-11-26", value: 1 },
    { year: "2021-11-27", value: 2 },
    { year: "2022-01-03", value: 3 },
    { year: "2026-11-25", value: 4 },
    { year: "2027-01-01", value: 5 },
  ];
  const filtered = filterStatisticsHistory(daily, "5", "2026-11-27T04:00:00Z");
  assert.deepEqual(filtered.map((point) => point.year), ["2021-11-27", "2022-01-03", "2026-11-25"]);
});

test("ten-year filter handles quarterly HCP periods and excludes future quarters", () => {
  const quarterly = [
    { year: "T4/2016", value: 1 },
    { year: "T1/2017", value: 2 },
    { year: "T3/2026", value: 3 },
    { year: "T1/2027", value: 4 },
  ];
  const filtered = filterStatisticsHistory(quarterly, "10", "2026-11-27");
  assert.deepEqual(filtered.map((point) => point.year), ["T1/2017", "T3/2026"]);
});

test("all-history view also excludes future observations when periods are parseable", () => {
  const points = [
    { year: "2025", value: 10 },
    { year: "2027", value: 20 },
  ];
  assert.deepEqual(filterStatisticsHistory(points, "all", "2026-11-27"), [{ year: "2025", value: 10 }]);
});

test("history merges latest and previous without duplicate periods and sorts chronologically", () => {
  const indicator = {
    history: [
      { year: "2025-01", value: 1 },
      { year: "2025-02", value: 2 },
    ],
    previous: { year: "2025-02", value: 22 },
    latest: { year: "2025-03", value: 3 },
  };
  assert.deepEqual(
    getStatisticsHistory(indicator),
    [
      { year: "2025-01", value: 1 },
      { year: "2025-02", value: 22 },
      { year: "2025-03", value: 3 },
    ],
  );
});
