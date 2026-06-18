// Enrich per-page content briefs with REAL keyword metrics from DataForSEO:
//   • search VOLUME (Google Ads) + keyword DIFFICULTY (Labs) on every candidate;
//   • keyword SUGGESTIONS (Labs) seeded from each page's primary — discovers the real
//     searched variants (with volume + difficulty), so a page seeded with a zero-volume
//     marketing name still gets searchable targets;
//   • a winnability `byPriority` list (volume weighted by 100-KD);
//   • PRIMARY PROMOTION — when a page's primary keyword has no/zero volume, the gated
//     primary (targetKeywords[0]) is swapped for the best searched variant.
//
// Optional, cheap (pay-as-you-go), CAPPED to the briefs' keywords (never a crawl). Runs
// AFTER research-brief.mjs, BEFORE dataforseo-serp.mjs (so SERP seeds the promoted primary).
//
// Usage (from REPO ROOT):
//   node scripts/dataforseo-volume.mjs <key> [--briefs frontend/seo/data/content-briefs/<key>]
//
// Creds (.env / frontend/.env): DATAFORSEO_LOGIN + DATAFORSEO_PASSWORD.
//   No creds → clean no-op (briefs keep their free-autocomplete keywords; exit 0).
// Config: DATAFORSEO_LOCATION_CODE (default 2826 = United Kingdom),
//         DATAFORSEO_LANGUAGE_CODE (default "en").

import fs from "node:fs";
import path from "node:path";

import { loadEnv } from "./lib/load-env.mjs";

const env = loadEnv();
const args = process.argv.slice(2);
// Slugify the key the SAME way research-brief.mjs does, so content-briefs/<key> lines up
// even if a non-kebab key is passed (onboard already passes a kebab-case tenant key).
const rawKey = args.find((a) => !a.startsWith("--"));
const key = rawKey ? rawKey.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : rawKey;
const bi = args.indexOf("--briefs");
const briefsDir =
  bi >= 0 ? args[bi + 1] : key ? path.join("frontend", "seo", "data", "content-briefs", key) : null;

if (!briefsDir) {
  console.error("Usage: node scripts/dataforseo-volume.mjs <key> [--briefs <dir>]");
  process.exit(1);
}

const LOGIN = env.DATAFORSEO_LOGIN;
const PASSWORD = env.DATAFORSEO_PASSWORD;
// Optional by design: no creds → keep the free-autocomplete keywords and exit cleanly
// (BEFORE touching the filesystem), so onboard.mjs can always run this step.
if (!LOGIN || !PASSWORD) {
  console.log(
    "· DataForSEO: no DATAFORSEO_LOGIN/PASSWORD set — skipping volume/difficulty enrichment " +
      "(briefs keep their free-autocomplete keywords).",
  );
  process.exit(0);
}

if (!fs.existsSync(briefsDir)) {
  console.error(`Briefs dir not found: ${briefsDir} — run research-brief.mjs first.`);
  process.exit(1);
}

const LOCATION = Number(env.DATAFORSEO_LOCATION_CODE || 2826); // 2826 = United Kingdom
const LANGUAGE = env.DATAFORSEO_LANGUAGE_CODE || "en";
const AUTH = "Basic " + Buffer.from(`${LOGIN}:${PASSWORD}`).toString("base64");
const MAX_SEED_CALLS = 40; // cap keyword-suggestion calls (one live call per seed)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lc = (s) => String(s || "").toLowerCase().trim();

