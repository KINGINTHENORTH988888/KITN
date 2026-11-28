const SCOPE_ORDER = ["all", "urban", "rural"];

function isFiniteObservationValue(value) {
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "string" || !value.trim()) return false;
  return Number.isFinite(Number(value));
}

function periodSortKey(value) {
  const period = String(value || "").trim();
  const quarter = period.match(/^(?:T([1-4])\/((?:19|20)\d{2})|((?:19|20)\d{2})-T([1-4])|((?:19|20)\d{2})[ -]Q([1-4]))$/i);
  if (quarter) {
    const quarterNumber = Number(quarter[1] || quarter[4] || quarter[6]);
    const year = Number(quarter[2] || quarter[3] || quarter[5]);
    return year * 10000 + ((quarterNumber - 1) * 3 + 1) * 100 + 1;
  }
  const dated = period.match(/^((?:19|20)\d{2})(?:-(0[1-9]|1[0-2]))?(?:-(0[1-9]|[12]\d|3[01]))?$/);
  if (!dated) return Number.MAX_SAFE_INTEGER;
  const year = Number(dated[1]);
  const month = Number(dated[2] || 1);
  const day = Number(dated[3] || 1);
  return year * 10000 + month * 100 + day;
}

export function buildRegionalStatisticsModel(payload, indicatorCode = "", residenceScope = "all") {
  const series = Array.isArray(payload?.series)
    ? payload.series.filter((item) => item && typeof item === "object" && item.indicator_code)
    : [];

  const optionMap = new Map();
  for (const item of series) {
    if (!optionMap.has(item.indicator_code)) {
      optionMap.set(item.indicator_code, {
        code: item.indicator_code,
        labelFr: item.label_fr || item.indicator_code,
        labelAr: item.label_ar || item.label_fr || item.indicator_code,
        unitFr: item.unit_fr || "%",
        unitAr: item.unit_ar || item.unit_fr || "%",
      });
    }
  }

  const indicatorOptions = [...optionMap.values()].sort((a, b) => a.labelFr.localeCompare(b.labelFr, "fr"));
  const activeIndicatorCode = indicatorOptions.some((item) => item.code === indicatorCode)
    ? indicatorCode
    : indicatorOptions[0]?.code || "";
  const indicatorSeries = series.filter((item) => item.indicator_code === activeIndicatorCode);
  const availableScopes = SCOPE_ORDER.filter((scope) =>
    indicatorSeries.some((item) => item.residence_scope === scope)
  );
  const activeScope = availableScopes.includes(residenceScope)
    ? residenceScope
    : (availableScopes.includes("all") ? "all" : availableScopes[0] || "all");
  const selectedSeries = indicatorSeries
    .filter((item) => item.residence_scope === activeScope)
    .sort((a, b) => {
      if (a.geography_code === "MAR") return -1;
      if (b.geography_code === "MAR") return 1;
      return String(a.geography_name_fr || "").localeCompare(String(b.geography_name_fr || ""), "fr");
    });

  const periods = [...new Set(selectedSeries.flatMap((item) =>
    Array.isArray(item.history) ? item.history.map((point) => String(point?.year || "")).filter(Boolean) : []
  ))].sort((a, b) => periodSortKey(a) - periodSortKey(b) || a.localeCompare(b));

  const rows = selectedSeries.map((item) => ({
    geographyCode: item.geography_code || "",
    geographyLevel: item.geography_level || "",
    nameFr: item.geography_name_fr || item.geography_code || "—",
    nameAr: item.geography_name_ar || item.geography_name_fr || item.geography_code || "—",
    points: periods.map((period) =>
      (Array.isArray(item.history) ? item.history.find((point) => String(point?.year || "") === period) : null) || null
    ),
  }));

  const selectedIndicator = indicatorOptions.find((item) => item.code === activeIndicatorCode) || null;
  const latestPeriod = periods[periods.length - 1] || "";
  const regionalRows = rows.filter((row) => row.geographyCode !== "MAR");
  const latestValues = regionalRows.map((row) => row.points[row.points.length - 1]).filter((point) => point && isFiniteObservationValue(point.value));
  const latestMissing = regionalRows.length - latestValues.length;
  const firstSeries = selectedSeries[0] || indicatorSeries[0] || null;
  const sourceSeries = selectedSeries.find((item) => item.source_name_ar) ||
    selectedSeries.find((item) =>
      item.source_name || item.source_url || item.methodology_note_fr || item.methodology_note_ar
    ) || firstSeries;
  const collectionDates = selectedSeries
    .map((item) => item.last_successful_collection_at || "")
    .filter(Boolean)
    .sort();
  const collectionStatuses = new Set(
    selectedSeries
      .map((item) => item.collection_status)
      .filter((status) => ["collected", "carried_forward", "manual_verified"].includes(status))
  );
  const collectionStatus = collectionStatuses.size > 1
    ? "partial"
    : collectionStatuses.has("collected")
      ? "collected"
      : collectionStatuses.has("carried_forward")
        ? "carried_forward"
        : collectionStatuses.has("manual_verified")
          ? "manual_verified"
          : "unknown";

  return {
    available: series.length > 0,
    generatedAt: payload?.generated_at || "",
    seriesCount: series.length,
    indicatorOptions,
    activeIndicatorCode,
    selectedIndicator,
    availableScopes,
    activeScope,
    periods,
    rows,
    latestPeriod,
    regionalCount: regionalRows.length,
    latestAvailableCount: latestValues.length,
    latestMissingCount: latestMissing,
    latestAverage: latestValues.length
      ? latestValues.reduce((sum, point) => sum + Number(point.value), 0) / latestValues.length
      : null,
    unitFr: firstSeries?.unit_fr || selectedIndicator?.unitFr || "%",
    unitAr: firstSeries?.unit_ar || selectedIndicator?.unitAr || "%",
    sourceName: sourceSeries?.source_name || "Haut-Commissariat au Plan",
    sourceNameAr: sourceSeries?.source_name_ar || "المندوبية السامية للتخطيط — بحث اليد العاملة",
    sourceUrl: sourceSeries?.source_url || "",
    sourcePage: sourceSeries?.source_page || null,
    lastSuccessfulCollectionAt: collectionDates.at(-1) || firstSeries?.last_successful_collection_at || "",
    collectionStatus,
    methodologyNoteFr: selectedSeries.find((item) => item.methodology_note_fr)?.methodology_note_fr || "",
    methodologyNoteAr: selectedSeries.find((item) => item.methodology_note_ar)?.methodology_note_ar || "",
    methodologyBreak: selectedSeries.some((item) => Boolean(item.methodology_break)),
  };
}
