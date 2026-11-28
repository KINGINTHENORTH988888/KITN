import test from "node:test";
import assert from "node:assert/strict";
import { getLibraryQualitySummary } from "../src/library-quality.js";

test("library quality summary counts review status and available reading formats", () => {
  const items = [
    { statut_validation: "valide", titre_original: "Document A", source_id: "hcp", date_publication: "2026-10-01", url_publication: "https://example.org/a", pdf_direct: "https://example.org/a.pdf", resume: "Résumé" },
    { statut_validation: "a_verifier", titre_original: "Document B", source_nom: "CESE", date_publication: "2025-03-12", url_publication: "https://example.org/b", pdf_direct: null, resume: "" },
    { statut_validation: "valide", date_publication: "", source_id: "", url_publication: null, doi: null, pdf_direct: "javascript:alert(1)", resume: "Résumé" },
    { statut_validation: "valide", titre_original: "Future", source_id: "hcp", date_publication: "2027-01-01", date_anomalie: true, url_publication: "https://example.org/future" }
  ];

  const summary = getLibraryQualitySummary(items, (item) => item.date_anomalie === true || item.date_publication === "2027-01-01");
  assert.deepEqual(summary, {
    total: 3,
    needsReview: 1,
    missingDate: 1,
    missingTitle: 1,
    missingSource: 1,
    duplicateRecords: 0,
    withSourceLink: 2,
    withPdf: 1,
    withAbstract: 2
  });
});

test("library quality summary detects duplicate DOI and publication URLs once per extra record", () => {
  const items = [
    { doi: "10.1234/ABC" },
    { doi: "https://doi.org/10.1234/abc" },
    { url_publication: "https://example.org/report?utm_source=feed" },
    { url_publication: "https://example.org/report#page=2" },
    { url_publication: "javascript:alert(1)" }
  ];
  const summary = getLibraryQualitySummary(items);
  assert.equal(summary.duplicateRecords, 2);
  assert.equal(summary.withSourceLink, 4);
});

test("library quality summary safely handles missing or non-array input", () => {
  assert.deepEqual(getLibraryQualitySummary(null), {
    total: 0,
    needsReview: 0,
    missingDate: 0,
    missingTitle: 0,
    missingSource: 0,
    duplicateRecords: 0,
    withSourceLink: 0,
    withPdf: 0,
    withAbstract: 0
  });
});


test("does not count credential-bearing publication or PDF URLs as usable links", () => {
  const items = [
    { url_publication: "https://user:secret@example.org/report", pdf_direct: "https://user:secret@example.org/report.pdf" },
    { url_publication: "https://example.org/report", pdf_direct: "https://example.org/report.pdf" }
  ];
  const summary = getLibraryQualitySummary(items);
  assert.equal(summary.withSourceLink, 1);
  assert.equal(summary.withPdf, 1);
  assert.equal(summary.duplicateRecords, 0);
});
