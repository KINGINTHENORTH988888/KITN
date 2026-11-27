import test from "node:test";
import assert from "node:assert/strict";

import { buildRegionalStatisticsModel } from "../src/regional-statistics.js";

const payload = {
  generated_at: "2026-11-27T14:00:00Z",
  series: [
    {
      indicator_code: "HCP_EMO_REGIONAL_STRICT_UNEMPLOYMENT",
      label_fr: "Taux de chômage strict",
      label_ar: "معدل البطالة بالمفهوم الضيق",
      unit_fr: "%",
      unit_ar: "%",
      geography_code: "DAKHLA_OUED_ED_DAHAB",
      geography_name_fr: "Dakhla-Oued Ed-Dahab",
      geography_name_ar: "الداخلة-وادي الذهب",
      residence_scope: "all",
      history: [
        { year: "T1/2026", value: 5.1, quality_flag: "standard" },
        { year: "T2/2026", value: 4.8, quality_flag: "standard" },
        { year: "T3/2026", value: 4.6, quality_flag: "medium_significance" },
      ],
      source_name: "HCP — EMO",
      source_url: "https://www.hcp.ma/attachment/2928207/",
      methodology_break: true,
      methodology_note_fr: "Rupture méthodologique EMO 2026.",
      methodology_note_ar: "انقطاع منهجي في بحث EMO 2026.",
    },
    {
      indicator_code: "HCP_EMO_REGIONAL_STRICT_UNEMPLOYMENT",
      label_fr: "Taux de chômage strict",
      label_ar: "معدل البطالة بالمفهوم الضيق",
      unit_fr: "%",
      unit_ar: "%",
      geography_code: "MAR",
      geography_name_fr: "Ensemble national",
      geography_name_ar: "المجموع الوطني",
      residence_scope: "all",
      history: [
        { year: "T1/2026", value: 10.1, quality_flag: "standard" },
        { year: "T2/2026", value: 9.6, quality_flag: "standard" },
        { year: "T3/2026", value: 10.5, quality_flag: "standard" },
      ],
      source_name: "HCP — EMO",
      source_url: "https://www.hcp.ma/attachment/2928207/",
      methodology_break: true,
      methodology_note_fr: "Rupture méthodologique EMO 2026.",
      methodology_note_ar: "انقطاع منهجي في بحث EMO 2026.",
    },
    {
      indicator_code: "HCP_EMO_REGIONAL_STRICT_UNEMPLOYMENT",
      label_fr: "Taux de chômage strict",
      label_ar: "معدل البطالة بالمفهوم الضيق",
      unit_fr: "%",
      unit_ar: "%",
      geography_code: "DAKHLA_OUED_ED_DAHAB",
      geography_name_fr: "Dakhla-Oued Ed-Dahab",
      geography_name_ar: "الداخلة-وادي الذهب",
      residence_scope: "urban",
      history: [{ year: "T3/2026", value: 4.2, quality_flag: "standard" }],
    },
  ],
};

test("builds a regional comparison table with chronological periods and national total first", () => {
  const model = buildRegionalStatisticsModel(payload, "HCP_EMO_REGIONAL_STRICT_UNEMPLOYMENT", "all");

  assert.equal(model.available, true);
  assert.deepEqual(model.periods, ["T1/2026", "T2/2026", "T3/2026"]);
  assert.deepEqual(model.rows.map((row) => row.geographyCode), ["MAR", "DAKHLA_OUED_ED_DAHAB"]);
  assert.equal(model.rows[0].points[2].value, 10.5);
  assert.equal(model.rows[1].points[2].quality_flag, "medium_significance");
  assert.equal(model.rows[1].nameAr, "الداخلة-وادي الذهب");
  assert.equal(model.methodologyBreak, true);
});

test("falls back to an available residence scope when the selected scope is missing", () => {
  const model = buildRegionalStatisticsModel(payload, "HCP_EMO_REGIONAL_STRICT_UNEMPLOYMENT", "rural");

  assert.equal(model.activeScope, "all");
  assert.equal(model.rows.length, 2);
});

test("returns a safe empty model when the regional dataset is not yet published", () => {
  const model = buildRegionalStatisticsModel(null);

  assert.equal(model.available, false);
  assert.deepEqual(model.rows, []);
  assert.deepEqual(model.periods, []);
});
