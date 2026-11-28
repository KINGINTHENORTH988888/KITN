import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/style.css", import.meta.url), "utf8");
const searchSource = await readFile(new URL("../src/search.js", import.meta.url), "utf8");
const knowledgeSource = await readFile(new URL("../src/knowledge-connections.js", import.meta.url), "utf8");
const spacesMatch = source.match(/const SPACES = \{([\s\S]*?)\n\};/);

test("Academy course UI renders concepts, local examples and applied exercises", () => {
  assert.match(source, /activeTrack\.lessons/);
  assert.match(source, /academy-course-section/);
  assert.match(source, /academyConceptsLabel/);
  assert.match(source, /academyExampleLabel/);
  assert.match(source, /academyExerciseLabel/);
  assert.match(source, /academy-guidance/);
  assert.match(styles, /\.academy-lesson/);
  assert.ok(styles.includes("@media (max-width: 560px)"), "Academy lesson mobile layout must define the 560px breakpoint");
});

test("Academy quiz feedback renders explanations for every option", () => {
  assert.match(source, /activeQuizQuestion\.option_explanations/);
  assert.match(source, /academyExplanationLabel/);
  assert.match(source, /quiz-explanations/);
  assert.match(styles, /\.quiz-explanations/);
});

test("Academy renders structured learning objectives and revision plans", () => {
  assert.match(source, /activeTrack\.learning_objectives/);
  assert.match(source, /activeTrack\.study_plan/);
  assert.match(source, /academyObjectivesLabel/);
  assert.match(source, /academyPlanLabel/);
  assert.match(styles, /\.academy-learning-block/);
});

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
  assert.match(source, /getLibraryQualitySummary\(docs\)/);
  assert.match(source, /libraryQuality\.needsReview/);
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


test("global search includes national statistical indicators and opens their dedicated view", () => {
  assert.match(source, /globalStatisticMatches = activeSpace === "all"/);
  assert.match(source, /statisticsData\?\.indicators/);
  assert.match(source, /data-global-stat=/);
  assert.match(source, /statisticsSearch = code/);
  assert.match(source, /INDICATEURS STATISTIQUES/);
  assert.match(styles, /\.global-stat-results/);
  assert.match(styles, /\.global-stat-result/);
});

test("mobile navigation exposes its controlled region and restores keyboard focus", () => {
  assert.match(source, /id="menu-toggle" aria-expanded="\$\{mobileMenuOpen\}" aria-controls="main-nav"/);
  assert.match(source, /document\.getElementById\("menu-toggle"\)\?\.focus\(\)/);
});

