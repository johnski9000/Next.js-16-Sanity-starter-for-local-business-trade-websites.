import {defineQuery} from 'next-sanity'

// Pin to the singleton _id so a stray second settings doc can't silently
// swap the live branding/SEO defaults (Studio + Presentation both pin "siteSettings").
export const settingsQuery = defineQuery(`*[_type == "settings" && _id == "siteSettings"][0]`)

const resolvedLink = /* groq */ `
  ...,
  "page": page->slug.current,
  "post": post->slug.current
`

export const navigationQuery = defineQuery(`
  *[_type == "navigation"][0]{
    logo {
      asset->{ _id, url, metadata { dimensions } },
      alt
    },
    items[]{
      label,
      kind,
      link{ ${resolvedLink} },
      children[]{
        label,
        description,
        link{ ${resolvedLink} }
      }
    },
    cta{
      label,
      variant,
      link{ ${resolvedLink} }
    }
  }
`)

export const footerQuery = defineQuery(`
  *[_type == "footer"][0]{
    columns[]{
      title,
      links[]{
        label,
        link{ ${resolvedLink} }
      }
    },
    social[]{ platform, url },
    legal[]{
      label,
      link{ ${resolvedLink} }
    },
    copyright
  }
`)

const postFields = /* groq */ `
  _id,
  _updatedAt,
  "status": select(_originalId in path("drafts.**") => "draft", "published"),
  "title": coalesce(title, "Untitled"),
  "slug": slug.current,
  excerpt,
  coverImage,
  "date": coalesce(date, _updatedAt),
  "author": author->{firstName, lastName, "slug": slug.current, picture},
`

// Shared `seo` projection — reused by the post detail query and every typed
// content query (service / area / project / serviceArea) so SEO behaves
// identically everywhere. Declared here (before postQuery) to stay above its
// first use.
const seoProjection = /* groq */ `
  seo{
    title, description, canonical, noIndex, noFollow,
    ogTitle, ogDescription, keywords, ogImage{ ..., asset-> }
  }
`

const linkReference = /* groq */ `
  _type == "link" => {
    "page": page->slug.current,
    "post": post->slug.current
  }
`

const resolvedButton = /* groq */ `
  buttonText,
  link { ${resolvedLink} }
`

export const getPageQuery = defineQuery(`
  *[_type == 'page' && (slug.current == $slug || "/" + slug.current == $slug)][0]{
    _id,
    _type,
    name,
    slug,
    heading,
    subheading,
    seo {
      title,
      description,
      canonical,
      noIndex,
      noFollow,
      ogTitle,
      ogDescription,
      keywords,
      ogImage { ..., asset-> },
    },
    "pageBuilder": pageBuilder[]{
      ...,
      _type == "heroBanner" => {
        ...,
        primaryButton { ${resolvedButton} },
        secondaryButton { ${resolvedButton} },
        "availableServices": *[_type == "service" && defined(name) && defined(slug.current)] | order(order asc, name asc){ "name": name },
        slides[]{
          ...,
          primaryButton { ${resolvedButton} },
          secondaryButton { ${resolvedButton} },
        },
      },
      _type == "servicesOverview" => {
        ...,
        "services": *[_type == "service" && defined(slug.current)] | order(order asc, name asc){
          "title": name,
          "sub": summary,
          "slug": slug.current,
          icon,
          heroImage,
        },
      },
      _type == "trustBar" => {
        ...,
        "trust": *[_type == "settings"][0]{
          "reviewsEnabled": structuredData.reviews.enabled,
          "rating": structuredData.reviews.aggregateRating{ ratingValue, reviewCount, bestRating },
          "platforms": structuredData.reviews.platforms[]{ platform, score, subLabel, showStars },
          "accreditations": trust.accreditations[]{ icon, title, sub },
          "stat": trust.stat{ headline, sub },
          "press": trust.press[]{ name, logo },
        },
      },
      _type == "heroCarousel" => {
        ...,
        slides[]{
          ...,
          primaryButton { ${resolvedButton} },
          secondaryButton { ${resolvedButton} },
        },
      },
      _type == "testimonials" => {
        ...,
        ctaButton { ${resolvedButton} },
      },
      _type == "cta" => {
        ...,
        primaryButton { ${resolvedButton} },
        secondaryButton { ${resolvedButton} },
        "phone": *[_type == "settings"][0].structuredData.organization.contact.phone,
        "services": *[_type == "service" && defined(name) && defined(slug.current)] | order(order asc, name asc){ "name": name },
      },
      _type == "pricingSection" => {
        ...,
        ctaButton { ${resolvedButton} },
        options[]{
          ...,
          cta { ${resolvedButton} },
        },
      },
      _type == "emergencyCtaStrip" => {
        ...,
        button { ${resolvedButton} },
      },
      _type == "serviceCards" => {
        ...,
        cards[]{
          ...,
          button { ${resolvedButton} },
        },
      },
      _type == "whyChooseUs" => {
        ...,
        button { ${resolvedButton} },
      },
      _type == "areasWeCover" => {
        ...,
        areas[]{
          name,
          region,
          "slug": page->slug.current,
        },
        footerButton { ${resolvedButton} },
      },
      _type == "faq" => {
        ...,
        ctaButton { ${resolvedButton} },
        items[]{
          _key,
          question,
          answer[]{
            ...,
            markDefs[]{
              ...,
              ${linkReference}
            }
          }
        }
      },
      _type == "introOverviewSection" => {
        ...,
        cta { ${resolvedButton} },
        secondaryCta { ${resolvedButton} },
        body[]{
          ...,
          markDefs[]{
            ...,
            ${linkReference}
          }
        }
      },
      _type == "mainServiceGrid" => {
        ...,
        items[]{
          ...,
          cta { ${resolvedButton} },
        },
      },
      _type == "contactForm" => {
        ...,
      },
      _type == "blogSection" => {
        ...,
        "posts": *[_type == "post" && defined(slug.current)] | order(coalesce(date, _updatedAt) desc)[0...6]{
          _id,
          "title": coalesce(title, "Untitled"),
          "slug": slug.current,
          excerpt,
          coverImage,
          "date": coalesce(date, _updatedAt),
        },
      },
      _type == "callToAction" => {
        ...,
        button { ${resolvedButton} },
      },
      _type == "infoSection" => {
        content[]{
          ...,
          markDefs[]{
            ...,
            ${linkReference}
          }
        }
      },
    },
  }
`)

