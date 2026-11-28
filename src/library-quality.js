export function getLibraryQualitySummary(items, isFutureDate = () => false) {
  const documents = Array.isArray(items) ? items.filter((item) => item && !isFutureDate(item)) : [];
  const isHttpUrl = (value) => /^https?:\/\//i.test(String(value || "").trim());

  return {
    total: documents.length,
    needsReview: documents.filter((item) =>
      item.statut_validation !== "valide" || item.date_anomalie === true ||
      item.date_statut === "date_future_a_verifier"
    ).length,
    missingDate: documents.filter((item) => !String(item.date_publication || "").trim()).length,
    withSourceLink: documents.filter((item) => isHttpUrl(item.url_publication) || Boolean(String(item.doi || "").trim())).length,
    withPdf: documents.filter((item) => isHttpUrl(item.pdf_direct)).length,
    withAbstract: documents.filter((item) => String(item.resume || "").trim()).length
  };
}
