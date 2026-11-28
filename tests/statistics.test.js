import test from "node:test";
import assert from "node:assert/strict";

import {
  filterStatisticsHistory,
  isFiniteStatisticValue,
  normalizeStatisticFormatting,
  countValidStatisticObservations,
  getStatisticsCategory,
  getLocalizedStatisticField,
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

test("Arabic HCP social labels fall back to reviewed translations when source fields are still French", () => {
  const indicator = {
    indicator_code: "HCP_SOCIAL_UNEMPLOYMENT",
    label_fr: "Taux de chômage — national",
    label_ar: "Taux de chômage — national",
    description_fr: "Taux de chômage national issu du HCP.",
    description_ar: "Taux de chômage national issu du HCP.",
    unit_fr: "%",
    unit_ar: "%",
  };
  assert.equal(getLocalizedStatisticField(indicator, "label", "fr"), "Taux de chômage — national");
  assert.equal(getLocalizedStatisticField(indicator, "label", "ar"), "معدل البطالة الوطني");
  assert.equal(
    getLocalizedStatisticField(indicator, "description", "ar"),
    "معدل البطالة الوطني المستند إلى البحث الوطني حول التشغيل الصادر عن المندوبية السامية للتخطيط.",
  );
  assert.equal(getLocalizedStatisticField(indicator, "unit", "ar"), "%");
});

test("Arabic statistics keep a valid source translation instead of replacing it", () => {
  const indicator = {
    indicator_code: "OTHER_INDICATOR",
    label_fr: "Population",
    label_ar: "السكان",
  };
  assert.equal(getLocalizedStatisticField(indicator, "label", "ar"), "السكان");
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
  const history = Array.from({ length: 2600 }, (_, index) => {
    const date = new Date(Date.UTC(2020, 0, 1 + index));
    return { year: date.toISOString().slice(0, 10), value: index };
  });
  const filtered = filterStatisticsHistory(history, "5", "2026-11-27T04:00:00Z");
  assert.ok(filtered.length > 1800);
  assert.ok(filtered.length < 1900);
  assert.equal(filtered.at(-1).year, "2026-11-27");
});

test("legacy histories with no parseable periods remain visible", () => {
  const history = [{ year: "Période inconnue", value: 1 }];
  assert.deepEqual(filterStatisticsHistory(history, "5", "2026-11-27"), history);
});

test("all-history view excludes future observations but preserves unknown legacy labels", () => {
  const history = [
    { year: "2024", value: 1 },
    { year: "2026-11-27", value: 2 },
    { year: "2027-01", value: 3 },
    { year: "Période non normalisée", value: 4 },
  ];
  assert.deepEqual(
    filterStatisticsHistory(history, "all", "2026-11-27T04:00:00Z"),
    [history[0], history[1], history[3]],
  );
});

test("five-year view excludes future observations even when they are last in the source array", () => {
  const history = [
    { year: "2022", value: 10 },
    { year: "2026", value: 20 },
    { year: "2027", value: 30 },
  ];
  assert.deepEqual(
    filterStatisticsHistory(history, "5", "2026-11-27T04:00:00Z"),
    history.slice(0, 2),
  );
});


test("statistic values reject blanks, nulls and booleans instead of coercing them to zero", () => {
  for (const value of ["", "   ", null, undefined, true, false, NaN, Infinity]) {
    assert.equal(isFiniteStatisticValue(value), false, String(value));
  }
  assert.equal(isFiniteStatisticValue(0), true);
  assert.equal(isFiniteStatisticValue("0"), true);
  assert.equal(isFiniteStatisticValue("-2.5"), true);
});


test("statistic formatting safely normalizes malformed divisors and precision", () => {
  assert.deepEqual(normalizeStatisticFormatting({ scale_divisor: 1000, precision: 2 }), { divisor: 1000, precision: 2 });
  assert.deepEqual(normalizeStatisticFormatting({ scale_divisor: 0, precision: -1 }), { divisor: 1, precision: 1 });
  assert.deepEqual(normalizeStatisticFormatting({ scale_divisor: "NaN", precision: 99 }), { divisor: 1, precision: 1 });
  assert.deepEqual(normalizeStatisticFormatting({ scale_divisor: -5, precision: 0 }), { divisor: 1, precision: 0 });
});

test("statistics overview counts only valid numeric observations", () => {
  const indicators = [
    { history: [{ value: 1 }, { value: "" }, { value: null }, { value: "2.5" }] },
    { history: [{ value: false }, { value: 0 }] },
    { history: "invalid" },
  ];
  assert.equal(countValidStatisticObservations(indicators), 3);
  assert.equal(countValidStatisticObservations(null), 0);
});
