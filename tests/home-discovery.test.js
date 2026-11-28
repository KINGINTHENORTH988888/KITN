import test from "node:test";
import assert from "node:assert/strict";
import { getHomeFeaturedItems } from "../src/home-discovery.js";

const item = (id, space, date) => ({ id, space, date_publication: date });

test("selects the most recent item from each available KITN space", () => {
  const items = [
    item("v1", "veille", "2026-11-20"),
    item("s1", "science", "2026-11-18"),
    item("v2", "veille", "2026-11-25"),
    item("c1", "chiffres", "2026-11-24"),
    item("b1", "bibliotheque", "2026-11-22"),
    item("a1", "academy", "2026-11-21")
  ];
  const result = getHomeFeaturedItems(items, { getSpace: (x) => x.space, getKey: (x) => x.id });
  assert.deepEqual(result.map((x) => x.id), ["v2", "c1", "b1", "a1", "s1"]);
});

test("fills remaining homepage slots without repeating an item or space", () => {
  const items = [
    item("v1", "veille", "2026-11-25"),
    item("v2", "veille", "2026-11-24"),
    item("s1", "science", "2026-11-23")
  ];
  const result = getHomeFeaturedItems(items, { getSpace: (x) => x.space, getKey: (x) => x.id, limit: 3 });
  assert.deepEqual(result.map((x) => x.id), ["v1", "s1", "v2"]);
});

test("handles empty input and invalid limits safely", () => {
  assert.deepEqual(getHomeFeaturedItems(null), []);
  assert.deepEqual(getHomeFeaturedItems([item("x", "veille", "2026-11-25")], { limit: 0 }), []);
});
