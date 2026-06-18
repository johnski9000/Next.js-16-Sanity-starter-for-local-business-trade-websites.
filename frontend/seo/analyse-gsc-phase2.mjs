// GSC phase-2 analyser — the query-level layer phase-1 can't do. Reads the on-disk
// GSC exports (+ optional KD cache + content-age snapshot), runs the four checks in
// gsc-phase2-lib.mjs, and writes a human report, a quick-wins CSV, and a filled
// striking-distance targets file. No API calls here (crash-isolated, like phase1) —
// gsc-query.mjs / dataforseo-kd.mjs / sanity-content-snapshot.mjs produce the inputs.
//
// Inputs (all under data/.../gsc/, written by the producers above):
//   gsc-queries-90d.json · gsc-query-page-90d.json · gsc-query-country-90d.json
//   gsc-kd-cache.json (optional) · sanity-content-ages.json (optional) · gsc-pages-90d.json (hubs)
// Outputs:
//   gsc-phase2-report.md · csv/gsc-phase2-quickwins-<date>.csv · striking-distance-targets-<date>.md
import fs from "node:fs";
import path from "node:path";
import {
  DIRS,
  GSC_EXPORT,
  GSC_QUERIES_EXPORT,
  GSC_QUERY_PAGE_EXPORT,
  GSC_QUERY_COUNTRY_EXPORT,
  GSC_KD_CACHE,
  SANITY_AGES_EXPORT,
  ensureDir,
  readJsonSafe,
  writeCsv,
} from "./seo-paths.mjs";
import {
  parseQueryRows,
  parseQueryPageRows,
  parseQueryCountryRows,
  provenCeiling,
  quickWins,
  reEvalCandidates,
  cannibalisation,
  internalLinkSuggestion,
  toPath,
} from "./gsc-phase2-lib.mjs";

const DATE = new Date().toISOString().slice(0, 10);
const NOW = new Date().toISOString();
const REPORT_PATH = path.join(DIRS.gsc, "gsc-phase2-report.md");
const TARGETS_PATH = path.join(DIRS.gsc, `striking-distance-targets-${DATE}.md`);
const CSV_PATH = path.join(DIRS.csv, `gsc-phase2-quickwins-${DATE}.csv`);

const CSV_COLUMNS = [
  { header: "Query", key: "query" },
  { header: "Page", key: "page" },
  { header: "GSC pos", key: "gscPos" },
  { header: "Main pos", key: "mainPos" },
  { header: "Impressions", key: "impr" },
  { header: "Clicks", key: "clicks" },
  { header: "CTR %", key: "ctrPct" },
  { header: "KD", key: "kd" },
  { header: "Phantom", key: "phantom" },
  { header: "Priority", key: "priority" },
  { header: "Action", key: "action" },
];

const fmt = (n) => Number(n).toLocaleString("en-GB");
const num = (v, d = 1) => (v == null ? "—" : Number(v).toFixed(d));

const queriesRaw = readJsonSafe(GSC_QUERIES_EXPORT);

// ── No-data path: write placeholders + exit 0 (clean state in the runner) ─────
if (!queriesRaw || !Array.isArray(queriesRaw.rows) || queriesRaw.rows.length === 0) {
  ensureDir(DIRS.gsc);
  fs.writeFileSync(
    REPORT_PATH,
    `# GSC Phase-2 Report — ${DATE}\n\nNo query-level GSC export at \`${GSC_QUERIES_EXPORT.replace(/\\/g, "/")}\`.\n\n` +
      `Run \`node frontend/seo/gsc-query.mjs\` (needs Google Search Console creds) to produce it, then re-run this.\n`,
    "utf8",
  );
  writeCsv(CSV_PATH, CSV_COLUMNS, []);
  console.log(`No GSC query data yet — wrote placeholder ${REPORT_PATH.replace(/\\/g, "/")}`);
  process.exit(0);
}

// ── Load + parse all inputs ──────────────────────────────────────────────────
const queryRows = parseQueryRows(queriesRaw);
const queryPageRows = parseQueryPageRows(readJsonSafe(GSC_QUERY_PAGE_EXPORT));
const queryCountryRows = parseQueryCountryRows(readJsonSafe(GSC_QUERY_COUNTRY_EXPORT));
const kd = readJsonSafe(GSC_KD_CACHE)?.kd || {};
const ages = readJsonSafe(SANITY_AGES_EXPORT)?.ages || {};

