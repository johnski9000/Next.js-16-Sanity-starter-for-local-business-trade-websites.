// Keyword gap report — find queries competitors rank for that we don't.
//
// For each competitor in ahrefs-config.mjs, fetches their top organic
// keywords (positions 1-30 only). Then fetches the target domain's
// organic keywords. Outputs the keywords competitors rank for in top
// 30 that the target either doesn't rank for at all, or ranks for at
// position 30+.
//
// Usage:
//   node frontend/seo/ahrefs-keyword-gap.mjs
//
// Run monthly. API budget: ~3,000-6,000 units per run.

import fs from "node:fs";
import path from "node:path";
import { ahrefs, unitsConsumedThisProcess } from "./ahrefs-query.mjs";
import { TARGET, COMPETITORS, OUTPUT_DIR } from "./ahrefs-config.mjs";

const DATE = new Date().toISOString().slice(0, 10);
const REPORT_DIR = path.join(OUTPUT_DIR, "reports");
const DATA_DIR = path.join(OUTPUT_DIR, "keyword-gap");

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

const PAGE = 200;
const MAX_PAGES_PER_DOMAIN = 3; // ~600 keywords per domain (top by traffic)
const TOP_POSITION_THRESHOLD = 30;

async function fetchOrganicKeywordsForDomain(domain) {
  const all = [];
  let offset = 0;
  for (let i = 0; i < MAX_PAGES_PER_DOMAIN; i++) {
    let result;
    try {
      result = await ahrefs.organicKeywords(domain, { country: "gb", limit: PAGE, offset });
    } catch (e) {
      console.error(`[keyword-gap] FAILED for ${domain}: ${e.message}`);
      break;
    }
    const rows = result?.keywords ?? result?.data ?? result?.results ?? [];
    if (!rows.length) break;
    all.push(...rows);
    if (rows.length < PAGE) break;
    offset += PAGE;
  }
  return all;
}

// Extract the best (smallest) integer position from a keyword row.
// Ahrefs v3 returns `all_positions: [{position, url}, ...]` per keyword
// with the actual integer positions across each ranking URL. Use this
// for accurate comparison; fall back to bucket string when array empty.
function bestPosition(k) {
  if (Array.isArray(k.all_positions) && k.all_positions.length > 0) {
    return Math.min(...k.all_positions.map((p) => p.position ?? 999));
  }
  // Fallback: estimate from bucket
  const bucketEstimate = {
    top_3: 2,
    top_4_10: 7,
    top_11_50: 30,
    top_51_100: 75,
  };
  return bucketEstimate[k.best_position_set] ?? 999;
}

console.log(`[keyword-gap] Target: ${TARGET}`);
console.log(`[keyword-gap] Fetching target organic keywords...`);
const targetKeywords = await fetchOrganicKeywordsForDomain(TARGET);
const targetKwMap = new Map();
for (const k of targetKeywords) {
  const key = (k.keyword ?? "").toLowerCase().trim();
  if (!key) continue;
  const pos = bestPosition(k);
  // Keep best (lowest) position when keyword appears multiple times
  if (!targetKwMap.has(key) || pos < bestPosition(targetKwMap.get(key))) {
    targetKwMap.set(key, k);
  }
}
console.log(`[keyword-gap] Target ranks for ${targetKwMap.size} unique keywords (top by traffic, in GB).`);

const competitorKeywords = {};
for (const competitor of COMPETITORS) {
  if (!competitor || competitor.startsWith("[")) continue;
  console.log(`[keyword-gap] Fetching ${competitor} organic keywords...`);
  const kws = await fetchOrganicKeywordsForDomain(competitor);
  competitorKeywords[competitor] = kws;
  console.log(`[keyword-gap]   ${kws.length} keywords found.`);
}

// Build the gap map: keyword -> { competitors_ranking: {comp: position, ...}, max_volume, ... }
const gapMap = new Map();
for (const [competitor, kws] of Object.entries(competitorKeywords)) {
  for (const k of kws) {
    const key = (k.keyword ?? "").toLowerCase().trim();
    if (!key) continue;
    const compPos = bestPosition(k);
    if (compPos > TOP_POSITION_THRESHOLD) continue;

    const targetMatch = targetKwMap.get(key);
    const targetPosition = targetMatch ? bestPosition(targetMatch) : null;
    // Include if target doesn't rank, or ranks at position > threshold
    if (targetPosition !== null && targetPosition <= TOP_POSITION_THRESHOLD) continue;

    if (!gapMap.has(key)) {
      gapMap.set(key, {
        keyword: key,
        target_position: targetPosition,
        volume: k.volume ?? 0,
        keyword_difficulty: k.keyword_difficulty ?? 0,
        cpc: k.cpc ?? 0,
        competitors_ranking: {},
      });
    }
    const g = gapMap.get(key);
    g.competitors_ranking[competitor] = compPos;
    if ((k.volume ?? 0) > g.volume) g.volume = k.volume ?? 0;
    if ((k.keyword_difficulty ?? 0) > g.keyword_difficulty) g.keyword_difficulty = k.keyword_difficulty ?? 0;
    if ((k.cpc ?? 0) > g.cpc) g.cpc = k.cpc ?? 0;
  }
}

