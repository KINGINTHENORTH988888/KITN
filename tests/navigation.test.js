import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
const spacesMatch = source.match(/const SPACES = \{([\s\S]*?)\n\};/);

test("public navigation exposes exactly six spaces in French and Arabic", () => {
  assert.ok(spacesMatch, "SPACES configuration must exist");
  const spaces = spacesMatch[1];
  const french = spaces.match(/fr:\s*\[([\s\S]*?)\],\s*ar:/)?.[1] || "";
  const arabic = spaces.match(/ar:\s*\[([\s\S]*?)\]\s*$/)?.[1] || "";
  assert.equal((french.match(/\{ id:/g) || []).length, 6);
  assert.equal((arabic.match(/\{ id:/g) || []).length, 6);
});

test("administration and local contribution tools are not public navigation spaces", () => {
  assert.ok(spacesMatch);
  assert.doesNotMatch(spacesMatch[1], /contribuer|Administration & contributions|الإدارة والمساهمات/);
});

test("legacy contribution-space sessions fall back to the public portal", () => {
  assert.match(source, /if \(activeSpace === "contribuer"\) activeSpace = "all";/);
});
