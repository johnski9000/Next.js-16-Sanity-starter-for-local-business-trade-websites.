// GSC <-> GA4 attribution analyser. Closes the loop between search ranking
// data (Google Search Console) and conversion data (GA4) per landing page so
// SEO movement can be expressed in commercial terms:
//   "Stockport link-building moved pos 5.3 -> 4.0  =>  +3 leads / £4.5k pipeline"
//
// Inputs
//   - frontend/seo/data/gsc/gsc-pages-90d.json     (existing GSC page-level export)
//   - GA4 Data API (pulled fresh for the same 90d window ending yesterday)
//
// Outputs
//   - frontend/seo/data/ga4/attribution/gsc-ga4-YYYY-MM-DD.json
//   - frontend/seo/data/ga4/reports/gsc-ga4-attribution-YYYY-MM-DD.md
//
// Usage
//   node frontend/seo/gsc-ga4-attribution.mjs
//
// Env (loaded from .env / .env.local, same pattern as ga4-discover.mjs)
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GA4_PROPERTY_ID
//
// Notes
//   - This property uses GA4's 'keyEvents' metric (mid-2025 rename of
//     'conversions'). The code probes the metadata endpoint and picks whichever
//     metric the property actually exposes; calling 'conversions' against a
//     keyEvents-only property returns 400 INVALID_ARGUMENT.
//   - Pages are joined by URL pathname (host/protocol/query/trailing slash all
//     stripped) so GSC's full URLs join cleanly to GA4's landingPage values.
import fs from "node:fs";
import path from "node:path";
import { DIRS, GSC_EXPORT, ensureDir } from "./seo-paths.mjs";

