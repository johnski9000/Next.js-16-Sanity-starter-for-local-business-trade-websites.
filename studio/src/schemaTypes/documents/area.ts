import {defineField, defineType, defineArrayMember} from 'sanity'
import {PinIcon} from '@sanity/icons'

const altField = defineField({
  name: 'alt',
  title: 'Alt Text',
  type: 'string',
  validation: (Rule) =>
    Rule.custom((alt, ctx) => {
      const hasAsset = Boolean((ctx.parent as any)?.asset?._ref)
      if (hasAsset && !alt) return 'Alt text is required when an image is set'
      return true
    }),
})

export const area = defineType({
  name: 'area',
  title: 'Area',
  type: 'document',
  icon: PinIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Area Name',
      type: 'string',
      description:
        'Used in nav, breadcrumbs and area listings — keep clean (e.g. "Didsbury"), no location qualifier.',
      validation: (Rule) => Rule.required(),
      group: 'content',
    }),
    defineField({
      name: 'h1',
      title: 'H1 Headline (optional)',
      type: 'string',
      description:
        'Overrides the H1 shown in the page hero only. Default: "Painting & Decorating in {Area}". Leave blank to use that default.',
      group: 'content',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Bare slug — route prefix /areas/ is added automatically.',
      options: {source: 'name', maxLength: 96},
      validation: (Rule) => Rule.required(),
      group: 'content',
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      initialValue: 100,
      group: 'content',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      options: {hotspot: true},
      fields: [altField],
      group: 'content',
    }),
    defineField({
      name: 'intro',
      title: 'Local Intro',
      type: 'blockContentTextOnly',
      description:
        'Unique, locally-specific intro. Avoid generic boilerplate — mention the area by name and real local context.',
      validation: (Rule) => Rule.required(),
      group: 'content',
    }),
    defineField({
      name: 'coverageNote',
      title: 'Coverage Note',
      type: 'string',
      description: 'Optional, e.g. "Covering all M20 postcodes and surrounding streets".',
      group: 'content',
    }),
    defineField({
      name: 'geo',
      title: 'Geo coordinates (optional)',
      description: 'Lat/long centre point — feeds Place.geo in the entity graph.',
      type: 'object',
      group: 'content',
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({name: 'latitude', title: 'Latitude', type: 'number'}),
        defineField({name: 'longitude', title: 'Longitude', type: 'number'}),
      ],
    }),
    defineField({
      name: 'featuredServices',
      title: 'Featured Services',
      type: 'array',
      description: 'Optional curated services for this area. If empty, all services are shown.',
      group: 'content',
      of: [defineArrayMember({type: 'reference', to: [{type: 'service'}]})],
    }),
    defineField({
      name: 'localTestimonials',
      title: 'Local Testimonials',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'testimonial',
          fields: [
            defineField({name: 'quote', title: 'Quote', type: 'text', rows: 4}),
            defineField({name: 'authorName', title: 'Author Name', type: 'string'}),
            defineField({name: 'authorLocation', title: 'Location', type: 'string'}),
            defineField({
              name: 'rating',
              title: 'Rating',
              type: 'number',
              validation: (Rule) => Rule.min(1).max(5).integer(),
              options: {list: [1, 2, 3, 4, 5], layout: 'radio'},
            }),
          ],
          preview: {select: {title: 'authorName', subtitle: 'quote'}},
        }),
      ],
    }),
    defineField({
      name: 'faqs',
      title: 'Area FAQs',
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
  preview: {
    select: {title: 'name', subtitle: 'slug.current', media: 'heroImage'},
    prepare({title, subtitle, media}) {
      return {title: title || 'Area', subtitle: subtitle ? `/areas/${subtitle}` : undefined, media}
    },
  },
})
