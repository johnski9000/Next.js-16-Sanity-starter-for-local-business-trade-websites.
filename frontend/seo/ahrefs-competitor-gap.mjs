// Competitor backlink gap — link prospecting tool.
//
// For each competitor in ahrefs-config.mjs COMPETITORS list, fetches
// their referring domains, then finds domains that link to ≥2
// competitors but DO NOT link to the target domain. Output is a
// prospect list sorted by Domain Rating — your link-building hit list.
//
// Usage:
//   node frontend/seo/ahrefs-competitor-gap.mjs
//
// Run monthly (or after updating COMPETITORS in config). API budget:
// ~2,500-5,000 units per run depending on competitor count.

import fs from "node:fs";
import path from "node:path";
import { ahrefs, unitsConsumedThisProcess } from "./ahrefs-query.mjs";
import { TARGET, COMPETITORS, OUTPUT_DIR } from "./ahrefs-config.mjs";

const DATE = new Date().toISOString().slice(0, 10);
const REPORT_DIR = path.join(OUTPUT_DIR, "reports");
const DATA_DIR = path.join(OUTPUT_DIR, "competitor-gap");

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

console.log(`[competitor-gap] Target: ${TARGET}`);
console.log(`[competitor-gap] Competitors (${COMPETITORS.length}): ${COMPETITORS.join(", ")}`);

const PAGE = 200;
const MAX_PAGES_PER_DOMAIN = 5; // ~1,000 refdomains per competitor

async function fetchRefdomainsForDomain(domain) {
  const all = [];
  let offset = 0;
  for (let i = 0; i < MAX_PAGES_PER_DOMAIN; i++) {
    let result;
    try {
      result = await ahrefs.refdomains(domain, { limit: PAGE, offset });
    } catch (e) {
      console.error(`[competitor-gap] FAILED for ${domain}: ${e.message}`);
      break;
    }
    const rows = result?.refdomains ?? result?.data ?? result?.results ?? [];
    if (!rows.length) break;
    all.push(...rows);
    if (rows.length < PAGE) break;
    offset += PAGE;
  }
  return all;
}

// Fetch target refdomains first — these are EXCLUDED from prospects
console.log(`[competitor-gap] Fetching ${TARGET} refdomains for exclusion...`);
const targetRefdomains = await fetchRefdomainsForDomain(TARGET);
const targetDomains = new Set(targetRefdomains.map((r) => r.domain));
console.log(`[competitor-gap] ${TARGET} has ${targetDomains.size} refdomains.`);

// Fetch each competitor's refdomains
const competitorData = {};
for (const competitor of COMPETITORS) {
  if (!competitor || competitor.startsWith("[")) {
    console.log(`[competitor-gap] Skipping placeholder competitor: ${competitor}`);
    continue;
  }
  console.log(`[competitor-gap] Fetching ${competitor} refdomains...`);
  const domains = await fetchRefdomainsForDomain(competitor);
  competitorData[competitor] = domains;
  console.log(`[competitor-gap]   ${domains.length} refdomains found.`);
}

// Build the prospect map: domain -> { competitors_linking: [], best_dr, ... }
const prospectMap = new Map();
for (const [competitor, domains] of Object.entries(competitorData)) {
  for (const d of domains) {
    if (!d.domain || targetDomains.has(d.domain)) continue;
    if (!prospectMap.has(d.domain)) {
      prospectMap.set(d.domain, {
        domain: d.domain,
        competitors_linking: [],
        domain_rating: d.domain_rating ?? 0,
        has_dofollow_link: false,
        first_seen: d.first_seen,
        last_seen: d.last_seen,
      });
    }
    const p = prospectMap.get(d.domain);
    p.competitors_linking.push(competitor);
    if (d.domain_rating && d.domain_rating > p.domain_rating) p.domain_rating = d.domain_rating;
    if ((d.dofollow_links ?? 0) > 0) p.has_dofollow_link = true;
  }
}

// Filter: prospects must link to ≥2 competitors (signal that it's a relevant
// link source, not just a one-off) — adjust threshold as needed.
const prospects = [...prospectMap.values()].filter((p) => p.competitors_linking.length >= 2);

// Sort by DR desc, then by competitor-count desc as tiebreaker
prospects.sort((a, b) => {
  if (b.domain_rating !== a.domain_rating) return b.domain_rating - a.domain_rating;
  return b.competitors_linking.length - a.competitors_linking.length;
});

console.log(`[competitor-gap] Found ${prospects.length} prospects (linking to ≥2 competitors, NOT to ${TARGET}).`);

// Save raw data
const dataFile = path.join(DATA_DIR, `prospects-${DATE}.json`);
fs.writeFileSync(
  dataFile,
  JSON.stringify(
    {
      date: DATE,
      target: TARGET,
      competitors: Object.keys(competitorData),
      target_refdomain_count: targetDomains.size,
      competitor_refdomain_counts: Object.fromEntries(
        Object.entries(competitorData).map(([k, v]) => [k, v.length]),
      ),
      prospect_count: prospects.length,
      prospects,
    },
    null,
    2,
  ),
);

// Build markdown report
const lines = [];
lines.push(`# Competitor Backlink Gap — Prospect List`);
lines.push("");
lines.push(`**Date**: ${DATE}`);
lines.push(`**Target**: ${TARGET}`);
lines.push(`**Competitors analysed (${Object.keys(competitorData).length})**: ${Object.keys(competitorData).join(", ")}`);
lines.push("");
lines.push(`- ${TARGET} current refdomains: **${targetDomains.size}**`);
lines.push(`- Total unique domains linking to at least one competitor: **${prospectMap.size}**`);
lines.push(`- Prospects (linking to ≥2 competitors, NOT linking to ${TARGET}): **${prospects.length}**`);
lines.push("");

lines.push("## Top 50 prospects (sorted by Domain Rating)");
lines.push("");
lines.push("| Rank | Domain | DR | Competitors Linking | Dofollow somewhere? |");
lines.push("|---:|---|---:|---|---|");
prospects.slice(0, 50).forEach((p, i) => {
  lines.push(
    `| ${i + 1} | \`${p.domain}\` | ${p.domain_rating} | ${p.competitors_linking.join(", ")} | ${p.has_dofollow_link ? "✅" : "—"} |`,
  );
});
lines.push("");
if (prospects.length > 50) {
  lines.push(`_(${prospects.length - 50} more prospects in JSON: ${dataFile})_`);
  lines.push("");
}

lines.push("## How to use this list");
lines.push("");
lines.push("1. Start with rows where ≥3 competitors link to the same domain — strongest signal of relevance.");
lines.push("2. Manually research each top-20 prospect to identify the outreach angle (guest post, expert quote, resource link, partnership).");
lines.push("3. Track outreach status in your CRM or a separate sheet.");
lines.push("4. Re-run this script monthly — newly-acquired competitor links surface here as fresh prospects.");
lines.push("");
lines.push(`Units consumed this run: ${JSON.stringify(unitsConsumedThisProcess())}`);
lines.push("");

const reportFile = path.join(REPORT_DIR, `competitor-gap-${DATE}.md`);
fs.writeFileSync(reportFile, lines.join("\n"));

console.log(`[competitor-gap] Data: ${dataFile}`);
console.log(`[competitor-gap] Report: ${reportFile}`);
console.log(`[competitor-gap] Units consumed: ${JSON.stringify(unitsConsumedThisProcess())}`);