export const sitemapData = defineQuery(`
  *[
    _type in ["page", "post", "service", "area", "project"]
    && defined(slug.current)
    && !(seo.noIndex == true)
    && !(seo.hideFromSitemap == true)
  ] | order(_type asc) {
    "slug": slug.current,
    _type,
    _updatedAt,
  }
`)

export const searchIndexQuery = defineQuery(`
  *[
    (_type == "page" || _type == "post" || _type == "service" || _type == "area" || _type == "project")
    && defined(slug.current)
    && !(seo.hideFromSitemap == true)
  ]
  | order(_type asc, coalesce(name, title) asc) {
    _type,
    "title": coalesce(name, title, "Untitled"),
    "slug": slug.current,
    "description": coalesce(seo.description, summary, excerpt),
  }
`)

export const allPostsQuery = defineQuery(`
  *[_type == "post" && defined(slug.current)] | order(date desc, _updatedAt desc) {
    ${postFields}
  }
`)

export const morePostsQuery = defineQuery(`
  *[_type == "post" && _id != $skip && defined(slug.current)] | order(date desc, _updatedAt desc) [0...$limit] {
    ${postFields}
  }
`)

export const postQuery = defineQuery(`
  *[_type == "post" && slug.current == $slug] [0] {
    content[]{
    ...,
    markDefs[]{
      ...,
      ${linkReference}
    }
  },
    ${postFields}
    ${seoProjection},
  }
`)

export const postPagesSlugs = defineQuery(`
  *[_type == "post" && defined(slug.current)]
  {"slug": slug.current}
`)

export const pagesSlugs = defineQuery(`
  *[_type == "page" && defined(slug.current)]
  {"slug": slug.current}
`)

// ── Typed content: service / area / project / serviceArea ──────────────────

const projectCard = /* groq */ `
  _id, title, "slug": slug.current, summary, coverImage, completedAt,
  "area": area->{ _id, name, "slug": slug.current }, locationLabel,
  "services": services[]->{ _id, name, "slug": slug.current }
`

const ptMarks = /* groq */ `..., markDefs[]{ ..., ${linkReference} }`

export const allServicesQuery = defineQuery(`
  *[_type == "service" && defined(slug.current)] | order(order asc, name asc){
    _id, name, "slug": slug.current, icon, summary, order, heroImage
  }
`)

export const serviceSlugs = defineQuery(`
  *[_type == "service" && defined(slug.current)]{"slug": slug.current}
`)

export const getServiceQuery = defineQuery(`
  *[_type == "service" && slug.current == $slug][0]{
    _id, _type, _updatedAt, name, h1, "slug": slug.current, icon, summary, heroImage,
    overview[]{ ${ptMarks} },
    trustSignals[], whatsIncluded[], pricingIndication, steps[],
    faqs[]{ _key, question, answer[]{ ${ptMarks} } },
    "areasServed": areasServed[]->{ _id, name, "slug": slug.current },
    ${seoProjection},
    "featuredProjects": featuredProjects[]->{ ${projectCard} },
    "autoProjects": *[_type == "project" && references(^._id)]
      | order(coalesce(completedAt, _createdAt) desc)[0...9]{ ${projectCard} }
  }
`)

