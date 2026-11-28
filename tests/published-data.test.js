import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const regional = JSON.parse(
  readFileSync(new URL("../data/regional-statistics.json", import.meta.url), "utf8"),
);
const regionalPublic = JSON.parse(
  readFileSync(new URL("../public/data/regional-statistics.json", import.meta.url), "utf8"),
);
const statistics = JSON.parse(
  readFileSync(new URL("../data/statistics.json", import.meta.url), "utf8"),
);
const statisticsPublic = JSON.parse(
  readFileSync(new URL("../public/data/statistics.json", import.meta.url), "utf8"),
);
const searchIndex = JSON.parse(
  readFileSync(new URL("../data/index/search-index.json", import.meta.url), "utf8"),
);
const searchIndexPublic = JSON.parse(
  readFileSync(new URL("../public/data/index/search-index.json", import.meta.url), "utf8"),
);
const academy = JSON.parse(
  readFileSync(new URL("../data/academy/academy.json", import.meta.url), "utf8"),
);
const academyPublic = JSON.parse(
  readFileSync(new URL("../public/data/academy/academy.json", import.meta.url), "utf8"),
);

function periodKey(value) {
  const quarter = String(value || "").match(/^T([1-4])\/(\d{4})$/);
  if (quarter) return Number(quarter[2]) * 10 + Number(quarter[1]);
  const year = String(value || "").match(/^(\d{4})$/);
  return year ? Number(year[1]) * 10 : Number.NaN;
}

test("published regional dataset has the expected complete series inventory", () => {
  assert.equal(regional.series.length, regional.series_count);
  // The PR validation snapshot may run before the live HCP social-data
  // workflow has committed its 108-series update. Both published states
  // are valid; the full branch dataset contains 342 series.
  assert.ok(
    [234, 342].includes(regional.series_count),
    `unexpected regional series count: ${regional.series_count}`,
  );

  const ids = regional.series.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, "series IDs must be unique");

  const counts = new Map();
  for (const item of regional.series) {
    counts.set(item.indicator_code, (counts.get(item.indicator_code) || 0) + 1);
  }

  const emo = [...counts.entries()].filter(([code]) => code.startsWith("HCP_EMO_"));
  const social = [...counts.entries()].filter(([code]) => code.startsWith("HCP_SOCIAL_"));
  assert.equal(emo.length, 6, "six EMO indicators should be published");
  assert.ok(emo.every(([, count]) => count === 39), "each EMO indicator covers 13 geographies and 3 scopes");
  const socialCount = social.reduce((sum, [, count]) => sum + count, 0);
  assert.ok(
    [0, 108].includes(socialCount),
    `social series must be absent in the pre-publication snapshot or complete (108), got ${socialCount}`,
  );
  assert.equal(regional.series_count, 234 + socialCount);

  const regionalGeographies = new Set(
    regional.series
      .filter((item) => item.geography_level === "region")
      .map((item) => item.geography_code),
  );
  assert.equal(regionalGeographies.size, 12, "social and regional series should cover the 12 regions");
});

test("regional series preserve source, chronology and explicit missing values", () => {
  for (const item of regional.series) {
    assert.ok(item.id, "every series needs a stable ID");
    assert.ok(item.indicator_code, "every series needs an indicator code");
    assert.ok(item.source_name, `${item.id} needs a source name`);
    assert.match(item.source_url || "", /^https:\/\//, `${item.id} needs an HTTPS source URL`);

    const history = item.history || [];
    const keys = history.map((point) => periodKey(point.year));
    assert.ok(keys.every(Number.isFinite), `${item.id} has an unsupported period label`);
    assert.ok(keys.every((key, index) => index === 0 || key >= keys[index - 1]), `${item.id} history must be chronological`);

    if (item.latest) {
      assert.ok(history.length > 0, `${item.id} has a latest value without history`);
      const last = history[history.length - 1];
      assert.equal(item.latest.year, last.year, `${item.id} latest period must match its last history point`);
      assert.equal(item.latest.value, last.value, `${item.id} latest value must match its last history point`);
    }

    for (const point of history) {
      assert.ok(
        point.value === null || (typeof point.value === "number" && Number.isFinite(point.value)),
        `${item.id} values must be finite numbers or explicit nulls`,
      );
    }
  }
});

test("Academy has three bilingual tracks with valid answer indexes", () => {
  for (const language of ["fr", "ar"]) {
    const tracks = academy.tracks?.[language] || [];
    assert.deepEqual(
      tracks.map((track) => track.id).sort(),
      ["admin", "dgsn", "irat"],
    );

    for (const track of tracks) {
      assert.equal(track.questions?.length, 5, `${language}/${track.id} should have five questions`);
      for (const [index, question] of track.questions.entries()) {
        assert.ok(question.question, `${language}/${track.id}/${index} needs a question`);
        assert.ok(Array.isArray(question.options) && question.options.length >= 2);
        assert.ok(
          Number.isInteger(question.answer) &&
            question.answer >= 0 &&
            question.answer < question.options.length,
          `${language}/${track.id}/${index} has an invalid answer index`,
        );
        assert.ok(question.correction, `${language}/${track.id}/${index} needs an explanation`);
      }
    }
  }
});


test("Academy learning paths provide bilingual objectives and actionable revision steps", () => {
  for (const language of ["fr", "ar"]) {
    const tracks = academy.tracks?.[language] || [];
    assert.equal(tracks.length, 3);
    for (const track of tracks) {
      assert.equal(track.learning_objectives?.length, 4, `${language}/${track.id} needs four learning objectives`);
      assert.equal(track.study_plan?.length, 4, `${language}/${track.id} needs four revision steps`);
      for (const objective of track.learning_objectives) assert.ok(objective.trim().length >= 20);
      for (const step of track.study_plan) assert.ok(step.trim().length >= 20);
    }
  }

  for (const id of ["dgsn", "irat", "admin"]) {
    const fr = academy.tracks.fr.find((track) => track.id === id);
    const ar = academy.tracks.ar.find((track) => track.id === id);
    assert.ok(fr && ar, `missing bilingual track ${id}`);
    assert.equal(fr.learning_objectives.length, ar.learning_objectives.length);
    assert.equal(fr.study_plan.length, ar.study_plan.length);
  }
});

test("published data mirrors are synchronized with the frontend copies", () => {
  assert.deepEqual(regionalPublic, regional, "regional data in public/ must match the source dataset");
  assert.deepEqual(statisticsPublic, statistics, "national statistics in public/ must match the source dataset");
  assert.deepEqual(searchIndexPublic, searchIndex, "document index in public/ must match the source index");
  assert.deepEqual(academyPublic, academy, "Academy content in public/ must match the source content");
});

test("document index preserves stable identity and flags future-dated records for review", () => {
  const items = searchIndex.items || [];
  assert.equal(searchIndex.total, items.length, "document index total must match the actual item count");

  const ids = items.map((item) => item.id);
  assert.ok(ids.every(Boolean), "every indexed document needs a stable ID");
  assert.equal(new Set(ids).size, ids.length, "document IDs must be unique");

  for (const item of items) {
    assert.ok(item.titre_original, `${item.id} needs a title`);
    assert.ok(item.source_nom, `${item.id} needs a source name`);
    assert.ok(
      ["valide", "a_verifier", "archive"].includes(item.statut_validation),
      `${item.id} has an unsupported validation status`,
    );
    if (item.date_anomalie || item.date_statut === "date_future_a_verifier") {
      assert.equal(
        item.statut_validation,
        "a_verifier",
        `${item.id} has an anomalous date and must not be presented as validated`,
      );
    }
  }
});
