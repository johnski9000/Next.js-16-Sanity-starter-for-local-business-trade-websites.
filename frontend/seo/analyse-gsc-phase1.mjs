// GSC page analyser — turns the 90-day Search Console page export into a
// "what pages to focus on" report. Generic to THIS template's route shapes
// (/services, /services/<service>/<area>, /areas, /projects, /blog, ...).
//
// Everything is derived from the live export — no client-specific numbers are
// baked in. Run `gsc-query.mjs` first to produce the export.
//
// Inputs:  frontend/seo/data/gsc/gsc-pages-90d.json   (written by gsc-query.mjs)
// Outputs: frontend/seo/data/gsc/gsc-phase1-report.md  (human-readable)
//          frontend/seo/data/gsc/gsc-whitelist.txt     (pages Google already shows)
//          frontend/seo/data/csv/gsc-page-priorities-<date>.csv  (machine-readable)
import fs from "node:fs";
import path from "node:path";
import { DIRS, GSC_EXPORT, ensureDir, writeCsv } from "./seo-paths.mjs";

const DATE = new Date().toISOString().slice(0, 10);
const REPORT_PATH = path.join(DIRS.gsc, "gsc-phase1-report.md");
const WHITELIST_PATH = path.join(DIRS.gsc, "gsc-whitelist.txt");
const CSV_PATH = path.join(DIRS.csv, `gsc-page-priorities-${DATE}.csv`);

const CSV_COLUMNS = [
  { header: "Path", key: "path" },
  { header: "Bucket", key: "bucket" },
  { header: "Impressions", key: "impr" },
  { header: "Clicks", key: "clicks" },
  { header: "CTR %", key: "ctrPct" },
  { header: "Avg position", key: "pos" },
  { header: "Priority", key: "priority" },
  { header: "Recommended action", key: "action" },
];

// ─── Load the export (degrade gracefully if it isn't there yet) ──────────────
const raw = fs.existsSync(GSC_EXPORT) ? (() => {
  try { return JSON.parse(fs.readFileSync(GSC_EXPORT, "utf8")); } catch { return null; }
})() : null;

if (!raw || !Array.isArray(raw.rows) || raw.rows.length === 0) {
  // No data yet — write empty artifacts and exit 0 so the Monday runner shows a
  // clean "no GSC data" state instead of a hard failure.
  ensureDir(DIRS.gsc);
  fs.writeFileSync(
    REPORT_PATH,
    `# GSC Page Report — ${DATE}\n\nNo GSC export found at \`${GSC_EXPORT.replace(/\\/g, "/")}\`, ` +
      `or it contained no rows.\n\nRun \`node frontend/seo/gsc-query.mjs\` (needs Google ` +
      `Search Console credentials in .env) to generate it, then re-run this script.\n`,
    "utf8",
  );
  fs.writeFileSync(WHITELIST_PATH, "", "utf8");
  writeCsv(CSV_PATH, CSV_COLUMNS, []);
  console.log(`No GSC data yet — wrote placeholder ${REPORT_PATH.replace(/\\/g, "/")}`);
  console.log(`Wrote ${CSV_PATH.replace(/\\/g, "/")} (0 pages)`);
  process.exit(0);
}

const rows = raw.rows.map((r) => {
  const url = r.keys?.[0] || "";
  let p = url;
  try { p = new URL(url).pathname; } catch {}
  return {
    url,
    path: p,
    clicks: Number(r.clicks || 0),
    impr: Number(r.impressions || 0),
    ctr: Number(r.ctr || 0),
    pos: Number(r.position || 0),
  };
}).filter((r) => r.path);

const windowLabel = raw.startDate && raw.endDate ? `${raw.startDate} → ${raw.endDate}` : "last 90 days";

// ─── Bucket every URL by THIS template's route shape ─────────────────────────
function bucketOf(p) {
  if (p === "/" || p === "") return "home";
  const parts = p.replace(/\/+$/, "").split("/").filter(Boolean);
  const [a, b] = parts;
  if (a === "services") {
    if (parts.length === 1) return "services:hub";
    if (parts.length === 2) return "services:service";
    return "services:service+area"; // /services/<service>/<area> combo pages
  }
  if (a === "areas") return parts.length === 1 ? "areas:hub" : "areas:area";
  if (a === "projects") return parts.length === 1 ? "projects:hub" : "projects:project";
  if (a === "blog") {
    if (parts.length === 1) return "blog:hub";
    if (b === "page") return "blog:pagination";
    return "blog:post";
  }
  if (a === "author") return "blog:author";
  if (a === "gallery") return "gallery";
  if (a === "search") return "search";
  if (a === "quote" || a === "contact") return "conversion";
  return "page:" + a; // freeform marketing pages served by app/[...slug]
}

