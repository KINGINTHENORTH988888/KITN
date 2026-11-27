import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const regional = JSON.parse(
  readFileSync(new URL("../data/regional-statistics.json", import.meta.url), "utf8"),
);
const academy = JSON.parse(
  readFileSync(new URL("../data/academy/academy.json", import.meta.url), "utf8"),
);

function periodKey(value) {
  const quarter = String(value || "").match(/^T([1-4])\/(\d{4})$/);
  if (quarter) return Number(quarter[2]) * 10 + Number(quarter[1]);
  const year = String(value || "").match(/^(\d{4})$/);
  return year ? Number(year[1]) * 10 : Number.NaN;
}

test("published regional dataset has the expected complete series inventory", () => {
  assert.equal(regional.series.length, regional.series_count);
  assert.equal(regional.series_count, 342);

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
  assert.equal(social.reduce((sum, [, count]) => sum + count, 0), 108);

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