// Hubs for the internal-link gate: the highest-click pages Google already shows.
const pageRows = (readJsonSafe(GSC_EXPORT)?.rows || []).map((r) => ({
  path: toPath(r.keys?.[0]),
  clicks: Number(r.clicks || 0),
}));
const hubs = pageRows
  .filter((p) => p.path && p.clicks > 0)
  .sort((a, b) => b.clicks - a.clicks)
  .slice(0, 15);

// Coverage flags — be honest about what was / wasn't available.
const cov = {
  kd: Object.keys(kd).length,
  ages: Object.keys(ages).length,
  country: queryCountryRows.length,
  queryPage: queryPageRows.length,
};

// ── Run the four checks ──────────────────────────────────────────────────────
const ceiling = provenCeiling(queryRows, kd);
const wins = quickWins(queryRows, queryPageRows, queryCountryRows, kd, ages, { now: NOW });
const reEval = reEvalCandidates(queryRows, queryPageRows, kd, ages, { now: NOW });
const cannibals = cannibalisation(queryPageRows);

const winsLive = wins.filter((w) => !w.phantom && !w.cooldown);
const winsPhantom = wins.filter((w) => w.phantom);

// ── CSV (machine-readable quick wins, phantoms included + flagged) ────────────
writeCsv(
  CSV_PATH,
  CSV_COLUMNS,
  wins.map((w) => ({
    query: w.query, page: w.page || "", gscPos: num(w.gscPos), mainPos: num(w.mainPos),
    impr: w.impr, clicks: w.clicks, ctrPct: (w.ctr * 100).toFixed(2), kd: w.kd == null ? "" : w.kd,
    phantom: w.phantom ? "yes" : "", priority: w.priority, action: w.action,
  })),
);

// ── Render the markdown report ───────────────────────────────────────────────
const windowLabel = queriesRaw.startDate && queriesRaw.endDate ? `${queriesRaw.startDate} → ${queriesRaw.endDate}` : "last 90 days";
const L = [];
L.push(`# GSC Phase-2 Report — ${windowLabel}`, "");
L.push(`Generated ${DATE}. Query-level analysis (proven authority, validated quick wins, re-eval, cannibalisation).`, "");
L.push(
  `**Data coverage:** ${fmt(queryRows.length)} queries · ${fmt(cov.queryPage)} query×page rows · ` +
    `${cov.country ? `${fmt(cov.country)} country rows` : "**no country split** (phantom filter off — run gsc-query.mjs)"} · ` +
    `${cov.kd ? `${fmt(cov.kd)} KD readings` : "**no KD** (position-only routing — run dataforseo-kd.mjs)"} · ` +
    `${cov.ages ? `${fmt(cov.ages)} page ages` : "**no content ages** (re-eval age + cooldown advisory — run sanity-content-snapshot.mjs)"}.`,
  "",
);

// ① Proven authority ceiling
L.push("## ① Proven authority ceiling", "");
L.push(ceiling.note, "");
if (ceiling.proven.length) {
  L.push("Hardest terms you already rank top-7 for:", "");
  L.push("| Query | Pos | KD | Impr |", "|---|---:|---:|---:|");
  for (const p of ceiling.proven.slice(0, 12)) L.push(`| ${p.query} | ${num(p.pos)} | ${p.kd} | ${fmt(p.impr)} |`);
  L.push("");
}

// ② Quick wins
L.push("## ② Quick wins — validated (Pos 4-15 + impressions)", "");
if (winsLive.length) {
  L.push("Country-split applied: phantom rankings (good blended avg, poor main-market) are filtered out below and listed separately.", "");
  L.push("| Query | GSC pos | Main pos | Impr | Clicks | CTR % | KD | Priority | Action |", "|---|---:|---:|---:|---:|---:|---:|---|---|");
  for (const w of winsLive.slice(0, 30)) {
    L.push(`| ${w.query} | ${num(w.gscPos)} | ${num(w.mainPos)} | ${fmt(w.impr)} | ${fmt(w.clicks)} | ${(w.ctr * 100).toFixed(2)} | ${w.kd == null ? "—" : w.kd} | ${w.priority} | ${w.action} |`);
  }
  L.push("");
  // Internal-link gate for the High-priority wins
  const linkLines = [];
  for (const w of winsLive.filter((x) => x.priority === "High" && x.page).slice(0, 10)) {
    const s = internalLinkSuggestion(w.page, hubs, { targetKeyword: w.query });
    if (s) linkLines.push(`- **${w.page}** ← link from \`${s.source}\`, anchor *"${s.anchor}"*. ${s.bridge} _${s.confirm}_`);
  }
  if (linkLines.length) {
    L.push("**Internal-link suggestions (relevance-gated — confirm topical match before adding):**", "", ...linkLines, "");
  }
} else {
  L.push("_No validated quick wins this round._", "");
}
if (winsPhantom.length) {
  L.push(`<details><summary>${winsPhantom.length} phantom ranking(s) filtered out</summary>`, "");
  L.push("| Query | Blended pos | Main pos | Impr |", "|---|---:|---:|---:|");
  for (const w of winsPhantom.slice(0, 15)) L.push(`| ${w.query} | ${num(w.gscPos)} | ${num(w.mainPos)} | ${fmt(w.impr)} |`);
  L.push("", "</details>", "");
}

