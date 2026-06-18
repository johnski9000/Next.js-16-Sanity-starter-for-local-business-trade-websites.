// gsc-phase2-lib.mjs — the PURE analysis core for the phase-2 GSC report.
//
// Every export here is a deterministic, IO-free function (no fs, no `Date.now()`
// — the caller injects `now`), so the whole thing is unit-testable with fixtures.
// analyse-gsc-phase2.mjs is the thin wrapper that reads the on-disk exports,
// calls these, and renders the report — mirroring how seo-paths splits the pure
// `toCsv` from the IO `writeCsv`.
//
// The four checks (all query-level, which the page-level phase-1 report can't do):
//   ① provenCeiling       — proven authority bar = the hardest KD we already rank top-7 for
//   ② quickWins           — Pos 4-15 + impressions, with the country-split phantom filter + cooldown
//   ③ reEvalCandidates    — Pos 8-25, KD<30, page >6mo — republish candidates (NavBoost window)
//   ④ cannibalisation     — one query, ≥2 of our pages — merge / differentiate
// plus the cross-cutting internal-link relevance GATE applied to ②/③ suggestions.

const lc = (s) => String(s || "").toLowerCase().trim();

/** URL → pathname (mirrors phase-1's tolerant parsing). */
export function toPath(url) {
  if (!url) return "";
  try {
    return new URL(url).pathname;
  } catch {
    return String(url);
  }
}

