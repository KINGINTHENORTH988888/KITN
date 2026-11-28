import test from "node:test";
import assert from "node:assert/strict";
import { getAcademyProgressSummary, mergeAcademyProgress, normalizeAcademyProgress } from "../src/academy-progress.js";

test("keeps valid answers for each Academy track and question", () => {
  assert.deepEqual(normalizeAcademyProgress({ "dgsn:0": 2, "irat:4": 1, "administrateur:12": 3 }), {
    "dgsn:0": 2, "irat:4": 1, "administrateur:12": 3
  });
});

test("rejects malformed keys and invalid answer values", () => {
  assert.deepEqual(normalizeAcademyProgress({
    "dgsn:0": 1, "dgsn:-1": 2, "dgsn:2": "1", "dgsn:3": -1, "dgsn:4": 10, "not a key": 0
  }), { "dgsn:0": 1 });
});

test("returns an empty progress object for malformed storage", () => {
  assert.deepEqual(normalizeAcademyProgress(null), {});
  assert.deepEqual(normalizeAcademyProgress([]), {});
  assert.deepEqual(normalizeAcademyProgress("invalid"), {});
});

test("summarizes answered, correct, completed and overall progress across tracks", () => {
  const tracks = [
    { id: "dgsn", label: "DGSN", questions: [{ answer: 1 }, { answer: 0 }] },
    { id: "irat", label: "IRAT", questions: [{ answer: 2 }] },
    { id: "admin", label: "Administration", answer: 1 }
  ];
  const summary = getAcademyProgressSummary(tracks, {
    "dgsn:0": 1, "dgsn:1": 2, "irat:0": 2, "admin:0": 0
  });
  assert.equal(summary.answered, 4);
  assert.equal(summary.correct, 2);
  assert.equal(summary.total, 4);
  assert.equal(summary.percent, 100);
  assert.equal(summary.completedTracks, 3);
  assert.deepEqual(summary.tracks.map(({ id, answered, correct, completed }) => ({ id, answered, correct, completed })), [
    { id: "dgsn", answered: 2, correct: 1, completed: true },
    { id: "irat", answered: 1, correct: 1, completed: true },
    { id: "admin", answered: 1, correct: 0, completed: true }
  ]);
});

test("ignores answers that do not belong to a track question", () => {
  const summary = getAcademyProgressSummary([{ id: "dgsn", questions: [{ answer: 0 }] }], {
    "dgsn:4": 0, "unknown:0": 1
  });
  assert.equal(summary.answered, 0);
  assert.equal(summary.correct, 0);
  assert.equal(summary.percent, 0);
  assert.equal(summary.completedTracks, 0);
});

test("imports only answers that belong to known questions and valid options", () => {
  const tracks = [
    { id: "dgsn", questions: [{ options: ["a", "b"] }, { options: ["a", "b", "c"] }] },
    { id: "irat", options: ["a", "b"] },
    { id: "other", options: ["a", "b"] }
  ];
  assert.deepEqual(mergeAcademyProgress({ "dgsn:0": 0 }, {
    "dgsn:0": 1,
    "dgsn:1": 2,
    "dgsn:2": 0,
    "irat:0": 1,
    "unknown:0": 0,
    "other:0": 9
  }, tracks), { "dgsn:0": 1, "dgsn:1": 2, "irat:0": 1 });
});

test("merging a backup preserves existing answers missing from the imported file", () => {
  const tracks = [{ id: "dgsn", questions: [{ options: ["a", "b"] }, { options: ["a", "b"] }] }];
  assert.deepEqual(mergeAcademyProgress({ "dgsn:0": 1, "dgsn:1": 0 }, {
    "dgsn:0": 0
  }, tracks), { "dgsn:0": 0, "dgsn:1": 0 });
});