// ─── Page-level priority + recommended action (the "focus" logic) ────────────
function recommend(r) {
  if (r.impr < 5) return { priority: "Monitor", action: "Low visibility — no action until impressions grow" };
  if (r.pos >= 4 && r.pos <= 10 && r.impr >= 20)
    return { priority: "High", action: "Striking distance (pos 4-10): sharpen title/meta, add internal links + schema to reach page 1" };
  if (r.pos > 10 && r.pos <= 20 && r.impr >= 20)
    return { priority: "High", action: "Page 2 (pos 11-20): expand content depth + build internal links toward page 1" };
  if (r.pos <= 5 && r.ctr < 0.02 && r.impr >= 50)
    return { priority: "High", action: "Top 5 but weak CTR: rewrite title/meta + add rich-result schema (FAQ/Review)" };
  if (r.clicks === 0 && r.impr >= 30)
    return { priority: "Medium", action: "Impressions but zero clicks: review snippet relevance / check for cannibalisation" };
  if (r.pos > 20 && r.impr >= 30)
    return { priority: "Medium", action: "Beyond page 2: expand content, target long-tail variations, add internal links" };
  if (r.clicks > 0 && r.pos <= 10)
    return { priority: "Maintain", action: "Converting on page 1 — keep content fresh, monitor position" };
  return { priority: "Low", action: "Minor — revisit after higher-priority pages" };
}

const PRIORITY_ORDER = { High: 0, Medium: 1, Maintain: 2, Low: 3, Monitor: 4 };

for (const r of rows) {
  const { priority, action } = recommend(r);
  r.bucket = bucketOf(r.path);
  r.priority = priority;
  r.action = action;
  r.ctrPct = (r.ctr * 100).toFixed(2);
}

// ─── Aggregates ──────────────────────────────────────────────────────────────
const totalImpr = rows.reduce((s, r) => s + r.impr, 0);
const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
const siteCtr = totalImpr ? ((totalClicks / totalImpr) * 100).toFixed(3) : "0.000";

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function aggregate(keyFn) {
  const map = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    if (k == null) continue;
    if (!map.has(k)) map.set(k, { urls: 0, impr: 0, clicks: 0, positions: [] });
    const e = map.get(k);
    e.urls += 1; e.impr += r.impr; e.clicks += r.clicks; e.positions.push(r.pos);
  }
  return [...map.entries()]
    .map(([k, e]) => ({
      key: k, urls: e.urls, impr: e.impr, clicks: e.clicks,
      ctrPct: e.impr ? ((e.clicks / e.impr) * 100).toFixed(3) : "0.000",
      medPos: median(e.positions)?.toFixed(1) ?? "—",
    }))
    .sort((a, b) => b.impr - a.impr);
}

const bucketTable = aggregate((r) => r.bucket);
const segOf = (prefix) => (r) => {
  const parts = r.path.replace(/\/+$/, "").split("/").filter(Boolean);
  return parts[0] === prefix && parts[1] ? parts[1] : null;
};
const serviceTable = aggregate(segOf("services"));
const areaTable = aggregate(segOf("areas"));

// Striking distance = the pages to focus on first (pos 4-20 with real impressions).
const strikingDistance = rows
  .filter((r) => r.pos >= 4 && r.pos <= 20 && r.impr >= 20)
  .sort((a, b) => b.impr - a.impr);

const zeroClick = rows
  .filter((r) => r.clicks === 0 && r.impr >= 30)
  .sort((a, b) => b.impr - a.impr);

// Whitelist: pages with > 9 impressions in 90d (≈ >3/month) — Google already shows them.
const whitelist = rows.filter((r) => r.impr > 9).sort((a, b) => b.impr - a.impr);

// ─── CSV — every page with impressions, prioritised ──────────────────────────
const csvRows = [...rows]
  .filter((r) => r.impr > 0)
  .sort((a, b) => (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) || (b.impr - a.impr))
  .map((r) => ({
    path: r.path, bucket: r.bucket, impr: r.impr, clicks: r.clicks,
    ctrPct: r.ctrPct, pos: r.pos.toFixed(1), priority: r.priority, action: r.action,
  }));
writeCsv(CSV_PATH, CSV_COLUMNS, csvRows);

