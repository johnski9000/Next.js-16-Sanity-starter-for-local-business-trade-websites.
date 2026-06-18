// SERP research for the per-page content briefs (DataForSEO SERP API).
//
// For each page it pulls the live Google SERP and extracts:
//   • PRIMARY keyword → top organic domains (competitor candidates) + local-pack signal;
//   • a QUESTION seed (service/home pages) → the real "People Also Ask", merged into the
//     brief's `questions` for FAQs. We query a question seed because the commercial primary
//     (e.g. "plumber altrincham") shows a LOCAL PACK, not PAA — PAA fires on question queries.
//
// The discovered competitors are tallied to serp-competitors.json (seed for the monthly
// Ahrefs gap). Optional, cheap, CAPPED. Runs AFTER research-brief.mjs (and after
// dataforseo-volume.mjs, so it seeds the promoted primary). ADDITIVE.
//
// Usage (from REPO ROOT):
//   node scripts/dataforseo-serp.mjs <key> [--site https://client.co.uk] [--briefs <dir>]
//
// Creds (.env / frontend/.env): DATAFORSEO_LOGIN + DATAFORSEO_PASSWORD.
//   No creds → clean no-op (briefs keep their autocomplete PAA proxy; exit 0).
// Config: DATAFORSEO_LOCATION_CODE (default 2826 = United Kingdom),
//         DATAFORSEO_LANGUAGE_CODE (default "en").

import fs from "node:fs";
import path from "node:path";

import { loadEnv } from "./lib/load-env.mjs";

const env = loadEnv();
const args = process.argv.slice(2);
// Slugify the key the SAME way research-brief.mjs does, so content-briefs/<key> lines up.
const rawKey = args.find((a) => !a.startsWith("--"));
const key = rawKey ? rawKey.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : rawKey;
const get = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const briefsDir = get("--briefs") || (key ? path.join("frontend", "seo", "data", "content-briefs", key) : null);
const site = get("--site");

if (!briefsDir) {
  console.error("Usage: node scripts/dataforseo-serp.mjs <key> [--site <url>] [--briefs <dir>]");
  process.exit(1);
}

