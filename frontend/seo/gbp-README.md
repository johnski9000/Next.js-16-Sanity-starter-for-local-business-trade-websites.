# GBP Performance Toolkit

Google Business Profile API wrapper + workflow scripts that pull local-pack performance, diff it week-on-week, and join it with GSC organic search and GA4 on-site conversions for the client site (target resolved from `.env` / Sanity).

Built around the existing `frontend/seo/` Node.js script pattern (matches `gsc-query.mjs`, `ga4-query.mjs`, and `ahrefs-query.mjs`).

## What's in this toolkit
- `gbp-query.mjs` — base API wrapper for the 3 Business Profile APIs
- `gbp-analyse.mjs` — weekly 90-day snapshot + delta report writer
- `gsc-ga4-gbp-attribution.mjs` — joins GBP local-pack performance with GSC organic search and GA4 on-site conversions
- `gbp-discover.mjs` — one-off probe to validate IDs + scopes + API enablement (also detects quota-gate)
- `monday-runner.mjs` — single command that runs the whole weekly stack

## Setup steps (one-time)

### 1. Enable APIs in Google Cloud Console
- My Business Account Management API: https://console.cloud.google.com/apis/library/mybusinessaccountmanagement.googleapis.com
- My Business Business Information API: https://console.cloud.google.com/apis/library/mybusinessbusinessinformation.googleapis.com
- Business Profile Performance API: https://console.cloud.google.com/apis/library/businessprofileperformance.googleapis.com

All three must be enabled on the same Cloud project that owns the OAuth client used by `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

### 2. OAuth scopes
The shared `GOOGLE_REFRESH_TOKEN` should have all of these scopes:
- `https://www.googleapis.com/auth/webmasters.readonly` (GSC)
- `https://www.googleapis.com/auth/analytics.readonly` (GA4 read)
- `https://www.googleapis.com/auth/analytics.edit` (GA4 admin, future-proof)
- `https://www.googleapis.com/auth/business.manage` (GBP — umbrella scope covering Performance + Information + Reviews + Q&A)

