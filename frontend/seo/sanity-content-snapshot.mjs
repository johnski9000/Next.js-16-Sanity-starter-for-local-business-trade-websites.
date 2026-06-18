// Sanity content-age snapshot — writes a { path -> _updatedAt } map so the
// phase-2 analyser can apply the re-eval AGE gate (>6 months old) and the 7-day
// quick-win cooldown without making any Sanity calls itself (phase2 stays
// API-free + crash-isolated, like phase1).
//
// Optional: if no Sanity project id is configured it writes an empty snapshot and
// exits 0, so the Monday runner shows a clean "no content ages" state rather than
// failing. Read token is optional too (public datasets resolve unauthenticated).
//
//   node frontend/seo/sanity-content-snapshot.mjs
//
// Output: frontend/seo/data/gsc/sanity-content-ages.json  (SANITY_AGES_EXPORT)
import fs from "node:fs";
import path from "node:path";
import { SANITY_AGES_EXPORT, ensureDir } from "./seo-paths.mjs";

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

const PROJECT_ID = env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = env.NEXT_PUBLIC_SANITY_DATASET || "production";
const API_VERSION = (env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01").replace(/^v/, "");
const TOKEN = env.SANITY_API_READ_TOKEN || env.SANITY_READ_TOKEN || "";

function writeSnapshot(ages) {
  ensureDir(path.dirname(SANITY_AGES_EXPORT));
  const out = { source: "sanity", fetchedAt: new Date().toISOString(), ages };
  fs.writeFileSync(SANITY_AGES_EXPORT, JSON.stringify(out, null, 2), "utf8");
  return Object.keys(ages).length;
}

if (!PROJECT_ID) {
  writeSnapshot({});
  console.log(`No NEXT_PUBLIC_SANITY_PROJECT_ID — wrote empty content-age snapshot (re-eval age gate degrades to "unknown").`);
  process.exit(0);
}

// Map a service/area/page doc to its public route path. Combo pages
// (/services/<svc>/<area>) inherit the service's age — the analyser falls back
// to the /services/<svc> prefix when an exact path isn't present.
function pageSlugToPath(slug) {
  const s = String(slug || "").replace(/^\/+/, "").toLowerCase();
  if (s === "" || s === "home" || s === "index") return "/";
  return "/" + s;
}

const GROQ = `{
  "services": *[_type=="service" && defined(slug.current)]{ "slug": slug.current, _updatedAt },
  "areas": *[_type=="area" && defined(slug.current)]{ "slug": slug.current, _updatedAt },
  "pages": *[_type=="page" && defined(slug.current)]{ "slug": slug.current, _updatedAt },
  "settings": *[_type=="settings"][0]{ _updatedAt }
}`;

const url =
  `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}` +
  `?query=${encodeURIComponent(GROQ)}`;

let data;
try {
  const res = await fetch(url, TOKEN ? { headers: { Authorization: `Bearer ${TOKEN}` } } : undefined);
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 160)}`);
  data = (await res.json()).result || {};
} catch (e) {
  // Non-fatal: write an empty snapshot so the cycle continues with age "unknown".
  writeSnapshot({});
  console.warn(`⚠ Sanity content-age fetch failed (${String(e.message || e).slice(0, 140)}) — wrote empty snapshot.`);
  process.exit(0);
}

const ages = {};
for (const s of data.services || []) if (s.slug && s._updatedAt) ages[`/services/${s.slug}`] = s._updatedAt;
for (const a of data.areas || []) if (a.slug && a._updatedAt) ages[`/areas/${a.slug}`] = a._updatedAt;
for (const p of data.pages || []) if (p.slug && p._updatedAt) ages[pageSlugToPath(p.slug)] = p._updatedAt;
if (data.settings?._updatedAt && !ages["/"]) ages["/"] = data.settings._updatedAt;

const n = writeSnapshot(ages);
console.log(`Wrote ${SANITY_AGES_EXPORT.replace(/\\/g, "/")} (${n} page ages, project ${PROJECT_ID}/${DATASET})`);
