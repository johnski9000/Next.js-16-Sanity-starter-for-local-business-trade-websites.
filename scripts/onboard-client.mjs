// Onboard a new client from a structured JSON brief.
//
// Reads scripts/client-brief.json, validates it, connects to Sanity via the
// HTTP API, and upserts:
//   1. Settings singleton — branding, SEO defaults, structured data (NAP).
//      NON-DESTRUCTIVE: only the fields this script owns are patched, so the
//      theme block and the richer structuredData (services[], areaServedCities[],
//      reviews, search action) written by seed-site.ts are preserved.
//   2. Area documents — one per service area (with a required placeholder intro).
//   3. Service documents — one per service (required summary, schema-valid icon).
//
// It then removes leftover [DEV] placeholder area/service docs and generates
// frontend/seo/AI-HANDOFF.md from the values written.
//
// Usage:
//   1. Copy scripts/client-brief.example.json (blank) OR scripts/client-brief.demo.json
//      (worked example) → scripts/client-brief.json and fill in client data.
//   2. Ensure .env has SANITY_WRITE_TOKEN + NEXT_PUBLIC_SANITY_PROJECT_ID.
//   3. Run: node scripts/onboard-client.mjs
//
// Safe to run after `pnpm -F studio seed:all` has populated [DEV] placeholders.

import fs from "node:fs";
import path from "node:path";

// Shared loader: strips inline `# comments` so a commented .env can't corrupt
// the Sanity API version / token and 405 the onboard. Scope kept to the root
// .env (the current client's project), NOT frontend/.env (the demo project).
import { loadEnv } from "./lib/load-env.mjs";

const env = loadEnv([".env.local", ".env"]);

// ─── Validate Sanity connectivity ───────────────────────────────────────────
const PROJECT_ID = env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = env.NEXT_PUBLIC_SANITY_DATASET || "production";
const API_VERSION = env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01";
const TOKEN = env.SANITY_WRITE_TOKEN;

if (!PROJECT_ID) {
  console.error("MISSING: NEXT_PUBLIC_SANITY_PROJECT_ID in .env");
  console.error("Create a Sanity project at https://sanity.io/manage first.");
  process.exit(1);
}
if (!TOKEN) {
  console.error("MISSING: SANITY_WRITE_TOKEN in .env");
  console.error("Create a write token at https://sanity.io/manage → your project → API → Tokens.");
  process.exit(1);
}

// Sanity's HTTP API requires the version segment to carry a `v` prefix
// (e.g. /v2024-01-01/…); a bare date 404s with "no Route matched".
const API_V = /^v/.test(API_VERSION) ? API_VERSION : `v${API_VERSION}`;
const BASE_URL = `https://${PROJECT_ID}.api.sanity.io/${API_V}`;

