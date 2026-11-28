import test from "node:test";
import assert from "node:assert/strict";
import { matchesSearchQuery, normalizeSearchText } from "../src/search.js";

test("French searches ignore accents and punctuation", () => {
  assert.equal(normalizeSearchText("chômage"), normalizeSearchText("chomage"));
  assert.equal(normalizeSearchText("Économie — finances publiques"), "economie finances publiques");
});

test("Arabic searches ignore optional diacritics without losing Arabic letters", () => {
  assert.equal(normalizeSearchText("الْمَغْرِب"), normalizeSearchText("المغرب"));
  assert.equal(normalizeSearchText("البطالة"), "البطالة");
});

test("search normalization collapses whitespace and is case-insensitive", () => {
  assert.equal(normalizeSearchText("  MAROC   EN   CHIFFRES "), "maroc en chiffres");
  assert.equal(normalizeSearchText("Fès"), "fes");
});

test("document search matches accented and unaccented French text", () => {
  const title = "Évolution du chômage et de l'emploi au Maroc";
  assert.equal(matchesSearchQuery(title, "chomage"), true);
  assert.equal(matchesSearchQuery(title, "emploi"), true);
  assert.equal(matchesSearchQuery(title, "inflation"), false);
});

test("document search matches Arabic text with or without diacritics", () => {
  assert.equal(matchesSearchQuery("مؤشرات الْبَطَالَة في المغرب", "البطالة"), true);
});

test("empty search queries match all text", () => {
  assert.equal(matchesSearchQuery("N'importe quel document", "   "), true);
});
