const SCOPE_ORDER = ["all", "urban", "rural"];

function periodSortKey(value) {
  const match = String(value || "").match(/^T([1-4])\/((?:19|20)\d{2})$/i);
  if (match) return Number(match[2]) * 10 + Number(match[1]);
  const year = String(value || "").match(/^(19|20)\d{2}/);
  return year ? Number(year[0]) * 10 : Number.MAX_SAFE_INTEGER;
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
  const firstSeries = selectedSeries[0] || indicatorSeries[0] || null;
  const sourceSeries = selectedSeries.find((item) =>
    item.source_name || item.source_name_ar || item.source_url ||
    item.methodology_note_fr || item.methodology_note_ar
  ) || firstSeries;
  const collectionDates = selectedSeries
    .map((item) => item.last_successful_collection_at || "")
    .filter(Boolean)
    .sort();
  const collectionStatuses = new Set(
    selectedSeries
      .map((item) => item.collection_status)
      .filter((status) => status === "collected" || status === "carried_forward")
  );
  const collectionStatus = collectionStatuses.has("collected") && collectionStatuses.has("carried_forward")
    ? "partial"
    : collectionStatuses.has("collected")
      ? "collected"
      : collectionStatuses.has("carried_forward")
        ? "carried_forward"
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
    unitFr: firstSeries?.unit_fr || selectedIndicator?.unitFr || "%",
    unitAr: firstSeries?.unit_ar || selectedIndicator?.unitAr || "%",
    sourceName: sourceSeries?.source_name || "Haut-Commissariat au Plan",
    sourceNameAr: sourceSeries?.source_name_ar || "المندوبية السامية للتخطيط — بحث اليد العاملة",
    sourceUrl: sourceSeries?.source_url || "",
    lastSuccessfulCollectionAt: collectionDates.at(-1) || firstSeries?.last_successful_collection_at || "",
    collectionStatus,
    methodologyNoteFr: selectedSeries.find((item) => item.methodology_note_fr)?.methodology_note_fr || "",
    methodologyNoteAr: selectedSeries.find((item) => item.methodology_note_ar)?.methodology_note_ar || "",
    methodologyBreak: selectedSeries.some((item) => Boolean(item.methodology_break)),
  };
}
