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
      source_name_ar: "المندوبية السامية للتخطيط — بحث اليد العاملة",
      source_url: "https://www.hcp.ma/attachment/2928207/",
      last_successful_collection_at: "2026-11-26T14:00:00Z",
      collection_status: "carried_forward",
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
  assert.equal(model.lastSuccessfulCollectionAt, "2026-11-26T14:00:00Z");
  assert.equal(model.collectionStatus, "carried_forward");
  assert.equal(model.sourceNameAr, "المندوبية السامية للتخطيط — بحث اليد العاملة");
});

test("reports partial freshness when regional series have mixed collection statuses", () => {
  const mixedPayload = JSON.parse(JSON.stringify(payload));
  mixedPayload.series.push({
    ...mixedPayload.series[0],
    geography_code: "FES_MEKNES",
    geography_name_fr: "Fès-Meknès",
    geography_name_ar: "فاس-مكناس",
    last_successful_collection_at: "2026-11-27T13:00:00Z",
    collection_status: "collected",
  });

  const model = buildRegionalStatisticsModel(
    mixedPayload,
    "HCP_EMO_REGIONAL_STRICT_UNEMPLOYMENT",
    "all",
  );

  assert.equal(model.collectionStatus, "partial");
  assert.equal(model.lastSuccessfulCollectionAt, "2026-11-27T13:00:00Z");
});

test("falls back to an available residence scope when the selected scope is missing", () => {
  const model = buildRegionalStatisticsModel(payload, "HCP_EMO_REGIONAL_STRICT_UNEMPLOYMENT", "rural");

  assert.equal(model.activeScope, "all");
  assert.equal(model.rows.length, 2);
});

test("supports annual HCP social indicators and regional urban/rural scopes", () => {
  const socialPayload = {
    generated_at: "2026-11-27T17:00:00Z",
    series: [
      {
        indicator_code: "HCP_SOCIAL_REGIONAL_FERTILITY",
        label_fr: "Indice synthétique de fécondité",
        label_ar: "مؤشر الخصوبة الإجمالي",
        unit_fr: "enfants par femme",
        unit_ar: "طفل لكل امرأة",
        geography_code: "FES_MEKNES",
        geography_name_fr: "Fès-Meknès",
        geography_name_ar: "فاس-مكناس",
        residence_scope: "urban",
        history: [{ year: "2024", value: 1.8, quality_flag: "standard" }],
        source_name: "HCP — Les indicateurs sociaux du Maroc",
        source_name_ar: "المندوبية السامية للتخطيط — المؤشرات الاجتماعية للمغرب",
        source_url: "https://www.hcp.ma/file/248623/",
        source_page: 35,
      },
      {
        indicator_code: "HCP_SOCIAL_REGIONAL_FERTILITY",
        label_fr: "Indice synthétique de fécondité",
        label_ar: "مؤشر الخصوبة الإجمالي",
        unit_fr: "enfants par femme",
        unit_ar: "طفل لكل امرأة",
        geography_code: "FES_MEKNES",
        geography_name_fr: "Fès-Meknès",
        geography_name_ar: "فاس-مكناس",
        residence_scope: "rural",
        history: [{ year: "2024", value: 2.46, quality_flag: "standard" }],
      },
      {
        indicator_code: "HCP_SOCIAL_REGIONAL_FERTILITY",
        label_fr: "Indice synthétique de fécondité",
        label_ar: "مؤشر الخصوبة الإجمالي",
        unit_fr: "enfants par femme",
        unit_ar: "طفل لكل امرأة",
        geography_code: "FES_MEKNES",
        geography_name_fr: "Fès-Meknès",
        geography_name_ar: "فاس-مكناس",
        residence_scope: "all",
        history: [{ year: "2024", value: 2.02, quality_flag: "standard" }],
      },
    ],
  };

  const urban = buildRegionalStatisticsModel(socialPayload, "HCP_SOCIAL_REGIONAL_FERTILITY", "urban");
  assert.deepEqual(urban.periods, ["2024"]);
  assert.deepEqual(urban.availableScopes, ["all", "urban", "rural"]);
  assert.equal(urban.rows[0].points[0].value, 1.8);
  assert.equal(urban.selectedIndicator.labelAr, "مؤشر الخصوبة الإجمالي");
  assert.equal(urban.unitAr, "طفل لكل امرأة");
  assert.equal(urban.sourcePage, 35);

  const rural = buildRegionalStatisticsModel(socialPayload, "HCP_SOCIAL_REGIONAL_FERTILITY", "rural");
  assert.equal(rural.rows[0].points[0].value, 2.46);
});

test("identifies regional series manually verified against an official HCP publication", () => {
  const manualPayload = {
    series: [{
      indicator_code: "HCP_SOCIAL_REGIONAL_POVERTY_GAP",
      label_fr: "Indice volumétrique de la pauvreté",
      label_ar: "مؤشر فجوة الفقر",
      geography_code: "FES_MEKNES",
      geography_name_fr: "Fès-Meknès",
      geography_name_ar: "فاس-مكناس",
      residence_scope: "all",
      history: [{ year: "2022", value: 1.74, quality_flag: "standard" }],
      collection_status: "manual_verified",
      source_name: "HCP — Les indicateurs sociaux du Maroc",
      source_name_ar: "المندوبية السامية للتخطيط — المؤشرات الاجتماعية للمغرب",
    }],
  };
  const model = buildRegionalStatisticsModel(manualPayload, "HCP_SOCIAL_REGIONAL_POVERTY_GAP", "all");
  assert.equal(model.collectionStatus, "manual_verified");
  assert.equal(model.latestPeriod, "2022");
});

test("returns a safe empty model when the regional dataset is not yet published", () => {
  const model = buildRegionalStatisticsModel(null);

  assert.equal(model.available, false);
  assert.deepEqual(model.rows, []);
  assert.deepEqual(model.periods, []);
});

test("reports latest regional coverage separately from the national aggregate", () => {
  const model = buildRegionalStatisticsModel(payload, "HCP_EMO_REGIONAL_STRICT_UNEMPLOYMENT", "all");
  assert.equal(model.regionalCount, 1);
  assert.equal(model.latestAvailableCount, 1);
  assert.equal(model.latestMissingCount, 0);
  assert.equal(model.latestPeriod, "T3/2026");
  assert.equal(model.latestAverage, 4.6);
});

test("does not count null regional observations as available numeric values", () => {
  const incompletePayload = structuredClone(payload);
  const regionalSeries = incompletePayload.series.find((item) => item.geography_code !== "MAR" && item.residence_scope === "all");
  regionalSeries.history[regionalSeries.history.length - 1].value = null;
  const model = buildRegionalStatisticsModel(incompletePayload, "HCP_EMO_REGIONAL_STRICT_UNEMPLOYMENT", "all");
  assert.equal(model.latestAvailableCount, 0);
  assert.equal(model.latestMissingCount, 1);
  assert.equal(model.latestAverage, null);
});
