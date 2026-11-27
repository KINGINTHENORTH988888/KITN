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


test("header exposes the six dedicated spaces and useful dropdown shortcuts", () => {
  assert.match(source, /data-space-id="chiffres"/);
  assert.match(source, /data-space-id="veille"/);
  assert.match(source, /data-space-id="science"/);
  assert.match(source, /data-space-id="bibliotheque"/);
  assert.match(source, /data-space-id="academy"/);
  assert.match(source, /data-stat-view-shortcut="regional"/);
  assert.match(source, /data-pole-shortcut="institutions_gouvernance"/);
});

test("homepage keeps Academy and the full research index out of the landing view", () => {
  assert.match(source, /activeSpace === "academy" ? `/);
  assert.match(source, /isDedicatedSpace ? `\s*<section class="section" id="research">/);
  assert.match(source, /home-featured-grid/);
});

test("dedicated spaces are addressable with hash routes and browser history", () => {
  assert.match(source, /window\.location\.hash\.match\(\/\^#\\\//);
  assert.match(source, /window\.history\.pushState/);
  assert.match(source, /window\.addEventListener\("popstate"/);
});
