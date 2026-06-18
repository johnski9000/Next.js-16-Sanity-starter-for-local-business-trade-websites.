# Tier 1 Citation Setup Guide

Step-by-step setup for the universal Tier 1 citations every UK local business should claim after Google Business Profile. Work one per week to keep NAP consistency tight (rushing all of them in a day risks data-entry drift). After each goes live, update `frontend/seo/citations/citations-tracker.csv` with `Status=Live` and the listing URL.

Everything below pulls from one source of truth: the canonical NAP and descriptions in `business-info.csv` (which mirror `settings.structuredData` in Sanity). Copy from there every time. Any deviation — "Rd" vs "Road", "+44 161" vs "0161", a missing space in the postcode — costs NAP consistency.

> **Service-area businesses**: on every platform that supports it, toggle "I serve customers at their location" / "hide my address" so the listing operates in SAB mode and the street address stays hidden. If the client has a public storefront, list the real address consistently instead.

---

## Platform: Bing Places for Business

- **Claim URL**: https://www.bingplaces.com
- **Prerequisites**: a Microsoft account (map the client's business email to it for ownership continuity)
- **Verification**: **Import from Google Business Profile** (instant, copies categories/hours/photos/SAB toggle in one step) — or postcard if not importing
- **Key fields**: business name, address (toggle SAB if applicable), phone, website, primary + additional categories (Bing allows up to 9), service areas (mirror GBP exactly), short + long description (from `business-info.csv`), hours, ≥3 photos, services

**Tips / pitfalls**
- Use "Import from Google" first — it's the fastest route to live and avoids re-keying.
- After import, re-verify the NAP character-for-character (Bing sometimes normalises "Road"→"Rd" or strips the postcode space).
- Bing powers DuckDuckGo, Yahoo, Ecosia and ChatGPT Search — reach is bigger than its raw search share suggests.

---

## Platform: Apple Business Connect

- **Claim URL**: https://businessconnect.apple.com
- **Prerequisites**: an Apple ID with 2FA (use a business-owned Apple ID, not a personal one — ownership transfer is painful otherwise)
- **Verification**: automated phone call (instant), document upload (1–2 days), or postcard
- **Key fields**: name, address (toggle the separate "Service Area Business" flag if applicable — it's distinct from the category), phone, website, primary + up to 3 secondary categories, up to 20 service areas, descriptions, hours, photos, services

**Tips / pitfalls**
- Verify by phone if possible — same-day live status.
- Set up **Showcases** immediately (Apple's equivalent of GBP Posts) — they surface on the Maps card and in Siri, and matter more as Apple Intelligence rolls out.
- Add a second manager (Apple allows up to 10) so ownership isn't single-point-of-failure.
- Apple Maps also ingests Foursquare and Yelp data — getting all three live within a fortnight maximises the chance Apple aligns on your canonical NAP.

---

## Platform: Yelp UK

- **Claim URL**: https://biz.yelp.co.uk
- **Prerequisites**: email + password (or Apple/Google SSO); the Business Manager account is separate from any personal Yelp account
- **Verification**: automated phone call (instant)
- **Key fields**: business name (use the trading name, not the Ltd name), address (toggle SAB), phone, website, primary + up to 2 secondary categories, service areas (up to 6, or a radius), descriptions, hours, photos, services

**Tips / pitfalls**
- **Decline every paid upsell.** Yelp's sales team pushes "Yelp Ads"/"Featured" hard; for most UK local businesses these convert poorly. Stay on the free tier.
- **Don't bulk-ask for reviews** — Yelp's filter aggressively buries reviews from new/low-activity accounts and detects the pattern. Ask 1–2 clients per quarter who already have active Yelp accounts.
- Claim and lock the listing immediately — Yelp lets anyone "suggest an edit", which is a competitor-NAP-edit risk.

---

## Platform: Foursquare for Business

- **Claim URL**: https://business.foursquare.com
- **Prerequisites**: email + password (or Google SSO); use Listings 360 (free tier), not the enterprise API tier
- **Verification**: email link (instant) or phone
- **Key fields**: name, address (toggle "service-based business"/hide address), phone, website, primary + up to 2 secondary categories, single location pin (Foursquare doesn't do multi-city service areas — do **not** create one listing per town), description, hours, photo

**Tips / pitfalls**
- Direct traffic is minimal, but the data pipeline feeds Apple Maps, Snapchat, Uber, Tesla and Samsung mapping — a clean entry quietly improves NAP accuracy across all of them.
- Run a name search after claiming and use "Report a duplicate" to merge any auto-created stub listings.
- Measure value as downstream NAP consistency, not enquiries.

---

## Suggested rollout order

One per week keeps NAP entry accurate (rushing risks drift):

| Week | Platform | Why this order |
|---|---|---|
| **1** | Bing Places | Lowest friction (one-click GBP import) + high authority (Microsoft/DuckDuckGo/Yahoo/ChatGPT Search). Locks the canonical NAP onto a major surface first. |
| **2** | Apple Business Connect | Rising importance via Siri/Apple Intelligence; phone verification lands same-day. Set up Showcases immediately. |
| **3** | Yelp UK | Tier 1 for NAP consistency and feeds Apple Maps; instant phone verification. Decline all upsells. |
| **4** | Foursquare | Lowest direct value but improves downstream NAP across Apple/Snapchat/Uber/Tesla. Last because the canonical NAP has now been entered correctly three times. |

**After all are live**: run a full Tier 1 NAP audit (see `README.md`). Search the business name on Google and verify the top results all show the canonical NAP; fix any divergence at the source listing within the week.

**Sector citations**: beyond these universal platforms, claim the trade body or sector lead/review platform relevant to the client (e.g. Gas Safe, NICEIC, FMB, Checkatrade, Rated People). Those carry strong sector-relevant signal — add them as Tier 3/4 rows in the tracker.
