// seo-paths.mjs — single source of truth for where the SEO toolkit reads and
// writes data. Every producer (query tools, analysers) and every consumer
// (report-xlsx, monday-runner) imports from here, so the paths can never drift
// apart again.
//
// All paths are RELATIVE TO THE REPO ROOT. The toolkit is always run from the
// repo root: `node frontend/seo/<script>.mjs`, and monday-runner spawns every
// child with cwd = repo root. Keeping the paths relative (not absolute) also
// keeps monday-runner's "files written" stdout parsing working.

import fs from "node:fs";
import path from "node:path";

// Per-tenant data isolation. When SEO_TENANT is set (the multi-tenant audit writes
// it into .env.local via scripts/get-tenant.mjs), each client's exports, snapshots
// and reports live under data/tenants/<key>/ — so concurrent clients never overwrite
// each other AND snapshot deltas (position/backlink) compare the SAME client over
// time. Unset (single-tenant / main) → the flat data/ dir, unchanged.
function readSeoTenant() {
  if (process.env.SEO_TENANT) return process.env.SEO_TENANT;
  for (const file of [".env.local", ".env"]) {
    try {
      for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
        const m = line.match(/^\s*SEO_TENANT\s*=\s*(.*?)\s*$/);
        if (m) return m[1].replace(/^["']|["']$/g, "");
      }
    } catch {}
  }
  return "";
}
const SEO_TENANT = readSeoTenant().trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");

const DATA_ROOT = path.join("frontend", "seo", "data");
export const DATA_DIR = SEO_TENANT ? path.join(DATA_ROOT, "tenants", SEO_TENANT) : DATA_ROOT;

// Canonical directory layout. Per-source subfolders keep snapshots, reports and
// raw exports from colliding, and mirror what each producer already writes.
export const DIRS = {
  data: DATA_DIR,

  // Google Search Console
  gsc: path.join(DATA_DIR, "gsc"),

  // Google Analytics 4
  ga4: path.join(DATA_DIR, "ga4"),
  ga4Snapshots: path.join(DATA_DIR, "ga4", "snapshots"),
  ga4Reports: path.join(DATA_DIR, "ga4", "reports"),
  ga4Attribution: path.join(DATA_DIR, "ga4", "attribution"),

  // Google Business Profile
  gbp: path.join(DATA_DIR, "gbp"),
  gbpSnapshots: path.join(DATA_DIR, "gbp", "snapshots"),
  gbpReports: path.join(DATA_DIR, "gbp", "reports"),
  gbpAttribution: path.join(DATA_DIR, "gbp", "attribution"),

  // Ahrefs
  ahrefs: path.join(DATA_DIR, "ahrefs"),
  ahrefsReports: path.join(DATA_DIR, "ahrefs", "reports"),
  refdomainSnapshots: path.join(DATA_DIR, "ahrefs", "refdomain-snapshots"),
  positionSnapshots: path.join(DATA_DIR, "ahrefs", "position-snapshots"),
  keywordGap: path.join(DATA_DIR, "ahrefs", "keyword-gap"),
  competitorGap: path.join(DATA_DIR, "ahrefs", "competitor-gap"),

  // Free keyword research
  autocomplete: path.join(DATA_DIR, "autocomplete"),

  // Machine-readable CSV exports of the actionable recommendation tables
  csv: path.join(DATA_DIR, "csv"),
};

// The canonical GSC page-level export. Written by gsc-query.mjs (default mode),
// read by analyse-gsc-phase1.mjs, the attribution scripts, and report-xlsx.
export const GSC_EXPORT = path.join(DIRS.gsc, "gsc-pages-90d.json");

// Phase-2 exports (all written by gsc-query.mjs default mode, read by
// analyse-gsc-phase2.mjs). Query-level + query×page + query×country are what the
// page-level export can't express: keyword-level position, cannibalisation, and
// the country-split "phantom ranking" check.
export const GSC_QUERIES_EXPORT = path.join(DIRS.gsc, "gsc-queries-90d.json"); // dims: [query]
export const GSC_QUERY_PAGE_EXPORT = path.join(DIRS.gsc, "gsc-query-page-90d.json"); // dims: [query, page]
export const GSC_QUERY_COUNTRY_EXPORT = path.join(DIRS.gsc, "gsc-query-country-90d.json"); // dims: [query, country]

// Keyword-difficulty cache for the phase-2 candidate queries — written by
// dataforseo-kd.mjs (optional; no-ops without DataForSEO creds), read by phase2.
// Shape: { fetchedAt, location, language, kd: { "<lowercased keyword>": <0-100|null> } }
export const GSC_KD_CACHE = path.join(DIRS.gsc, "gsc-kd-cache.json");

// Per-path content-age snapshot (Sanity _updatedAt) — written by
// sanity-content-snapshot.mjs (optional), read by phase2 for the re-eval age
// gate (>6mo) + the 7-day quick-win cooldown. Shape: { fetchedAt, ages: { "<path>": "<ISO>" } }
export const SANITY_AGES_EXPORT = path.join(DIRS.gsc, "sanity-content-ages.json");

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Returns the freshest file in `dir` matching `re` (by filename sort, which is
// chronological for our YYYY-MM-DD-suffixed names), or null. Non-recursive.
export function freshestFile(dir, re) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => re.test(f)).sort();
  return files.length ? path.join(dir, files[files.length - 1]) : null;
}

export function readJsonSafe(fp) {
  try {
    return JSON.parse(fs.readFileSync(fp, "utf8"));
  } catch {
    return null;
  }
}

// Minimal RFC-4180 CSV serializer.
// `columns` is either an array of strings (headers) or an array of
// { header, key } objects; when keys are provided each row may be an object.
export function toCsv(columns, rows) {
  const esc = (v) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const headers = columns.map((c) => (typeof c === "object" ? c.header : c));
  const keys = columns.map((c) => (typeof c === "object" ? c.key : null));
  const lines = [headers.map(esc).join(",")];
  for (const row of rows) {
    const cells = Array.isArray(row)
      ? row
      : keys.map((k, i) => (k != null ? row[k] : row[headers[i]]));
    lines.push(cells.map(esc).join(","));
  }
  return lines.join("\r\n") + "\r\n";
}

// Writes a CSV file (creating the directory) and returns the path written.
export function writeCsv(filePath, columns, rows) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, toCsv(columns, rows), "utf8");
  return filePath;
}
