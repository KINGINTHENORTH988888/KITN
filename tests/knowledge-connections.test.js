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

test("one incidental context word cannot create a recommendation", () => {
  const source = { id: "a", espace: "bibliotheque", titre_original: "Rencontre institutionnelle", resume: "Le président Ahmed présente un rapport" };
  const candidate = { id: "b", espace: "veille", titre_original: "Actualité locale", resume: "Ahmed participe à un événement" };
  assert.deepEqual(related([source, candidate], source), []);
});

test("two shared context terms can support a recommendation when titles differ", () => {
  const source = { id: "a", espace: "bibliotheque", titre_original: "Analyse territoriale", resume: "transition énergétique et efficacité industrielle" };
  const candidate = { id: "b", espace: "science", titre_original: "Évolution des secteurs", resume: "transition énergétique au Maroc" };
  const result = related([source, candidate], source);
  assert.equal(result.length, 1);
  assert.ok(result[0].sharedTerms.includes("transition"));
  assert.ok(result[0].sharedTerms.includes("energetique"));
});

test("related knowledge ignores months, ordinals and generic news wording", () => {
  const source = { id: "a", espace: "bibliotheque", titre_original: "Rapport stratégique novembre 2026" };
  const candidate = { id: "b", espace: "veille", titre_original: "Rencontre du premier novembre 2026" };
  assert.deepEqual(related([source, candidate], source), []);
});

test("a shared classification pole alone is not enough to create a recommendation", () => {
  const source = { id: "a", espace: "bibliotheque", pole: "economie_finances_publiques", titre_original: "Rencontre institutionnelle", resume: "Discussion protocolaire" };
  const candidate = { id: "b", espace: "veille", pole: "economie_finances_publiques", titre_original: "Rapport annuel de conjoncture", resume: "Publication nationale" };
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

test("cross-space matches take priority over stronger same-space matches", () => {
  const source = { id: "a", espace: "bibliotheque", titre_original: "Transition énergétique et gouvernance territoriale" };
  const sameSpace = { id: "b", espace: "bibliotheque", titre_original: "Transition énergétique et gouvernance territoriale au Maroc" };
  const crossSpace = { id: "c", espace: "veille", titre_original: "Transition énergétique" };
  const result = related([source, sameSpace, crossSpace], source);
  assert.equal(result[0].item.id, "c");
  assert.equal(result[0].crossSpace, true);
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
