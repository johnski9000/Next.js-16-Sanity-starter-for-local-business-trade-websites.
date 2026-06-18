// GSC Search Analytics query tool. Reads creds from env or ./.env.local / ./.env.
//
// GSC property auto-detection: a site can be verified as a URL-prefix property
// (https://www.example.com/) OR a Domain property (sc-domain:example.com). This
// tool lists the account's verified properties and uses whichever matches the
// domain in GSC_SITE_URL — and falls back to trying both forms at query time —
// so you don't have to know which kind the client set up.
//
// Modes:
//   node frontend/seo/gsc-query.mjs
//       Default. Pulls the standard 90-day page-level window and writes it to
//       the canonical export (frontend/seo/data/gsc/gsc-pages-90d.json).
//   node frontend/seo/gsc-query.mjs --sites
//       Lists the verified GSC properties for these credentials.
//   node frontend/seo/gsc-query.mjs '<searchAnalytics requestBody JSON>'
//       Raw query — prints the API JSON to stdout.
import fs from "node:fs";
import path from "node:path";
import {
  GSC_EXPORT,
  GSC_QUERIES_EXPORT,
  GSC_QUERY_PAGE_EXPORT,
  GSC_QUERY_COUNTRY_EXPORT,
  ensureDir,
} from "./seo-paths.mjs";

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
for (const k of ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN", "GSC_SITE_URL"])
  if (!env[k]) { console.error(`Missing ${k} in .env.local / .env / environment`); process.exit(1); }

const tok = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token: env.GOOGLE_REFRESH_TOKEN, grant_type: "refresh_token",
  }),
}).then(r => r.ok ? r.json() : r.text().then(t => { throw new Error(`token: ${r.status} ${t}`); }))
  .then(j => j.access_token);

const arg = process.argv[2];

async function listSites() {
  const r = await fetch("https://www.googleapis.com/webmasters/v3/sites", { headers: { Authorization: `Bearer ${tok}` } });
  if (!r.ok) throw new Error(`sites: ${r.status} ${await r.text()}`);
  return (await r.json()).siteEntry || [];
}

if (arg === "--sites") {
  console.log(JSON.stringify(await listSites(), null, 2));
  process.exit(0);
}

// Reduce GSC_SITE_URL to a bare domain (no scheme, no www, no sc-domain: prefix).
function bareDomain(u) {
  const s = String(u).replace(/^sc-domain:/, "");
  try {
    return new URL(s.includes("://") ? s : `https://${s}`).hostname.replace(/^www\./, "");
  } catch {
    return s.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
  }
}

// Decide which property string(s) to query, preferring an exact match from the
// account's verified list, then the Domain property, then any URL-prefix for the
// same domain. If listing fails, fall back to trying the given URL then sc-domain.
async function resolveCandidates(want) {
  const dom = bareDomain(want);
  const scDomain = `sc-domain:${dom}`;
  try {
    const verified = (await listSites())
      .filter((s) => s.permissionLevel && s.permissionLevel !== "siteUnverifiedUser")
      .map((s) => s.siteUrl);
    if (verified.includes(want)) return [want];
    if (verified.includes(scDomain)) return [scDomain];
    const prefix = verified.find((s) => !s.startsWith("sc-domain:") && bareDomain(s) === dom);
    if (prefix) return [prefix];
    // domain present in neither form we recognise — try both anyway
  } catch {
    // listing unavailable — fall through to trying both forms
  }
  return [want, scDomain].filter((v, i, a) => a.indexOf(v) === i);
}

const candidates = await resolveCandidates(env.GSC_SITE_URL);

// Run a searchAnalytics query, trying each candidate property until one responds 2xx.
async function queryGsc(body) {
  let lastErr = "";
  for (const property of candidates) {
    const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`;
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body,
    });
    if (r.ok) return { property, json: await r.json() };
    lastErr = `${r.status} ${await r.text()}`;
  }
  throw new Error(`query failed for [${candidates.join(", ")}]: ${lastErr}`);
}

// Raw mode — caller supplied a request body. Print the API response verbatim.
if (arg) {
  try {
    const { property, json } = await queryGsc(arg);
    console.error(`(property: ${property})`);
    console.log(JSON.stringify(json));
    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

// Default mode — standard 90-day page-level pull, written to the canonical export.
function isoDaysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}
// GSC data lags ~2-3 days, so end the window 3 days back for complete data.
const endDate = isoDaysAgo(3);
const startDate = isoDaysAgo(3 + 90);

// Write a dimension export to disk in the canonical envelope shape.
function writeExport(filePath, property, dimensions, rows) {
  const out = { source: "gsc", property, dimensions, startDate, endDate, fetchedAt: new Date().toISOString(), rows: rows || [] };
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(out, null, 2), "utf8");
  return out.rows.length;
}

// 1) Page-level (core) — fatal if it fails; everything else is best-effort so a
// partial GSC permission/quota issue still leaves a usable page export.
let pageResult;
try {
  pageResult = await queryGsc(JSON.stringify({ startDate, endDate, dimensions: ["page"], rowLimit: 25000 }));
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
const property = pageResult.property;
const nPages = writeExport(GSC_EXPORT, property, ["page"], pageResult.json.rows || []);
console.log(`Wrote ${GSC_EXPORT.replace(/\\/g, "/")} (${nPages} pages, ${startDate} → ${endDate}, property: ${property})`);

// 2) Phase-2 query-level exports — non-fatal. Query (keyword position), query×page
// (cannibalisation), query×country (phantom-ranking check). Reuse the resolved
// property so all four exports describe the same window + site.
async function pullExport(label, dimensions, filePath, rowLimit) {
  try {
    const { json } = await queryGsc(JSON.stringify({ startDate, endDate, dimensions, rowLimit }));
    const n = writeExport(filePath, property, dimensions, json.rows || []);
    console.log(`Wrote ${filePath.replace(/\\/g, "/")} (${n} ${label})`);
  } catch (e) {
    console.warn(`⚠ ${label} export skipped — ${String(e.message || e).slice(0, 160)}`);
  }
}
await pullExport("queries", ["query"], GSC_QUERIES_EXPORT, 25000);
await pullExport("query×page rows", ["query", "page"], GSC_QUERY_PAGE_EXPORT, 25000);
await pullExport("query×country rows", ["query", "country"], GSC_QUERY_COUNTRY_EXPORT, 25000);
