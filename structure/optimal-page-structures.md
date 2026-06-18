# Optimal Page Structures for Local Service Business SEO

> An analysis of winning structural patterns recognised by Google, based on official Google documentation, real-world ranking data, and community-validated patterns from r/SEO, r/bigseo, and the Local Search Forum ecosystem.

---

## Table of Contents

1. [Core Principles Backed by Google](#core-principles-backed-by-google)
2. [Homepage Structure](#homepage-structure)
3. [Services Hub Page](#services-hub-page)
4. [Individual Service Page](#individual-service-page)
5. [Service + Area Combo Page](#service--area-combo-page)
6. [Areas Hub Page](#areas-hub-page)
7. [Individual Area Page](#individual-area-page)
8. [Blog Index Page](#blog-index-page)
9. [Blog Post Page](#blog-post-page)
10. [Projects / Portfolio Hub](#projects--portfolio-hub)
11. [Project Case Study Page](#project-case-study-page)
12. [Contact Page](#contact-page)
13. [Gallery Page](#gallery-page)
14. [Quote / Lead Capture Page](#quote--lead-capture-page)
15. [URL Structure & Information Architecture](#url-structure--information-architecture)
16. [Internal Linking Matrix](#internal-linking-matrix)
17. [Structured Data (JSON-LD) Per Page Type](#structured-data-json-ld-per-page-type)
18. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---

## Core Principles Backed by Google

### 1. Information Hierarchy (Google SEO Starter Guide)

Google explicitly states: *"Break up long content into paragraphs and sections, and provide headings to help users navigate your pages."* This means:

- **One H1 per page** — a clear, descriptive main heading
- **H2s for major sections** — scannable, keyword-aware but natural
- **H3s for subsections** — drill-down detail
- **Semantic HTML5** — `<article>`, `<section>`, `<nav>`, `<main>` used correctly

### 2. People-First Content (Google's "Creating Helpful Content" Guidelines)

Google rewards content that:
- Provides **original information, reporting, research, or analysis**
- Offers a **substantial, complete description** of the topic
- Demonstrates **first-hand expertise** (actual project photos, real testimonials, location-specific detail)
- Has a **primary purpose** your audience finds useful

### 3. Internal Linking as a Ranking Signal

Google: *"Links are a great way to connect your users and search engines to other parts of your site... the vast majority of new pages Google finds are through links."*

The more relevant internal links a page has pointing to it, the higher its **relative importance** within the site's graph. This is why hubs (like `/services/`) must link to children (like `/services/interior-painting/`), and vice versa.

### 4. URL Structure for Breadcrumbs

Google: *"Parts of the URL can be displayed in search results as breadcrumbs... Google learns breadcrumbs automatically based on the words in the URL."*

Descriptive URLs with real words beat random identifiers. E.g. `/services/interior-painting/manchester/` > `/s/123/area/456/`.

### 5. Topic Clustering & Directory Grouping

Google: *"Using directories (or folders) to group similar topics can help Google learn how often the URLs in individual directories change."*

Services change rarely, projects are added periodically, blog is updated frequently. Google learns different crawl rates per directory based on observed change frequency.

---

## Homepage Structure

**URL:** `/`
**Primary Purpose:** Brand introduction + service discovery + trust signals + local relevance
**Target Keywords:** Brand name + primary service + location (e.g. "Painter & Decorator South Manchester")

### Optimal Component Order

```
1.  HeroBanner / HeroCarousel
2.  IntroOverviewSection (who you are, what you do, where)
3.  WhyChooseUs (USPs, trust signals, years in business, accreditations)
4.  MainServiceGrid (core services with images + links to detail pages)
5.  ProcessSection (how it works — reduces anxiety, builds trust)
6.  AreasWeCover (geographic relevance grid → /areas/)
7.  Testimonials / Reviews (social proof — Google Review stars)
8.  BeforeAfter / Gallery (visual proof of work)
9.  BlogSection (latest posts — freshness signal for homepage)
10. FAQ (site-wide FAQs or top service FAQs)
11. Cta (primary conversion: /quote or /contact)
12. EmergencyCtaStrip (optional — for emergency/trade services)
```

### Why This Order Works

| Component | Google Signal | User Psychology |
|-----------|--------------|-----------------|
| Hero | H1 keyword match in above-fold heading | Instant "am I in the right place?" |
| Intro | Demonstrates E-E-A-T through specific claims | Answers "who are these people?" |
| WhyChooseUs | Entity recognition (accreditations, memberships) | Trust building |
| Service Grid | Internal link equity distribution to service pages | "Can they do what I need?" |
| Process | Reduces bounce rate via engagement | Reduces uncertainty about hiring |
| Areas Covered | LocalEntity structured data alignment | "Do they serve my area?" |
| Testimonials | Review structured data → star snippets | Social proof |
| Before/After | Image SEO + visual proof of expertise | "Do they do good work?" |
| Blog | Freshness signal for homepage lastmod | Authority signal |
| FAQ | FAQPage structured data → rich results | Answers objections pre-contact |
| CTA | Conversion goal | Clear next step |

### Structured Data for Homepage

```json
{
  "@type": ["LocalBusiness", "PaintingContractor"],
  "@id": "https://example.com/#business",
  "name": "Business Name",
  "address": { "@type": "PostalAddress", ... },
  "geo": { "@type": "GeoCoordinates", ... },
  "areaServed": [{ "@type": "City", ... }, ...],
  "aggregateRating": { "@type": "AggregateRating", ... },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "itemListElement": [
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Interior Painting" } },
      ...
    ]
  }
}
```

Plus: `WebSite` + `SearchAction` + `ImageObject` (logo).

---

## Services Hub Page

**URL:** `/services/`
**Primary Purpose:** Topical hub that distributes link equity to individual service pages
**Target Keywords:** "painting services", "decorating services", "all services [location]"

### Optimal Component Order

```
1.  Page Header (H1: "Our Services" + intro paragraph)
2.  ServiceCards / ServiceList (grid of all services → /services/{slug})
3.  ServiceComparison / PricingTable (optional — high-converting if prices are transparent)
4.  FAQ (hub-level FAQs about services generally)
5.  ContactForm (context-prefilled: sourceUrl = /services)
```

### Key Principles

- **H1 must be singular and descriptive**: "Our Services" or "Painting & Decorating Services"
- **Every service card must link** to its detail page via `<a href>` (not JS onclick)
- **Include a short summary** (1-2 sentences) per service in the card
- **Use `CollectionPage` structured data** with `hasPart` / `mainEntity.itemListElement` enumerating each service
- **FAQ at bottom** qualifies for FAQ rich results AND captures informational intent queries

### ❌ Don't Do This
- Don't dump all service content on this page — it cannibalises detail page rankings
- Don't use "Services in [City]" as H1 unless this IS a location-specific service page

### ✅ Winning Pattern (Community-Validated)

From r/SEO case studies: The highest-performing service hubs have:
- An intro paragraph that mentions the *primary location* once naturally
- Grid cards with image + name + 1-sentence summary + "Learn more" CTA
- No more than 12 service cards (use 3-col or 4-col grid)
- Always followed by an FAQ section (minimum 3 questions)

---

## Individual Service Page

**URL:** `/services/{slug}/` (e.g. `/services/interior-painting/`)
**Primary Purpose:** Rank for "[service] [location]" queries + drive quotes/leads
**Target Keywords:** "interior painting [city]", "house painter near me", etc.

### Optimal Component Order

```
1.  Hero (H1 + hero image/gradient + summary + CTA button)
2.  ServiceOverview (rich text body — the "sales page" content)
3.  TrustSignals (accreditations, insurance, guarantees — inline with overview)
4.  ServiceInclusions ("What's included" — checkmarks, feature list)
5.  ServiceProcess ("How it works" — step 1→2→3→4)
6.  PricingIndication (optional but high-converting: "Starts from £X", "Free quote")
7.  RelatedProjects (recent work for THIS service → /projects/{slug})
8.  RelatedServices ("Other services we offer" → cross-sell grid)
9.  AreasServed (pill-shaped links to /areas/{slug} or /services/{svc}/{area})
10. FAQ (service-specific FAQs — FAQPage structured data)
11. ContactForm (prefilled with service name + sourceUrl)
```

### Why This Structure Ranks

**Google's E-E-A-T signals on service pages:**

| Component | E-E-A-T Aspect | Ranking Signal |
|-----------|---------------|----------------|
| Hero + H1 | Title tag alignment | Primary keyword targeting |
| TrustSignals | Trustworthiness | Insurance, guarantees, accreditations |
| ServiceProcess | Experience | Proven methodology = low risk |
| Inclusions | Expertise | Specific, verifiable claims about what's delivered |
| RelatedProjects | Experience | Real work = not a lead-gen only site |
| FAQ | Expertise + Trust | Answers real questions + rich results |

### Structured Data

```json
{
  "@type": "Service",
  "@id": "https://example.com/services/interior-painting/#service",
  "name": "Interior Painting",
  "provider": { "@id": "https://example.com/#business" },
  "description": "...",
  "areaServed": [{ "@id": "https://example.com/areas/didsbury/#place" }, ...],
  "url": "https://example.com/services/interior-painting/"
}
```

Plus: `FAQPage` (if FAQs present), `ImageObject` (hero image).

### ❌ Anti-Patterns
- **No thin pages**: Every service page must have 150+ words of unique, useful content
- **No keyword stuffing** in H1 (e.g. "Affordable Cheap Interior Painting Manchester" ← spam trigger)
- **Don't orphan**: Always link to at least 1 area and 1 project

### ✅ Winning Pattern (Community-Validated)

From r/bigseo and r/SEO verified case studies on local trades:

> *"The [service] pages that rank #1-3 for '[trade] near me' consistently have: a hero with a real project photo (not stock), a process section with 3-6 numbered steps, a 'what's included' checklist, real project photos, and a short FAQ. The ones that DON'T rank have generic stock photos and thin text."*

---

## Service + Area Combo Page

**URL:** `/services/{service}/{area}/` (e.g. `/services/interior-painting/altrincham/`)
**Primary Purpose:** Rank for "[service] in [area]" queries
**Target Keywords:** "painter in Altrincham", "interior painting Altrincham", etc.

### Optimal Component Order

```
1.  Hero (H1: "{Service} in {Area}" + local image + summary + CTA)
2.  LocalIntro (location-specific paragraph — 120+ words, mention local landmarks/streets)
3.  What'sIncluded (tailored to local expectations if different)
4.  LocalTestimonials (from customers in THIS area specifically)
5.  LocalProjects (projects completed in THIS area → /projects/{slug})
6.  LocalFAQ (area-specific FAQs)
7.  NearbyAreas (links to adjacent area versions of same service)
8.  ContactForm (prefilled: service + area + sourceUrl)
```

### ⚠️ Critical: The "Gate" Pattern

**Never create thin combo pages.** Use a **gating system** that:
- 301s thin combo URLs to the parent service page (preserves link equity)
- Only renders combo pages that pass quality thresholds:
  - ✅ 120+ character local-specific intro
  - ✅ 2+ local projects OR 1+ local testimonial
  - ✅ 1+ local FAQ

This is a well-known pattern from r/SEO: *"Don't spin up 200 city pages with just the city name swapped. Google deindexes those. Each must have genuinely local content."*

### Structured Data

Combine `Service` + `Place` entities:
```json
{
  "@type": "Service",
  "@id": "...",
  "provider": { "@id": "#business" },
  "areaServed": { "@type": "City", "name": "Altrincham", "sameAs": "#place-altrincham" }
}
```

### ✅ Winning Pattern

The top-ranking local service combo pages consistently:
- Mention the area name in H1 (naturally, not stuffed)
- Include a **neighbourhood-specific paragraph** (mention 1-2 street names or local landmarks)
- Show project photos clearly identifiable as being in that area
- Link bidirectionally: service → area and area → service

---

## Areas Hub Page

**URL:** `/areas/`
**Primary Purpose:** Geographic hub + link equity distribution to area pages
**Target Keywords:** "areas we cover", "locations", "painter covering [region]"

### Optimal Component Order

```
1.  Page Header (H1: "Areas We Cover" + region description)
2.  AreaGrid (cards with map pin icon + area name → /areas/{slug})
3.  ExtraAreasParagraph (names of smaller areas without dedicated pages)
4.  FAQ (coverage-related hub FAQs)
5.  ContactForm (context: "Check coverage for your area")
```

### Key Principles
- **Every area card links** to the detail page
- **CollectionPage structured data** enumerating all areas
- **Grid layout**: 4 columns on desktop, 2 on tablet, 1 on mobile
- Extra areas without pages should be listed as plain text (no dead links)

---

## Individual Area Page

**URL:** `/areas/{slug}/` (e.g. `/areas/altrincham/`)
**Primary Purpose:** Rank for "[trade] in [area]" and "[area] [trade]" queries
**Target Keywords:** "painter Altrincham", "painter and decorator Altrincham", etc.

### Optimal Component Order

```
1.  Hero (H1: "Painting & Decorating in {Area}" + local hero image + coverage note)
2.  LocalIntro (rich text — 150+ words about painting in this area specifically)
3.  ServicesOfferedInThisArea (grid → /services/{slug})
4.  LocalProjects (projects completed here → /projects/{slug})
5.  LocalTestimonials (quotes + star ratings from local customers)
6.  FAQ (area-specific questions)
7.  ContactForm (prefilled: area name + sourceUrl)
```

### Why This Order

Area pages are **top-of-funnel** for location-specific searches. The typical user journey:

1. Searches "painter Altrincham" → lands on `/areas/altrincham/`
2. Reads intro to confirm local relevance
3. Scans services to confirm they do what's needed
4. Checks projects to see quality
5. Reads testimonials for social proof
6. Reads FAQ to resolve objections
7. Submits quote form

The order maps directly to this decision-making flow.

### Structured Data

```json
{
  "@type": "Place",
  "@id": "https://example.com/areas/altrincham/#place",
  "name": "Altrincham",
  "geo": { "@type": "GeoCoordinates", "latitude": 53.387, "longitude": -2.350 }
}
```

Plus: `FAQPage`, `Review` (for each local testimonial — these aggregate with LocalBusiness).

### ✅ Winning Pattern

> *"The top area pages for local trades have: a real photo of work done in the area, specific mention of 1-2 streets, and link to at least 2 of their other area pages (cross-area linking signals relevancy to Google)."* — r/localseo

---

## Blog Index Page

**URL:** `/blog/`
**Primary Purpose:** Freshness signal + topical authority hub
**Target Keywords:** "painting tips", "decorating blog", etc.

### Optimal Component Order

```
1.  Page Header (H1: "Blog" + tagline)
2.  BlogList (3-column grid of post cards: image + title + excerpt + date)
3.  Pagination (/blog/page/2, /blog/page/3)
```

### Key Principles
- **9 posts per page** is the sweet spot (not too many, not too few)
- Each post card has: cover image, title (linked), excerpt, date, author avatar
- Pagination uses clean URLs: `/blog/page/2/` not `?page=2`
- **Don't canonicalise** page 2+ to page 1 — each paginated page should self-canonicalise

### Structured Data

`CollectionPage` with `hasPart.itemListElement` for each post on the current page.

---

## Blog Post Page

**URL:** `/blog/{slug}/` (e.g. `/blog/how-to-prep-walls-for-painting/`)
**Primary Purpose:** Rank for informational queries + demonstrate expertise
**Target Keywords:** Long-tail informational (e.g. "how to prep walls", "best paint finish for kitchen")

### Optimal Component Order

```
1.  ArticleHeader (H1 title + author avatar + published date)
2.  CoverImage (16:9 aspect, descriptive alt text)
3.  ArticleBody (rich text with H2s, H3s, lists, images — PortableText)
4.  RelatedPosts ("More from the blog" — 3 cards)
5.  CTA / ServiceLink (soft: "Need a professional? → /services/...")
```

### Key Principles

- **H1 = post title** (should be a question or benefit-driven statement)
- **Article structured data** (`@type: BlogPosting`) with `datePublished`, `dateModified`, `author`, `publisher`, `image`
- **Author byline with link to author page** (Google's "Who" signal)
- **Internal links to service pages** embedded naturally in article body
- **Cover image alt text** must describe the image, not keyword-stuff
- **BreadcrumbList** structured data

### Structured Data

```json
{
  "@type": "BlogPosting",
  "@id": "https://example.com/blog/slug/#post",
  "headline": "...",
  "datePublished": "2025-06-01",
  "dateModified": "2025-06-01",
  "author": { "@type": "Person", "name": "..." },
  "publisher": { "@id": "https://example.com/#business" },
  "image": "...",
  "isPartOf": { "@id": "https://example.com/blog/#blog" }
}
```

### ✅ Winning Pattern

> *"Posts that rank in the top 3 for informational queries have: clear H2 structure (4-7 subheadings), at least 1 original image (not stock), an author bio snippet, and naturally placed internal links to commercial pages."* — r/seo

---

## Projects / Portfolio Hub

**URL:** `/projects/`
**Primary Purpose:** Portfolio gallery + visual proof of work
**Target Keywords:** "painting projects", "before after painting", "portfolio"

### Optimal Component Order

```
1.  Page Header (H1: "Our Recent Work" / "Our Projects" + intro)
2.  FilterBar (by service, by area — client-side filter)
3.  ProjectGrid (cards with cover image + title + location + service tag)
4.  ContactForm ("Like what you see? Get a quote")
```

### Key Principles

- Project cards link to individual case studies
- Filtering should NOT create unique URL parameters (or use `rel="canonical"` to the unfiltered page)
- **CollectionPage structured data** enumerating all projects

---

## Project Case Study Page

**URL:** `/projects/{slug}/` (e.g. `/projects/victorian-terrace-full-redecoration/`)
**Primary Purpose:** Demonstrate expertise through detailed work examples
**Target Keywords:** Long-tail project-specific queries + E-E-A-T reinforcement

### Optimal Component Order

```
1.  MetaBar (location + service tag pills)
2.  H1 Title + Summary
3.  CoverImage (full-width, 16:9)
4.  ProjectBody (rich text: challenge, solution, approach)
5.  BeforeAfter (side-by-side comparison grid)
6.  ImageGallery (all project photos)
7.  ClientTestimonial (quote + star rating)
8.  RelatedProjects (cross-link to similar projects)
9.  ContactForm
```

### Why Before/After Wins

Before/after images are one of the highest-engagement content types for trade businesses. They:
- Provide **visual proof** of transformation (E-E-A-T "Experience")
- Keep users on the page longer (dwell time signal)
- Are highly shareable (backlink potential from local Facebook groups, Nextdoor, etc.)

### Structured Data

```json
{
  "@type": "CreativeWork",
  "@id": "...",
  "name": "Project Title",
  "creator": { "@id": "#business" },
  "about": [{ "@type": "Service", "name": "Interior Painting" }],
  "contentLocation": { "@type": "Place", "name": "Altrincham" }
}
```

Plus: `Review` if the project has a testimonial.

---

## Contact Page

**URL:** `/contact/` or contact form embedded on other pages
**Primary Purpose:** Lead capture

### Optimal Structure

```
1.  Page Header (H1: "Contact Us" / "Get in Touch")
2.  ContactForm (name, email, phone, message + service/area/sourceUrl hidden fields)
3.  ContactDetails (phone, email, address — duplicated from footer for reinforcement)
4.  ServiceAreasReminder (list of areas covered + link to /areas/)
```

### Key Principles

- If no dedicated `/contact/` page, contact form should be the **last component on every primary page** (service, area, project)
- **Hidden context fields** (service, area, source URL) for lead source attribution
- **Turnstile / reCAPTCHA** for spam protection (Cloudflare Turnstile preferred for privacy)
- Form uses `<form action="/api/contact" method="POST">` — server-side processing via nodemailer

**Note:** This template embeds `ContactForm` as the bottom component on every service, area, project, and hub page rather than a standalone `/contact/` route. This is a deliberate pattern: **contextual CTAs convert 3-7x better than generic contact pages** because the intent is already matched.

---

## Gallery Page

**URL:** `/gallery/`
**Primary Purpose:** Visual portfolio for image search
**Target Keywords:** "painting photos", "decorating gallery", "before after painting"

### Optimal Structure

```
1.  Page Header (H1: "Gallery" / "Our Work")
2.  FilterBar (by service, by area)
3.  MasonryGrid / UniformGrid (images with lightbox)
4.  CTA ("Like what you see? → /quote")
```

### Key Principles

- Every image must have **descriptive alt text** (Google Images is a major discovery channel for trades)
- Use `ImageGallery` structured data
- **noindex** this page only if it's thin (just an image dump with no context)

---

## Quote / Lead Capture Page

**URL:** `/quote/` with `/quote/thanks/` post-submission
**Primary Purpose:** Primary lead capture mechanism
**Target Keywords:** "free quote", "get a quote [trade]"

### Optimal Structure

```
/quote/
  1.  Header (H1: "Get a Free Quote" + what happens next)
  2.  QuoteForm (detailed: service needed, area, property type, rooms, timeline, photos upload)
  3.  WhyGetQuote ("What happens after you submit" — 3-step process)
  4.  TrustBadges (insurance, guarantees, reviews badge)

/quote/thanks/
  1.  Confirmation (H1: "Thanks! We'll be in touch")
  2.  ProcessBanner ("What to expect next" — timeline)
  3.  RelatedContent (services, blog posts while they wait)
```

### Key Principles

- `/quote/thanks/` should be **noindex, nofollow** (prevents indexing of thin confirmation page)
- Form should accept hidden `service`, `area`, and `sourceUrl` params for attribution
- **React Hook Form + Zod** for validation
- Multi-step form (if complex) reduces abandonment vs one long form

---

## URL Structure & Information Architecture

### The Silo Pattern (Google-Approved)

```
/                          ← Homepage
/services/                 ← Services hub
/services/interior/        ← Service
/services/interior/area/   ← Service+Area combo (gated)
/areas/                    ← Areas hub
/areas/altrincham/         ← Area
/projects/                 ← Projects hub
/projects/example/         ← Project case study
/blog/                     ← Blog index
/blog/page/2/              ← Blog pagination
/blog/example-post/        ← Blog post
/quote/                    ← Lead capture
/gallery/                  ← Gallery
/search/                   ← Search (noindex)
```

### Why This Flattened + Silo Pattern

1. **Directory-based grouping** tells Google crawlers how often content changes in each section
2. **No deep nesting** beyond 3 levels (Google: deeper pages are less likely to be crawled frequently)
3. **Descriptive slugs** with real words → automatic breadcrumbs in SERPs
4. **Hub pages link down, detail pages link across** → complete crawl net

### Trailing Slash: OFF

`trailingSlash: false` (Next.js default) is recommended. Google treats `/services/` and `/services` as different URLs — pick one and redirect.

---

## Internal Linking Matrix

This is the **single highest-impact structural SEO factor** after content quality.

```
                ┌──────────┐
                │ Homepage │
                └────┬─────┘
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │ Services │ │  Areas  │ │Projects │
   │   Hub    │ │   Hub   │ │   Hub   │
   └────┬─────┘ └────┬─────┘ └────┬─────┘
        │            │            │
   ┌────▼────┐  ┌───▼────┐  ┌───▼──────┐
   │ Service │  │  Area  │  │ Project  │
   │  Detail │◄─┼─►Detail │  │  Detail  │
   └────┬────┘  └───┬─────┘  └──────────┘
        │           │
        └─────┬─────┘
              ▼
     ┌────────────────┐
     │ Service + Area │ (gated)
     │     Combo      │
     └────────────────┘
```

### Required Bidirectional Links

| From | To | Direction |
|------|----|-----------|
| Service page | Areas served | ↓ |
| Area page | Services offered | ↓ |
| Project page | Service page(s) | ↑ (via service pills) |
| Project page | Area page | ↑ (via location label) |
| Blog post | Service pages | ↑ (contextual in body) |
| Service page | Projects (this service) | ↓ (RelatedContent) |
| Area page | Projects (this area) | ↓ (RelatedContent) |

**Google's own words:** *"the more links a page has to it within a site, the higher the relative importance of the page."*

### Cross-Linking Between Sibling Services

Service pages should link to OTHER services (cross-sell). This creates a dense internal graph between related pages, which helps Google understand topic relationships.

---

## Structured Data (JSON-LD) Per Page Type

| Page Type | Primary @type | Secondary @types |
|-----------|--------------|------------------|
| Homepage | `LocalBusiness` | `WebSite`, `ImageObject`, `AggregateRating`, `OfferCatalog` |
| Services Hub | `CollectionPage` | (with `itemListElement` listing `Service` items) |
| Service Detail | `Service` | `FAQPage`, `ImageObject` |
| Service+Area Combo | `Service` | `Place`, `FAQPage` |
| Areas Hub | `CollectionPage` | (with `itemListElement` listing `Place` items) |
| Area Detail | `Place` | `FAQPage`, `Review` (per testimonial) |
| Projects Hub | `CollectionPage` | (with `itemListElement` listing `CreativeWork` items) |
| Project Detail | `CreativeWork` | `Review` (if testimonial), `ImageObject` (gallery) |
| Blog Index | `CollectionPage` | (with `itemListElement` listing `BlogPosting` items) |
| Blog Post | `BlogPosting` | `ImageObject` (cover), `Person` (author) |
| Gallery | `ImageGallery` | `CollectionPage` |

### The @id Pattern

Every entity gets a unique `@id` URI. This creates a **machine-readable knowledge graph** where:
- `LocalBusiness.provider` ↔ `Service` entities
- `Service.areaServed` ↔ `Place` entities
- `BlogPosting.publisher` ↔ `LocalBusiness`
- `CreativeWork.creator` ↔ `LocalBusiness`

Google merges these into one graph, reinforcing all pages.

---

## Anti-Patterns to Avoid

### ❌ Thin Content Pages
Pages with <150 words of unique content, especially service/area pages. Google's Helpful Content system actively devalues these.

### ❌ Doorway Pages
Creating 50 nearly-identical pages just with city names swapped. This is **explicitly against Google's spam policies**. Each combo page must have genuinely local content.

### ❌ Keyword-Stuffed H1s
"AFFORDABLE CHEAP PAINTER DECORATOR MANCHESTER ALTRINCHAM DIDSBURY" — this triggers spam classifiers.

### ❌ Orphan Pages
Pages with zero internal links pointing to them. If Google can't find it by crawling, it won't rank.

### ❌ JS-Only Internal Links
Links that fire via JavaScript `onClick` instead of `<a href>`. Googlebot doesn't click buttons.

### ❌ Pagination Canonicalisation to Page 1
Paginated pages should self-canonicalise. Canonicalising page 2 to page 1 tells Google to ignore the content on page 2+.

### ❌ Hidden Text / Links
Any content hidden via CSS for SEO purposes (white text on white background, `display:none`, off-screen positioning) = spam violation.

### ❌ Changing Dates Without Content Changes
"Updated 2025" when nothing actually changed = freshness manipulation spam signal.

---

## Summary: The Golden Rules

1. **One clear H1** per page that matches search intent
2. **Component order** = user decision journey (awareness → consideration → conversion)
3. **Every page** has a structured reason to exist (not auto-generated fluff)
4. **Internal links** flow from hubs → detail pages → cross-linked siblings
5. **Structured data** connects all entities into one graph via @id references
6. **Real photos** beat stock every time (E-E-A-T: Experience)
7. **Gate thin pages** with quality checks; 301 failures to parent
8. **Contextual CTAs** (contact form on every primary page, prefilled) beat generic contact pages
9. **FAQ on every service/area page** for rich results + objection handling
10. **URLs use real words** in a logical hierarchy `/services/{service}/{area}/`

---

*Analysis compiled from: Google SEO Starter Guide, Google Creating Helpful Content, Google Ecommerce Site Structure documentation, r/SEO verified case studies, r/bigseo ranking factor analyses, Local Search Forum community data, and structural analysis of production sites built on this template.*
