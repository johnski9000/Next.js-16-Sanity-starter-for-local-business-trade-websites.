// DataForSEO keyword-difficulty enrichment for the phase-2 candidate queries.
//
// Reads the GSC query export, selects the candidates phase2 cares about (queries
// with real impressions sitting in striking distance / proven-authority range),
// and fetches their keyword difficulty in one Labs bulk call. Writes a KD cache
// that analyse-gsc-phase2.mjs reads — so the analyser never calls an API itself.
//
// Optional + non-fatal: with no DATAFORSEO_LOGIN/PASSWORD it writes an empty cache
// and exits 0 (phase2 then routes purely on position, KD shown as "—").
//
//   node frontend/seo/dataforseo-kd.mjs
//
// Creds (.env / .env.local): DATAFORSEO_LOGIN + DATAFORSEO_PASSWORD.
// Market: DATAFORSEO_LOCATION (default 2826 = United Kingdom) + DATAFORSEO_LANGUAGE (default "en").
import fs from "node:fs";
import path from "node:path";
import { GSC_QUERIES_EXPORT, GSC_KD_CACHE, ensureDir, readJsonSafe } from "./seo-paths.mjs";

function loadEnv() {
  const env = { ...process.env };
  for (const file of [".env.local", ".env"]) {
    try {
      for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (m && !env[m[1]]) env[m[1]] = m[2].replace(/\s+#.*$/, "").trim().replace(/^["']|["']$/g, "");
      }
    } catch {}
  }
  return env;
}
const env = loadEnv();

const LOGIN = env.DATAFORSEO_LOGIN;
const PASSWORD = env.DATAFORSEO_PASSWORD;
const LOCATION = Number(env.DATAFORSEO_LOCATION || 2826); // United Kingdom
const LANGUAGE = env.DATAFORSEO_LANGUAGE || "en";
const MAX_KEYWORDS = 200; // cap the bulk call — keeps cost ~1 call / a few pennies

const lc = (s) => String(s || "").toLowerCase().trim();

function writeCache(kd) {
  ensureDir(path.dirname(GSC_KD_CACHE));
  const out = { fetchedAt: new Date().toISOString(), location: LOCATION, language: LANGUAGE, kd };
  fs.writeFileSync(GSC_KD_CACHE, JSON.stringify(out, null, 2), "utf8");
  return Object.keys(kd).length;
}

if (!LOGIN || !PASSWORD) {
  writeCache({});
  console.log("· DataForSEO KD: no DATAFORSEO_LOGIN/PASSWORD — wrote empty KD cache (phase2 routes on position only).");
  process.exit(0);
}

// Load candidate queries: real impressions, sitting in proven-authority (≤7) or
// striking-distance (≤25) range — the superset all four phase-2 checks need.
const raw = readJsonSafe(GSC_QUERIES_EXPORT);
if (!raw || !Array.isArray(raw.rows) || raw.rows.length === 0) {
  writeCache({});
  console.log(`No GSC query export at ${GSC_QUERIES_EXPORT.replace(/\\/g, "/")} — wrote empty KD cache. Run gsc-query.mjs first.`);
  process.exit(0);
}

const MIN_IMPR = 10;
const candidates = [
  ...new Set(
    raw.rows
      .map((r) => ({ q: lc(r.keys?.[0]), impr: Number(r.impressions || 0), pos: Number(r.position || 0) }))
      .filter((r) => r.q && r.impr >= MIN_IMPR && r.pos > 0 && r.pos <= 25)
      .sort((a, b) => b.impr - a.impr)
      .slice(0, MAX_KEYWORDS)
      .map((r) => r.q),
  ),
];

if (!candidates.length) {
  writeCache({});
  console.log("· DataForSEO KD: no in-range candidate queries — wrote empty KD cache.");
  process.exit(0);
}

const AUTH = "Basic " + Buffer.from(`${LOGIN}:${PASSWORD}`).toString("base64");
async function dfs(endpoint, payload) {
  const res = await fetch(`https://api.dataforseo.com/v3/${endpoint}`, {
    method: "POST",
    headers: { Authorization: AUTH, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  const task = json.tasks?.[0];
  if (!res.ok || (json.status_code && json.status_code >= 40000) || (task?.status_code && task.status_code >= 40000)) {
    throw new Error(
      `${endpoint} → ${task?.status_code || json.status_code || res.status}: ${(task?.status_message || json.status_message || "request failed").slice(0, 160)}`,
    );
  }
  return task?.result || [];
}

const kd = {};
try {
  // Labs nests rows under result[0].items (a known DataForSEO shape gotcha).
  const dr = await dfs("dataforseo_labs/google/bulk_keyword_difficulty/live", [
    { keywords: candidates, location_code: LOCATION, language_code: LANGUAGE },
  ]);
  for (const it of dr[0]?.items || []) {
    if (it?.keyword != null) kd[lc(it.keyword)] = it.keyword_difficulty ?? null;
  }
} catch (e) {
  writeCache(kd);
  console.warn(`⚠ DataForSEO KD enrichment failed (${String(e.message || e).slice(0, 140)}) — wrote ${Object.keys(kd).length} cached so far.`);
  process.exit(0);
}

const n = writeCache(kd);
console.log(`Wrote ${GSC_KD_CACHE.replace(/\\/g, "/")} (${n} keyword difficulties, location ${LOCATION}, lang ${LANGUAGE}).`);