const gap = [...gapMap.values()];
// Sort: prioritise by competitor coverage (more comps = more validated), then by volume
gap.sort((a, b) => {
  const aCount = Object.keys(a.competitors_ranking).length;
  const bCount = Object.keys(b.competitors_ranking).length;
  if (bCount !== aCount) return bCount - aCount;
  return (b.volume ?? 0) - (a.volume ?? 0);
});

console.log(`[keyword-gap] Found ${gap.length} keyword gaps.`);

// Save raw data
const dataFile = path.join(DATA_DIR, `gap-${DATE}.json`);
fs.writeFileSync(
  dataFile,
  JSON.stringify({ date: DATE, target: TARGET, gap_count: gap.length, gap }, null, 2),
);

// Build markdown report — split into "high opportunity" and "high volume"
const multi = gap.filter((g) => Object.keys(g.competitors_ranking).length >= 2);
const highVol = [...gap].filter((g) => (g.volume ?? 0) >= 100).slice(0, 50);

const lines = [];
lines.push(`# Keyword Gap Report`);
lines.push("");
lines.push(`**Date**: ${DATE}`);
lines.push(`**Target**: ${TARGET}`);
lines.push(`**Competitors analysed**: ${Object.keys(competitorKeywords).join(", ")}`);
lines.push("");
lines.push(`- Target ranks for: **${targetKwMap.size}** unique keywords (GB market)`);
lines.push(`- Total keyword gaps found: **${gap.length}**`);
lines.push(`- Keywords ≥2 competitors rank for (validated): **${multi.length}**`);
lines.push("");

lines.push("## Top 50 validated opportunities (≥2 competitors rank, target doesn't)");
lines.push("");
lines.push("| Rank | Keyword | Volume | KD | CPC | Target pos | Competitors |");
lines.push("|---:|---|---:|---:|---:|---:|---|");
multi.slice(0, 50).forEach((g, i) => {
  const comps = Object.entries(g.competitors_ranking)
    .map(([c, p]) => `${c.replace(/\..*/, "")}@${p}`)
    .join(", ");
  lines.push(
    `| ${i + 1} | \`${g.keyword}\` | ${g.volume ?? "-"} | ${g.keyword_difficulty ?? "-"} | £${g.cpc?.toFixed?.(2) ?? "-"} | ${g.target_position ?? "—"} | ${comps} |`,
  );
});
lines.push("");

lines.push(`## Top 50 high-volume gaps (volume ≥ 100/month)`);
lines.push("");
lines.push("| Rank | Keyword | Volume | KD | CPC | Target pos |");
lines.push("|---:|---|---:|---:|---:|---:|");
highVol.forEach((g, i) => {
  lines.push(
    `| ${i + 1} | \`${g.keyword}\` | ${g.volume ?? "-"} | ${g.keyword_difficulty ?? "-"} | £${g.cpc?.toFixed?.(2) ?? "-"} | ${g.target_position ?? "—"} |`,
  );
});
lines.push("");

lines.push("## How to use this list");
lines.push("");
lines.push("1. **Validated opportunities** (table 1) — ≥2 competitors ranking is signal that the SERP rewards content on this topic and there's no domain-authority floor. Prioritise these for round-2 content authoring.");
lines.push("2. **High-volume gaps** (table 2) — wider topical opportunities, may be harder to win without link-building support.");
lines.push("3. **Difficulty score**: 0-30 = realistic; 30-60 = harder, needs supporting content; 60+ = competitive (skip unless brand/feature angle).");
lines.push("4. **Target pos column**: `—` = target doesn't rank at all. Number ≥30 = ranks but deep — page exists but isn't competitive.");
lines.push("");
lines.push(`Units consumed this run: ${JSON.stringify(unitsConsumedThisProcess())}`);
lines.push("");

const reportFile = path.join(REPORT_DIR, `keyword-gap-${DATE}.md`);
fs.writeFileSync(reportFile, lines.join("\n"));

console.log(`[keyword-gap] Data: ${dataFile}`);
console.log(`[keyword-gap] Report: ${reportFile}`);
console.log(`[keyword-gap] Units consumed: ${JSON.stringify(unitsConsumedThisProcess())}`);
