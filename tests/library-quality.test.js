import test from "node:test";
import assert from "node:assert/strict";
import { getLibraryQualitySummary } from "../src/library-quality.js";

test("library quality summary counts review status and available reading formats", () => {
  const items = [
    { statut_validation: "valide", date_publication: "2026-10-01", url_publication: "https://example.org/a", pdf_direct: "https://example.org/a.pdf", resume: "Résumé" },
    { statut_validation: "a_verifier", date_publication: "2025-03-12", url_publication: "https://example.org/b", pdf_direct: null, resume: "" },
    { statut_validation: "valide", date_publication: "", url_publication: null, doi: null, pdf_direct: "javascript:alert(1)", resume: "Résumé" },
    { statut_validation: "valide", date_publication: "2027-01-01", date_anomalie: true, url_publication: "https://example.org/future" }
  ];

  const summary = getLibraryQualitySummary(items, (item) => item.date_anomalie === true || item.date_publication === "2027-01-01");
  assert.deepEqual(summary, {
    total: 3,
    needsReview: 1,
    missingDate: 1,
    withSourceLink: 2,
    withPdf: 1,
    withAbstract: 2
  });
});

test("library quality summary safely handles missing or non-array input", () => {
  assert.deepEqual(getLibraryQualitySummary(null), {
    total: 0,
    needsReview: 0,
    missingDate: 0,
    withSourceLink: 0,
    withPdf: 0,
    withAbstract: 0
  });
});
