// Shared configuration for the Ahrefs helper toolkit.
//
// Reads the target domain from .env (NEXT_PUBLIC_SITE_URL or AHREFS_TARGET)
// and falls back to _sanity-seo-data for auto-resolution.
// Competitors and keywords are seeded with defaults — replace them with
// real Ahrefs data after the first organic-competitors + keyword-research run.
//
// Every script in `frontend/seo/ahrefs-*.mjs` imports from here so changes
// propagate consistently.

import fs from "node:fs";
import { DIRS } from "./seo-paths.mjs";

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

function resolveDomain() {
  // 1. Explicit AHREFS_TARGET env var
  if (env.AHREFS_TARGET) return env.AHREFS_TARGET;

  // 2. Derive from site URL
  const siteUrl = env.NEXT_PUBLIC_SITE_URL || env.NEXT_PUBLIC_BASE_URL;
  if (siteUrl) {
    try {
      return new URL(siteUrl).hostname.replace(/^www\./, "");
    } catch {
      return siteUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
    }
  }

  return null;
}

// ── Target domain (resolved synchronously from env) ──────────────────────
// Set AHREFS_TARGET in .env to override, or it derives from NEXT_PUBLIC_SITE_URL.
// TODO per-client: ensure NEXT_PUBLIC_SITE_URL is set in .env.
export const TARGET = resolveDomain();
if (!TARGET) {
  console.warn("[ahrefs-config] TARGET domain not resolved. Set NEXT_PUBLIC_SITE_URL or AHREFS_TARGET in .env");
}

// Async helper for scripts that need a guaranteed resolution.
// Falls back to Sanity if env is unavailable.
export async function getTarget() {
  if (TARGET) return TARGET;
  try {
    const { getTargetDomain } = await import("./_sanity-seo-data.mjs");
    return await getTargetDomain();
  } catch {
    return null;
  }
}

// ── Competitor domains ────────────────────────────────────────────────────
// TODO: Replace with real data from Ahrefs organic-competitors for your
// target domain. Run: node frontend/seo/ahrefs-query.mjs
// then head to Ahrefs → Site Explorer → Organic competitors.
// Pick 5-7 domains that share keywords with your target, weighted toward
// higher-DR aspirational targets.
// Per-tenant override: set AHREFS_COMPETITORS in .env as a comma-separated list
// (e.g. "a.co.uk,b.co.uk"). Falls back to the defaults below for single-tenant use.
export const COMPETITORS = env.AHREFS_COMPETITORS
  ? env.AHREFS_COMPETITORS.split(",").map((s) => s.trim()).filter(Boolean)
  : [
      // TODO: competitor1.co.uk — DR XX (X shared kw)
      // TODO: competitor2.co.uk — DR XX (X shared kw)
      // TODO: competitor3.co.uk — DR XX (X shared kw)
    ];

// ── Priority keywords for position tracking ───────────────────────────────
// TODO: Replace with real data from GSC top queries + commercial-intent
// terms. 20-40 keywords is the right scope.
//
// Format: { keyword: string, location: "United Kingdom" | "London,England" | ... }
// Ahrefs supports location parameters down to city level.
// Per-tenant override: set AHREFS_PRIORITY_KEYWORDS in .env as either a JSON array
// of {keyword, location} objects, OR a simple comma/semicolon list of keywords
// (location then defaults to AHREFS_LOCATION || "United Kingdom").
function keywordsFromEnv(raw) {
  if (!raw) return null;
  const loc = env.AHREFS_LOCATION || "United Kingdom";
  const t = raw.trim();
  if (t.startsWith("[")) {
    try {
      return JSON.parse(t);
    } catch {
      return null;
    }
  }
  return t
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((keyword) => ({ keyword, location: loc }));
}

export const PRIORITY_KEYWORDS = keywordsFromEnv(env.AHREFS_PRIORITY_KEYWORDS) || [
  // Example entries — replace all of these:
  // { keyword: "your main service + city", location: "United Kingdom" },
  // { keyword: "your service for sector", location: "United Kingdom" },
];

// ── Output paths (single source of truth in ./seo-paths.mjs) ──────────────
export const OUTPUT_DIR = DIRS.ahrefs;

// ── API budget guidance ───────────────────────────────────────────────────
// Lite tier = 100,000 units/month. At default frequency expect ~8-15k units.
export const BUDGET = {
  monthlyUnitsBudget: 100_000,
  warningThreshold: 80_000,
};
