// Pre-go-live QA gate for a tenant. Run before switching a client live to catch
// the usual launch-day embarrassments: placeholder copy, missing NAP, no services/
// areas, or broken essential pages. Exits non-zero if any BLOCKING check fails.
//
// Usage (from REPO ROOT):
//   node scripts/verify-tenant.mjs <tenant key | host | url>
//
// Single-tenant: gates the project configured in .env (NEXT_PUBLIC_SANITY_PROJECT_ID +
// SANITY_API_READ_TOKEN) — checks NAP, services/areas, [DEV]/placeholder copy, images,
// the research-driven content guards (--briefs), and probes the live site if reachable.

import fs from "node:fs";
import path from "node:path";

import { loadEnv } from "./lib/load-env.mjs";
import { findRiskyClaims, normaliseClaimText } from "./lib/content-claims.mjs";

async function main() {
  const env = loadEnv();

  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: node scripts/verify-tenant.mjs <tenant key | host | url>");
    process.exitCode = 1;
    return;
  }

  const RAW_V = env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01";
  const API_V = /^v/.test(RAW_V) ? RAW_V : `v${RAW_V}`;

  // Single-tenant: gate the project configured in .env. The `arg` is just a label.
  const sp = env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  // --drafts (previewDrafts) needs a token with draft-read access — a Viewer token has
  // it; a published-only read token won't see staged copy.
  const stoken = env.SANITY_API_READ_TOKEN || env.SANITY_WRITE_TOKEN;
  if (!sp || !stoken) {
    console.error(
      "Set NEXT_PUBLIC_SANITY_PROJECT_ID + SANITY_API_READ_TOKEN in .env\n" +
        "  (--drafts needs a token with draft-read access, e.g. a Viewer token).",
    );
    process.exitCode = 1;
    return;
  }
  const t = {
    key: arg,
    projectId: sp,
    dataset: env.NEXT_PUBLIC_SANITY_DATASET || "production",
    readToken: stoken,
    siteUrl: env.NEXT_PUBLIC_SITE_URL || null,
  };

  const checks = [];
  const add = (level, label, detail) => checks.push({ level, label, detail: detail || "" });
  const PASS = "pass", WARN = "warn", FAIL = "fail";

  add(PASS, "Single-tenant project", `gating ${t.projectId} from .env`);

  // ── Content (the project) ───────────────────────────────────────────────
  if (t.projectId && t.readToken) {
    const cq = `{
      "settings": *[_type=="settings"][0]{"name": branding.siteTitle, "phone": structuredData.organization.contact.phone, "email": structuredData.organization.contact.email},
      "services": count(*[_type=="service"]),
      "areas": count(*[_type=="area"]),
      "placeholders": count(*[(_type=="service"||_type=="area"||_type=="page"||_type=="post") && (name match "*[DEV]*" || title match "*[DEV]*" || title match "*lorem*" || name match "*lorem*")]),
      "bodyPlaceholders": count(*[_type=="area" && pt::text(intro) match "*PLACEHOLDER*"]),
      "genericServices": count(*[_type=="service" && summary match "Professional * from *"]),
      "servicesNoImage": count(*[_type=="service" && !defined(heroImage.asset)]),
      "areasNoImage": count(*[_type=="area" && !defined(heroImage.asset)]),
      "homeHeroNoBg": count(*[_type=="page" && slug.current=="/"][0].pageBuilder[_type=="heroBanner" && !defined(backgroundImage.asset)]),
      "serviceDocs": *[_type=="service"]{ "name": name, "slug": slug.current, "summary": summary, "overview": pt::text(overview), "pricing": pt::text(pricingIndication), "hasIncluded": count(whatsIncluded) },
      "areaDocs": *[_type=="area"]{ "name": name, "slug": slug.current, "intro": pt::text(intro) }
    }`;
    // Pin the perspective EXPLICITLY in both modes. On API versions before
    // 2025-02-19 the default is `raw`, which returns BOTH the published doc AND its
    // draft as separate documents — that would double-count and let unpublished
    // draft copy contaminate every content guard. So:
    //   default  → perspective=published    (gate exactly what is live)
    //   --drafts → perspective=previewDrafts (gate the STAGED copy: each doc's draft
    //              if one exists else its published version, drafts. prefix stripped —
    //              i.e. what the page will look like once published). Needs a token
    //              with draft read access (a Viewer token has it).
    const useDrafts = process.argv.includes("--drafts");
    const perspective = useDrafts ? "previewDrafts" : "published";
    const cUrl = `https://${t.projectId}.api.sanity.io/${API_V}/data/query/${t.dataset || "production"}?query=${encodeURIComponent(cq)}&perspective=${perspective}`;
    try {
      const cRes = await fetch(cUrl, { headers: { Authorization: `Bearer ${t.readToken}` } });
      const cj = await cRes.json();
      // A failed request (bad/low-priv token, rejected perspective) returns an
      // {error} body, not a throw — without this the content guards would iterate
      // empty arrays and print misleading green checks. Surface it as a FAIL.
      if (!cRes.ok || cj.error) {
        add(FAIL, "Content query", `${cRes.status}: ${String(cj.error?.description || cj.error || "request failed").slice(0, 140)}`);
      }
      const c = cj.result || {};
      const s = c.settings || {};
      add(s.name ? PASS : FAIL, "Business name (NAP)", s.name || "missing");
      add(s.phone ? PASS : FAIL, "Phone (NAP)", s.phone || "missing");
      add(s.email ? PASS : WARN, "Email (NAP)", s.email || "missing");
      add(c.services > 0 ? PASS : FAIL, "Services present", `${c.services || 0}`);
      add(c.areas > 0 ? PASS : FAIL, "Areas present", `${c.areas || 0}`);
      add(!c.placeholders ? PASS : FAIL, "No [DEV]/lorem placeholders", c.placeholders ? `${c.placeholders} found` : "");
      add(!c.bodyPlaceholders ? PASS : FAIL, "No [PLACEHOLDER] body copy", c.bodyPlaceholders ? `${c.bodyPlaceholders} area page(s) — replace intros` : "");
      add(!c.genericServices ? PASS : WARN, "No auto-generated service summaries", c.genericServices ? `${c.genericServices} generic ("Professional … from …") — write real copy` : "");
      // Imagery gaps — a seed that didn't get its trade's photos (e.g. wrong/missing
      // image set) shows blank cards/heroes. Catches imageless or mis-seeded sites.
      // BLOCKING: every service/area missing its image is the signature of a
      // mis-seeded or wrong-trade site (e.g. electrician seeded with no image set);
      // don't let it reach a paying client. Home-hero bg stays a WARN because the
      // light splitForm hero variant intentionally ships without a background image.
      add(!c.servicesNoImage ? PASS : FAIL, "Services have images", c.servicesNoImage ? `${c.servicesNoImage} service(s) missing heroImage — re-seed with this trade's image set` : "");
      add(!c.areasNoImage ? PASS : FAIL, "Areas have images", c.areasNoImage ? `${c.areasNoImage} area(s) missing heroImage — re-seed with this trade's image set` : "");
      add(!c.homeHeroNoBg ? PASS : WARN, "Home hero has a background image", c.homeHeroNoBg ? "home heroBanner has no backgroundImage (OK for the light splitForm variant)" : "");

      // ── Content guards (research-driven copy) ───────────────────────────────
      // Load the per-page content briefs once (opt-in via --briefs <dir>, the
      // output of research-brief.mjs). Used to (1) allowlist claims the client
      // genuinely declares in their brief and (2) check keyword coverage. The
      // brief is the human-declared source of truth for what's factually true.
      const bi = process.argv.indexOf("--briefs");
      const briefsDir = bi >= 0 ? process.argv[bi + 1] : null;
      let briefs = [];
      let declaredFacts = "";
      if (briefsDir) {
        try {
          briefs = fs
            .readdirSync(briefsDir)
            .filter((f) => f.endsWith(".json") && f !== "index.json")
            .map((f) => JSON.parse(fs.readFileSync(path.join(briefsDir, f), "utf8")));
          // Everything the brief declares as fact — accreditations, summaries,
          // descriptions, pricing — flattened into one searchable blob.
          declaredFacts = briefs.map((b) => JSON.stringify(b.facts || {})).join("  ");
        } catch (e) {
          add(WARN, "Content briefs", `could not read ${briefsDir}: ${String(e).slice(0, 70)}`);
        }
      }
      // Use the SAME normaliser the detector uses, so a phrase detected in copy can
      // be matched against the brief that declares it (see content-claims.mjs).
      const normClaim = normaliseClaimText;
      const declaredNorm = normClaim(declaredFacts);

      // BLOCKING: a claim in the copy that the client's brief does NOT back. A demo
      // phrase the client genuinely DECLARES in their brief (e.g. a real Worcester
      // Bosch accreditation) may legitimately appear on the page; one that's in the
      // copy but absent from the brief almost certainly inherited the pack phrasing
      // and/or is an unsubstantiated claim. With no --briefs supplied we can't tell
      // genuine from inherited, so every demo phrase blocks (strict default).
      const allCopy = [
        ...(c.serviceDocs || []).flatMap((s) => [s.summary, s.overview, s.pricing]),
        ...(c.areaDocs || []).map((a) => a.intro),
      ]
        .filter(Boolean)
        .join("  ");
      const { blocking, warnings } = findRiskyClaims(allCopy);
      const uniqBlock = [...new Set(blocking)];
      const inherited = uniqBlock.filter((p) => !(declaredNorm && declaredNorm.includes(normClaim(p))));
      const declaredHits = uniqBlock.filter((p) => declaredNorm && declaredNorm.includes(normClaim(p)));
      add(
        !inherited.length ? PASS : FAIL,
        "No inherited / unsupported claims",
        inherited.length
          ? `found ${inherited.slice(0, 4).join(", ")} — not in the client's brief; rewrite from real facts`
          : declaredHits.length
            ? `${declaredHits.length} pack-style phrase(s) allowed — declared in brief (confirm true, see WARN)`
            : "",
      );
      // The allowlist source includes the brief's service summaries, which on a
      // not-yet-customised brief can echo pack phrasing. So don't SILENTLY pass an
      // allowlisted demo phrase — name it for a human to confirm it's genuinely true
      // for this client (DMCC: no unsubstantiated claims).
      if (declaredHits.length) add(WARN, "Confirm these declared pack-style claims are genuinely true", declaredHits.join(", "));
      const uniqWarn = [...new Set(warnings.map((w) => w.label))];
      if (uniqWarn.length) add(WARN, "Claims to verify are true for this client", uniqWarn.join(", "));

      // Depth: thin copy ranks poorly + reads as filler.
      const wc = (txt) => String(txt || "").trim().split(/\s+/).filter(Boolean).length;
      const thinSvc = (c.serviceDocs || []).filter((s) => wc(s.overview) < 250).map((s) => s.name);
      add(!thinSvc.length ? PASS : WARN, "Service copy depth (>=250 words)", thinSvc.length ? `${thinSvc.length} thin: ${thinSvc.slice(0, 3).join(", ")}` : "");
      const thinArea = (c.areaDocs || []).filter((a) => wc(a.intro) < 120).map((a) => a.name);
      add(!thinArea.length ? PASS : WARN, "Area intro depth (>=120 words)", thinArea.length ? `${thinArea.length} thin: ${thinArea.slice(0, 3).join(", ")}` : "");

      // Structure: required sections present per service.
      const noOverview = (c.serviceDocs || []).filter((s) => !String(s.overview || "").trim()).map((s) => s.name);
      add(!noOverview.length ? PASS : WARN, "Services have an overview body", noOverview.length ? `${noOverview.length} missing: ${noOverview.slice(0, 3).join(", ")}` : "");
      const noIncluded = (c.serviceDocs || []).filter((s) => !(s.hasIncluded > 0)).map((s) => s.name);
      add(!noIncluded.length ? PASS : WARN, "Services have a what's-included list", noIncluded.length ? `${noIncluded.length} missing: ${noIncluded.slice(0, 3).join(", ")}` : "");

      // Keyword coverage — opt-in: pass --briefs <dir> (output of research-brief.mjs)
      // to check each page's primary target keyword actually appears in the copy.
      // Token-subset match (not a verbatim substring): normalise both sides
      // (lower-case, "&"→"and", strip punctuation), then require every meaningful
      // token of the keyword to appear in the copy. So the search query "plumber
      // altrincham" is satisfied by natural prose "...a plumber in Altrincham",
      // and "boiler installation & heating upgrades" by copy that reads
      // "...installing boilers and upgrading heating". Stopwords/short words ignored.
      const norm = (s) => String(s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
      const STOP = new Set(["and", "the", "for", "with", "near", "your", "you", "our"]);
      const kwTokens = (kw) => norm(kw).split(" ").filter((w) => w.length >= 3 && !STOP.has(w));
      if (briefs.length) {
        const missing = [];
        for (const b of briefs) {
          const kw = (b.targetKeywords || [])[0];
          if (!kw) continue;
          let text = null;
          if (b.page === "service") {
            const d = (c.serviceDocs || []).find((s) => s.slug === b.service);
            text = d ? `${d.overview || ""} ${d.summary || ""}` : null;
          } else if (b.page === "area") {
            const d = (c.areaDocs || []).find((a) => a.slug === b.area);
            text = d ? d.intro || "" : null;
          } else continue;
          if (text !== null && text.trim()) {
            const hay = norm(text);
            const toks = kwTokens(kw);
            if (!toks.length) {
              // Keyword reduced to nothing checkable (all stopwords / <3 chars) —
              // surface it rather than passing vacuously.
              missing.push(`${b.title} ⟶ "${kw}" (no checkable tokens)`);
            } else {
              const missTok = toks.filter((tk) => !hay.includes(tk));
              if (missTok.length) missing.push(`${b.title} ⟶ "${kw}" (no: ${missTok.join(", ")})`);
            }
          }
        }
        add(!missing.length ? PASS : WARN, "Primary keyword present in copy", missing.length ? `${missing.length} page(s) miss target: ${missing.slice(0, 2).join("; ")}` : "");
      }
    } catch (e) {
      add(FAIL, "Content query", e.message);
    }
  }

  // ── Live site ─────────────────────────────────────────────────────────────
  if (t.siteUrl) {
    const base = t.siteUrl.replace(/\/$/, "");
    for (const [path, level] of [["/", FAIL], ["/sitemap.xml", FAIL], ["/robots.txt", WARN], ["/privacy", WARN], ["/contact", WARN]]) {
      try {
        const r = await fetch(`${base}${path}`, { redirect: "follow" });
        add(r.ok ? PASS : level, `GET ${path}`, r.ok ? "" : `HTTP ${r.status}`);
      } catch (e) {
        add(level, `GET ${path}`, e.message);
      }
    }
  } else {
    add(WARN, "Live site", "no siteUrl to probe");
  }

  // ── Report ────────────────────────────────────────────────────────────────
  const icon = { pass: "✓", warn: "⚠", fail: "✗" };
  console.log(`Pre-go-live check — ${t.key} (${t.projectId})${process.argv.includes("--drafts") ? "  [drafts/staged]" : ""}\n`);
  for (const c of checks) {
    console.log(`  ${icon[c.level]} ${c.label}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  const fails = checks.filter((c) => c.level === FAIL).length;
  const warns = checks.filter((c) => c.level === WARN).length;
  console.log(`\n${fails ? `✗ NOT READY — ${fails} blocking issue(s), ${warns} warning(s).` : `✓ READY${warns ? ` — ${warns} warning(s) to review` : ""}.`}`);
  process.exitCode = fails ? 1 : 0;
}

await main();
