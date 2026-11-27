import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSearchText } from "../src/search.js";

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
