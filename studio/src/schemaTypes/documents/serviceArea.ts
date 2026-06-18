import {defineField, defineType, defineArrayMember} from 'sanity'
import {SplitHorizontalIcon} from '@sanity/icons'

/**
 * Long-tail service × area landing page.
 * Canonical URL: /services/<service.slug>/<area.slug> (hierarchical).
 * No manual slug — the URL is derived from the service+area refs, so two
 * docs can't share a URL by accident.
 *
 * Publish gate (see docs/CONTENT-MODEL.md): a serviceArea is only fit to
 * publish when ALL hold —
 *   • localIntro is a real, unique 2–3 sentences (>= 120 chars),
 *   • >= 2 project refs,
 *   • >= 1 local testimonial OR >= 1 local FAQ.
 * Document-level validation enforces these minimums in Studio. The frontend
 * route additionally verifies the project refs actually match this doc's
 * service + area; gate failures 301 to the parent /services/<service> so
 * link equity is never wasted on a 404.
 *
 * At launch: schema + reserved route exist, ZERO published.
 */
export const serviceArea = defineType({
  name: 'serviceArea',
  title: 'Service × Area',
  type: 'document',
  icon: SplitHorizontalIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'service',
      title: 'Service',
      type: 'reference',
      to: [{type: 'service'}],
      validation: (Rule) => Rule.required(),
      group: 'content',
    }),
    defineField({
      name: 'area',
      title: 'Area',
      type: 'reference',
      to: [{type: 'area'}],
      validation: (Rule) => Rule.required(),
      group: 'content',
    }),
    defineField({
      name: 'localIntro',
      title: 'Local Intro',
      type: 'text',
      rows: 4,
      description:
        'Unique 2–3 sentences specific to this service in this area. No generic boilerplate.',
      validation: (Rule) =>
        Rule.required().min(120).warning('Aim for a genuine, locally-specific 2–3 sentences.'),
      group: 'content',
    }),
    defineField({
      name: 'projects',
      title: 'Local Projects',
      type: 'array',
      description:
        'At least 2 projects for THIS service in THIS area. The page does not publish/index until met.',
      validation: (Rule) => Rule.required().min(2),
      group: 'content',
      of: [defineArrayMember({type: 'reference', to: [{type: 'project'}]})],
    }),
    defineField({
      name: 'localTestimonial',
      title: 'Local Testimonial',
      type: 'object',
      group: 'content',
      fields: [
        defineField({name: 'quote', title: 'Quote', type: 'text', rows: 4}),
        defineField({name: 'authorName', title: 'Author Name', type: 'string'}),
      ],
    }),
    defineField({
      name: 'localFaqs',
      title: 'Local FAQs',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          fields: [
            defineField({name: 'question', title: 'Question', type: 'string'}),
            defineField({
              name: 'answer',
              title: 'Answer',
              type: 'blockContentTextOnly',
              description:
                'Plain paragraphs with optional inline links. Renders as a real `<a>` in the FAQ accordion AND flattens to plain text for FAQPage JSON-LD.',
            }),
          ],
          preview: {select: {title: 'question'}},
        }),
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      options: {collapsible: true, collapsed: true},
      group: 'seo',
    }),
  ],
  // Document-level publish gate.
  validation: (Rule) =>
    Rule.custom((doc: any) => {
      const missing: string[] = []
      if (!doc?.localIntro || String(doc.localIntro).trim().length < 120) {
        missing.push('a unique local intro of at least ~2–3 sentences')
      }
      if (!Array.isArray(doc?.projects) || doc.projects.length < 2) {
        missing.push('at least 2 local project references')
      }
      const hasTestimonial = Boolean(doc?.localTestimonial?.quote)
      const hasFaq = Array.isArray(doc?.localFaqs) && doc.localFaqs.length > 0
      if (!hasTestimonial && !hasFaq) {
        missing.push('at least 1 local testimonial or 1 local FAQ')
      }
      if (missing.length) {
        return `Not ready to publish — still needs: ${missing.join('; ')}.`
      }
      return true
    }),
  preview: {
    select: {
      service: 'service.name',
      area: 'area.name',
      serviceSlug: 'service.slug.current',
      areaSlug: 'area.slug.current',
    },
    prepare({service, area, serviceSlug, areaSlug}) {
      return {
        title: service && area ? `${service} × ${area}` : 'Service × Area',
        subtitle:
          serviceSlug && areaSlug ? `/services/${serviceSlug}/${areaSlug}` : 'unconfigured',
        media: SplitHorizontalIcon,
      }
    },
  },
})