async function sanityApi(method, endpoint, body) {
  const url = `${BASE_URL}/${endpoint}`;
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sanity ${method} ${endpoint} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

async function mutate(mutations) {
  // Sanity's mutation endpoint is POST — PUT returns 405 Method Not Allowed.
  return sanityApi("POST", `data/mutate/${DATASET}`, { mutations });
}

async function sanityQuery(groq) {
  const res = await sanityApi("GET", `data/query/${DATASET}?query=${encodeURIComponent(groq)}`);
  return res.result;
}

// ─── Load client brief ──────────────────────────────────────────────────────
const BRIEF_PATH = path.join("scripts", "client-brief.json");
if (!fs.existsSync(BRIEF_PATH)) {
  console.error(`MISSING: ${BRIEF_PATH}`);
  console.error(
    "Copy scripts/client-brief.example.json (blank) or scripts/client-brief.demo.json (example) → scripts/client-brief.json and fill in client data.",
  );
  process.exit(1);
}

let brief;
try {
  brief = JSON.parse(fs.readFileSync(BRIEF_PATH, "utf8"));
} catch (e) {
  console.error(`Failed to parse ${BRIEF_PATH}: ${e.message}`);
  process.exit(1);
}

const b = brief.business;
if (!b?.name || !b?.phone || !b?.email || !b?.website) {
  console.error(
    "client-brief.json is missing required fields: business.name, business.phone, business.email, business.website",
  );
  process.exit(1);
}
try {
  new URL(b.website);
} catch {
  console.error(`client-brief.json business.website is not a valid URL: ${JSON.stringify(b.website)}`);
  process.exit(1);
}
if (!brief.services?.length) {
  console.error("client-brief.json must include at least one service in services[].");
  process.exit(1);
}
if (!brief.areas?.length) {
  console.error("client-brief.json must include at least one area in areas[].");
  process.exit(1);
}

// ─── Derive domain ──────────────────────────────────────────────────────────
let domain = "";
try {
  domain = new URL(b.website).hostname.replace(/^www\./, "");
} catch {}
const siteUrl = b.website.replace(/\/$/, "");
const orgName = b.name;

const address = brief.address || {};
const hasAddress = Boolean(address.streetAddress && address.addressLocality);
const serviceAreaOnly = Boolean(brief.serviceAreaOnly);
// For a service-area business, Google's guidance is to hide the street address —
// so we do NOT emit organization.address/geo even when the brief supplies one
// (the address is still used for verification, just not in public structured data).
const emitAddress = hasAddress && !serviceAreaOnly;
const hasGeo = address.latitude != null && address.longitude != null;

console.log(`\nOnboarding: ${orgName} (${domain || "no domain"})`);
console.log(`Sanity:     ${PROJECT_ID} / ${DATASET}`);
console.log(`Mode:       ${serviceAreaOnly ? "service-area business (address hidden)" : emitAddress ? "physical address published" : "no address provided"}\n`);

// ─── Helpers ──────────────────────────────────────────────────────────────--
// service.icon is a fixed dropdown in studio/src/schemaTypes/documents/service.ts.
// Writing an off-list value renders an invalid field in Studio, so we only keep
// icons that are in the allowed set and drop anything else (icon is optional).
const ALLOWED_SERVICE_ICONS = new Set([
  "Wrench", "Hammer", "Flame", "Droplet", "Zap", "Thermometer", "ShieldCheck",
  "Siren", "Bath", "Home", "Building2", "Paintbrush", "PaintRoller", "PaintBucket",
  "Ruler", "Sparkles", "Plug", "Fan", "Leaf", "Truck",
]);

// trust.accreditations[].icon is a fixed dropdown in studio settings (the trust
// object). Off-list values render an invalid field, so we coerce to ShieldCheck.
const ALLOWED_ACCREDITATION_ICONS = new Set([
  "ShieldCheck", "BadgeCheck", "Award", "Leaf", "Clock", "Users", "Star", "Tag",
]);

function clamp(str, max) {
  if (!str) return str;
  return str.length <= max ? str : str.slice(0, max - 1).trimEnd() + "…";
}

// A single plain paragraph as blockContentTextOnly portable text. Deterministic
// _keys so re-running onboard produces a stable doc.
function portableParagraph(idBase, text) {
  return [
    {
      _type: "block",
      _key: `${idBase}-p0`,
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: `${idBase}-s0`, text, marks: [] }],
    },
  ];
}

// Parse a brief opening-hours string like "Mo-Fr 08:00-18:00" or "Sat 9am-1pm"
// into the schema's openingHoursSpec shape: { dayOfWeek: [...full names], opens, closes }.
const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_ALIASES = {
  mo: "Monday", mon: "Monday", monday: "Monday",
  tu: "Tuesday", tue: "Tuesday", tues: "Tuesday", tuesday: "Tuesday",
  we: "Wednesday", wed: "Wednesday", weds: "Wednesday", wednesday: "Wednesday",
  th: "Thursday", thu: "Thursday", thur: "Thursday", thurs: "Thursday", thursday: "Thursday",
  fr: "Friday", fri: "Friday", friday: "Friday",
  sa: "Saturday", sat: "Saturday", saturday: "Saturday",
  su: "Sunday", sun: "Sunday", sunday: "Sunday",
};

function normaliseTime(t) {
  const s = t.trim().toLowerCase();
  let m = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/);
  if (m) {
    let h = parseInt(m[1], 10);
    if (m[3] === "pm" && h < 12) h += 12;
    if (m[3] === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${m[2]}`;
  }
  m = s.match(/^(\d{1,2})\s*(am|pm)$/);
  if (m) {
    let h = parseInt(m[1], 10);
    if (m[2] === "pm" && h < 12) h += 12;
    if (m[2] === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:00`;
  }
  return null;
}