async function dfs(endpoint, payload) {
  const res = await fetch(`https://api.dataforseo.com/v3/${endpoint}`, {
    method: "POST",
    headers: { Authorization: AUTH, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  const task = json.tasks?.[0];
  // DataForSEO returns 200 with an envelope status_code AND a per-task status_code. A
  // task-level error (e.g. 40402 insufficient funds, rate-limit) must NOT look like a
  // successful empty result, or a drained account would silently enrich nothing.
  if (!res.ok || (json.status_code && json.status_code >= 40000) || (task?.status_code && task.status_code >= 40000)) {
    throw new Error(
      `${endpoint} → ${task?.status_code || json.status_code || res.status}: ${(task?.status_message || json.status_message || "request failed").slice(0, 160)}`,
    );
  }
  return task?.result || [];
}

const files = fs.readdirSync(briefsDir).filter((f) => f.endsWith(".json") && f !== "index.json");
if (!files.length) {
  console.error(`No page briefs in ${briefsDir}.`);
  process.exit(1);
}
// Process core pages (home/service/area) before combos so the suggestion-call cap can't
// be eaten by combo--* pages (which sort first alphabetically).
const pageOrder = (f) => (f.startsWith("home") ? 0 : f.startsWith("service--") ? 1 : f.startsWith("area--") ? 2 : 3);
const briefs = files
  .sort((a, b) => pageOrder(a) - pageOrder(b))
  .map((f) => ({ f, data: JSON.parse(fs.readFileSync(path.join(briefsDir, f), "utf8")) }));

// Existing candidate keywords (template + autocomplete) across all pages.
const volumes = {};
const difficulty = {};
const allKw = [
  ...new Set(briefs.flatMap((b) => b.data.targetKeywords || []).map(lc).filter(Boolean)),
].slice(0, 1000);
if (!allKw.length) {
  console.log("· DataForSEO: no candidate keywords in briefs — nothing to enrich.");
  process.exit(0);
}

console.log(`DataForSEO metrics — ${allKw.length} keyword(s), location ${LOCATION}, lang ${LANGUAGE}`);

try {
  // 1) Search volume (Google Ads) — the core; fatal if it fails.
  for (const it of await dfs("keywords_data/google_ads/search_volume/live", [
    { keywords: allKw, location_code: LOCATION, language_code: LANGUAGE },
  ])) {
    if (it?.keyword != null) volumes[lc(it.keyword)] = it.search_volume ?? null;
  }
} catch (e) {
  console.error(`DataForSEO search-volume failed: ${String(e.message || e).slice(0, 180)}`);
  process.exit(1);
}
try {
  // 2) Keyword difficulty (Labs, 0-100) — NON-fatal. Labs nests rows under result[0].items.
  const dr = await dfs("dataforseo_labs/google/bulk_keyword_difficulty/live", [
    { keywords: allKw, location_code: LOCATION, language_code: LANGUAGE },
  ]);
  for (const it of dr[0]?.items || []) {
    if (it?.keyword != null) difficulty[lc(it.keyword)] = it.keyword_difficulty ?? null;
  }
} catch (e) {
  console.warn(`⚠ DataForSEO difficulty unavailable (${String(e.message || e).slice(0, 120)}) — continuing with volume only.`);
}

// 3) Keyword SUGGESTIONS seeded from each page's primary — real searched variants WITH
// volume + difficulty (Labs nests rows under result[0].items). One live call per seed,
// sequential + tolerant. When the primary is a dead (no-volume) marketing name, fall back
// to a cleaned core seed so suggestions still surface searched variants.
const cleanSeed = (s) =>
  s
    .replace(/\b(premium|luxury|bespoke|professional|expert|quality|affordable|trusted|local|reliable|complete|full|specialist)\b/gi, " ")
    .replace(/\s*&.*$/, " ") // drop "& heating upgrades" etc.
    .replace(/\s+/g, " ")
    .trim();

const fetchSugg = async (seed) => {
  try {
    const r = await dfs("dataforseo_labs/google/keyword_suggestions/live", [
      { keyword: seed, location_code: LOCATION, language_code: LANGUAGE, limit: 25 },
    ]);
    return (r[0]?.items || [])
      .map((it) => ({
        keyword: lc(it.keyword),
        volume: it.keyword_info?.search_volume ?? null,
        difficulty: it.keyword_properties?.keyword_difficulty ?? null,
      }))
      .filter((s) => s.keyword && typeof s.volume === "number" && s.volume > 0)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);
  } catch {
    return [];
  }
};

const suggByFile = {};
let calls = 0;
for (const { f, data } of briefs) {
  if (calls >= MAX_SEED_CALLS) break;
  const primary = lc((data.targetKeywords || [])[0]);
  if (!primary) continue;
  const seedList = [primary];
  const primaryDead = volumes[primary] == null || volumes[primary] === 0;
  if (primaryDead) {
    const alt = cleanSeed(primary);
    if (alt && alt !== primary && alt.length >= 3) seedList.push(alt);
  }
  let sugg = [];
  for (const seed of seedList) {
    sugg = await fetchSugg(seed);
    calls++;
    await sleep(120);
    if (sugg.length || calls >= MAX_SEED_CALLS) break;
  }
  suggByFile[f] = sugg;
  for (const s of sugg) {
    if (volumes[s.keyword] == null) volumes[s.keyword] = s.volume;
    if (difficulty[s.keyword] == null) difficulty[s.keyword] = s.difficulty;
  }
}
if (calls >= MAX_SEED_CALLS) {
  console.warn(`⚠ suggestion cap (${MAX_SEED_CALLS} calls) reached — later pages got no suggestions/promotion (core pages processed first).`);
}

// Winnability priority: volume weighted by (100 - difficulty). Unknown KD → no penalty
// (use volume); unknown volume → 0. Raw volume/difficulty kept so the agent can judge.
const scoreOf = (vol, kd) => {
  if (vol == null) return 0;
  if (kd == null) return vol;
  return Math.round((vol * (100 - kd)) / 100);
};

let enriched = 0;
const promotions = [];
for (const { f, data } of briefs) {
  // Candidate set = this page's targetKeywords + its discovered suggestions.
  const cand = new Set((data.targetKeywords || []).map(lc).filter(Boolean));
  for (const s of suggByFile[f] || []) cand.add(s.keyword);
  const metrics = {};
  for (const k of cand) metrics[k] = { volume: volumes[k] ?? null, difficulty: difficulty[k] ?? null };
  data.keywordMetrics = metrics;
  data.byPriority = Object.entries(metrics)
    .map(([keyword, m]) => ({ keyword, volume: m.volume, difficulty: m.difficulty, score: scoreOf(m.volume, m.difficulty) }))
    .sort((a, b) => b.score - a.score);

  // PRIMARY PROMOTION — if the page's primary has no/zero volume but a searched variant
  // exists, make that variant the gated primary (targetKeywords[0]). Keeps the old terms
  // in the array, just demoted. Only fires on a genuinely dead primary.
  const primary = lc((data.targetKeywords || [])[0]);
  const primaryVol = metrics[primary]?.volume;
  if (primaryVol == null || primaryVol === 0) {
    // On-intent guard so promotion never picks an over-broad head term (e.g. bare
    // "bathroom" off "bathroom design") or an off-geo term for an area page.
    const coreTokens = cleanSeed(primary).split(" ").filter((t) => t.length >= 4);
    const areaToks = (data.page === "area" ? lc(data.facts?.area || "") : "").split(/\s+/).filter((t) => t.length >= 4);
    const onIntent = (kw) => {
      // Area pages: the promoted term must still name the area — match ANY area token, so a
      // multi-word area like "Didsbury Village" still allows the shorter "plumber didsbury".
      if (data.page === "area") return areaToks.length > 0 && areaToks.some((t) => kw.includes(t));
      // Other pages: a real ≥2-word term sharing a core token of the primary. If the primary
      // cleaned to nothing (all-adjective marketing name) we can't verify intent — don't
      // promote (keep the original rather than risk an off-topic head term).
      if (!coreTokens.length) return false;
      return kw.split(/\s+/).filter(Boolean).length >= 2 && coreTokens.some((t) => kw.includes(t));
    };
    const best = data.byPriority.find(
      (c) => typeof c.volume === "number" && c.volume > 0 && c.keyword !== primary && onIntent(c.keyword),
    );
    if (best) {
      const rest = [...new Set((data.targetKeywords || []).map(lc))].filter((k) => k !== best.keyword);
      data.targetKeywords = [best.keyword, ...rest];
      promotions.push(`${data.title || f}: "${primary}" → "${best.keyword}" (${best.volume}/mo)`);
    }
  }

  fs.writeFileSync(path.join(briefsDir, f), JSON.stringify(data, null, 2));
  enriched++;
}

const known = Object.values(volumes).filter((v) => typeof v === "number").length;
const kdKnown = Object.values(difficulty).filter((v) => typeof v === "number").length;
if (known === 0) {
  console.warn("⚠ No search volume returned for ANY keyword — check DataForSEO balance/access. Briefs keep their free-autocomplete keywords.");
}
console.log(`✓ enriched ${enriched} brief(s); volume for ${known}, difficulty for ${kdKnown} keyword(s); ${calls} suggestion call(s).`);
if (promotions.length) {
  console.log(`  Promoted ${promotions.length} dead primary keyword(s) to searched terms:`);
  for (const p of promotions.slice(0, 6)) console.log(`    ${p}`);
}
console.log("  Authoring: targetKeywords[0] is the gated H1 (promoted to a searched term where needed); byPriority[] ranks candidates by winnability for supporting copy.");