// ---------- env loader (mirrors ga4-discover.mjs) ----------
function loadEnv() {
  const env = { ...process.env };
  for (const file of [".env", ".env.local"]) {
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
const REQUIRED = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN", "GA4_PROPERTY_ID"];
const missing = REQUIRED.filter((k) => !env[k]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  console.error("Add them to .env or .env.local at repo root.");
  process.exit(1);
}

// ---------- path normaliser (the join key) ----------
// Both GSC URLs and GA4 landing-page strings get reduced to:
//   - leading slash
//   - no protocol, no host
//   - no query string
//   - no trailing slash (except for "/")
//   - lowercase (GSC and GA4 sometimes disagree on case)
function normalisePath(input) {
  if (input == null) return "";
  let s = String(input).trim();
  if (!s || s === "(not set)") return "";
  // Strip protocol+host if present.
  try {
    if (/^https?:\/\//i.test(s)) s = new URL(s).pathname + (new URL(s).search || "");
  } catch {}
  // Drop query/fragment.
  const qIdx = s.search(/[?#]/);
  if (qIdx !== -1) s = s.slice(0, qIdx);
  // Ensure single leading slash.
  if (!s.startsWith("/")) s = "/" + s;
  s = s.replace(/\/{2,}/g, "/");
  // Strip trailing slash unless it's the root.
  if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1);
  return s.toLowerCase();
}

// ---------- date helpers ----------
function yyyyMmDd(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
const today = new Date();
const yesterday = new Date(today);
yesterday.setUTCDate(today.getUTCDate() - 1);
const startWindow = new Date(yesterday);
startWindow.setUTCDate(yesterday.getUTCDate() - 89); // 90-day window inclusive of yesterday
const WINDOW = { startDate: yyyyMmDd(startWindow), endDate: yyyyMmDd(yesterday) };
const REPORT_DATE = yyyyMmDd(today);

// ---------- 1. Read GSC export ----------
const GSC_PATH = GSC_EXPORT;
if (!fs.existsSync(GSC_PATH)) {
  console.error(`GSC export not found at ${GSC_PATH}.`);
  console.error("Generate it first: node frontend/seo/gsc-query.mjs");
  process.exit(1);
}
const gscRaw = JSON.parse(fs.readFileSync(GSC_PATH, "utf8"));
const gscRows = (gscRaw.rows ?? []).map((r) => {
  const url = r.keys?.[0] || "";
  return {
    url,
    path: normalisePath(url),
    impressions: Number(r.impressions || 0),
    clicks: Number(r.clicks || 0),
    ctr: Number(r.ctr || 0),
    position: Number(r.position || 0),
  };
}).filter((r) => r.path);
console.error(`gsc: loaded ${gscRows.length} page rows from ${GSC_PATH}`);

// ---------- 2. Optional: fetch top queries per page from GSC (for context) ----------
// We try to enrich each page with its top 5 queries. This is a second GSC call
// with dimensions:["page","query"], grouped client-side. If the call fails or
// GSC creds are missing we degrade gracefully (queries stay empty).
async function fetchAccessToken() {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`OAuth token exchange failed: HTTP ${r.status} ${text}`);
  const j = JSON.parse(text);
  if (!j.access_token) throw new Error(`OAuth response had no access_token: ${text}`);
  return j.access_token;
}

const accessToken = await fetchAccessToken();
console.error("oauth: access token acquired");
const authHeaders = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

const queriesByPath = new Map(); // path -> [{query, clicks, impressions, position}]
if (env.GSC_SITE_URL) {
  try {
    const site = encodeURIComponent(env.GSC_SITE_URL);
    const body = {
      startDate: WINDOW.startDate,
      endDate: WINDOW.endDate,
      dimensions: ["page", "query"],
      rowLimit: 25000,
    };
    const r = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`,
      { method: "POST", headers: authHeaders, body: JSON.stringify(body) }
    );
    if (!r.ok) {
      console.error(`gsc queries: HTTP ${r.status} — skipping query enrichment`);
    } else {
      const j = await r.json();
      for (const row of j.rows || []) {
        const p = normalisePath(row.keys?.[0]);
        const q = row.keys?.[1] || "";
        if (!p || !q) continue;
        if (!queriesByPath.has(p)) queriesByPath.set(p, []);
        queriesByPath.get(p).push({
          query: q,
          clicks: Number(row.clicks || 0),
          impressions: Number(row.impressions || 0),
          position: Number(row.position || 0),
        });
      }
      // Keep only top 5 by impressions per page.
      for (const [p, arr] of queriesByPath) {
        arr.sort((a, b) => b.impressions - a.impressions);
        queriesByPath.set(p, arr.slice(0, 5));
      }
      console.error(`gsc queries: enriched ${queriesByPath.size} pages with top-5 queries`);
    }
  } catch (e) {
    console.error(`gsc queries: ${e.message} — skipping query enrichment`);
  }
} else {
  console.error("gsc queries: GSC_SITE_URL not set, skipping query enrichment");
}

// ---------- 3. GA4 landing-page report ----------
// Prefer importing a helper from ./ga4-query.mjs if it exists (lets that module
// own the canonical GA4 call shape). Otherwise fall back to an inline call that
// mirrors the discovery probe's request — this script is intentionally usable
// standalone.
const propertyId = String(env.GA4_PROPERTY_ID).replace(/^properties\//, "").trim();

async function ga4RunReport(body) {
  const r = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    { method: "POST", headers: authHeaders, body: JSON.stringify(body) }
  );
  const text = await r.text();
  if (!r.ok) throw new Error(`GA4 runReport ${r.status}: ${text}`);
  return JSON.parse(text);
}

// Pick the right conversion metric for this property (keyEvents vs conversions).
async function ga4PickConversionMetric() {
  const r = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}/metadata`,
    { headers: authHeaders }
  );
  if (!r.ok) {
    console.error(`ga4 metadata: HTTP ${r.status} — defaulting to keyEvents`);
    return { conv: "keyEvents", convRate: "sessionKeyEventRate", names: [] };
  }
  const meta = await r.json();
  const names = (meta.metrics || []).map((m) => m.apiName);
  if (names.includes("keyEvents")) {
    return { conv: "keyEvents", convRate: names.includes("sessionKeyEventRate") ? "sessionKeyEventRate" : null, names };
  }
  if (names.includes("conversions")) {
    return { conv: "conversions", convRate: names.includes("sessionConversionRate") ? "sessionConversionRate" : null, names };
  }
  return { conv: null, convRate: null, names };
}

let ga4Helper = null;
try {
  // Best-effort dynamic import: if the user adds ./ga4-query.mjs later with a
  // fetchLandingPages(window) export, we use it. If the file does not exist
  // (the common case today) we silently fall back to the inline path below.
  const url = new URL("./ga4-query.mjs", import.meta.url);
  if (fs.existsSync(url)) {
    ga4Helper = await import(url.href);
    console.error("ga4: using helper from ./ga4-query.mjs");
  }
} catch (e) {
  console.error(`ga4: ./ga4-query.mjs import skipped (${e.message})`);
  ga4Helper = null;
}

let landingRows = [];
let convMetric = null;
let convRateMetric = null;

if (ga4Helper && typeof ga4Helper.fetchLandingPages === "function") {
  // Helper contract: returns [{ page, sessions, totalUsers, conversions, conversionRate, primaryEvents? }]
  try {
    landingRows = await ga4Helper.fetchLandingPages({
      window: WINDOW,
      accessToken,
      propertyId,
    });
    convMetric = ga4Helper.conversionMetricName || "keyEvents";
    convRateMetric = ga4Helper.conversionRateMetricName || null;
    console.error(`ga4: helper returned ${landingRows.length} landing pages`);
  } catch (e) {
    console.error(`ga4 helper failed (${e.message}) — falling back to inline call`);
    ga4Helper = null;
  }
}

if (!ga4Helper) {
  const picked = await ga4PickConversionMetric();
  convMetric = picked.conv;
  convRateMetric = picked.convRate;
  if (!convMetric) {
    console.error("ga4: property exposes neither 'conversions' nor 'keyEvents' — sections 3-6 will be empty.");
  } else {
    console.error(`ga4: using conversion metric '${convMetric}'${convRateMetric ? `, rate '${convRateMetric}'` : ""}`);
  }

  // Page-level join: GSC landing pages are pages a user enters on, so we use
  // landingPagePlusQueryString (stripped of query at normalisation time). If
  // that dimension is unavailable we fall back to landingPage.
  const landingDim = "landingPagePlusQueryString";
  const metrics = [
    { name: "sessions" },
    { name: "totalUsers" },
    ...(convMetric ? [{ name: convMetric }] : []),
    ...(convRateMetric ? [{ name: convRateMetric }] : []),
  ];

  let report;
  try {
    report = await ga4RunReport({
      dateRanges: [WINDOW],
      dimensions: [{ name: landingDim }],
      metrics,
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10000,
    });
  } catch (e) {
    console.error(`ga4 landing report (${landingDim}) failed: ${e.message}`);
    console.error("ga4: retrying with dimension 'landingPage'");
    report = await ga4RunReport({
      dateRanges: [WINDOW],
      dimensions: [{ name: "landingPage" }],
      metrics,
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10000,
    });
  }

  landingRows = (report.rows || []).map((row) => {
    const pageRaw = row.dimensionValues?.[0]?.value || "";
    const vals = row.metricValues || [];
    let i = 0;
    const sessions = Number(vals[i++]?.value || 0);
    const totalUsers = Number(vals[i++]?.value || 0);
    const conversions = convMetric ? Number(vals[i++]?.value || 0) : 0;
    const conversionRate = convRateMetric ? Number(vals[i++]?.value || 0) : (sessions > 0 ? conversions / sessions : 0);
    return {
      pageRaw,
      page: normalisePath(pageRaw),
      sessions,
      totalUsers,
      conversions,
      conversionRate,
    };
  }).filter((r) => r.page);
  console.error(`ga4: ${landingRows.length} landing pages returned (after pathname normalisation)`);

  // Primary conversion-driving events per page. Only worth running if the
  // property actually has a conversion metric configured.
  if (convMetric) {
    try {
      const evReport = await ga4RunReport({
        dateRanges: [WINDOW],
        dimensions: [{ name: "landingPagePlusQueryString" }, { name: "eventName" }],
        metrics: [{ name: convMetric }],
        orderBys: [{ metric: { metricName: convMetric }, desc: true }],
        limit: 25000,
      });
      const primaryByPath = new Map();
      for (const row of evReport.rows || []) {
        const p = normalisePath(row.dimensionValues?.[0]?.value || "");
        const ev = row.dimensionValues?.[1]?.value || "";
        const c = Number(row.metricValues?.[0]?.value || 0);
        if (!p || !ev || c <= 0) continue;
        if (!primaryByPath.has(p)) primaryByPath.set(p, []);
        primaryByPath.get(p).push({ event: ev, count: c });
      }
      for (const lr of landingRows) {
        const arr = primaryByPath.get(lr.page) || [];
        arr.sort((a, b) => b.count - a.count);
        lr.primaryEvents = arr.slice(0, 3);
      }
      console.error(`ga4: enriched ${primaryByPath.size} pages with primary conversion events`);
    } catch (e) {
      console.error(`ga4 primary-events report failed: ${e.message} — skipping enrichment`);
    }
  }
}

// ---------- 4. Join ----------
// Build a map keyed by normalised pathname, merging both sides.
const merged = new Map();
function ensure(p) {
  if (!merged.has(p)) {
    merged.set(p, {
      path: p,
      gsc: null,   // { impressions, clicks, ctr, position, url, topQueries }
      ga4: null,   // { sessions, totalUsers, conversions, conversionRate, primaryEvents }
    });
  }
  return merged.get(p);
}

for (const r of gscRows) {
  const e = ensure(r.path);
  e.gsc = {
    url: r.url,
    impressions: r.impressions,
    clicks: r.clicks,
    ctr: r.ctr,
    position: r.position,
    topQueries: queriesByPath.get(r.path) || [],
  };
}
for (const r of landingRows) {
  const e = ensure(r.page);
  e.ga4 = {
    raw: r.pageRaw,
    sessions: r.sessions,
    totalUsers: r.totalUsers,
    conversions: r.conversions,
    conversionRate: r.conversionRate,
    primaryEvents: r.primaryEvents || [],
  };
}

const joined = [...merged.values()];

// ---------- 5. Aggregates / state flags ----------
const totalConversions = joined.reduce((s, j) => s + (j.ga4?.conversions || 0), 0);
const noConversionsConfigured = !convMetric || totalConversions === 0;

// ---------- 6. Section builders ----------
function fmt(n, digits = 0) {
  if (n == null || Number.isNaN(n)) return "—";
  return Number(n).toFixed(digits);
}
function fmtPct(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return (Number(n) * 100).toFixed(2) + "%";
}
function pickRow(j) {
  return {
    path: j.path,
    gscImpr: j.gsc?.impressions ?? 0,
    gscClicks: j.gsc?.clicks ?? 0,
    gscPos: j.gsc?.position ?? null,
    gscCtr: j.gsc?.ctr ?? null,
    ga4Sessions: j.ga4?.sessions ?? 0,
    ga4Users: j.ga4?.totalUsers ?? 0,
    ga4Conv: j.ga4?.conversions ?? 0,
    ga4ConvRate: j.ga4?.conversionRate ?? (j.ga4 && j.ga4.sessions > 0 ? (j.ga4.conversions / j.ga4.sessions) : null),
    topQueries: j.gsc?.topQueries || [],
    primaryEvents: j.ga4?.primaryEvents || [],
  };
}
const allRows = joined.map(pickRow);

// Section 1: top 50 by GSC impressions (must have GSC side; GA4 side may be missing)
const section1 = allRows
  .filter((r) => r.gscImpr > 0)
  .sort((a, b) => b.gscImpr - a.gscImpr)
  .slice(0, 50);

// Section 2: striking-distance (GSC pos 5..25, impressions > 50 to filter noise)
const section2 = allRows
  .filter((r) => r.gscPos != null && r.gscPos >= 5 && r.gscPos <= 25 && r.gscImpr >= 50)
  .sort((a, b) => b.gscImpr - a.gscImpr)
  .slice(0, 50);

// Section 3: conversions per impression leaderboard
const section3 = allRows
  .filter((r) => r.gscImpr > 0 && r.ga4Conv > 0)
  .map((r) => ({ ...r, convPerImpr: r.ga4Conv / r.gscImpr }))
  .sort((a, b) => b.convPerImpr - a.convPerImpr)
  .slice(0, 30);

// Section 4: SEO without commerce (high impressions, zero conversions)
//   - Require >= 200 impressions in 90d (1 day's worth of attention)
//   - Either no GA4 row OR zero conversions
const section4 = allRows
  .filter((r) => r.gscImpr >= 200 && (r.ga4Conv || 0) === 0)
  .sort((a, b) => b.gscImpr - a.gscImpr)
  .slice(0, 50);

// Section 5: Commerce without SEO (GA4 conv > 0 but low GSC impressions)
//   - Require >= 1 GA4 conversion
//   - GSC impressions == 0 OR < 100 (under the radar)
const section5 = allRows
  .filter((r) => r.ga4Conv > 0 && r.gscImpr < 100)
  .sort((a, b) => b.ga4Conv - a.ga4Conv)
  .slice(0, 50);

// Section 6: Top 10 conversion-driving pages
const section6 = allRows
  .filter((r) => r.ga4Conv > 0)
  .sort((a, b) => b.ga4Conv - a.ga4Conv)
  .slice(0, 10);

// ---------- 7. Markdown rendering ----------
const lines = [];
const banner = noConversionsConfigured
  ? `> **No GA4 conversions recorded in the last 90 days.**\n> ${!convMetric ? "Property exposes neither 'conversions' nor 'keyEvents' — Data API conversion tracking unavailable. " : "Either no events are marked as conversions (or 'key events') in GA4 Admin, or those events have not fired in this window. "}Sections 3, 5, and 6 will be empty until conversion events are configured AND firing. Section 4 will list every page with traffic but no conversions.`
  : null;

lines.push(`# GSC <-> GA4 attribution report`);
lines.push("");
lines.push(`*Generated: ${new Date().toISOString()}*  `);
lines.push(`*Window: ${WINDOW.startDate} -> ${WINDOW.endDate} (90 days, ending yesterday)*  `);
lines.push(`*GSC source: \`${GSC_PATH}\`*  `);
lines.push(`*GA4 property: \`${propertyId}\`*  `);
lines.push(`*Conversion metric: \`${convMetric || "(none)"}\`*  `);
lines.push("");
if (banner) {
  lines.push(banner);
  lines.push("");
}
lines.push(`Pages joined: **${joined.length}** total — `
  + `GSC only: ${joined.filter((j) => j.gsc && !j.ga4).length}, `
  + `GA4 only: ${joined.filter((j) => !j.gsc && j.ga4).length}, `
  + `both: ${joined.filter((j) => j.gsc && j.ga4).length}.`);
lines.push("");

function renderJoinedTable(rows, opts = {}) {
  const headers = ["Page", "GSC impr", "GSC clicks", "GSC pos", "GA4 sessions", "GA4 conv", "Conv rate"];
  if (opts.extraColumn) headers.push(opts.extraColumn.header);
  lines.push(`| ${headers.join(" | ")} |`);
  lines.push(`| ${headers.map(() => "---").join(" | ")} |`);
  for (const r of rows) {
    const row = [
      `\`${r.path}\``,
      fmt(r.gscImpr),
      fmt(r.gscClicks),
      r.gscPos != null ? fmt(r.gscPos, 1) : "—",
      fmt(r.ga4Sessions),
      fmt(r.ga4Conv),
      r.ga4ConvRate != null ? fmtPct(r.ga4ConvRate) : "—",
    ];
    if (opts.extraColumn) row.push(opts.extraColumn.value(r));
    lines.push(`| ${row.join(" | ")} |`);
  }
}

// Section 1
lines.push("## Section 1 — Top 50 pages by GSC impressions (joined with GA4)");
lines.push("");
lines.push("The pages search engines show the most. The GA4 columns reveal whether that visibility is producing commercial outcomes.");
lines.push("");
if (section1.length === 0) {
  lines.push("_No GSC impressions in the export — is `gsc-pages-90d.json` empty?_");
} else {
  renderJoinedTable(section1);
}
lines.push("");

// Section 2
lines.push("## Section 2 — Striking-distance pages (GSC pos 5–25)");
lines.push("");
lines.push("Highest-leverage SEO work: a small position shift here ripples directly into clicks and (where conversion tracking works) leads. Filtered to pages with >= 50 impressions to suppress noise.");
lines.push("");
if (section2.length === 0) {
  lines.push("_No pages in the position 5–25 band with >= 50 impressions._");
} else {
  renderJoinedTable(section2);
}
lines.push("");

// Section 3
lines.push("## Section 3 — Conversions per impression leaderboard");
lines.push("");
lines.push("Pages where every GSC impression is most likely to end in a GA4 conversion event. Highest SEO investment ROI per impression.");
lines.push("");
if (noConversionsConfigured || section3.length === 0) {
  lines.push("_Empty — no pages have both GSC impressions and GA4 conversions in this window._");
} else {
  renderJoinedTable(section3, {
    extraColumn: {
      header: "Conv / impr",
      value: (r) => (r.convPerImpr * 1000).toFixed(2) + " per 1k",
    },
  });
}
lines.push("");

// Section 4
lines.push("## Section 4 — SEO without commerce (high impressions, zero conversions)");
lines.push("");
lines.push("Pages that rank but don't convert. Investigation checklist:");
lines.push("");
lines.push("- Is the page's search intent matched but the on-page CTA broken?");
lines.push("- Is the page ranking for vanity queries that wouldn't convert even if intent were right?");
lines.push("- Is GA4 conversion tracking firing on the page at all (check Realtime / DebugView)?");
lines.push("- Has a conversion event been MARKED as a conversion / key event in GA4 Admin?");
lines.push("");
lines.push(`Filtered to pages with >= 200 GSC impressions in the 90-day window.`);
lines.push("");
if (section4.length === 0) {
  lines.push("_No pages match — either every high-impression page converts at least once, or there's no GSC traffic at all._");
} else {
  renderJoinedTable(section4, {
    extraColumn: {
      header: "Top GSC query",
      value: (r) => r.topQueries[0] ? `\`${r.topQueries[0].query}\` (impr ${r.topQueries[0].impressions})` : "—",
    },
  });
}
lines.push("");

// Section 5
lines.push("## Section 5 — Commerce without SEO (converts well, low search visibility)");
lines.push("");
lines.push("These pages already convert — but Google barely shows them. Best SEO-investment candidates: get the page in front of more searchers and the conversion math will follow.");
lines.push("");
lines.push("Filtered to pages with >= 1 GA4 conversion and < 100 GSC impressions in the 90-day window.");
lines.push("");
if (noConversionsConfigured || section5.length === 0) {
  lines.push("_Empty — no pages convert without already getting search impressions._");
} else {
  renderJoinedTable(section5, {
    extraColumn: {
      header: "Primary events",
      value: (r) => r.primaryEvents.length ? r.primaryEvents.map((e) => `${e.event} (${e.count})`).join(", ") : "—",
    },
  });
}
lines.push("");

// Section 6
lines.push("## Section 6 — Top 10 conversion-driving pages");
lines.push("");
lines.push("The pages that produce the leads. Use this as the prioritisation backbone — every SEO/content/UX decision should preserve or amplify these.");
lines.push("");
if (noConversionsConfigured || section6.length === 0) {
  lines.push("_Empty — no GA4 conversions recorded in this window._");
} else {
  renderJoinedTable(section6, {
    extraColumn: {
      header: "Primary events",
      value: (r) => r.primaryEvents.length ? r.primaryEvents.map((e) => `${e.event} (${e.count})`).join(", ") : "—",
    },
  });
}
lines.push("");

// Methodology footer
lines.push("---");
lines.push("");
lines.push("### Methodology");
lines.push("");
lines.push("- GSC data: `frontend/seo/data/gsc/gsc-pages-90d.json`, dimensions=[page] (plus a secondary [page,query] pull for the 'top GSC query' column).");
lines.push(`- GA4 data: live Data API call against property ${propertyId}, landing-page dimension, ${WINDOW.startDate} -> ${WINDOW.endDate}.`);
lines.push(`- Conversion metric: \`${convMetric || "(unavailable)"}\` (GA4 mid-2025 renamed 'conversions' to 'keyEvents' — the script auto-detects which the property exposes).`);
lines.push("- Join key: URL pathname (host/protocol/query/trailing-slash/case all stripped).");
lines.push("- Full-outer-join semantics: pages present on only one side are still reported (section 4 catches GSC-only, section 5 catches GA4-only).");
lines.push("");

// ---------- 8. Write outputs ----------
const jsonDir = DIRS.ga4Attribution;
const mdDir = DIRS.ga4Reports;
ensureDir(jsonDir);
ensureDir(mdDir);

const jsonOut = path.join(jsonDir, `gsc-ga4-${REPORT_DATE}.json`);
const mdOut = path.join(mdDir, `gsc-ga4-attribution-${REPORT_DATE}.md`);

const jsonPayload = {
  generated_at: new Date().toISOString(),
  window: WINDOW,
  property_id: propertyId,
  gsc_source: GSC_PATH,
  conversion_metric: convMetric,
  conversion_rate_metric: convRateMetric,
  no_conversions_configured: noConversionsConfigured,
  totals: {
    pages_joined: joined.length,
    gsc_only: joined.filter((j) => j.gsc && !j.ga4).length,
    ga4_only: joined.filter((j) => !j.gsc && j.ga4).length,
    both: joined.filter((j) => j.gsc && j.ga4).length,
    total_gsc_impressions: joined.reduce((s, j) => s + (j.gsc?.impressions || 0), 0),
    total_gsc_clicks: joined.reduce((s, j) => s + (j.gsc?.clicks || 0), 0),
    total_ga4_sessions: joined.reduce((s, j) => s + (j.ga4?.sessions || 0), 0),
    total_ga4_conversions: totalConversions,
  },
  sections: {
    top_by_impressions: section1,
    striking_distance: section2,
    conversions_per_impression: section3,
    seo_without_commerce: section4,
    commerce_without_seo: section5,
    top_conversion_drivers: section6,
  },
  joined_rows: allRows,
};

fs.writeFileSync(jsonOut, JSON.stringify(jsonPayload, null, 2));
fs.writeFileSync(mdOut, lines.join("\n"));

console.log("");
console.log("=== GSC <-> GA4 ATTRIBUTION ===");
console.log(`Window:            ${WINDOW.startDate} -> ${WINDOW.endDate}`);
console.log(`Pages joined:      ${joined.length}  (gsc-only ${joined.filter((j) => j.gsc && !j.ga4).length}, ga4-only ${joined.filter((j) => !j.gsc && j.ga4).length}, both ${joined.filter((j) => j.gsc && j.ga4).length})`);
console.log(`Conversion metric: ${convMetric || "(unavailable)"}`);
console.log(`Total conversions: ${totalConversions}${noConversionsConfigured ? "  (no_conversions_configured — see banner in report)" : ""}`);
console.log("");
console.log(`JSON written:      ${jsonOut}`);
console.log(`Markdown written:  ${mdOut}`);