function parseOpeningHours(str, i) {
  if (typeof str !== "string") return null;
  const timeMatch = str.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–—to]+\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  if (!timeMatch) return null;
  const opens = normaliseTime(timeMatch[1]);
  const closes = normaliseTime(timeMatch[2]);
  if (!opens || !closes) return null;

  const dayPart = str.slice(0, timeMatch.index).trim();
  const days = [];
  for (const chunk of dayPart.split(",").map((c) => c.trim()).filter(Boolean)) {
    const range = chunk.split(/[-–—]/).map((c) => c.trim().toLowerCase());
    if (range.length === 2 && DAY_ALIASES[range[0]] && DAY_ALIASES[range[1]]) {
      const start = DAY_ORDER.indexOf(DAY_ALIASES[range[0]]);
      const end = DAY_ORDER.indexOf(DAY_ALIASES[range[1]]);
      if (start !== -1 && end !== -1) {
        for (let d = start; d <= end; d++) days.push(DAY_ORDER[d]);
        continue;
      }
    }
    const single = DAY_ALIASES[chunk.toLowerCase()];
    if (single) days.push(single);
  }
  if (!days.length) return null;
  return { _type: "openingHoursSpec", _key: `oh-${i}`, dayOfWeek: days, opens, closes };
}

const openingHours = (brief.openingHours ?? [])
  .map((h, i) => {
    const parsed = parseOpeningHours(h, i);
    if (!parsed) console.warn(`  ⚠ could not parse opening hours "${h}" — skipped`);
    return parsed;
  })
  .filter(Boolean);

// ═══════════════════════════════════════════════════════════════════════════
// 1. Upsert Settings singleton (non-destructive)
// ═══════════════════════════════════════════════════════════════════════════

// Minimal valid scaffold so a fresh dataset (onboard before seed) still gets a
// complete theme block; if seed-site already created the doc this is a no-op.
const DEFAULT_THEME = {
  colorScheme: "blue-white",
  mode: "light",
  accent: "solid",
  headingFont: "inter",
  bodyFont: "inter",
  monoFont: "ibmplexmono",
  radius: "xl",
  buttonStyle: "pill",
  container: "default",
};

const minimalSettings = {
  _id: "siteSettings",
  _type: "settings",
  theme: DEFAULT_THEME,
  branding: {},
  seo: {},
  structuredData: { website: {}, localBusiness: {} },
};

const organization = {
  name: orgName,
  ...(b.legalName ? { legalName: b.legalName } : {}),
  url: siteUrl,
  ...(b.description ? { description: b.description } : {}),
  ...(b.slogan ? { slogan: b.slogan } : {}),
  ...(b.foundingDate ? { foundingDate: b.foundingDate } : {}),
  ...(brief.social?.length ? { sameAs: brief.social } : {}),
  contact: {
    phone: b.phone,
    email: b.email,
    contactType: "Customer Service",
    availableLanguage: "English",
  },
  ...(emitAddress
    ? {
        address: {
          streetAddress: address.streetAddress,
          addressLocality: address.addressLocality,
          ...(address.addressRegion ? { addressRegion: address.addressRegion } : {}),
          postalCode: address.postalCode || "",
          addressCountry: address.addressCountry || "GB",
        },
      }
    : {}),
  ...(emitAddress && hasGeo ? { geo: { latitude: address.latitude, longitude: address.longitude } } : {}),
  ...(brief.founder?.name
    ? {
        founder: {
          name: brief.founder.name,
          ...(brief.founder.jobTitle ? { jobTitle: brief.founder.jobTitle } : {}),
          ...(brief.founder.sameAs ? { sameAs: brief.founder.sameAs } : {}),
        },
      }
    : {}),
};

