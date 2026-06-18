// XLSX report generator — 13-tab actionable Excel workbook.
// Reads Sanity data (NAP, services, areas) + all SEO snapshot files on disk.
// Produces a styled .xlsx with built-in guide, status tracking, and
// data-derived action recommendations, plus machine-readable CSV copies of the
// key recommendation tables in frontend/seo/data/csv/.
//
// All input/output locations come from ./seo-paths.mjs so producers and this
// consumer can never drift apart.
//
// Usage:
//   node frontend/seo/report-xlsx.mjs

import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import { getAreas, getServices, getNAPRecord } from "./_sanity-seo-data.mjs";
import { TARGET, COMPETITORS, PRIORITY_KEYWORDS, getTarget } from "./ahrefs-config.mjs";
import { DIRS, GSC_EXPORT, writeCsv } from "./seo-paths.mjs";

const DATA_DIR = DIRS.data;
const DATE = new Date().toISOString().slice(0, 10);

const workbook = new ExcelJS.Workbook();
workbook.creator = "Ahrefs + GSC + GBP SEO Toolkit";

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════
const fmtNum = (n) => (n != null ? Number(n).toLocaleString("en-GB") : "—");

function freshestFile(dir, re) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => re.test(f)).sort();
  return files.length ? path.join(dir, files[files.length - 1]) : null;
}

function readJsonSafe(fp) {
  try { return JSON.parse(fs.readFileSync(fp, "utf8")); } catch { return null; }
}

function autoFit(sheet, minW = 10, maxW = 50) {
  sheet.columns.forEach((col, i) => {
    let max = minW;
    sheet.getColumn(i + 1).eachCell({ includeEmpty: true }, (cell) => {
      const v = cell.value;
      if (v == null) return;
      const len = typeof v === "object" && v.richText
        ? v.richText.map((r) => r.text).join("").length
        : String(v).length;
      if (len > max) max = len;
    });
    col.width = Math.min(max + 3, maxW);
  });
}

function hdr(sheet, rowNum = 1) {
  const row = sheet.getRow(rowNum);
  row.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
  row.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  row.height = 22;
}

function secHdr(sheet, rowNum, text) {
  sheet.getCell(rowNum, 1).value = text;
  sheet.getCell(rowNum, 1).font = { bold: true, size: 12, color: { argb: "FF1E40AF" } };
  sheet.getRow(rowNum).height = 22;
  sheet.mergeCells(rowNum, 1, rowNum, sheet.columnCount);
}

function greenRow(r) { r.eachCell((c) => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } }; }); }
function redRow(r) { r.eachCell((c) => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } }; }); }
function blueRow(r) { r.eachCell((c) => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } }; }); }