const LOGIN = env.DATAFORSEO_LOGIN;
const PASSWORD = env.DATAFORSEO_PASSWORD;
if (!LOGIN || !PASSWORD) {
  console.log(
    "· DataForSEO SERP: no DATAFORSEO_LOGIN/PASSWORD set — skipping SERP research " +
      "(briefs keep their autocomplete PAA proxy).",
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
const MAX_KEYWORDS = 40;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lc = (s) => String(s || "").toLowerCase().trim();

// Directories / aggregators / socials are NOT competitors you'd gap against — drop them.
const DIRECTORY_DOMAINS = new Set([
  "yell.com", "checkatrade.com", "trustatrader.com", "mybuilder.com", "ratedpeople.com", "bark.com",
  "trustpilot.com", "facebook.com", "instagram.com", "linkedin.com", "x.com", "twitter.com", "youtube.com",
  "google.com", "g.co", "yelp.com", "yelp.co.uk", "thomsonlocal.com", "192.com", "scoot.co.uk",
  "freeindex.co.uk", "threebestrated.co.uk", "cylex-uk.co.uk", "which.co.uk", "trustedtraders.which.co.uk",
  "gov.uk", "nhs.uk", "reddit.com", "indeed.com", "glassdoor.co.uk", "wikipedia.org", "houzz.co.uk", "trustmark.org.uk",
]);
const bareDomain = (d) => lc(d).replace(/^www\./, "");
const registrable = (u) => {
  try {
    return bareDomain(new URL(u.startsWith("http") ? u : `https://${u}`).hostname);
  } catch {
    return null;
  }
};
const selfDomain = site ? registrable(site) : null;

const files = fs.readdirSync(briefsDir).filter((f) => f.endsWith(".json") && f !== "index.json");
const briefs = files.map((f) => ({ f, data: JSON.parse(fs.readFileSync(path.join(briefsDir, f), "utf8")) }));
const briefByFile = Object.fromEntries(briefs.map((b) => [b.f, b]));

// Build SERP assignments: every page's PRIMARY (competitors + local pack + any PAA), plus a
// QUESTION seed for service/home pages (PAA reliably shows on question queries).
const assignments = []; // { file, role: 'primary' | 'question', keyword }
const uniq = new Map(); // keyword -> task object
const addTask = (kw) => {
  if (!uniq.has(kw)) uniq.set(kw, { keyword: kw, location_code: LOCATION, language_code: LANGUAGE, depth: 20 });
};
for (const b of briefs) {
  const primary = lc((b.data.targetKeywords || [])[0]);
  if (primary) {
    assignments.push({ file: b.f, role: "primary", keyword: primary });
    addTask(primary);
  }
  if (b.data.page === "service" || b.data.page === "home") {
    let q = lc((b.data.questions || [])[0]);
    if (!q && primary) q = `how much does ${primary} cost`;
    if (q) {
      assignments.push({ file: b.f, role: "question", keyword: q });
      addTask(q);
    }
  }
}
const kwTasks = [...uniq.values()].slice(0, MAX_KEYWORDS);
if (uniq.size > kwTasks.length) console.log(`  (capping SERP at ${kwTasks.length} of ${uniq.size} keywords)`);
if (!kwTasks.length) {
  console.log("· DataForSEO SERP: no keywords in briefs — nothing to research.");
  process.exit(0);
}

console.log(`DataForSEO SERP — ${kwTasks.length} keyword(s), location ${LOCATION}, lang ${LANGUAGE} (one request each)`);

// live/advanced wants ONE task per POST — batching many returns status 40000 for every task
// after the first. So fetch each keyword individually, tolerate failures, throttle gently.
const byKw = {};
let okCount = 0;
let failCount = 0;
for (const [i, task] of kwTasks.entries()) {
  try {
    const res = await fetch("https://api.dataforseo.com/v3/serp/google/organic/live/advanced", {
      method: "POST",
      headers: { Authorization: AUTH, "Content-Type": "application/json" },
      body: JSON.stringify([task]),
    });
    const json = await res.json();
    const t0 = json.tasks?.[0];
    const r = t0?.result?.[0];
    if (!res.ok || (t0?.status_code && t0.status_code >= 40000) || !r) {
      failCount++;
    } else {
      const paa = [];
      const domains = [];
      let localPack = false;
      for (const it of r.items || []) {
        if (it.type === "organic" && it.domain) domains.push(bareDomain(it.domain));
        else if (it.type === "people_also_ask") {
          for (const q of it.items || []) if (q.title) paa.push(String(q.title).trim());
        } else if (it.type === "local_pack") localPack = true;
      }
      byKw[lc(r.keyword || task.keyword)] = { paa, domains, localPack };
      okCount++;
    }
  } catch {
    failCount++;
  }
  if (i < kwTasks.length - 1) await sleep(120);
}
if (!okCount) {
  console.error("All SERP requests failed (check DataForSEO balance / SERP API access).");
  process.exit(1);
}
if (failCount > kwTasks.length / 2) {
  console.warn(`⚠ ${failCount}/${kwTasks.length} SERP requests failed — likely balance/rate-limit; competitor + PAA data is partial.`);
} else if (failCount) {
  console.log(`  (${failCount}/${kwTasks.length} keyword(s) returned no SERP — skipped)`);
}

// Apply assignments to the briefs in memory.
const competitorTally = {};
let paaAdded = 0;
const mergeQuestions = (data, paa) => {
  const existing = new Set((data.questions || []).map(lc));
  let before = (data.questions || []).length;
  const merged = [...(data.questions || [])];
  for (const q of paa) {
    const n = lc(q);
    if (n && !existing.has(n)) {
      merged.push(q);
      existing.add(n);
    }
  }
  data.questions = merged.slice(0, 10);
  if (data.questions.length > before) paaAdded += data.questions.length - before;
};
for (const a of assignments) {
  const r = byKw[a.keyword];
  if (!r) continue;
  const b = briefByFile[a.file];
  if (!b) continue;
  mergeQuestions(b.data, r.paa);
  if (a.role === "primary") {
    b.data.serp = { localPack: r.localPack, topDomains: r.domains.slice(0, 5) };
    for (const d of r.domains.slice(0, 10)) {
      if (!d || DIRECTORY_DOMAINS.has(d) || d === selfDomain) continue;
      competitorTally[d] = (competitorTally[d] || 0) + 1;
    }
  }
}

let enriched = 0;
for (const b of briefs) {
  fs.writeFileSync(path.join(briefsDir, b.f), JSON.stringify(b.data, null, 2));
  if (b.data.serp) enriched++;
}

const competitors = Object.entries(competitorTally)
  .sort((a, b) => b[1] - a[1])
  .map(([domain, appearances]) => ({ domain, appearances }));
fs.writeFileSync(
  path.join(briefsDir, "serp-competitors.json"),
  JSON.stringify({ location: LOCATION, self: selfDomain, competitors }, null, 2),
);

const localPackPages = Object.values(byKw).filter((r) => r.localPack).length;
console.log(`✓ ${enriched} brief(s) enriched; +${paaAdded} real PAA question(s); local pack on ${localPackPages} keyword(s).`);
console.log("  Top local competitors (→ add to frontend/seo/ahrefs-config.mjs COMPETITORS for the monthly gap):");
for (const c of competitors.slice(0, 8)) console.log(`    ${c.domain}  (${c.appearances}×)`);
if (!competitors.length) console.log("    (none found above the directory denylist)");
console.log(`  Full list: ${path.join(briefsDir, "serp-competitors.json")}`);