// Leaf-path sets only — this is what makes the write non-destructive. We never
// set `branding`, `seo`, `structuredData`, `trust` or `theme` as whole objects, so
// branding.logo, seo.ogImage, theme, trust.press, structuredData.{services,
// areaServedCities, website.enableSearchAction} and reviews.items survive untouched.
// (The trust.* and reviews.* leaf paths are appended below, after this object.)
const settingsSet = {
  "branding.siteTitle": orgName,
  "seo.title": orgName,
  "seo.description":
    b.shortDescription || b.description || `${orgName} — ${brief.services.map((s) => s.name).join(", ")}`,
  "seo.metadataBase": siteUrl,
  "seo.robots": { index: true, follow: true },
  "structuredData.enabled": true,
  "structuredData.language": "en-GB",
  "structuredData.website.name": orgName,
  "structuredData.website.url": siteUrl,
  "structuredData.organization": organization,
  "structuredData.localBusiness.enabled": emitAddress || serviceAreaOnly,
  "structuredData.localBusiness.serviceAreaOnly": serviceAreaOnly,
};
if (b.whatsappNumber) settingsSet["branding.whatsappNumber"] = b.whatsappNumber;
if (b.priceRange) settingsSet["structuredData.localBusiness.priceRange"] = b.priceRange;
if (openingHours.length) settingsSet["structuredData.localBusiness.openingHours"] = openingHours;

// Trust signals (settings.trust) — powers the Trust Bar blocks. Leaf-path sets so
// they're non-destructive: trust.press (image upload, Studio-only) is preserved.
const trust = brief.trust || {};
if (trust.stat && (trust.stat.headline || trust.stat.sub)) {
  settingsSet["trust.stat"] = {
    ...(trust.stat.headline ? { headline: trust.stat.headline } : {}),
    ...(trust.stat.sub ? { sub: trust.stat.sub } : {}),
  };
}
if (Array.isArray(trust.accreditations)) {
  const accreditations = trust.accreditations
    .filter((a) => a && a.title)
    .map((a, i) => {
      if (a.icon && !ALLOWED_ACCREDITATION_ICONS.has(a.icon)) {
        console.warn(`  ⚠ accreditation "${a.title}" icon "${a.icon}" not in the allowed set — defaulting to ShieldCheck`);
      }
      return {
        _type: "accreditation",
        _key: `acc-${i}`,
        icon: a.icon && ALLOWED_ACCREDITATION_ICONS.has(a.icon) ? a.icon : "ShieldCheck",
        title: a.title,
        ...(a.sub ? { sub: a.sub } : {}),
      };
    });
  if (accreditations.length) settingsSet["trust.accreditations"] = accreditations;
}

// Reviews (settings.structuredData.reviews). DMCC Act 2024: only written when the
// brief EXPLICITLY enables it (real, publicly visible reviews). When not enabled we
// touch nothing, so the seed's gated default (enabled:false) is preserved.
const reviews = brief.reviews || {};
if (reviews.enabled === true) {
  settingsSet["structuredData.reviews.enabled"] = true;
  const agg = reviews.aggregate || {};
  if (agg.reviewCount > 0 && agg.ratingValue > 0) {
    settingsSet["structuredData.reviews.aggregateRating"] = {
      ratingValue: agg.ratingValue,
      reviewCount: agg.reviewCount,
      bestRating: agg.bestRating ?? 5,
      worstRating: agg.worstRating ?? 1,
    };
  }
  if (Array.isArray(reviews.platforms) && reviews.platforms.length) {
    settingsSet["structuredData.reviews.platforms"] = reviews.platforms
      .filter((p) => p && p.platform)
      .map((p, i) => ({
        _type: "reviewPlatform",
        _key: `rp-${i}`,
        platform: p.platform,
        ...(p.score ? { score: p.score } : {}),
        ...(p.subLabel ? { subLabel: p.subLabel } : {}),
        showStars: p.showStars !== false,
      }));
  }
} else if (brief.reviews && brief.reviews.enabled === false && (brief.reviews.platforms?.length || brief.reviews.aggregate?.reviewCount > 0)) {
  console.warn("  ⚠ reviews data supplied but reviews.enabled is false — skipped (set enabled:true once the reviews are genuinely live; DMCC: no fabricated ratings).");
}