test("mobile navigation stays in the header document flow", () => {
  const mobile = styles.match(/@media \(max-width: 820px\) \{([\s\S]*?)\n\}/)?.[1] || "";
  assert.match(mobile, /\.nav\s*\{[\s\S]*?position:\s*static/);
  assert.match(mobile, /\.nav\s*\{[\s\S]*?order:\s*3/);
  assert.match(mobile, /\.nav\.is-open\s*\{\s*display:\s*flex/);
});

test("search normalization ignores accents and combining diacritics", () => {
  assert.match(source, /import \{ matchesSearchQuery, normalizeSearchText \} from "\.\/search\.js"/);
  assert.match(searchSource, /export function normalizeSearchText\(value\)/);
  assert.match(searchSource, /\.normalize\("NFD"\)/);
  assert.match(source, /matchesSearchQuery\(searchable, q\)/);
  assert.match(source, /normalizeSearchText\(statisticsSearch\)/);
});

test("mobile header wraps navigation onto a full-width row", () => {
  const mobile = styles.match(/@media \(max-width: 820px\) \{([\s\S]*?)\n\}/)?.[1] || "";
  assert.match(mobile, /\.topbar\s*\{[\s\S]*?flex-wrap:\s*wrap/);
  assert.match(mobile, /\.nav\s*\{[\s\S]*?flex:\s*0 0 100%/);
  assert.match(mobile, /\.nav\s*\{[\s\S]*?min-width:\s*0/);
});

test("veille dashboard exposes source-collection transparency without assuming live availability", () => {
  assert.match(source, /fetch\("\/data\/sources-health\.json", \{ cache: "no-store" \}\)/);
  assert.match(source, /sourceHealthData\?\.sources/);
  assert.match(source, /Dernière mise à jour/);
  assert.match(source, /ne garantit pas la disponibilité en temps réel/);
  assert.match(styles, /\.watch-source-health/);
});


test("mobile navigation parents expand submenus without navigating away", () => {
  for (const id of ["chiffres", "veille", "science"]) {
    assert.ok(source.includes(`data-mobile-submenu="${id}"`));
    assert.ok(source.includes(`aria-controls="nav-submenu-${id}"`));
    assert.ok(source.includes(`aria-expanded="${"${"}mobileOpenSubmenu === "${id}"}"`));
  }
  assert.ok(source.includes('window.matchMedia("(max-width: 820px)").matches'));
  assert.ok(source.includes('mobileOpenSubmenu = mobileOpenSubmenu === mobileSubmenu ? "" : mobileSubmenu'));
});

test("mobile submenus stay collapsed until their parent is opened", () => {
  assert.ok(styles.includes(".nav-group:not(.is-open) .nav-dropdown { display: none; }"));
  assert.ok(styles.includes(".nav-group.is-open .nav-dropdown { display: grid; }"));
});


test("content grids cannot force horizontal overflow on narrow phones", () => {
  assert.match(styles, /\.results-grid\s*\{[^}]*minmax\(min\(100%, 290px\), 1fr\)/s);
  assert.match(styles, /\.theme-detail,[\s\S]*?grid-template-columns: repeat\(auto-fit, minmax\(min\(100%, 260px\), 1fr\)\)/);
});


test("monitoring dashboard exposes individual source failures and diagnostics", () => {
  assert.match(source, /sourceAttentionItems = enabledSources\.filter/);
  assert.match(source, /source\.source_name \|\| source\.source_id/);
  assert.match(source, /source\.error \|\| source\.message/);
  assert.match(source, /watch-source-issues/);
  assert.match(styles, /\.watch-source-issue\.is-error/);
  assert.match(styles, /\.watch-source-issue-heading/);
});

test("homepage space cards explain the purpose of all five spaces in French and Arabic", () => {
  const descriptions = source.match(/const SPACE_DESCRIPTIONS = \{([\s\S]*?)\n\};/)?.[1] || "";
  const french = descriptions.match(/fr:\s*\{([\s\S]*?)\},\s*ar:/)?.[1] || "";
  const arabic = descriptions.match(/ar:\s*\{([\s\S]*?)\}\s*$/)?.[1] || "";
  for (const id of ["chiffres", "veille", "science", "bibliotheque", "academy"]) {
    assert.match(french, new RegExp(`${id}:`), `French description missing for ${id}`);
    assert.match(arabic, new RegExp(`${id}:`), `Arabic description missing for ${id}`);
  }
  assert.match(source, /SPACE_DESCRIPTIONS\[lang\]\[sp\.id\]/);
  assert.ok(source.includes('<p>${escapeHtml(SPACE_DESCRIPTIONS[lang][sp.id] || "")}</p>'));
  assert.match(styles, /\.home-space-card p\s*\{/);
});

test("all document search fields use accent-insensitive normalized matching", () => {
  assert.match(source, /import \{ matchesSearchQuery, normalizeSearchText \} from "\.\/search\.js";/);
  assert.match(source, /return matchesSearchQuery\(searchable, q\);/);
  assert.match(source, /matchesSearchQuery\(authorsForFilter, authorQuery\)/);
  assert.match(source, /matchesSearchQuery\(disciplineText, disciplineQuery\)/);
});


test("Academy progress can be exported and restored from a local JSON backup", () => {
  assert.match(source, /data-academy-export/);
  assert.match(source, /data-academy-import/);
  assert.match(source, /format: "kitn-academy-progress"/);
  assert.match(source, /URL\.createObjectURL\(blob\)/);
  assert.match(source, /await file\.text\(\)/);
  assert.match(source, /mergeAcademyProgress\(quizAnswers, imported, ACADEMY_TRACKS\[lang\]\)/);
});

test("Academy displays a cross-track learning progress overview", () => {
  assert.match(source, /getAcademyProgressSummary\(tracks, quizAnswers\)/);
  assert.match(source, /academy-progress-overview/);
  assert.match(source, /academyProgressSummary\.tracks\.map/);
  assert.match(source, /data-academy-progress-idx=/);
  assert.ok(source.includes('querySelectorAll("[data-academy-progress-idx]")'));
  assert.ok(source.includes('selectedAcademyIndex = Number(btn.getAttribute("data-academy-progress-idx"))'));
  assert.match(styles, /\.academy-progress-overview\s*\{/);
  assert.match(styles, /\.academy-progress-track\s*>\s*span\s*\{/);
});

test("Academy quiz progress persists locally and can be reset per track", () => {
  assert.match(source, /const ACADEMY_PROGRESS_KEY = "kitn_academy_progress_v1"/);
  assert.match(source, /let quizAnswers = loadAcademyProgress\(\)/);
  assert.match(source, /saveJsonStorage\(ACADEMY_PROGRESS_KEY, quizAnswers\)/);
  assert.match(source, /data-quiz-reset/);
  assert.match(source, /!key\.startsWith\(\x60\$\{trackId\}:\x60\)/);
});

test("homepage uses the independently tested balanced discovery selector", () => {
  assert.match(source, /import \{ getHomeFeaturedItems \} from "\.\/home-discovery\.js"/);
  assert.match(source, /getHomeFeaturedItems\(visibleItems, \{ getSpace: resolveItemSpace, getKey: getItemKey, limit: 5 \}\)/);
  assert.match(source, /spaces\.find\(\(space\) => space\.id === resolveItemSpace\(item\)\)\?\.label/);
});

test("publication pages recommend related knowledge across KITN spaces", () => {
  assert.match(source, /function getRelatedKnowledgeItems\(item, limit = 3\)/);
  assert.match(source, /findRelatedKnowledgeItems\(indexItems, item/);
  assert.match(source, /const relatedItems = getRelatedKnowledgeItems\(item\)/);
  assert.match(source, /related-knowledge-grid/);
  assert.match(source, /data-open-home-item=/);
  assert.match(knowledgeSource, /candidateSpace !== sourceSpace/);
  assert.match(knowledgeSource, /crossSpace \? 3 : 0/);
  assert.match(knowledgeSource, /sharedTerms,\\s*crossSpace/);
  assert.ok(source.includes("relatedItems.map(({ item: related, crossSpace, sharedTerms })"));
  assert.match(source, /Thèmes communs : /);
  assert.match(source, /sharedTerms\.slice\(0, 3\)\.join\(" · "\)/);
  assert.match(styles, /\.related-knowledge-grid\s*\{/);
  assert.match(styles, /\.related-knowledge-card\s*\{/);
});


test("global statistical indicator search uses accent-insensitive token matching", () => {
  assert.match(source, /return matchesSearchQuery\(searchable, globalQuery\)/);
  assert.match(source, /const globalQuery = normalizeSearchText\(searchQuery\)/);
});


test("document detail modal lets readers follow a related item into its full page", () => {
  const modal = source.slice(source.indexOf("function renderModal"), source.indexOf("function renderResults"));
  assert.match(modal, /const relatedItems = getRelatedKnowledgeItems\(item\)/);
  assert.match(modal, /data-related-item=/);
  assert.match(modal, /modal\.querySelectorAll\("\[data-related-item\]"\)/);
  assert.match(modal, /activeArticleId = key/);
});