// ③ Re-eval
L.push("## ③ Re-Eval — republish candidates (Pos 8-25, KD<30, >6mo)", "");
if (reEval.length) {
  L.push("| Query | Page | Pos | Impr | KD | Age (mo) | Action |", "|---|---|---:|---:|---:|---:|---|");
  for (const r of reEval.slice(0, 20)) {
    L.push(`| ${r.query} | ${r.page || "—"} | ${num(r.pos)} | ${fmt(r.impr)} | ${r.kd == null ? "—" : r.kd} | ${r.ageMonths == null ? "?" : num(r.ageMonths)} | ${r.action} |`);
  }
  L.push("");
} else {
  L.push("_No re-eval candidates this round._", "");
}

// ④ Cannibalisation
L.push("## ④ Cannibalisation — one query, multiple of our pages", "");
if (cannibals.length) {
  L.push("| Query | Total impr | Pages (path @ pos) | Call |", "|---|---:|---|---|");
  for (const c of cannibals.slice(0, 20)) {
    const pages = c.pages.map((p) => `${p.path}@${num(p.pos)}`).join("<br>");
    L.push(`| ${c.query} | ${fmt(c.totalImpr)} | ${pages} | ${c.call} |`);
  }
  L.push("");
} else {
  L.push("_No cannibalisation detected._", "");
}

L.push("---", "");
L.push(`Machine-readable quick wins: \`${CSV_PATH.replace(/\\/g, "/")}\`. Striking-distance targets: \`${TARGETS_PATH.replace(/\\/g, "/")}\`.`, "");

ensureDir(DIRS.gsc);
fs.writeFileSync(REPORT_PATH, L.join("\n"), "utf8");

// ── Fill the striking-distance targets template (query-level) ─────────────────
const T = [];
T.push(`# Striking-Distance Page Improvement Targets`, "");
T.push(`_Source: Google Search Console — generated ${DATE}. Window: ${windowLabel}._`, "");
T.push("## How to use this", "");
T.push(
  "Each row is an EXISTING page ranking Pos 4-25 for a real query with demand — close to page 1. " +
    "IMPROVE THE LISTED PAGE (sharpen title/H1/H2 toward the query, add the depth/FAQs it lacks, add a relevant internal link). " +
    "Do NOT create a new competing page — that splits the ranking signal. Sorted by opportunity (impressions × closeness to page 1).",
  "",
);
T.push(`## Targets (${winsLive.length} qualifying query/page pairs)`, "");
T.push("| # | Query | Pos | Impr | Clicks | CTR% | KD | Page |", "|---|---|---:|---:|---:|---:|---:|---|");
winsLive.slice(0, 40).forEach((w, i) =>
  T.push(`| ${i + 1} | ${w.query} | ${num(w.gscPos)} | ${fmt(w.impr)} | ${fmt(w.clicks)} | ${(w.ctr * 100).toFixed(2)} | ${w.kd == null ? "—" : w.kd} | ${w.page || "—"} |`),
);
T.push("");
fs.writeFileSync(TARGETS_PATH, T.join("\n"), "utf8");

console.log(`Wrote ${REPORT_PATH.replace(/\\/g, "/")}`);
console.log(`Wrote ${CSV_PATH.replace(/\\/g, "/")} (${wins.length} quick-win rows)`);
console.log(`Wrote ${TARGETS_PATH.replace(/\\/g, "/")} (${winsLive.length} targets)`);
console.log(
  `Phase-2: ${winsLive.length} validated wins (${winsPhantom.length} phantom), ${reEval.length} re-eval, ${cannibals.length} cannibalisation, ceiling ${ceiling.ceiling ?? "n/a"}.`,
);