try {
  await mutate([
    { createIfNotExists: minimalSettings },
    { patch: { id: "siteSettings", set: settingsSet } },
  ]);
  console.log("✓ settings  [siteSettings]  (patched — theme + extra structuredData preserved)");
} catch (e) {
  console.error(`✗ settings: ${e.message}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. Upsert Area documents (non-destructive — mirrors the settings pattern)
// ═══════════════════════════════════════════════════════════════════════════
// createIfNotExists writes the full doc (identity + brief data + placeholder
// intro) ONLY on a first run; a re-run never touches an existing doc's body, so
// intro/seo copy written in Studio survives. We then patch ONLY the safe
// identity fields (name, order) so a re-run still refreshes labels. We do NOT
// patch intro/seo — those may hold real copy. The slug stays the _id anchor, so
// renaming a slug creates a NEW doc (the old one must be deleted manually).

for (const area of brief.areas) {
  if (!area.slug) {
    console.error(`  ✗ area "${area.name}" — missing slug, skipped`);
    continue;
  }
  const id = `area-${area.slug.replace(/[^a-zA-Z0-9._-]+/g, "-")}`;
  // intro is Rule.required() — write the brief's intro if present, else a clearly
  // marked placeholder the editor must replace with locally-specific copy.
  const introText =
    (typeof area.intro === "string" && area.intro.trim()) ||
    `[PLACEHOLDER — replace with a unique, locally-specific intro] ${orgName} provides ${brief.services
      .slice(0, 3)
      .map((s) => s.name.toLowerCase())
      .join(", ")} and more across ${area.name} and the surrounding area.`;
  const doc = {
    _id: id,
    _type: "area",
    name: area.name,
    slug: { _type: "slug", current: area.slug },
    order: area.order ?? 99,
    intro: portableParagraph(id, introText),
    ...(area.coverageNote ? { coverageNote: area.coverageNote } : {}),
    seo: {
      title: clamp(`${area.name} — ${orgName}`, 70),
      description: clamp(`${orgName} provides professional services in ${area.name}.`, 180),
      noIndex: false,
      noFollow: false,
    },
  };
  try {
    await mutate([
      { createIfNotExists: doc },
      { patch: { id, set: { name: area.name, order: area.order ?? 99 } } },
    ]);
    console.log(`✓ area     "${area.name}"  [${id}]`);
  } catch (e) {
    console.error(`  ✗ area "${area.name}": ${e.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. Upsert Service documents (non-destructive — mirrors the settings pattern)
// ═══════════════════════════════════════════════════════════════════════════
// As with areas: createIfNotExists writes the full doc only on a first run, and
// we patch ONLY the safe identity fields (name, order) on a re-run. We do NOT
// patch summary/seo — those may hold real copy written in Studio. The slug stays
// the _id anchor, so a slug rename creates a NEW doc (delete the old one first).

for (const svc of brief.services) {
  if (!svc.slug) {
    console.error(`  ✗ service "${svc.name}" — missing slug, skipped`);
    continue;
  }
  const id = `service-${svc.slug.replace(/[^a-zA-Z0-9._-]+/g, "-")}`;
  // summary is Rule.required().max(220) — always write it, synthesised + clamped.
  const summary = clamp(svc.summary || `Professional ${svc.name.toLowerCase()} from ${orgName}.`, 220);
  if (!svc.summary) console.warn(`  ⚠ service "${svc.name}" had no summary — synthesised a placeholder`);
  if (svc.icon && !ALLOWED_SERVICE_ICONS.has(svc.icon)) {
    console.warn(
      `  ⚠ service "${svc.name}" icon "${svc.icon}" is not in the schema's icon set — omitted ` +
        `(pick one in Studio, or expand SERVICE_ICONS in studio/src/schemaTypes/documents/service.ts)`,
    );
  }
  const doc = {
    _id: id,
    _type: "service",
    name: svc.name,
    slug: { _type: "slug", current: svc.slug },
    summary,
    ...(svc.icon && ALLOWED_SERVICE_ICONS.has(svc.icon) ? { icon: svc.icon } : {}),
    order: svc.order ?? 99,
    seo: {
      title: clamp(`${svc.name} — ${orgName}`, 70),
      description: clamp(summary, 180),
      noIndex: false,
      noFollow: false,
    },
  };
  try {
    await mutate([
      { createIfNotExists: doc },
      { patch: { id, set: { name: svc.name, order: svc.order ?? 99 } } },
    ]);
    console.log(`✓ service  "${svc.name}"  [${id}]`);
  } catch (e) {
    console.error(`  ✗ service "${svc.name}": ${e.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3b. Remove leftover [DEV] placeholder area/service docs
// ═══════════════════════════════════════════════════════════════════════════
// seed-dev.ts seeds areas/services under its own slugs (so their _ids differ
// from the client's). Without cleanup they linger as orphans in nav/sitemap/grids.
try {
  const devDocs = await sanityQuery(`*[_type in ["area", "service"]]{ _id, name }`);
  const devIds = (devDocs || [])
    .filter((d) => typeof d.name === "string" && d.name.startsWith("[DEV]"))
    .map((d) => d._id);
  if (devIds.length) {
    await mutate(devIds.flatMap((id) => [{ delete: { id } }, { delete: { id: `drafts.${id}` } }]));
    console.log(`\n✓ removed ${devIds.length} leftover [DEV] area/service placeholder(s)`);
  }
} catch (e) {
  console.warn(`\n⚠ could not clean up [DEV] placeholders: ${e.message}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. Generate AI-HANDOFF.md
// ═══════════════════════════════════════════════════════════════════════════

const today = new Date().toISOString().slice(0, 10);
const servicesList = brief.services
  .map((s) => `| ${s.name} | \`${s.slug}\` | ${s.summary || "—"} |`)
  .join("\n");
const areasList = brief.areas.map((a) => `- **${a.name}** (\`${a.slug}\`)`).join("\n");

const handoff = `# AI Handoff — ${orgName}

> **Read this first if you're an AI model picking up this work with no prior context.**
> This file is the single source of truth for "where are we, what's running, what comes next."
> Last updated: ${today}.

---

## 🔄 KEEP THIS FILE CURRENT — non-negotiable

**Always update this file in the SAME commit** as any substantive change.
See the "keep the handoff current" rule in \`frontend/seo/SEO-PLAYBOOK.md\`.

**Always update when you:**
- Ship a new GBP post batch
- Add a citation that goes live
- Change the NAP anywhere
- Add/remove a service or area
- Ship a new toolkit script
- Discover a new pitfall
- Change the weekly cadence

**Never update for:** single-character fixes, comment-only changes, formatting.

**Test:** would a fresh AI session miss this if you didn't update? If yes → update.

---

## TL;DR (90 seconds)

${orgName} is a ${b.shortDescription || "local service business"}. Site is built on Next.js + Sanity (this template). The SEO toolkit is at \`frontend/seo/\` with GSC, GA4, GBP, and Ahrefs integration. Run the weekly cycle with \`node frontend/seo/monday-runner.mjs\` — it produces an Excel workbook, CSV recommendation tables, markdown reports, and a digest under \`frontend/seo/data/\`.

**The single most important rule**: every NAP reference everywhere must match the canonical string byte-for-byte. NAP drift is a textbook local-SEO killer.

---

## 1. The business

**Brand**: ${orgName}${b.legalName ? ` (legal: ${b.legalName})` : ""}
**Trade**: ${brief.trade || "plumber (default)"}
**Website**: ${siteUrl}
**GitHub**: (add repo URL)

### Canonical NAP (use this EXACT string everywhere)

\`\`\`
${orgName}
${emitAddress ? `${address.streetAddress}\n${address.addressLocality}\n${address.postalCode}\n${b.phone}` : `Service-area business — no public address\n${b.phone}`}
\`\`\`

- Phone: ${b.phone}
- Email: ${b.email}
${emitAddress && hasGeo ? `- Geo: ${address.latitude}, ${address.longitude}` : ""}

### Services

| Service | Slug | Summary |
|---|---|---|
${servicesList}

### Areas

${areasList}

---

## 2. Toolkit reference

All scripts are Node ESM (.mjs), read \`.env\` at repo root, and are run from the repo root. Full methodology in \`frontend/seo/SEO-PLAYBOOK.md\`.

### Run the weekly cycle

\`\`\`bash
node frontend/seo/monday-runner.mjs
\`\`\`

This runs GSC → Ahrefs → GA4 → GBP → 3-way attribution and writes the XLSX workbook, CSVs, reports and digest.

### Key scripts

| Script | Purpose |
|---|---|
| \`monday-runner.mjs\` | Orchestrates the full weekly stack |
| \`gsc-query.mjs\` | GSC fetch — default mode writes the 90-day page export |
| \`analyse-gsc-phase1.mjs\` | GSC striking-distance + per-page priority analysis (MD + CSV) |
| \`analyse-ahrefs.mjs\` | Runs the four Ahrefs scripts (positions, backlinks, gaps) |
| \`ga4-analyse.mjs\` | GA4 90-day snapshot + delta |
| \`gbp-analyse.mjs\` | GBP 90-day snapshot (⚠ until allowlist clears) |
| \`gsc-ga4-gbp-attribution.mjs\` | 3-way attribution |
| \`google-autocomplete.mjs\` | Free keyword research |
| \`report-xlsx.mjs\` | Client Excel workbook + CSV exports |

### Data output paths (all under \`frontend/seo/data/\`, gitignored)

\`\`\`
data/
├── gsc/                gsc-pages-90d.json, gsc-phase1-report.md, gsc-whitelist.txt
├── ga4/{snapshots,reports,attribution}/
├── gbp/{snapshots,reports,attribution}/
├── ahrefs/{refdomain-snapshots,position-snapshots,keyword-gap,competitor-gap,reports}/
├── autocomplete/
├── csv/                machine-readable recommendation tables
└── monday-run-<date>.{md,xlsx}
\`\`\`

---

## 3. Active state as of ${today}

### ✅ Set up
- Sanity CMS with settings, areas (${brief.areas.length}), services (${brief.services.length})
- SEO toolkit at \`frontend/seo/\`
${emitAddress ? "- LocalBusiness structured data with published address + geo" : "- Service-area business — no public address in structured data"}

### 🟡 Optional / in motion
- GBP local-pack metrics (optional) — add GBP_ACCOUNT_ID + GBP_LOCATION_ID and, if not already done for the agency Cloud project, complete the one-time Business Profile API allowlist (https://support.google.com/business/contact/api_default). The weekly run skips GBP cleanly until then.

### ⏳ Awaiting
- First Monday SEO cycle run
- First GBP post batch authoring
- Citation setup (Tier 1)

---

## 4. Weekly cadence

\`\`\`bash
node frontend/seo/monday-runner.mjs
\`\`\`

Read the digest it writes. Act on striking-distance movements.

## 5. What to do next

1. **Submit GBP quota allowlist** — https://support.google.com/business/contact/api_default (7-10 day lead time)
2. **Set up Google OAuth** — GSC + GA4 + GBP scopes on a refresh token
3. **Populate .env** with API keys (see .env.example)
4. **Run seed-seo-defaults**: \`cd studio && npx sanity exec scripts/seed-seo-defaults.ts --with-user-token\`
5. **Author first GBP post batch** — see the GBP posts section of \`frontend/seo/SEO-PLAYBOOK.md\`
6. **Set up citations** — start with Google Business Profile + Bing Places, then Apple, Yelp, Foursquare (see \`frontend/seo/citations/\`)

---

Generated by \`scripts/onboard-client.mjs\` on ${today}.
Update this file as the project evolves — see §KEEP THIS FILE CURRENT above.
`;

const HANDOFF_PATH = path.join("frontend", "seo", "AI-HANDOFF.md");
fs.writeFileSync(HANDOFF_PATH, handoff, "utf8");
console.log(`\n✓ AI-HANDOFF  [${HANDOFF_PATH}]`);

// ═══════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════

console.log(`\n──────────────────────────────────────────────────────────`);
console.log(`Onboarding complete: ${orgName}`);
console.log(``);
console.log(`Sanity updated:`);
console.log(`  settings  — siteSettings (branding, SEO, structured data; theme preserved)`);
console.log(`  areas     — ${brief.areas.length} docs`);
console.log(`  services  — ${brief.services.length} docs`);
console.log(``);
console.log(`Generated:`);
console.log(`  ${HANDOFF_PATH}`);
console.log(``);
console.log(`Next steps (manual):`);
console.log(`  1. Open Studio and replace [DEV] page content + the placeholder area intros with real copy`);
console.log(`  2. Upload logo + photos in Studio`);
console.log(`  3. Add real projects/testimonials to project docs`);
console.log(`  4. Fill in remaining .env keys (.env.example has the full list)`);
console.log(`  5. Submit GBP API allowlist form (7-10 day lead time)`);
console.log(`  6. Run first Monday cycle: node frontend/seo/monday-runner.mjs`);
if (domain) {
  console.log(`  7. Verify GSC property for ${domain} in Search Console`);
}
console.log(``);
console.log(`Re-running is safe: an updated brief ADDS new services/areas and refreshes`);
console.log(`labels (name, order) but never overwrites intro/summary/seo copy written in`);
console.log(`Studio. Note: the slug IS the doc _id — renaming a slug creates a NEW doc, so`);
console.log(`delete the old area/service doc in Studio first when you rename a slug.`);
console.log(``);