function statusDropdown(sheet, col, rowStart, rowEnd) {
  for (let r = rowStart; r <= rowEnd; r++) {
    sheet.getCell(r, col).dataValidation = {
      type: "list", allowBlank: true,
      formulae: ['"not-started,audit-needed,in-progress,submitted,live,declined,not-applicable"'],
      showErrorMessage: true,
      errorTitle: "Invalid status",
      error: "Pick a valid status from the dropdown.",
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Load all data sources
// ═══════════════════════════════════════════════════════════════════════════
const domain = (await getTarget()) || TARGET || "unknown";
const nap = await getNAPRecord();
const services = await getServices();
const areas = await getAreas();

const gscRaw = readJsonSafe(GSC_EXPORT);
const gscRows = (gscRaw?.rows ?? []).map((r) => ({
  url: r.keys[0],
  path: (() => { try { return new URL(r.keys[0]).pathname; } catch { return r.keys[0]; } })(),
  clicks: r.clicks,
  impr: r.impressions,
  ctr: r.ctr,
  pos: r.position,
}));

const blLatest = freshestFile(DIRS.refdomainSnapshots, /refdomains-\d{4}-\d{2}-\d{2}\.json$/);
const blData = blLatest ? readJsonSafe(blLatest) : null;
const prevBlFile = (() => {
  const d = DIRS.refdomainSnapshots;
  if (!fs.existsSync(d)) return null;
  const files = fs.readdirSync(d).filter((f) => /refdomains-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  return files.length >= 2 ? path.join(d, files[files.length - 2]) : null;
})();
const prevBl = prevBlFile ? readJsonSafe(prevBlFile) : null;

const posLatest = freshestFile(DIRS.positionSnapshots, /positions-\d{4}-\d{2}-\d{2}\.json$/);
const posData = posLatest ? readJsonSafe(posLatest) : null;
const prevPosFile = (() => {
  const d = DIRS.positionSnapshots;
  if (!fs.existsSync(d)) return null;
  const files = fs.readdirSync(d).filter((f) => /positions-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  return files.length >= 2 ? path.join(d, files[files.length - 2]) : null;
})();
const prevPosData = prevPosFile ? readJsonSafe(prevPosFile) : null;

const prospectFile = freshestFile(DIRS.competitorGap, /prospects-\d{4}-\d{2}-\d{2}\.json$/);
const prospectData = prospectFile ? readJsonSafe(prospectFile) : null;

// keyword-gap.mjs writes `gap-<date>.json` (not `keyword-gap-*`) into the keyword-gap dir.
const kwGapFile = freshestFile(DIRS.keywordGap, /gap-\d{4}-\d{2}-\d{2}\.json$/);
const kwGapData = kwGapFile ? readJsonSafe(kwGapFile) : null;

const gbpSnapshot = freshestFile(DIRS.gbpSnapshots, /gbp-\d{4}-\d{2}-\d{2}\.json$/);
const gbpData = gbpSnapshot ? readJsonSafe(gbpSnapshot) : null;

const businessName = nap?.businessName || "Unknown";

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1 — Start Here (guide)
// ═══════════════════════════════════════════════════════════════════════════
const s1 = workbook.addWorksheet("Start Here");
s1.columns = [{ header: " ", key: "content", width: 100 }];
hdr(s1);
s1.getRow(1).getCell(1).value = "";

const guideLines = [
  [`${businessName} — SEO & GBP Optimisation Workbook`],
  [""],
  [`Generated: ${DATE}  |  Domain: ${domain}  |  Country: ${nap?.country || "GB"}`],
  [""],
  [`HOW TO USE THIS WORKBOOK`],
  [""],
  [`Work tabs left → right in order. Each tab serves a specific purpose:`],
  [""],
  [`  Business Info     — NAP, GBP config, contact details. Single source of truth for all listings.`],
  [`  GBP Setup         — Service areas, categories, and services to configure in your GBP listing.`],
  [`  GSC Indexing      — URL inspection schedule (Mon–Thu, ~10 URLs/day). Prioritised by recrawl value.`],
  [`  GSC Pages         — Every indexed page with impressions, clicks, CTR, and position.`],
  [`  Optimisation      — Pages that need fixing: low-CTR and zero-click pages with suggested actions.`],
  [`  Position Tracker  — Keyword SERP positions with week-over-week movement. Colour-coded.`],
  [`  Backlink Delta    — New and lost referring domains this period.`],
  [`  Citations Tracker — Backlink prospects + core citation platforms. Track outreach status here.`],
  [`  Keyword Gap       — Content opportunities where competitors rank top-30 and you don't.`],
  [`  Services          — Service list with descriptions and target keywords (from Sanity + Ahrefs).`],
  [`  Action Plan       — Prioritised 4-week action plan, review flow, and do-NOT-do list.`],
  [""],
  [`STATUS KEY (used in Citations Tracker)`],
  [""],
  [`  not-started      — Not yet actioned`],
  [`  audit-needed     — Check if profile already exists before creating`],
  [`  in-progress      — Started, applied, or awaiting approval`],
  [`  submitted        — Application sent, waiting for verification`],
  [`  live             — Confirmed live with NAP matching Business Info tab`],
  [`  declined         — Rejected, or deliberately not pursued`],
  [`  not-applicable   — Platform type doesn't fit this business`],
  [""],
  [`CRITICAL RULES`],
  [""],
  [`  NAP consistency: Every citation must use the EXACT NAP from the Business Info tab.`],
  [`    "Rd" vs "Road", different phone formats — any inconsistency hurts ranking.`],
  [""],
  [`  GBP service areas ≠ citation addresses: GBP/Bing/Apple = list ALL service-area towns.`],
  [`    Every other citation = ONE primary address only. Mixed areas = noisy entity-graph.`],
  [""],
  [`  Data sources: Sanity CMS is the source of truth for NAP, services, and areas.`],
  [`    If any field looks wrong, update it in Sanity Studio and re-run this tool.`],
  [""],
  [`REFRESH SCHEDULE`],
  [""],
  [`  Weekly  — Re-run monday-runner.mjs (refreshes all tabs with latest data)`],
  [`  Monthly — Audit Tier 1 citation NAP consistency; check GBP listing for suggested edits`],
  [`  Quarterly — Full NAP audit across top 20 Google results; prune dormant listings`],
  [""],
  [`Last generated: ${new Date().toISOString()}`],
];

for (const [i, row] of guideLines.entries()) {
  const r = s1.getRow(i + 2);
  const cell = r.getCell(1);
  cell.value = row[0];
  const txt = row[0];
  if (txt && /^[A-Z\s]{5,}$/.test(txt)) {
    cell.font = { bold: true, size: 13, color: { argb: "FF1E40AF" } };
    r.height = 22;
  } else if (txt && txt.startsWith("  ")) {
    cell.font = { name: "Consolas", size: 10 };
  } else if (txt && /^[A-Z]/.test(txt) && !txt.startsWith(" ")) {
    cell.font = { bold: true, size: 12, color: { argb: "FF1E40AF" } };
    r.height = 20;
  }
}
s1.getRow(2).getCell(1).font = { bold: true, size: 14, color: { argb: "FF1E40AF" } };
s1.getColumn(1).width = 110;

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2 — Business Info
// ═══════════════════════════════════════════════════════════════════════════
const s2 = workbook.addWorksheet("Business Info");
s2.columns = [
  { header: "Field", key: "field", width: 28 },
  { header: "Value", key: "value", width: 60 },
  { header: "Source", key: "source", width: 40 },
];
hdr(s2);

const bRows = [
  ["BUSINESS IDENTITY", "", ""],
  ["Business name", nap?.businessName || "—", "Sanity → structuredData.organization.name"],
  ["Legal name", nap?.legalName || "—", "Sanity → structuredData.organization.legalName"],
  ["Domain", domain, "Sanity → seo.metadataBase / ahrefs-config.mjs"],
  ["Site title", nap?.siteTitle || "—", "Sanity → branding.siteTitle"],
  ["Description", nap?.description || "—", "Sanity → structuredData.organization.description"],
  ["Price range", nap?.priceRange || "—", "Sanity → structuredData.localBusiness.priceRange"],
  ["", "", ""],
  ["NAP (NAME / ADDRESS / PHONE) — CANONICAL", "", "Copy-paste this block everywhere verbatim"],
  ["Street address", nap?.street || "—", "Sanity → structuredData.organization.address.streetAddress"],
  ["City", nap?.city || "—", "Sanity → structuredData.organization.address.addressLocality"],
  ["Region", nap?.region || "—", "Sanity → structuredData.organization.address.addressRegion"],
  ["Postcode", nap?.postcode || "—", "Sanity → structuredData.organization.address.postalCode"],
  ["Country", nap?.country || "GB", "Sanity → structuredData.organization.address.addressCountry"],
  ["Phone (primary)", nap?.phone || "—", "Sanity → structuredData.organization.contact.phone"],
  ["Email", nap?.email || "—", "Sanity → structuredData.organization.contact.email"],
  ["WhatsApp", nap?.whatsappNumber || "—", "Sanity → branding.whatsappNumber"],
  ["", "", ""],
  ["Canonical NAP block", "", "Copy this block exactly into every citation:"],
  ["  (formatted)", [nap?.businessName, nap?.street, [nap?.city, nap?.region, nap?.postcode].filter(Boolean).join(" "), nap?.phone].filter(Boolean).join("\n") || "—", ""],
  ["", "", ""],
  ["GEO COORDINATES", "", ""],
  ["Latitude", nap?.latitude || "—", "Sanity → structuredData.organization.geo.latitude"],
  ["Longitude", nap?.longitude || "—", "Sanity → structuredData.organization.geo.longitude"],
  ["", "", ""],
  ["SOCIAL PROFILES", "", "Sanity → structuredData.organization.sameAs"],
];
if (nap?.sameAs?.length) {
  for (const url of nap.sameAs) {
    const platform = url.match(/(?:facebook|linkedin|instagram|twitter|x\.com|youtube|tiktok)/i)?.[0] || "Other";
    bRows.push(["  " + platform.charAt(0).toUpperCase() + platform.slice(1), url, ""]);
  }
} else {
  bRows.push(["  (none configured)", "Add social URLs in Sanity → Settings → Structured Data → sameAs", ""]);
}

bRows.push(
  ["", "", ""],
  ["COMPETITORS", (COMPETITORS || []).join(", ") || "—", "ahrefs-config.mjs → COMPETITORS"],
  ["PRIORITY KEYWORDS", String((PRIORITY_KEYWORDS || []).length) + " tracked", "ahrefs-config.mjs → PRIORITY_KEYWORDS"],
  ["", "", ""],
  ["GBP PERFORMANCE (latest snapshot)", "", `GBP data from ${gbpSnapshot || "no snapshot yet"}`],
);
if (gbpData) {
  const t = gbpData.totals || {};
  bRows.push(
    ["Website clicks (90d)", fmtNum(t.websiteClicks), ""],
    ["Call clicks (90d)", fmtNum(t.callClicks), ""],
    ["Direction requests (90d)", fmtNum(t.directionRequests), ""],
    ["Total searches (90d)", fmtNum(t.totalSearches), ""],
    ["Direct searches", fmtNum(t.directSearches), "User searched for business by name"],
    ["Discovery searches", fmtNum(t.discoverySearches), "User searched for category/service"],
  );
}

for (const row of bRows) {
  const r = s2.addRow({ field: row[0], value: row[1], source: row[2] });
  if (row[0] && /^[A-Z\s]{5,}/.test(row[0]) && row[0].includes(" ")) {
    r.getCell(1).font = { bold: true, size: 12, color: { argb: "FF1E40AF" } };
    r.eachCell((c) => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F4FF" } }; });
    r.height = 20;
  }
}
autoFit(s2, 10, 65);

// ═══════════════════════════════════════════════════════════════════════════
// TAB 3 — GBP Setup
// ═══════════════════════════════════════════════════════════════════════════
const s3 = workbook.addWorksheet("GBP Setup");
s3.columns = [
  { header: "Section", key: "section", width: 18 },
  { header: "Item", key: "item", width: 42 },
  { header: "Detail / Rationale", key: "detail", width: 58 },
];
hdr(s3);

let rn = 2;

// Service areas from Sanity areas + priority keyword locations
secHdr(s3, rn++, "SERVICE AREAS (list ALL in GBP → Edit profile → Location → Service area)");
const areaSet = new Set();
if (areas?.length) {
  for (const a of areas) {
    if (!areaSet.has(a.name)) {
      areaSet.add(a.name);
      s3.addRow({ section: "Service Area", item: a.name, detail: `From Sanity — area "${a.slug}". Ensure /areas-we-cover/${a.slug}/ page is published.` });
    }
  }
}
if (PRIORITY_KEYWORDS?.length) {
  for (const { location } of PRIORITY_KEYWORDS) {
    if (!location || location === "United Kingdom") continue;
    const town = location.split(",")[0].trim();
    if (town && !areaSet.has(town)) {
      areaSet.add(town);
      s3.addRow({ section: "Service Area", item: town, detail: `From priority keyword location: "${location}" — verify the city page exists.` });
    }
  }
}
if (areaSet.size === 0) {
  s3.addRow({ section: "Service Area", item: "No areas configured", detail: "Add areas in Sanity Studio → Areas, or add location-specific keywords in ahrefs-config.mjs." });
}

// GBP Categories
rn = s3.rowCount + 1;
secHdr(s3, rn++, "SUGGESTED GBP CATEGORIES (primary + up to 9 additional)");
const catMap = {
  "web design": "Website Designer", "seo": "SEO Service", "digital marketing": "Marketing Agency",
  "web development": "Website Designer", "local seo": "SEO Service", "social media": "Social Media Marketing Agency",
  "ppc|google ads|adwords": "Advertising Agency", "content marketing": "Marketing Consultant",
  "ecommerce": "E-Commerce Service", "app development": "Software Company",
  "hosting": "Internet Service Provider", "consult": "Marketing Consultant",
  "brand": "Branding Agency", "design": "Graphic Designer",
};
const seenCats = new Set();
if (PRIORITY_KEYWORDS?.length) {
  for (const { keyword } of PRIORITY_KEYWORDS) {
    const lower = keyword.toLowerCase();
    for (const [pattern, cat] of Object.entries(catMap)) {
      if (new RegExp(pattern, "i").test(lower) && !seenCats.has(cat)) {
        seenCats.add(cat);
        s3.addRow({ section: "Category", item: cat, detail: `Suggested by priority keyword: "${keyword}"` });
        break;
      }
    }
  }
}

// Also derive from Sanity services
if (services?.length) {
  for (const svc of services) {
    const lower = svc.name.toLowerCase();
    for (const [pattern, cat] of Object.entries(catMap)) {
      if (new RegExp(pattern, "i").test(lower) && !seenCats.has(cat)) {
        seenCats.add(cat);
        s3.addRow({ section: "Category", item: cat, detail: `Suggested by Sanity service: "${svc.name}"` });
        break;
      }
    }
  }
}
if (!seenCats.has("Internet marketing service")) {
  s3.addRow({ section: "Category (Primary)", item: "Internet marketing service", detail: "Broadest default for digital agencies. Swap if your primary business is narrower." });
}

// GBP Services
rn = s3.rowCount + 1;
secHdr(s3, rn++, "GBP SERVICES (list up to 30 in GBP → Edit profile → Services)");
if (services?.length) {
  for (const svc of services) {
    s3.addRow({
      section: "Service",
      item: svc.name,
      detail: `From Sanity — ${svc.summary || "no summary"}. Description ≥50 chars. Link to /${svc.slug || ""}. If custom-quote, set "No price".`,
    });
  }
}

// GBP Posts
rn = s3.rowCount + 1;
secHdr(s3, rn++, "GBP POST TOPICS (2x/week; Update type expires after 7 days)");
const topGsc = [...gscRows].sort((a, b) => b.impr - a.impr).slice(0, 6);
for (const p of topGsc) {
  const title = p.path.replace(/^\/+|\/+$/g, "").replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  if (title.length > 3) {
    s3.addRow({ section: "Post", item: `Highlight: ${title}`, detail: `${fmtNum(p.impr)} impressions — create GBP post linking to this page. 1200×900 image.` });
  }
}
if (kwGapData?.gap) {
  const localKws = kwGapData.gap.filter((g) => (g.volume ?? 0) >= 100 && (g.keyword_difficulty ?? 99) <= 40).sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)).slice(0, 6);
  for (const g of localKws) {
    s3.addRow({ section: "Post", item: `"${g.keyword}" — new content`, detail: `Vol: ${g.volume} | KD: ${g.keyword_difficulty} | Write blog post → share as GBP Update.` });
  }
}

// Q&A
rn = s3.rowCount + 1;
secHdr(s3, rn++, "Q&A SEEDING (seed 5+ questions via owner account)");
const qaCandidates = [...gscRows].filter((r) => r.impr >= 200).slice(0, 6);
for (const r of qaCandidates) {
  const topic = r.path.replace(/^\/+|\/+$/g, "").replace(/[-_]/g, " ").replace(/\//g, " — ");
  s3.addRow({ section: "Q&A", item: `What ${topic} services do you offer?`, detail: `${fmtNum(r.impr)} monthly impressions — seed this Q and answer as owner.` });
}

// Photos
rn = s3.rowCount + 1;
secHdr(s3, rn++, "PHOTOS & VIDEOS (10+ photos; refresh 1/month)");
s3.addRow({ section: "Photo", item: "Upload logo (PNG transparent, ≥250×250)", detail: "42% more direction requests with photos." });
s3.addRow({ section: "Photo", item: "Upload cover photo (1080×608, 16:9)", detail: "Top of knowledge panel in search results." });
s3.addRow({ section: "Photo", item: "Upload team / office photo", detail: "Signals legitimacy even for SAB listings." });
s3.addRow({ section: "Photo", item: "Upload 1 photo per primary service", detail: `${seenCats.size} category suggestions — 1 photo per service minimum.` });
s3.addRow({ section: "Video", item: "30-second service overview", detail: "3x more engagement on GBP profiles with video." });

autoFit(s3, 10, 60);

// ═══════════════════════════════════════════════════════════════════════════
// TAB 4 — GSC Indexing
// ═══════════════════════════════════════════════════════════════════════════
const s4 = workbook.addWorksheet("GSC Indexing");
s4.columns = [
  { header: "Day", key: "day", width: 10 },
  { header: "#", key: "num", width: 6 },
  { header: "URL Path", key: "path", width: 55 },
  { header: "Priority", key: "priority", width: 12 },
  { header: "Reason", key: "reason", width: 35 },
  { header: "Submitted?", key: "submitted", width: 12 },
  { header: "Indexed?", key: "indexed", width: 10 },
];
hdr(s4);

const idxCandidates = [];
for (const r of gscRows) {
  let priority = "Low", reason = "";
  if (r.impr >= 100 && r.ctr < 0.01) { priority = "High"; reason = "High impressions + very low CTR — indexing or snippet issues"; }
  else if (r.clicks === 0 && r.impr >= 50) { priority = "High"; reason = "Zero clicks at decent impressions — may need reindexing"; }
  else if (r.impr >= 500) { priority = "Medium"; reason = "High-impression page — verify indexed correctly"; }
  else if (r.impr >= 100) { priority = "Low"; reason = "Moderate impressions"; }
  if (priority !== "Low" || reason) idxCandidates.push({ path: r.path, priority, reason });
}
idxCandidates.sort((a, b) => (a.priority === "High" ? -1 : 1) - (b.priority === "High" ? -1 : 1));

const days = ["Monday", "Tuesday", "Wednesday", "Thursday"];
const perDay = Math.min(Math.ceil(idxCandidates.length / 4), 10);
let iX = 0;
for (const day of days) {
  for (let j = 0; j < perDay && iX < idxCandidates.length; j++, iX++) {
    const r = idxCandidates[iX];
    s4.addRow({ day, num: j + 1, path: r.path, priority: r.priority, reason: r.reason, submitted: "", indexed: "" });
  }
}
if (idxCandidates.length === 0) {
  s4.addRow({ day: "—", num: "", path: "No URLs identified. Run GSC fetch step first.", priority: "", reason: "", submitted: "", indexed: "" });
}
for (const col of [6, 7]) {
  s4.getColumn(col).eachCell({ includeEmpty: true }, (cell, rowNum) => {
    if (rowNum > 1 && rowNum <= s4.rowCount) {
      cell.dataValidation = { type: "list", allowBlank: true, formulae: ['"Yes,No"'] };
    }
  });
}
autoFit(s4);

// ═══════════════════════════════════════════════════════════════════════════
// TAB 5 — GSC Pages
// ═══════════════════════════════════════════════════════════════════════════
const s5 = workbook.addWorksheet("GSC Pages");
s5.columns = [
  { header: "#", key: "rank", width: 6 },
  { header: "Path", key: "path", width: 55 },
  { header: "Impressions", key: "impr", width: 15 },
  { header: "Clicks", key: "clicks", width: 12 },
  { header: "CTR", key: "ctr", width: 10 },
  { header: "Avg Position", key: "pos", width: 14 },
];
hdr(s5);
[...gscRows].sort((a, b) => b.impr - a.impr).forEach((r, i) => {
  s5.addRow({ rank: i + 1, path: r.path, impr: r.impr, clicks: r.clicks, ctr: (r.ctr * 100).toFixed(2) + "%", pos: r.pos.toFixed(1) });
});
autoFit(s5);

// ═══════════════════════════════════════════════════════════════════════════
// TAB 6 — Optimisation Targets
// ═══════════════════════════════════════════════════════════════════════════
const s6 = workbook.addWorksheet("Optimisation Targets");
s6.columns = [
  { header: "Issue", key: "type", width: 18 },
  { header: "Path", key: "path", width: 55 },
  { header: "Impressions", key: "impr", width: 15 },
  { header: "Clicks", key: "clicks", width: 12 },
  { header: "CTR", key: "ctr", width: 10 },
  { header: "Avg Position", key: "pos", width: 14 },
  { header: "Suggested Action", key: "action", width: 42 },
];
hdr(s6);

const optTargets = []; // captured for CSV export below
const lowCtr = gscRows.filter((r) => r.impr >= 100 && r.ctr < 0.01).sort((a, b) => b.impr - a.impr);
for (const r of lowCtr) {
  let action = "Update title tag & meta description for higher CTR";
  if (r.pos <= 3) action = "Add rich snippet schema (FAQ / Review / HowTo); optimise SERP snippet text";
  else if (r.pos <= 10) action = "Improve page title for higher CTR; A/B test meta description angle";
  optTargets.push({ type: "Low CTR (<1%)", path: r.path, impr: r.impr, clicks: r.clicks, ctr: (r.ctr * 100).toFixed(2) + "%", pos: r.pos.toFixed(1), action });
}
const noClicks = gscRows.filter((r) => r.clicks === 0 && r.impr >= 10).sort((a, b) => b.impr - a.impr);
for (const r of noClicks) {
  let action = "Add internal links from high-authority pages";
  if (r.pos >= 20) action = "Improve content depth; target longer-tail keyword variations";
  else if (r.pos <= 10) action = "Review on-page SEO (H1, schema, content quality); check for cannibalisation";
  optTargets.push({ type: "Zero Clicks", path: r.path, impr: r.impr, clicks: r.clicks, ctr: (r.ctr * 100).toFixed(2) + "%", pos: r.pos.toFixed(1), action });
}
for (const t of optTargets) s6.addRow(t);
autoFit(s6);

// ═══════════════════════════════════════════════════════════════════════════
// TAB 7 — Position Tracker
// ═══════════════════════════════════════════════════════════════════════════
const s7 = workbook.addWorksheet("Position Tracker");
s7.columns = [
  { header: "Movement", key: "movement", width: 11 },
  { header: "Keyword", key: "keyword", width: 32 },
  { header: "Location", key: "location", width: 22 },
  { header: "Prev Pos", key: "prevPos", width: 11 },
  { header: "Curr Pos", key: "currPos", width: 11 },
  { header: "Delta", key: "delta", width: 8 },
  { header: "Top Competitor", key: "topComp", width: 35 },
  { header: "Our URL", key: "url", width: 45 },
];
hdr(s7);

let posMovements = []; // captured for CSV export below
if (posData) {
  const prevByKw = prevPosData
    ? new Map(prevPosData.positions.map((p) => [`${p.keyword}::${p.location ?? ""}`, p]))
    : new Map();
  const movements = posData.positions.map((curr) => {
    const key = `${curr.keyword}::${curr.location ?? ""}`;
    const prev = prevByKw.get(key);
    const pp = prev?.our_position ?? null;
    const cp = curr.our_position ?? null;
    let delta = null;
    if (pp != null && cp != null) delta = pp - cp;
    let mv = "unchanged";
    if (pp == null && cp != null) mv = "new";
    else if (pp != null && cp == null) mv = "lost";
    else if (delta != null && delta >= 5) mv = "improved";
    else if (delta != null && delta <= -5) mv = "declined";
    else if (delta != null && delta !== 0) mv = "minor";
    return { ...curr, prev_position: pp, delta, movement: mv };
  });
  const ork = { improved: 0, new: 1, minor: 2, unchanged: 3, declined: 4, lost: 5 };
  movements.sort((a, b) => ork[a.movement] - ork[b.movement] || Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0));
  posMovements = movements;
  for (const m of movements) {
    const tc = m.top_competitor;
    const row = s7.addRow({
      movement: m.movement, keyword: m.keyword, location: m.location || "—",
      prevPos: m.prev_position ?? "—", currPos: m.our_position ?? "—",
      delta: m.delta != null ? (m.delta > 0 ? "+" + m.delta : String(m.delta)) : "—",
      topComp: tc ? `#${tc.position} ${(tc.url || "").replace(/^https?:\/\/(www\.)?/, "").slice(0, 28)}` : "—",
      url: m.our_url ? m.our_url.replace(/^https?:\/\/(www\.)?/, "") : "—",
    });
    if (m.movement === "improved") greenRow(row);
    if (m.movement === "declined" || m.movement === "lost") redRow(row);
    if (m.movement === "new") blueRow(row);
  }
} else {
  s7.addRow({ movement: "—", keyword: "Run position-tracker step first", location: "", prevPos: "", currPos: "", delta: "", topComp: "", url: "" });
}
autoFit(s7);

// ═══════════════════════════════════════════════════════════════════════════
// TAB 8 — Backlink Delta
// ═══════════════════════════════════════════════════════════════════════════
const s8 = workbook.addWorksheet("Backlink Delta");
s8.columns = [
  { header: "Change", key: "change", width: 10 },
  { header: "Domain", key: "domain", width: 35 },
  { header: "DR", key: "dr", width: 8 },
  { header: "Links to target", key: "links", width: 16 },
  { header: "Dofollow links", key: "dofollow", width: 15 },
  { header: "First / Last seen", key: "seen", width: 20 },
];
hdr(s8);

if (blData && prevBl) {
  const prevDoms = new Map((prevBl.refdomains || []).map((r) => [r.domain, r]));
  const currDoms = new Map((blData.refdomains || []).map((r) => [r.domain, r]));
  const nd = (blData.refdomains || []).filter((r) => !prevDoms.has(r.domain)).sort((a, b) => (b.domain_rating ?? 0) - (a.domain_rating ?? 0));
  const ld = (prevBl.refdomains || []).filter((r) => !currDoms.has(r.domain)).sort((a, b) => (b.domain_rating ?? 0) - (a.domain_rating ?? 0));
  for (const d of nd) s8.addRow({ change: "NEW", domain: d.domain, dr: d.domain_rating ?? "—", links: d.links_to_target ?? "—", dofollow: d.dofollow_links ?? "—", seen: d.first_seen ?? "—" });
  for (const d of ld) s8.addRow({ change: "LOST", domain: d.domain, dr: d.domain_rating ?? "—", links: d.links_to_target ?? "—", dofollow: "—", seen: d.last_seen ?? "—" });
  if (nd.length === 0 && ld.length === 0) s8.addRow({ change: "—", domain: "No changes detected", dr: "", links: "", dofollow: "", seen: "" });
} else {
  s8.addRow({ change: "—", domain: "Baseline snapshot only — re-run next week for delta", dr: "", links: "", dofollow: "", seen: "" });
}
autoFit(s8);

// ═══════════════════════════════════════════════════════════════════════════
// TAB 9 — Citations Tracker
// ═══════════════════════════════════════════════════════════════════════════
const s9 = workbook.addWorksheet("Citations Tracker");
s9.columns = [
  { header: "#", key: "rank", width: 6 },
  { header: "Domain", key: "domain", width: 30 },
  { header: "DR", key: "dr", width: 8 },
  { header: "Platform Type", key: "type", width: 16 },
  { header: "Competitors Linking", key: "comps", width: 32 },
  { header: "Services to Feature", key: "services", width: 30 },
  { header: "Location to List", key: "location", width: 22 },
  { header: "Status", key: "status", width: 16 },
  { header: "Notes", key: "notes", width: 35 },
];
hdr(s9);

const svcNames = (services || []).slice(0, 5).map((s) => s.name).join("; ") || "All services";
const priAddr = nap?.city || "Primary address";

const tier1Platforms = [
  { domain: "business.google.com", dr: "—", type: "Tier 1 — Core", comps: "—", services: "All primary services", location: "Primary address", status: "audit-needed", notes: "Verify NAP matches Business Info tab exactly." },
  { domain: "bingplaces.com", dr: "—", type: "Tier 1 — Core", comps: "—", services: "Top 10 services", location: priAddr, status: "not-started", notes: "Import from GBP if possible." },
  { domain: "businessconnect.apple.com", dr: "—", type: "Tier 1 — Core", comps: "—", services: "Top 10 services", location: priAddr, status: "not-started", notes: "Apple Maps — growing market share." },
  { domain: "foursquare.com", dr: "—", type: "Tier 1 — Core", comps: "—", services: svcNames, location: priAddr, status: "not-started", notes: "" },
  { domain: "yelp.co.uk", dr: "—", type: "Tier 1 — Core", comps: "—", services: svcNames, location: priAddr, status: "not-started", notes: "Claim free listing." },
  { domain: "trustpilot.com", dr: "—", type: "Tier 1 — Review", comps: "—", services: "—", location: "—", status: "audit-needed", notes: "Claim/create. 4.5+ target. Send review link after project handover." },
];
for (const p of tier1Platforms) {
  s9.addRow(p);
}

if (prospectData?.prospects) {
  for (const [i, p] of prospectData.prospects.slice(0, 60).entries()) {
    const cc = (p.competitors_linking || []).length;
    let pType = "Tier 2 — National";
    if (cc >= 3 && p.domain_rating >= 50) pType = "Tier 2 — High Value";
    else if (cc >= 2) pType = "Tier 3 — Regional";
    else pType = "Tier 4 — Niche";
    s9.addRow({
      rank: i + 1, domain: p.domain, dr: p.domain_rating ?? "—", type: pType,
      comps: (p.competitors_linking || []).join(", "), services: svcNames, location: priAddr,
      status: "not-started", notes: p.has_dofollow_link ? "Dofollow available" : "Check for dofollow opportunity",
    });
  }
}
statusDropdown(s9, 8, 2, s9.rowCount);
autoFit(s9, 10, 38);

// ═══════════════════════════════════════════════════════════════════════════
// TAB 10 — Keyword Gap
// ═══════════════════════════════════════════════════════════════════════════
const s10 = workbook.addWorksheet("Keyword Gap");
s10.columns = [
  { header: "#", key: "rank", width: 6 },
  { header: "Keyword", key: "keyword", width: 35 },
  { header: "Volume", key: "volume", width: 11 },
  { header: "KD", key: "kd", width: 8 },
  { header: "CPC", key: "cpc", width: 9 },
  { header: "Target pos", key: "tpos", width: 12 },
  { header: "Competitors ranking", key: "comps", width: 42 },
  { header: "Priority", key: "priority", width: 12 },
];
hdr(s10);

let kwGapRows = []; // captured for CSV export below
if (kwGapData?.gap) {
  const sorted = [...kwGapData.gap].sort((a, b) => {
    const ac = Object.keys(a.competitors_ranking || {}).length;
    const bc = Object.keys(b.competitors_ranking || {}).length;
    if (bc !== ac) return bc - ac;
    return (b.volume ?? 0) - (a.volume ?? 0);
  });
  kwGapRows = sorted.map((g) => {
    const comps = Object.entries(g.competitors_ranking || {}).map(([c, p]) => `${c.replace(/\..*/, "")}@${p}`).join(", ");
    const cc = Object.keys(g.competitors_ranking || {}).length;
    let priority = "Medium";
    if (cc >= 3 && (g.keyword_difficulty ?? 99) <= 30) priority = "High";
    else if (cc >= 3 && (g.volume ?? 0) >= 500) priority = "High";
    else if (cc < 2) priority = "Review";
    return { keyword: g.keyword, volume: g.volume ?? "—", kd: g.keyword_difficulty ?? "—", cpc: g.cpc ? g.cpc.toFixed(2) : "—", tpos: g.target_position ?? "—", comps, priority };
  });
  kwGapRows.forEach((row, i) => s10.addRow({ rank: i + 1, ...row }));
} else {
  s10.addRow({ rank: "", keyword: "Run keyword-gap step first", volume: "", kd: "", cpc: "", tpos: "", comps: "", priority: "" });
}
autoFit(s10);

// ═══════════════════════════════════════════════════════════════════════════
// TAB 11 — Autocomplete
// ═══════════════════════════════════════════════════════════════════════════
const acFile = freshestFile(DIRS.autocomplete, /autocomplete-\d{4}-\d{2}-\d{2}\.json$/);
const acData = acFile ? readJsonSafe(acFile) : null;

const s11 = workbook.addWorksheet("Autocomplete");
s11.columns = [
  { header: "Category", key: "category", width: 16 },
  { header: "Query", key: "query", width: 55 },
  { header: "Seed", key: "seed", width: 40 },
  { header: "Content Use", key: "use", width: 50 },
];
hdr(s11);

if (acData?.all) {
  const order = ["Question", "Pricing", "Comparison", "Local Intent", "Emergency", "General"];
  const sorted = [...acData.all].sort((a, b) => {
    const ai = order.indexOf(a.category);
    const bi = order.indexOf(b.category);
    if (ai !== bi) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    return a.query.localeCompare(b.query);
  });

  const useMap = {
    Question: "FAQ item on service/area page",
    Pricing: "Blog post or pricing indication field",
    Comparison: "Comparison blog post (e.g. 'X vs Y')",
    "Local Intent": "Area page H1 or GBP post angle",
    Emergency: "Service page urgency CTA + GBP post",
    General: "Service page keyword or blog topic",
  };

  for (const r of sorted) {
    const row = s11.addRow({ category: r.category, query: r.query, seed: r.seed, use: useMap[r.category] || "General keyword target" });
    if (r.category === "Question") blueRow(row);
    if (r.category === "Emergency") redRow(row);
    if (r.category === "Pricing") greenRow(row);
  }
} else {
  s11.addRow({ category: "", query: "Run google-autocomplete step first", seed: "", use: "" });
}
autoFit(s11, 10, 58);

// ═══════════════════════════════════════════════════════════════════════════
// TAB 12 — Services
// ═══════════════════════════════════════════════════════════════════════════
const s12 = workbook.addWorksheet("Services");
s12.columns = [
  { header: "#", key: "rank", width: 6 },
  { header: "Service Name", key: "name", width: 30 },
  { header: "Slug", key: "slug", width: 30 },
  { header: "Short Description", key: "shortDesc", width: 45 },
  { header: "SEO Description", key: "seoDesc", width: 55 },
  { header: "Target Keywords", key: "keywords", width: 35 },
  { header: "Location Scope", key: "location", width: 22 },
  { header: "NAP Usage", key: "nap", width: 20 },
];
hdr(s12);

if (services?.length) {
  for (const [i, svc] of services.entries()) {
    const kwMatch = (PRIORITY_KEYWORDS || []).filter((k) =>
      k.keyword.toLowerCase().includes(svc.name.toLowerCase()) || svc.name.toLowerCase().includes(k.keyword.toLowerCase())
    );
    const kws = kwMatch.length ? kwMatch.map((k) => k.keyword).join(", ") : svc.name.toLowerCase().replace(/\s+/g, ", ");
    s12.addRow({
      rank: i + 1, name: svc.name, slug: svc.slug || "",
      shortDesc: svc.summary || `Professional ${svc.name.toLowerCase()} services.`,
      seoDesc: `Expert ${svc.name.toLowerCase()} services. Our ${svc.name.toLowerCase()} offering helps businesses achieve measurable results. Contact us for a free consultation.`,
      keywords: kws, location: "UK-wide", nap: "Use Business Info NAP verbatim",
    });
  }
}
  if (!services?.length) {
  s12.addRow({ rank: "", name: "No services in Sanity — seed Sanity Studio first", slug: "", shortDesc: "", seoDesc: "", keywords: "", location: "", nap: "" });
}
autoFit(s12, 10, 58);

// ═══════════════════════════════════════════════════════════════════════════
// TAB 13 — Action Plan
// ═══════════════════════════════════════════════════════════════════════════
const s13 = workbook.addWorksheet("Action Plan");
s13.columns = [
  { header: "Week", key: "week", width: 14 },
  { header: "Priority", key: "priority", width: 12 },
  { header: "Action", key: "action", width: 55 },
  { header: "Detail", key: "detail", width: 55 },
  { header: "Done?", key: "done", width: 8 },
];
hdr(s13);

const topGwGap = kwGapData?.gap?.[0];
const topGapKeyword = topGwGap?.keyword || "top opportunity";

const actionPlan = [
  ["WEEK 1 — Foundation", "High", "Verify NAP in Business Info tab", `Confirm name, address, phone match ${businessName}'s actual details. Update Sanity Studio if anything is wrong.`, ""],
  ["", "High", "Audit GBP listing", `Open business.google.com for ${businessName}. Run the GBP Setup tab checks — categories, services, service areas, photos, Q&A.`, ""],
  ["", "High", "Claim Tier 1 citations", "Bing Places, Apple Business Connect, Foursquare, Yelp UK — use NAP from Business Info tab verbatim.", ""],
  ["", "Medium", "Set up review acquisition flow", "Create project-handover email template with GBP + Trustpilot review links. Target: 1 new review per completed project.", ""],
  ["", "Medium", "Seed 5 GBP Q&A questions", "From the GBP Setup tab → Q&A SEEDING. Post as owner with owner-marked answers.", ""],
  ["", "", "", "", ""],
  ["WEEK 2 — Content & GSC", "High", "Fix optimisation targets", "From Optimisation Targets tab — tackle top 5 low-CTR and top 5 zero-click pages. Update titles, metas, add schema.", ""],
  ["", "High", "Run GSC Indexing schedule", "From GSC Indexing tab — submit Mon–Thu URLs via GSC URL Inspection tool. ~10 URLs/day.", ""],
  ["", "Medium", "Publish 2 GBP posts", "From GBP Setup tab → GBP POST TOPICS. 1200×900 images, include CTA button.", ""],
  ["", "Medium", `Write content for: "${topGapKeyword}"`, topGwGap ? `Vol: ${topGwGap.volume} | KD: ${topGwGap.keyword_difficulty}. Publish blog post or service page targeting this keyword.` : "Run keyword-gap step first.", ""],
  ["", "", "", "", ""],
  ["WEEK 3 — Links & Citations", "High", "Outreach to top 5 link prospects", "From Citations Tracker — focus on Tier 2 High Value prospects (DR ≥50, ≥3 competitors linking). Research editorial angle first.", ""],
  ["", "High", "Complete Tier 2+3 citation listings", "From Citations Tracker — work through remaining Tier 2 National and Tier 3 Regional listings. Update status column as you go.", ""],
  ["", "Medium", "Publish 2 GBP posts", "Second batch — use fresh content or highlight a recent project/case study.", ""],
  ["", "Medium", "Respond to all GBP reviews", "Every review gets a personalised response within 48h. Name the project type and restate value delivered.", ""],
  ["", "", "", "", ""],
  ["WEEK 4 — Review & Optimise", "High", "Re-run full pipeline", "node frontend/seo/monday-runner.mjs — generates fresh data and new XLSX workbook. Compare deltas.", ""],
  ["", "High", "Audit Tier 1 citation NAP consistency", `Search "${businessName}" on Google. Verify top 10 results match Business Info NAP exactly (Rd vs Road, phone format).`, ""],
  ["", "Medium", `Deploy content for top 3 keyword gaps`, kwGapData?.gap ? kwGapData.gap.slice(0, 3).map((g) => `"${g.keyword}"`).join(", ") : "—", ""],
  ["", "Medium", "Add 1 new photo to GBP", "Office, team, or project photo. Keeps 'Recent updates' signal alive in the knowledge panel.", ""],
  ["", "Low", "Schedule Month 2 plan", "Review what's working. Adjust posting cadence and outreach targets based on Week 1-3 results.", ""],
  ["", "", "", "", ""],
  ["⚠ DO NOT DO", "Critical", "Mix address formats across citations", "Rd vs Road, 0161 vs +44 — any inconsistency actively hurts ranking. Use Business Info NAP verbatim.", ""],
  ["", "Critical", "Create multiple GBP listings", `One GBP only for ${businessName}. Multiple listings for same business = suspension risk.`, ""],
  ["", "Critical", "List all service areas on Tier 2-5 citations", "GBP/Bing/Apple = list all service areas. All other citations = primary address ONLY.", ""],
  ["", "High", "Ignore GBP suggested edits from public", "Google users can suggest edits to your listing. Check weekly — reject any that contradict the canonical state.", ""],
  ["", "High", "Buy backlinks or use link farms", "All outreach should be editorial. Paid links violate Google guidelines.", ""],
  ["", "Medium", "Leave negative reviews unanswered", "Every negative review gets a public response within 24h + private follow-up.", ""],
];

for (const row of actionPlan) {
  const r = s13.addRow({ week: row[0], priority: row[1], action: row[2], detail: row[3], done: row[4] });
  if (row[0]?.startsWith("WEEK")) {
    r.eachCell((c) => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } }; });
    r.getCell(1).font = { bold: true, size: 12, color: { argb: "FF1E40AF" } };
    r.height = 20;
  }
  if (row[0] === "⚠ DO NOT DO") {
    r.eachCell((c) => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } }; });
    r.getCell(1).font = { bold: true, size: 12, color: { argb: "FFDC2626" } };
    r.height = 20;
  }
}
autoFit(s13, 10, 60);
s13.getColumn(5).eachCell({ includeEmpty: true }, (cell, rowNum) => {
  if (rowNum > 1) cell.dataValidation = { type: "list", allowBlank: true, formulae: ['"✓,✗,—"'] };
});

