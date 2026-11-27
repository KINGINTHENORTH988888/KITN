import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/style.css", import.meta.url), "utf8");
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
  assert.ok(source.includes('${activeSpace === "academy" ? `'));
  assert.ok(source.includes('${isDedicatedSpace ? `\n    <section class="section" id="research">'));
  assert.ok(source.includes("home-featured-grid"));
});

test("dedicated spaces have clean URLs and browser history navigation", () => {
  assert.ok(source.includes('chiffres: "/maroc-en-chiffres"'));
  assert.ok(source.includes('science: "/etudes-recherche"'));
  assert.ok(source.includes('bibliotheque: "/bibliotheque"'));
  assert.ok(source.includes('academy: "/academy"'));
  assert.match(source, /window\.history\.pushState/);
  assert.match(source, /window\.addEventListener\("popstate"/);
  assert.match(source, /function getSpaceFromLocation\(\)/);
});


test("dedicated views do not repeat the full spaces navigation inside the page", () => {
  assert.ok(!source.includes('class="spaces-bar"'));
});

test("national statistics expose transparent counts before indicator detail", () => {
  assert.ok(source.includes("totalObservations"));
  assert.ok(source.includes("sourceCount"));
  assert.ok(source.includes("stats-overview"));
});


test("homepage provides direct access cards for the five non-home spaces", () => {
  assert.ok(source.includes("home-space-grid"));
  assert.ok(source.includes('spaces.filter((sp) => !["all", "contribuer"].includes(sp.id))'));
  assert.ok(source.includes('data-space-id="chiffres"'));
});

test("homepage hero actions lead to useful KITN spaces rather than dead anchors", () => {
  assert.ok(source.includes('class="btn primary" data-space-id="chiffres"'));
  assert.ok(source.includes('class="text-link" data-space-id="veille"'));
  assert.ok(!source.includes('href="#method"'));
});

test("legacy dashboard sections are no longer displayed on the homepage", () => {
  assert.ok(styles.includes("#portal-hub, #themes { display: none; }"));
});


test("each dedicated space updates the browser document title", () => {
  assert.ok(source.includes("document.title = activeArticleItem"));
  assert.ok(source.includes('${activeSpaceObj.label} | KITN'));
});

test("returning to the home space also restores the root URL", () => {
  assert.ok(source.includes('window.history.pushState({ kitnSpace: "all" }, "", SPACE_PATHS.all)'));
});


test("homepage publication links open internal reading pages", () => {
  assert.ok(source.includes('"/publication/" + encodeURIComponent(key)'));
  assert.ok(source.includes("function renderArticlePage(item)"));
  assert.ok(source.includes('class="article-reading section"'));
});

test("publication pages preserve source references and respect reproduction rights", () => {
  assert.ok(source.includes("Le texte intégral ne sera reproduit que si les droits ou la licence de la source l'autorisent."));
  assert.ok(source.includes('Publication originale'));
  assert.ok(source.includes('Source et références'));
});

test("direct publication URLs are restored after the index loads and browser navigation", () => {
  assert.ok(source.includes("function getArticleIdFromLocation()"));
  assert.ok(source.includes('activeArticleId = getArticleIdFromLocation()'));
  assert.ok(source.includes('document.body.classList.toggle("is-article-view", Boolean(activeArticleItem))'));
});


test("national statistics make unclassified indicators discoverable instead of hiding them", () => {
  assert.ok(source.includes('id: "unclassified"'));
  assert.ok(source.includes('statisticsCategory === "unclassified"'));
  assert.ok(source.includes('isAr ? "غير مصنفة" : "À classer"'));
});

test("national statistics provide searchable indicators and visible result counts", () => {
  assert.ok(source.includes('data-stat-search'));
  assert.ok(source.includes('stats-results-meta'));
  assert.ok(source.includes('indicator.indicator_code'));
});

test("regional HCP dashboard displays territorial coverage and missing-value counts", () => {
  assert.ok(source.includes('class="regional-coverage"'));
  assert.ok(source.includes("model.latestAvailableCount"));
  assert.ok(source.includes("model.latestMissingCount"));
  assert.ok(source.includes("model.latestPeriod"));
});

test("regional HCP dashboard ranks only available regional observations for the latest period", () => {
  assert.ok(source.includes('class="regional-ranking"'));
  assert.ok(source.includes('row.geographyCode !== "MAR"'));
  assert.ok(source.includes("latestRanking"));
  assert.ok(source.includes("model.latestPeriod"));
});

test("monitoring space exposes thematic entry points with grounded indexed counts", () => {
  assert.match(source, /function renderWatchDashboard\(\)/);
  assert.match(source, /watchItems = indexItems\.filter\(\(item\) => matchesSpace\(item, "veille"\)/);
  assert.match(source, /data-pole-shortcut=/);
  assert.match(source, /Les volumes correspondent aux notices actuellement indexées/);
  assert.match(styles, /\.watch-topic-grid/);
});

test("library hub metrics are computed from available indexed documents", () => {
  assert.match(source, /function renderLibraryDirectory\(\)/);
  assert.match(source, /matchesSpace\(item, "bibliotheque"\)/);
  assert.match(source, /withPdf = docs\.filter/);
  assert.match(source, /library-recent-item/);
  assert.match(source, /Les portails institutionnels peuvent proposer/);
  assert.match(styles, /\.library-metrics/);
  assert.match(styles, /\.library-recent-list/);
});

test("global search overview exposes all content spaces and labels result context", () => {
  assert.match(source, /function renderGlobalSearchOverview\(\)/);
  assert.match(source, /EXPLORATION TRANSVERSALE/);
  assert.match(source, /matchesSpace\(item,space\.id\)/);
  assert.match(source, /activeSpace === "all" \? itemSpaceLabel/);
  assert.match(styles, /\.global-search-spaces/);
});

test("library source cards reflect the real indexed institutional and internal sources", () => {
  assert.match(source, /id:"cour_des_comptes_maroc"/);
  assert.match(source, /id:"cese_maroc"/);
  assert.match(source, /id:"ires_maroc"/);
  assert.match(source, /id:"hcp_maroc"/);
  assert.match(source, /id:"manual_studio"/);
  assert.match(source, /Source interne KITN/);
  assert.doesNotMatch(source, /id:"world_bank_maroc"/);
});
