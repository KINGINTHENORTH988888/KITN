export function getLibraryQualitySummary(items, isFutureDate = () => false) {
  const documents = Array.isArray(items) ? items.filter((item) => item && !isFutureDate(item)) : [];
  const isHttpUrl = (value) => {
    try {
      const url = new URL(String(value || "").trim());
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };
  const normalizeDoi = (value) => {
    const doi = String(value || "").trim()
      .replace(/^https?:\\/\\/(?:dx\\.)?doi\\.org\\//i, "")
      .replace(/^doi:\\s*/i, "");
    return /^10\\.\\d{4,9}\\/\\S+$/i.test(doi) ? doi.toLowerCase() : "";
  };
  const documentIdentity = (item) => {
    const doi = normalizeDoi(item.doi) || normalizeDoi(item.url_publication);
    if (doi) return `doi:${doi}`;
    try {
      const url = new URL(String(item.url_publication || "").trim());
      if (url.protocol !== "http:" && url.protocol !== "https:") return "";
      return `url:${url.origin.toLowerCase()}${url.pathname.replace(/\\/$/, "").toLowerCase()}`;
    } catch {
      return "";
    }
  };

  const seenIdentities = new Set();
  let duplicateRecords = 0;
  for (const item of documents) {
    const identity = documentIdentity(item);
    if (!identity) continue;
    if (seenIdentities.has(identity)) duplicateRecords += 1;
    else seenIdentities.add(identity);
  }

  return {
    total: documents.length,
    needsReview: documents.filter((item) =>
      item.statut_validation !== "valide" || item.date_anomalie === true ||
      item.date_statut === "date_future_a_verifier"
    ).length,
    missingDate: documents.filter((item) => !String(item.date_publication || "").trim()).length,
    missingTitle: documents.filter((item) => !String(item.titre_original || "").trim()).length,
    missingSource: documents.filter((item) =>
      !String(item.source_id || item.source_nom || item.source_name || "").trim()
    ).length,
    duplicateRecords,
    withSourceLink: documents.filter((item) =>
      isHttpUrl(item.url_publication) || Boolean(normalizeDoi(item.doi))
    ).length,
    withPdf: documents.filter((item) => isHttpUrl(item.pdf_direct)).length,
    withAbstract: documents.filter((item) => String(item.resume || "").trim()).length
  };
}
