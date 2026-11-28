import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAcademyProgress } from "../src/academy-progress.js";

test("keeps valid answers for each Academy track and question", () => {
  assert.deepEqual(normalizeAcademyProgress({ "dgsn:0": 2, "irat:4": 1, "administrateur:12": 3 }), {
    "dgsn:0": 2, "irat:4": 1, "administrateur:12": 3
  });
});

test("rejects malformed keys and invalid answer values", () => {
  assert.deepEqual(normalizeAcademyProgress({
    "dgsn:0": 1,
    "dgsn:-1": 2,
    "dgsn:2": "1",
    "dgsn:3": -1,
    "dgsn:4": 10,
    "not a key": 0
  }), { "dgsn:0": 1 });
});

test("returns an empty progress object for malformed storage", () => {
  assert.deepEqual(normalizeAcademyProgress(null), {});
  assert.deepEqual(normalizeAcademyProgress([]), {});
  assert.deepEqual(normalizeAcademyProgress("invalid"), {});
});