Regenerate the token via the [OAuth Playground](https://developers.google.com/oauthplayground/) with **Use your own OAuth credentials** -> paste `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` -> paste all four scopes space-separated into **Input your own scopes** -> authorize -> exchange. A token issued with only a subset of scopes will 403 on whichever API is missing.

### 3. .env keys required
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`
- `GBP_ACCOUNT_ID` (format: `accounts/NUMERIC` or just `NUMERIC` — wrapper normalises)
- `GBP_LOCATION_ID` (format: `locations/NUMERIC` or just `NUMERIC`)

(`.env.local` also supported; either filename works.)

### 4. Find your IDs
- Go to https://business.google.com -> log in -> click your location card
- URL will be `business.google.com/n/{ACCOUNT_NUMERIC}/profile?fid={LOCATION_NUMERIC}`
- Account ID = the number after `/n/`
- Location ID = the `fid` query param

OR run the probe: `node frontend/seo/gbp-discover.mjs` — it lists every account + location the OAuth user can see.

## The quota allowlist gotcha (CRITICAL)

Google sets the default Business Profile API quota to **zero requests per minute** on new Cloud projects. Even with APIs enabled and scopes correct, every call returns `403 RESOURCE_EXHAUSTED` with `quota_limit_value=0` until you submit the access form.

**Submit the access request form**: https://support.google.com/business/contact/api_default

**This project's allowlist case ID**: `4-7733000041342` (submitted 2026-05-31, expected approval 7-10 business days)

The scripts in this toolkit detect the quota-gate error specifically and exit cleanly with a `QUOTA NOT YET GRANTED` banner — no crash, no half-written outputs. Once approval lands, the same commands just work.

## Scripts — usage

### `gbp-query.mjs` — smoke test
```bash
node frontend/seo/gbp-query.mjs
```
Validates OAuth + API enablement + ID correctness. Run after any `.env` change. Also imports as a library from the other scripts — centralising the request shape here means schema fixes (auth, quota detection, ID normalisation) only happen in one place.

### `gbp-analyse.mjs` — weekly snapshot
```bash
node frontend/seo/gbp-analyse.mjs
```
**Run every Monday.** Pulls a 90-day GBP baseline (impressions, website clicks, call clicks, direction requests, top search keywords), diffs it against the previous snapshot, and writes:
- `frontend/seo/data/gbp/snapshots/gbp-YYYY-MM-DD.json` (raw)
- `frontend/seo/data/gbp/reports/gbp-{baseline|delta}-YYYY-MM-DD.md` (digest)

First run writes a `baseline` report; every subsequent run writes a `delta` report against the previous snapshot.

### `gsc-ga4-gbp-attribution.mjs` — three-way join
```bash
node frontend/seo/gsc-ga4-gbp-attribution.mjs
```
**Run weekly, after the other snapshots are fresh.** Requires `gsc-query.mjs` and `ga4-analyse.mjs` to have produced fresh snapshots first. Joins GBP local-pack performance with GSC organic search and GA4 on-site conversions and writes the unified attribution report.

Outputs:
- `frontend/seo/data/gbp/attribution/gsc-ga4-gbp-YYYY-MM-DD.json`
- `frontend/seo/data/gbp/reports/gsc-ga4-gbp-attribution-YYYY-MM-DD.md`

### `monday-runner.mjs` — run the lot
```bash
node frontend/seo/monday-runner.mjs
```
Runs the full weekly stack (GSC -> GA4 -> GBP -> attribution) in the correct order. Exits with a digest of what was written and what failed.

## Cadence
- **Monday morning** — run `node frontend/seo/monday-runner.mjs` (5-10 min)
- **First Monday of each month** — review the delta reports for trends, decide next batch of GBP posts based on which Month 1/2 angles drove clicks

| Day | Task | Time |
|---|---|---:|
| Monday | `monday-runner.mjs` (full stack) | 5-10 min |
| Monthly | Review delta reports, plan next GBP post batch | 30 min |

## Key metrics to watch (in GBP reports)
- **`website_clicks`** — direct CTR from local pack to site (rising = post pilot working)
- **`call_clicks`** — phone interest (rising = local intent strong)
- **`direction_requests`** — physical-visit intent (lower priority for a remote agency, but signals local trust)
- **`total_impressions`** — visibility (track Search vs Maps split — Search is where business search lives, Maps is where navigation lives)
- **search keywords** — what people type to find you (compare to GSC top queries for vocabulary gaps)

## What GBP unlocks vs GSC + GA4 alone

GSC tells you: did our ranking move in organic search?
GA4 tells you: did the visitors who arrived convert?
GBP adds: did people find the **business** itself in the local pack / Maps? Did they click through to the site, call, or ask for directions from the listing? What search terms surfaced the listing (which often differ from the queries that rank organic pages)?

Joining all three via `gsc-ga4-gbp-attribution.mjs` is what separates "we rank well organically" from "we are the local choice when someone searches with local intent."

## When endpoints break
- **Quota allowlist revoked** -> re-submit the form, check the case in Google's support portal
- **401 on token exchange** -> refresh token expired or scopes changed; regenerate via OAuth Playground (see Setup step 2)
- **404 on location** -> re-run `gbp-discover.mjs`, check whether the location was deleted/merged in the GBP UI
- **Empty timeseries despite live business** -> check the GBP listing isn't suspended (business.google.com will show a banner at the top)
- **403 `RESOURCE_EXHAUSTED` with `quota_limit_value=0`** -> the allowlist hasn't been granted yet (or was revoked). The scripts detect this and print the `QUOTA NOT YET GRANTED` banner.

## API cost

The Business Profile APIs are free under the standard allowlisted quota (300 requests per minute once granted), well above what this toolkit uses (~10-20 requests per weekly run). No billing exposure.

## Files

```
frontend/seo/
├── gbp-query.mjs                # base wrapper
├── gbp-analyse.mjs              # weekly analyser
├── gbp-discover.mjs             # probe / validate IDs
├── gsc-ga4-gbp-attribution.mjs  # 3-way join
├── monday-runner.mjs            # run the whole stack
├── gbp-README.md                # this file
└── data/gbp/
    ├── snapshots/               # gbp-YYYY-MM-DD.json
    ├── reports/                 # gbp-{baseline|delta}-YYYY-MM-DD.md + gsc-ga4-gbp-attribution-YYYY-MM-DD.md
    └── attribution/             # gsc-ga4-gbp-YYYY-MM-DD.json
```
