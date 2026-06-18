// Google Autocomplete — free keyword discovery for the template.
// Mines suggestqueries.google.com for seed keywords (services + areas from
// Sanity + ahrefs-config). Output: frontend/seo/data/autocomplete-YYYY-MM-DD.json
//
// Usage:
//   node frontend/seo/google-autocomplete.mjs

import fs from "node:fs";
import path from "node:path";
import { getServices, getAreas, getNAPRecord } from "./_sanity-seo-data.mjs";
import { TARGET, COMPETITORS, PRIORITY_KEYWORDS, getTarget } from "./ahrefs-config.mjs";
import { DATA_DIR } from "./seo-paths.mjs";

const OUT_DIR = path.join(DATA_DIR, "autocomplete");
fs.mkdirSync(OUT_DIR, { recursive: true });
const DATE = new Date().toISOString().slice(0, 10);

const domain = (await getTarget()) || TARGET || "unknown";
const services = await getServices();
const areas = await getAreas();
const nap = await getNAPRecord();

// ─── Helpers ────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function googleSuggest(query) {
  const url = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text);
    return (json[1] || []).map((s) => String(s).trim().toLowerCase()).filter(Boolean);
  } catch {
    return [];
  }
}

function categorize(query) {
  const q = query.toLowerCase();
  if (/^(how|what|why|can|do|is|are|does|should|will|who|when)\b/.test(q)) return "Question";
  if (/\b(cost|price|quote|pricing|how much|expensive|cheap)\b/.test(q)) return "Pricing";
  if (/\b(best|top|vs|versus|or|comparison|review|rating)\b/.test(q)) return "Comparison";
  if (/\b(near me|local|close by|nearby)\b/.test(q)) return "Local Intent";
  if (/\b(emergency|24 hour|24hr|urgent|immediate|same day|out of hours)\b/.test(q)) return "Emergency";
  return "General";
}

// ─── Build seeds ─────────────────────────────────────────────────────────────
console.log(`[autocomplete] ${nap?.businessName || domain} — ${domain}`);
console.log(`[autocomplete] Building seed keywords...`);

const seeds = new Set();

// Seed 1: Services from Sanity
const svcNames = new Set((services || []).map((s) => s.name.toLowerCase()));
for (const svc of svcNames) {
  seeds.add(svc);
  seeds.add(`${svc} near me`);
  seeds.add(`best ${svc}`);
  seeds.add(`${svc} cost`);
}

// Seed 2: Areas from Sanity
const areaNames = new Set((areas || []).map((a) => a.name.toLowerCase()));
const cityLower = (nap?.city || "").toLowerCase();
if (cityLower) areaNames.add(cityLower);

// Seed 3: Service+area combos (top 5 × top 8)
for (const svc of [...svcNames].slice(0, 5)) {
  for (const area of [...areaNames].slice(0, 8)) {
    seeds.add(`${svc} ${area}`);
    seeds.add(`${svc} in ${area}`);
  }
}

// Seed 4: Priority keywords from ahrefs-config
for (const { keyword, location } of (PRIORITY_KEYWORDS || [])) {
  seeds.add(keyword);
  if (location && location !== "United Kingdom") {
    const town = location.split(",")[0].trim();
    seeds.add(`${keyword} ${town}`);
    seeds.add(`${keyword} in ${town}`);
  }
}

// Seed 5: Modifiers for top services
const prefixes = ["best", "local", "emergency", "affordable", "reliable", "24 hour"];
const suffixes = ["near me", "cost", "price", "reviews", "quote"];
for (const svc of [...svcNames].slice(0, 4)) {
  for (const p of prefixes) seeds.add(`${p} ${svc}`);
  for (const s of suffixes) seeds.add(`${svc} ${s}`);
}

// Seed 6: Question starters for FAQ mining
const qStarts = ["how much does", "how to", "what is", "can i", "do i need", "how long does"];
for (const qs of qStarts) {
  for (const svc of [...svcNames].slice(0, 3)) {
    seeds.add(`${qs} ${svc}`);
  }
}

// Seed 7: Competitor-driven queries
for (const comp of (COMPETITORS || []).slice(0, 3)) {
  const compName = comp.replace(/\..*/, "").replace(/-/g, " ").toLowerCase();
  if (compName.length > 3) seeds.add(`${compName} reviews`);
}

const seedList = [...seeds].filter((s) => s.length >= 4).slice(0, 250);
console.log(`[autocomplete] ${seedList.length} seed queries prepared`);

// ─── Fetch suggestions ──────────────────────────────────────────────────────
const allResults = new Map();
const seen = new Set();

for (const [i, seed] of seedList.entries()) {
  console.log(`[autocomplete] ${i + 1}/${seedList.length}: "${seed}"`);
  const suggestions = await googleSuggest(seed);
  for (const s of suggestions) {
    if (seen.has(s)) continue;
    seen.add(s);
    allResults.set(s, { query: s, category: categorize(s), seed });
  }
  if (i < seedList.length - 1) await sleep(150);
}

// Stage 2: cascade — feed best suggestions back deeper
const topSuggestions = [...allResults.values()]
  .filter((r) => r.category !== "General")
  .slice(0, 20);

console.log(`[autocomplete] Stage 2: mining ${topSuggestions.length} top suggestions deeper...`);
for (const [i, item] of topSuggestions.entries()) {
  const deeper = await googleSuggest(item.query);
  for (const s of deeper) {
    if (seen.has(s)) continue;
    seen.add(s);
    allResults.set(s, { query: s, category: categorize(s), seed: item.query });
  }
  if (i < topSuggestions.length - 1) await sleep(150);
}

// ─── Organize ───────────────────────────────────────────────────────────────
const results = [...allResults.values()];
const categories = {};
for (const r of results) {
  if (!categories[r.category]) categories[r.category] = [];
  categories[r.category].push(r);
}
for (const cat of Object.keys(categories)) {
  categories[cat].sort((a, b) => a.query.localeCompare(b.query));
}

const topQuestions = (categories["Question"] || []).slice(0, 30).map((r) => r.query);
const topLocal = (categories["Local Intent"] || []).slice(0, 20).map((r) => r.query);
const topEmergency = (categories["Emergency"] || []).slice(0, 10).map((r) => r.query);
const topPricing = (categories["Pricing"] || []).slice(0, 15).map((r) => r.query);
const topComparison = (categories["Comparison"] || []).slice(0, 15).map((r) => r.query);

const output = {
  date: DATE,
  domain,
  seeds_queried: seedList.length,
  total_suggestions: results.length,
  categories: Object.fromEntries(Object.entries(categories).map(([k, v]) => [k, v.length])),
  top_questions: topQuestions,
  top_local_intent: topLocal,
  top_emergency: topEmergency,
  top_pricing: topPricing,
  top_comparison: topComparison,
  all: results,
};

const outFile = path.join(OUT_DIR, `autocomplete-${DATE}.json`);
fs.writeFileSync(outFile, JSON.stringify(output, null, 2));

console.log(`\n[autocomplete] Done — ${results.length} unique suggestions`);
console.log(`[autocomplete] Categories:`);
for (const [cat, count] of Object.entries(output.categories)) {
  console.log(`  ${cat}: ${count}`);
}
console.log(`\n[autocomplete] Top questions for FAQ content:`);
for (const q of topQuestions.slice(0, 8)) console.log(`  • ${q}`);
console.log(`\n[autocomplete] Output: ${outFile}`);