/** Linear-interpolated percentile of an unsorted numeric array. p in [0,1]. */
export function percentile(nums, p) {
  const xs = nums.filter((n) => typeof n === "number" && Number.isFinite(n)).sort((a, b) => a - b);
  if (!xs.length) return null;
  if (xs.length === 1) return xs[0];
  const idx = p * (xs.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return xs[lo];
  return xs[lo] + (xs[hi] - xs[lo]) * (idx - lo);
}

/** Whole-ish months between two ISO/Date values (b - a), or null if unparseable. */
export function monthsBetween(aIso, bIso) {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return (b - a) / (1000 * 60 * 60 * 24 * 30.4375);
}

/** Days between two ISO/Date values (b - a), or null. */
export function daysBetween(aIso, bIso) {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return (b - a) / (1000 * 60 * 60 * 24);
}

/** First path segment ("/services/x/y" → "services"), "" for home. */
export function bucketTop(path) {
  if (!path || path === "/") return "";
  return path.replace(/^\/+/, "").split("/")[0] || "";
}

// ── Parsers: raw GSC export envelope → normalized rows (pure) ────────────────

export function parseQueryRows(raw) {
  if (!raw || !Array.isArray(raw.rows)) return [];
  return raw.rows
    .map((r) => ({
      query: lc(r.keys?.[0]),
      clicks: Number(r.clicks || 0),
      impr: Number(r.impressions || 0),
      ctr: Number(r.ctr || 0),
      pos: Number(r.position || 0),
    }))
    .filter((r) => r.query);
}

export function parseQueryPageRows(raw) {
  if (!raw || !Array.isArray(raw.rows)) return [];
  return raw.rows
    .map((r) => ({
      query: lc(r.keys?.[0]),
      path: toPath(r.keys?.[1]),
      clicks: Number(r.clicks || 0),
      impr: Number(r.impressions || 0),
      ctr: Number(r.ctr || 0),
      pos: Number(r.position || 0),
    }))
    .filter((r) => r.query && r.path);
}

export function parseQueryCountryRows(raw) {
  if (!raw || !Array.isArray(raw.rows)) return [];
  return raw.rows
    .map((r) => ({
      query: lc(r.keys?.[0]),
      country: lc(r.keys?.[1]),
      clicks: Number(r.clicks || 0),
      impr: Number(r.impressions || 0),
      pos: Number(r.position || 0),
    }))
    .filter((r) => r.query && r.country);
}

/** Map each query → the single page that earns it the most impressions. */
export function primaryPageByQuery(queryPageRows) {
  const best = new Map();
  for (const r of queryPageRows) {
    const cur = best.get(r.query);
    if (!cur || r.impr > cur.impr) best.set(r.query, r);
  }
  return best;
}

/** Resolve a path's content age from the ages map, falling back to the
 *  /services/<svc> prefix for generated combo pages (/services/<svc>/<area>). */
export function ageForPath(ages, path) {
  if (!ages || !path) return null;
  if (ages[path]) return ages[path];
  const parts = path.replace(/^\/+/, "").replace(/\/+$/, "").split("/");
  if (parts[0] === "services" && parts[1]) {
    const svc = `/services/${parts[1]}`;
    if (ages[svc]) return ages[svc];
  }
  return null;
}

// ── ① Proven ranking ceiling ────────────────────────────────────────────────

export function provenCeiling(queryRows, kd, opts = {}) {
  const { minProven = 3, percentileP = 0.9, topPos = 7 } = opts;
  const proven = queryRows
    .filter((r) => r.pos > 0 && r.pos <= topPos)
    .map((r) => ({ query: r.query, pos: r.pos, impr: r.impr, kd: numOrNull(kd?.[r.query]) }))
    .filter((r) => r.kd != null)
    .sort((a, b) => b.kd - a.kd);

  if (proven.length < minProven) {
    return {
      ceiling: null,
      sampleSize: proven.length,
      proven,
      note: `Insufficient proven authority — only ${proven.length} top-${topPos} query(ies) with a KD reading (need ≥${minProven}). Fall back to estimate-based winnability.`,
    };
  }
  const ceiling = Math.round(percentile(proven.map((p) => p.kd), percentileP));
  return {
    ceiling,
    sampleSize: proven.length,
    proven,
    note: `Proven authority ceiling ≈ KD ${ceiling} (90th pct of ${proven.length} queries already ranked top-${topPos}). Treat new keywords with KD ≤ ${ceiling} as winnable now.`,
  };
}

/** Classify a NEW candidate keyword's KD against the proven ceiling. */
export function classifyCandidateKd(candidateKd, ceiling) {
  const k = numOrNull(candidateKd);
  if (k == null || ceiling == null) return "unknown";
  if (k <= ceiling) return "winnable";
  if (k <= ceiling + 10) return "stretch";
  return "not-yet";
}

// ── ② Quick wins (country-split phantom filter + 7-day cooldown) ─────────────

export function quickWins(queryRows, queryPageRows, queryCountryRows, kd, ages, opts = {}) {
  const {
    now = new Date().toISOString(),
    minImpr = 20,
    posMin = 4,
    posMax = 15,
    mainCountry = "gbr",
    phantomGap = 10,
    cooldownDays = 7,
  } = opts;

  const primary = primaryPageByQuery(queryPageRows);
  // main-market position per query (lowest pos row for the main country)
  const mainPos = new Map();
  for (const r of queryCountryRows) {
    if (r.country !== mainCountry || !(r.pos > 0)) continue;
    const cur = mainPos.get(r.query);
    if (cur == null || r.pos < cur) mainPos.set(r.query, r.pos);
  }

  const rows = queryRows
    .filter((r) => r.pos >= posMin && r.pos <= posMax && r.impr >= minImpr)
    .map((r) => {
      const page = primary.get(r.query)?.path || null;
      const mp = mainPos.has(r.query) ? mainPos.get(r.query) : null;
      const phantom = mp != null && mp - r.pos > phantomGap;
      const k = numOrNull(kd?.[r.query]);
      const updatedAt = ageForPath(ages, page);
      const sinceEdit = updatedAt ? daysBetween(updatedAt, now) : null;
      const cooldown = sinceEdit != null && sinceEdit < cooldownDays;

      let action, priority;
      if (phantom) {
        action = `Phantom ranking — main-market (${mainCountry.toUpperCase()}) position ${mp.toFixed(1)} is far worse than the blended ${r.pos.toFixed(1)}. Skip; the average is distorted by tail countries.`;
        priority = "Low";
      } else if (cooldown) {
        action = `Cooldown — page edited <${cooldownDays}d ago; let GSC register the last change before touching it again.`;
        priority = "Hold";
      } else if (k != null && k < 30) {
        action = `Push: sharpen title/H1 toward "${r.query}", add the depth/FAQs it lacks, + one relevant internal link from a hub (see link gate).`;
        priority = "High";
      } else if (k != null && k <= 50) {
        action = `Needs authority (KD ${k}) — build topical depth + internal links before expecting page 1.`;
        priority = "Medium";
      } else if (k != null) {
        action = `Hard (KD ${k}) — deprioritise unless strategically important.`;
        priority = "Low";
      } else {
        action = `Push candidate (KD unknown): sharpen on-page toward "${r.query}" + add one relevant internal link.`;
        priority = "Medium";
      }
      return {
        query: r.query, page, gscPos: r.pos, mainPos: mp, impr: r.impr, clicks: r.clicks,
        ctr: r.ctr, kd: k, phantom, cooldown, action, priority,
      };
    })
    .sort((a, b) => {
      const rank = (x) => (x.phantom ? 2 : x.cooldown ? 1 : 0);
      return rank(a) - rank(b) || b.impr - a.impr;
    });
  return rows;
}

// ── ③ Re-Eval republish candidates ──────────────────────────────────────────

export function reEvalCandidates(queryRows, queryPageRows, kd, ages, opts = {}) {
  const { now = new Date().toISOString(), minImpr = 20, posMin = 8, posMax = 25, maxKd = 30, minAgeMonths = 6 } = opts;
  const primary = primaryPageByQuery(queryPageRows);

  return queryRows
    .filter((r) => r.pos >= posMin && r.pos <= posMax && r.impr >= minImpr)
    .map((r) => {
      const k = numOrNull(kd?.[r.query]);
      const page = primary.get(r.query)?.path || null;
      const updatedAt = ageForPath(ages, page);
      const ageMonths = updatedAt ? monthsBetween(updatedAt, now) : null;
      return { query: r.query, page, pos: r.pos, impr: r.impr, kd: k, updatedAt, ageMonths };
    })
    // KD gate: winnable (KD<maxKd) OR unknown (advisory — flagged in the action).
    .filter((r) => r.kd == null || r.kd < maxKd)
    // Age gate: old enough to be worth refreshing, OR age unknown (advisory).
    .filter((r) => r.ageMonths == null || r.ageMonths >= minAgeMonths)
    .map((r) => ({
      ...r,
      ageKnown: r.ageMonths != null,
      action:
        `Republish: make a SUBSTANTIVE update that better answers "${r.query}" (a new section / FAQ / worked example), then re-publish to refresh.` +
        (r.kd == null ? " Confirm KD<30 first." : "") +
        (r.ageMonths == null ? " Verify the page is >6mo old before counting this." : "") +
        " Never a date-bump only.",
    }))
    .sort((a, b) => b.impr - a.impr);
}

// ── ④ Cannibalisation ────────────────────────────────────────────────────────

export function cannibalisation(queryPageRows, opts = {}) {
  const { minImpr = 10, maxPos = 30, minPages = 2 } = opts;
  const byQuery = new Map();
  for (const r of queryPageRows) {
    if (!(r.impr >= minImpr) || !(r.pos > 0 && r.pos <= maxPos)) continue;
    if (!byQuery.has(r.query)) byQuery.set(r.query, []);
    byQuery.get(r.query).push(r);
  }

  const out = [];
  for (const [query, pages] of byQuery) {
    if (pages.length < minPages) continue;
    const sorted = [...pages].sort((a, b) => a.pos - b.pos || b.clicks - a.clicks);
    const target = sorted[0];
    const cannibals = sorted.slice(1);
    const totalImpr = pages.reduce((s, p) => s + p.impr, 0);
    out.push({
      query,
      totalImpr,
      pages: sorted.map((p) => ({ path: p.path, pos: p.pos, impr: p.impr, clicks: p.clicks })),
      target: target.path,
      cannibals: cannibals.map((p) => p.path),
      call:
        `Merge or differentiate: "${query}" is split across ${pages.length} pages. ` +
        `Consolidate into ${target.path} (best position ${target.pos.toFixed(1)}) and 301 ${cannibals.map((c) => c.path).join(", ")}, ` +
        `OR retarget the others to distinct queries so they stop competing.`,
    });
  }
  return out.sort((a, b) => b.totalImpr - a.totalImpr);
}

// ── Internal-link relevance GATE (cross-cutting, used by ②/③ recommendations) ─
//
// A link only passes authority if it's topically relevant. This emits a suggestion
// ONLY with all four parts named: (1) a high-click hub SOURCE, (2) a topical-match
// signal (shared bucket or slug token), (3) a descriptive anchor, (4) a one-line
// user-bridge — and it flags what the human must confirm (true topical match + that
// the source isn't already Pos 1-3). Returns null when no plausible hub exists.

export function internalLinkSuggestion(targetPath, hubs, opts = {}) {
  const { targetKeyword = "" } = opts;
  if (!targetPath || !Array.isArray(hubs) || !hubs.length) return null;
  const targetTokens = new Set(slugTokens(targetPath).concat(slugTokens(targetKeyword)));
  const targetBucket = bucketTop(targetPath);

  const scored = hubs
    .filter((h) => h.path && h.path !== targetPath)
    .map((h) => {
      const sharedToken = slugTokens(h.path).some((t) => targetTokens.has(t));
      const sameBucket = bucketTop(h.path) === targetBucket && targetBucket !== "";
      const relevance = (sharedToken ? 2 : 0) + (sameBucket ? 1 : 0);
      return { ...h, relevance, sharedToken, sameBucket };
    })
    .filter((h) => h.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance || (b.clicks || 0) - (a.clicks || 0));

  const source = scored[0];
  if (!source) return null;

  const anchor = descriptiveAnchor(targetKeyword || targetPath);
  return {
    source: source.path,
    anchor,
    bridge: `Readers on ${source.path} plausibly also want "${anchor}" — ${source.sharedToken ? "shared topic tokens" : "same section"}.`,
    confirm: `Confirm the anchor's surrounding paragraph is on-topic for ${targetPath}, place it mid-content (not nav/footer), and check ${source.path} isn't already Pos 1-3 for its own term.`,
  };
}

// ── small internal helpers ───────────────────────────────────────────────────

function numOrNull(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function slugTokens(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .split(/[\/\s\-_]+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}
const STOP = new Set(["the", "and", "for", "services", "areas", "near", "best", "with"]);

function descriptiveAnchor(s) {
  const words = String(s || "")
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .split(/[\/\s\-_]+/)
    .filter(Boolean);
  return words.slice(0, 5).join(" ") || "related service";
}