// ═══════════════════════════════════════════════════════════════════════════
// CSV exports — machine-readable copies of the actionable recommendation tables
// (the Excel workbook stays the formatted client deliverable; these are for
// importing into other tools / sheets). Written to frontend/seo/data/csv/.
// ═══════════════════════════════════════════════════════════════════════════
const csvFiles = [];
csvFiles.push(writeCsv(
  path.join(DIRS.csv, `optimisation-targets-${DATE}.csv`),
  [
    { header: "Issue", key: "type" },
    { header: "Path", key: "path" },
    { header: "Impressions", key: "impr" },
    { header: "Clicks", key: "clicks" },
    { header: "CTR", key: "ctr" },
    { header: "Avg position", key: "pos" },
    { header: "Suggested action", key: "action" },
  ],
  optTargets,
));
csvFiles.push(writeCsv(
  path.join(DIRS.csv, `keyword-gap-${DATE}.csv`),
  [
    { header: "Keyword", key: "keyword" },
    { header: "Volume", key: "volume" },
    { header: "KD", key: "kd" },
    { header: "CPC", key: "cpc" },
    { header: "Target position", key: "tpos" },
    { header: "Competitors ranking", key: "comps" },
    { header: "Priority", key: "priority" },
  ],
  kwGapRows,
));
csvFiles.push(writeCsv(
  path.join(DIRS.csv, `position-tracker-${DATE}.csv`),
  [
    { header: "Movement", key: "movement" },
    { header: "Keyword", key: "keyword" },
    { header: "Location", key: "location" },
    { header: "Prev position", key: "prevPos" },
    { header: "Curr position", key: "currPos" },
    { header: "Delta", key: "delta" },
    { header: "Top competitor", key: "topCompetitor" },
    { header: "Our URL", key: "ourUrl" },
  ],
  posMovements.map((m) => ({
    movement: m.movement,
    keyword: m.keyword,
    location: m.location || "",
    prevPos: m.prev_position ?? "",
    currPos: m.our_position ?? "",
    delta: m.delta != null ? m.delta : "",
    topCompetitor: m.top_competitor ? `#${m.top_competitor.position} ${(m.top_competitor.url || "").replace(/^https?:\/\/(www\.)?/, "")}` : "",
    ourUrl: m.our_url ? m.our_url.replace(/^https?:\/\/(www\.)?/, "") : "",
  })),
));
for (const f of csvFiles) console.log(`Wrote ${f.replace(/\\/g, "/")}`);

// ═══════════════════════════════════════════════════════════════════════════
// Write file
// ═══════════════════════════════════════════════════════════════════════════
const xlsxPath = path.join(DATA_DIR, `monday-run-${DATE}.xlsx`);
fs.mkdirSync(path.dirname(xlsxPath), { recursive: true });
await workbook.xlsx.writeFile(xlsxPath);
console.log(`Wrote ${xlsxPath.replace(/\\/g, "/")}`);
console.log(`Tabs: ${workbook.worksheets.map((ws) => ws.name).join(", ")}`);
