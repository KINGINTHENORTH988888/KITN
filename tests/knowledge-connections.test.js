import test from "node:test";
import assert from "node:assert/strict";
import { findRelatedKnowledgeItems } from "../src/knowledge-connections.js";
import { normalizeSearchText } from "../src/search.js";

const getSpace = (item) => item.espace;
const getKey = (item) => item.id;
const related = (items, source, options = {}) => findRelatedKnowledgeItems(items, source, {
  getSpace, getKey, normalizeText: normalizeSearchText, ...options
});

test("related knowledge ignores years and generic words as thematic connections", () => {
  const source = { id: "a", espace: "bibliotheque", titre_original: "Rapport annuel 2026", resume: "Le président présente une analyse nationale" };
  const candidate = { id: "b", espace: "veille", titre_original: "Actualité Maroc 2026", resume: "Le conseil publie un rapport national" };
  assert.deepEqual(related([source, candidate], source), []);
});

test("related knowledge matches meaningful complete terms across different spaces", () => {
  const source = { id: "a", espace: "bibliotheque", pole: "institutions_gouvernance", titre_original: "Déconcentration administrative et gouvernance locale" };
  const candidate = { id: "b", espace: "veille", titre_original: "La déconcentration administrative au Maroc" };
  const result = related([source, candidate], source);
  assert.equal(result.length, 1);
  assert.equal(result[0].crossSpace, true);
  assert.deepEqual(result[0].sharedTerms.sort(), ["administrative", "deconcentration"]);
});

test("related knowledge excludes self and future content, ranks stronger topical matches first", () => {
  const source = { id: "a", espace: "science", titre_original: "Transition énergétique et énergies renouvelables" };
  const weak = { id: "b", espace: "veille", titre_original: "Transition énergétique au Maroc", date_publication: "2025-01-01" };
  const strong = { id: "c", espace: "bibliotheque", titre_original: "Énergies renouvelables et transition énergétique", date_publication: "2024-01-01" };
  const future = { id: "d", espace: "veille", titre_original: "Transition énergétique et énergies renouvelables", date_publication: "2027-01-01" };
  const result = related([source, weak, strong, future], source, { isFutureDate: (item) => item.id === "d" });
  assert.deepEqual(result.map((entry) => entry.item.id), ["c", "b"]);
});

test("related knowledge respects the requested result limit and invalid inputs", () => {
  const source = { id: "a", espace: "science", titre_original: "Énergie renouvelable et transition écologique" };
  const candidates = ["b", "c", "d"].map((id) => ({
    id, espace: "veille", titre_original: "Transition écologique et énergie renouvelable"
  }));
  assert.equal(related([source, ...candidates], source, { limit: 2 }).length, 2);
  assert.deepEqual(findRelatedKnowledgeItems(null, source), []);
  assert.deepEqual(related([source], source, { limit: 0 }), []);
});