// ─── Render the markdown report ──────────────────────────────────────────────
const fmt = (n) => Number(n).toLocaleString("en-GB");
const lines = [];
lines.push(`# GSC Page Report — ${windowLabel}`);
lines.push("");
lines.push(`Generated ${DATE} from \`${GSC_EXPORT.replace(/\\/g, "/")}\` (Search Analytics, page-level).`);
lines.push("");
lines.push(`- Pages with ≥1 impression: **${fmt(rows.length)}**`);
lines.push(`- Total impressions: **${fmt(totalImpr)}**`);
lines.push(`- Total clicks: **${fmt(totalClicks)}**`);
lines.push(`- Site-wide CTR: **${siteCtr}%**`);
lines.push("");

lines.push("## Pages by section (route shape)");
lines.push("");
lines.push("| Section | Pages w/ impr | Impressions | Clicks | CTR % | Median pos |");
lines.push("|---|---:|---:|---:|---:|---:|");
for (const b of bucketTable) lines.push(`| \`${b.key}\` | ${fmt(b.urls)} | ${fmt(b.impr)} | ${fmt(b.clicks)} | ${b.ctrPct} | ${b.medPos} |`);
lines.push("");

if (serviceTable.length) {
  lines.push("## By service (`/services/<service>`)");
  lines.push("");
  lines.push("| Service | Pages w/ impr | Impressions | Clicks | CTR % | Median pos |");
  lines.push("|---|---:|---:|---:|---:|---:|");
  for (const s of serviceTable) lines.push(`| \`${s.key}\` | ${fmt(s.urls)} | ${fmt(s.impr)} | ${fmt(s.clicks)} | ${s.ctrPct} | ${s.medPos} |`);
  lines.push("");
}

if (areaTable.length) {
  lines.push("## By area (`/areas/<area>`)");
  lines.push("");
  lines.push("| Area | Pages w/ impr | Impressions | Clicks | CTR % | Median pos |");
  lines.push("|---|---:|---:|---:|---:|---:|");
  for (const a of areaTable) lines.push(`| \`${a.key}\` | ${fmt(a.urls)} | ${fmt(a.impr)} | ${fmt(a.clicks)} | ${a.ctrPct} | ${a.medPos} |`);
  lines.push("");
}

lines.push("## ⭐ Pages to focus on first — striking distance (pos 4-20)");
lines.push("");
lines.push("These already rank on page 1 (bottom) or page 2 with real demand. Small on-page + internal-link work moves them up fastest.");
lines.push("");
if (strikingDistance.length) {
  lines.push("| Path | Impr | Clicks | CTR % | Pos | Recommended action |");
  lines.push("|---|---:|---:|---:|---:|---|");
  for (const r of strikingDistance.slice(0, 30)) lines.push(`| \`${r.path}\` | ${fmt(r.impr)} | ${fmt(r.clicks)} | ${r.ctrPct} | ${r.pos.toFixed(1)} | ${r.action} |`);
  if (strikingDistance.length > 30) lines.push("");
  if (strikingDistance.length > 30) lines.push(`_…and ${fmt(strikingDistance.length - 30)} more. Full prioritised list in the CSV._`);
} else {
  lines.push("_No striking-distance pages yet._");
}
lines.push("");

lines.push("## Zero-click pages with impressions");
lines.push("");
if (zeroClick.length) {
  lines.push("| Path | Impr | CTR % | Pos |");
  lines.push("|---|---:|---:|---:|");
  for (const r of zeroClick.slice(0, 20)) lines.push(`| \`${r.path}\` | ${fmt(r.impr)} | ${r.ctrPct} | ${r.pos.toFixed(1)} |`);
} else {
  lines.push("_None._");
}
lines.push("");

lines.push("## Whitelist — pages with >3 impressions/month (>9 in 90d)");
lines.push("");
lines.push(`**${fmt(whitelist.length)} pages.** Full list in \`${WHITELIST_PATH.replace(/\\/g, "/")}\`. Top 30:`);
lines.push("");
lines.push("| Path | Impr | Clicks | Pos |");
lines.push("|---|---:|---:|---:|");
for (const r of whitelist.slice(0, 30)) lines.push(`| \`${r.path}\` | ${fmt(r.impr)} | ${fmt(r.clicks)} | ${r.pos.toFixed(1)} |`);
lines.push("");
lines.push(`Machine-readable priorities for all pages: \`${CSV_PATH.replace(/\\/g, "/")}\`.`);
lines.push("");

ensureDir(DIRS.gsc);
fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf8");
fs.writeFileSync(WHITELIST_PATH, whitelist.map((r) => r.path).join("\n") + (whitelist.length ? "\n" : ""), "utf8");

console.log(`Wrote ${REPORT_PATH.replace(/\\/g, "/")}`);
console.log(`Wrote ${WHITELIST_PATH.replace(/\\/g, "/")} (${whitelist.length} URLs)`);
console.log(`Wrote ${CSV_PATH.replace(/\\/g, "/")} (${csvRows.length} pages)`);
