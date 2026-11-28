import test from "node:test";
import assert from "node:assert/strict";
import { getPageSlice } from "../src/pagination.js";

test("pagination returns the first page and preserves item order", () => {
  const items = Array.from({ length: 55 }, (_, index) => index + 1);
  const page = getPageSlice(items, 1, 24);
  assert.deepEqual(page.items, Array.from({ length: 24 }, (_, index) => index + 1));
  assert.equal(page.total, 55);
  assert.equal(page.pageCount, 3);
  assert.equal(page.startIndex, 0);
  assert.equal(page.endIndex, 24);
});

test("pagination clamps requested pages and returns the final partial page", () => {
  const items = Array.from({ length: 50 }, (_, index) => index + 1);
  const page = getPageSlice(items, 99, 24);
  assert.equal(page.page, 3);
  assert.deepEqual(page.items, [49, 50]);
  assert.equal(page.startIndex, 48);
  assert.equal(page.endIndex, 50);
});

test("pagination handles empty lists and invalid page sizes safely", () => {
  const empty = getPageSlice([], 0, 0);
  assert.deepEqual(empty.items, []);
  assert.equal(empty.page, 1);
  assert.equal(empty.pageCount, 1);
  assert.equal(empty.total, 0);
});

test("pagination supports Arabic and French result sets without changing their content", () => {
  const items = ["المغرب", "chômage", "اقتصاد"];
  assert.deepEqual(getPageSlice(items, 1, 2).items, ["المغرب", "chômage"]);
  assert.deepEqual(getPageSlice(items, 2, 2).items, ["اقتصاد"]);
});