export const allAreasQuery = defineQuery(`
  *[_type == "area" && defined(slug.current)] | order(order asc, name asc){
    _id, name, "slug": slug.current, order
  }
`)

export const areaSlugs = defineQuery(`
  *[_type == "area" && defined(slug.current)]{"slug": slug.current}
`)

export const getAreaQuery = defineQuery(`
  *[_type == "area" && slug.current == $slug][0]{
    _id, _type, name, h1, "slug": slug.current, heroImage, coverageNote,
    geo{latitude, longitude},
    intro[]{ ${ptMarks} },
    localTestimonials[],
    faqs[]{ _key, question, answer[]{ ${ptMarks} } },
    "featuredServices": featuredServices[]->{ _id, name, "slug": slug.current, icon, summary, heroImage },
    ${seoProjection},
    "projects": *[_type == "project" && references(^._id)]
      | order(coalesce(completedAt, _createdAt) desc)[0...9]{ ${projectCard} }
  }
`)

export const projectsIndexQuery = defineQuery(`
  *[_type == "project" && defined(slug.current)]
    | order(coalesce(completedAt, _createdAt) desc){ ${projectCard} }
`)

export const projectSlugs = defineQuery(`
  *[_type == "project" && defined(slug.current)]{"slug": slug.current}
`)

export const getProjectQuery = defineQuery(`
  *[_type == "project" && slug.current == $slug][0]{
    _id, _type, title, "slug": slug.current, summary, completedAt,
    body[]{ ${ptMarks} },
    coverImage, gallery[], beforeAfter[], testimonial,
    "services": services[]->{ _id, name, "slug": slug.current },
    "area": area->{ _id, name, "slug": slug.current }, locationLabel,
    ${seoProjection},
    "related": *[_type == "project" && _id != ^._id && defined(slug.current)
      && defined(^.area._ref) && area._ref == ^.area._ref]
      | order(coalesce(completedAt, _createdAt) desc)[0...3]{ ${projectCard} },
    "relatedByService": *[_type == "project" && _id != ^._id && defined(slug.current)
      && count(services[@._ref in ^.^.services[]._ref]) > 0]
      | order(coalesce(completedAt, _createdAt) desc)[0...3]{ ${projectCard} }
  }
`)

export const galleryQuery = defineQuery(`
  *[_type == "project" && defined(slug.current)]
    | order(coalesce(completedAt, _createdAt) desc){
    _id, title, "slug": slug.current,
    "area": area->{ name, "slug": slug.current }, locationLabel,
    "services": services[]->{ name, "slug": slug.current },
    coverImage, gallery[]
  }
`)

/**
 * All real testimonial ratings (area localTestimonials + project testimonial).
 * Layout aggregates these into LocalBusiness.aggregateRating — only fires
 * when reviewCount > 0, so a freshly-seeded site with no real reviews
 * emits nothing (we never seed fabricated testimonials).
 */
export const testimonialAggregateQuery = defineQuery(`
  {
    "areaRatings": *[_type == "area" && defined(localTestimonials)].localTestimonials[]{
      "rating": rating
    },
    "projectRatings": *[_type == "project" && defined(testimonial.rating)]{
      "rating": testimonial.rating
    }
  }
`)

/** Look up a serviceArea by service+area slugs (hierarchical URL). */
export const getServiceAreaByRefsQuery = defineQuery(`
  *[_type == "serviceArea"
    && service->slug.current == $service
    && area->slug.current == $area][0]{
    _id, _type, localIntro, localTestimonial,
    localFaqs[]{ _key, question, answer[]{ ${ptMarks} } },
    "service": service->{ _id, name, "slug": slug.current, icon, summary, whatsIncluded, "areasServed": areasServed[]->{ _id, name, "slug": slug.current } },
    "area": area->{ _id, name, "slug": slug.current },
    ${seoProjection},
    "projects": projects[]->{ ${projectCard} }
  }
`)

// ── Author queries ──────────────────────────────────────

export const authorSlugs = defineQuery(`
  *[_type == "person" && defined(slug.current)]{"slug": slug.current}
`)

export const getAuthorQuery = defineQuery(`
  *[_type == "person" && slug.current == $slug][0]{
    _id, firstName, lastName, "slug": slug.current, picture
  }
`)

export const postsByAuthorQuery = defineQuery(`
  *[_type == "post" && author->slug.current == $slug && defined(slug.current)]
    | order(date desc, _updatedAt desc) { ${postFields} }
`)
