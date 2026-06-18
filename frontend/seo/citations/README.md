# Citation Tracker

Three CSV files structured for Google Sheets import. Each becomes a separate tab. They ship as **blank templates** — fill them in per client from the content brief and the canonical NAP in Sanity.

## How to import into Google Sheets

1. Open Google Sheets and create a new spreadsheet
2. For each CSV file:
   - File → Import → Upload → drag the `.csv` file
   - **Import location**: "Insert new sheet(s)"
   - **Separator type**: Detect automatically (or comma)
   - **Convert text to numbers, dates, and formulas**: leave **unchecked** (preserves description text)
3. Rename each new sheet tab to match the CSV name

## Files

| File | Becomes tab | Contents |
|---|---|---|
| `business-info.csv` | Business Info | NAP, GBP service areas, categories, credentials, descriptions, assets, social profiles — all `[fill in]` |
| `services.csv` | Services | One example row; populate from the client's real services (the same ones seeded into Sanity) |
| `citations-tracker.csv` | Citations Tracker | Universal Tier 1-2 platforms pre-listed + regional/sector placeholders + a skip list |

## NAP — the canonical string to copy-paste everywhere

The single most important rule. Decide one exact Name / Address / Phone string and use it **identically** on every citation. Inconsistency (e.g. "Rd" vs "Road", different phone formats, "Ltd" present on some and not others) splits the entity signal and hurts ranking.

Keep the canonical NAP in `business-info.csv` (and matching `settings.structuredData` in Sanity) as the source of truth; copy from there every time.

## SAB (service-area business) setup for GBP

If the client serves customers at their location rather than at a storefront (most trades), set the Google Business Profile up as a service-area business:

1. **Single GBP** with the address entered, then toggle **"hide my address from customers"**
2. **List every service-area town** the client covers (from the brief / `business-info.csv`)
3. **Do not create separate GBP listings** per town — Google penalises this
4. **Toggle "hide address"** on every other citation that supports it
5. **Use the same canonical NAP string everywhere**

If the client has a public storefront, skip the address-hiding and list the real address consistently instead.

## Tier strategy

- **Tier 1 — universal core**: Google Business Profile, Bing Places, Apple Business Connect, Yell, Trustpilot, Yelp UK, Foursquare. Do these first; they apply to every UK local business.
- **Tier 2 — UK national directories**: Companies House (if a Ltd), FreeIndex, Hotfrog, Cylex, 192.com, Thomson Local.
- **Tier 3 — regional**: the client's local council directory, regional press, and local Chamber of Commerce. Often higher value per listing than national directories. Fill in the placeholders with the client's actual region.
- **Tier 4 — sector**: the trade body or sector lead/review platform relevant to the client (e.g. Gas Safe, NICEIC, FMB, Checkatrade, Rated People). A/B test paid lead platforms before committing spend.
- **SKIP**: bulk-submission services, low-quality aggregators, and pay-for-inclusion listicles. Modern Google rewards fewer, higher-authority listings, not volume.

**Earned links** (press, industry publications, digital PR) are a separate, pitch-driven workflow — not "submit your business info" — so they're tracked outside this citation list.

## Review acquisition flow

Only pursue reviews that are genuinely earned — never fabricate ratings. A simple cadence that works:

1. **Day of project handover**: email the client direct links to leave a Google + (optionally) Trustpilot review.
2. **+3 days**: soft follow-up if no review yet.
3. **+7 days**: a personal follow-up from the owner.
4. Keep the rolling 90-day review count healthy so reviews read as "recent".

## Status column conventions

| Status | Meaning |
|---|---|
| `Not Started` | Haven't begun the listing process |
| `In Progress` | Account created, listing being filled in |
| `Submitted` | Listing submitted, awaiting verification |
| `Verified` | Verified but not yet publicly visible |
| `Live` | Publicly visible and indexable |
| `Skip` | Decided not to pursue |

## Refresh / re-audit schedule

- **Monthly**: audit Tier 1 listings for NAP consistency.
- **Quarterly**: full NAP audit — search the business name on Google and verify NAP across the top results.
- **Annually**: prune dormant or low-value listings.
- **After service-area expansion**: update the GBP service-area list and any relevant regional (Tier 3) citations.
