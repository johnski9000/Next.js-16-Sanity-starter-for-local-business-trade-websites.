import {defineField, defineType, defineArrayMember} from 'sanity'
import {TagIcon} from '@sanity/icons'

const SERVICE_ICONS = [
  {title: 'Wrench', value: 'Wrench'},
  {title: 'Hammer', value: 'Hammer'},
  {title: 'Flame', value: 'Flame'},
  {title: 'Droplet', value: 'Droplet'},
  {title: 'Zap (Electrical)', value: 'Zap'},
  {title: 'Thermometer (Heating)', value: 'Thermometer'},
  {title: 'Shield Check', value: 'ShieldCheck'},
  {title: 'Siren (Emergency)', value: 'Siren'},
  {title: 'Bath', value: 'Bath'},
  {title: 'Home', value: 'Home'},
  {title: 'Building (Commercial)', value: 'Building2'},
  {title: 'Paint Brush', value: 'Paintbrush'},
  {title: 'Paint Roller', value: 'PaintRoller'},
  {title: 'Paint Bucket', value: 'PaintBucket'},
  {title: 'Ruler', value: 'Ruler'},
  {title: 'Sparkles (Finish)', value: 'Sparkles'},
  {title: 'Plug', value: 'Plug'},
  {title: 'Fan', value: 'Fan'},
  {title: 'Leaf (Gardening)', value: 'Leaf'},
  {title: 'Truck (Removals)', value: 'Truck'},
]

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

export const service = defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  icon: TagIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Service Name',
      type: 'string',
      description:
        'Used in nav, breadcrumbs, "Other services" cards and Service JSON-LD. Keep clean (e.g. "Interior Painting") — no location.',
      validation: (Rule) => Rule.required(),
      group: 'content',
    }),
    defineField({
      name: 'h1',
      title: 'H1 Headline (optional)',
      type: 'string',
      description:
        'Overrides the H1 shown in the page hero only. Pattern: "{Service} in South Manchester". Leave blank to fall back to Service Name.',
      group: 'content',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Bare slug — route prefix /services/ is added automatically.',
      options: {source: 'name', maxLength: 96},
      validation: (Rule) => Rule.required(),
      group: 'content',
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Sort order in menus, hub grid and footer.',
      initialValue: 100,
      group: 'content',
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      options: {list: SERVICE_ICONS, layout: 'dropdown'},
      initialValue: 'Wrench',
      group: 'content',
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 2,
      description: 'Short blurb for cards, menus and related-content.',
      validation: (Rule) => Rule.required().max(220),
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
      name: 'overview',
      title: 'Overview',
      type: 'blockContentTextOnly',
      description: 'Main body copy for the service page.',
      group: 'content',
    }),
    defineField({
      name: 'trustSignals',
      title: 'Trust Signals',
      type: 'array',
      description:
        'Short trust badges shown beside the overview section (e.g. "Fully Insured"). 3–4 items work best.',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'trustSignal',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
              options: {
                list: [
                  {title: 'Shield (Insured)', value: 'ShieldCheck'},
                  {title: 'Clock (Fast Response)', value: 'Clock'},
                  {title: 'Star (Rated)', value: 'Star'},
                  {title: 'Tag (Free Quotes)', value: 'Tag'},
                  {title: 'Badge Check', value: 'BadgeCheck'},
                  {title: 'Sparkles (Finish)', value: 'Sparkles'},
                ],
                layout: 'dropdown',
              },
              initialValue: 'ShieldCheck',
            }),
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (Rule) => Rule.required().max(40),
            }),
          ],
          preview: {select: {title: 'label', subtitle: 'icon'}},
        }),
      ],
    }),
    defineField({
      name: 'whatsIncluded',
      title: "What's Included",
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'inclusion',
          fields: [
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({name: 'description', title: 'Description', type: 'text', rows: 2}),
          ],
          preview: {
            select: {title: 'title', subtitle: 'description'},
          },
        }),
      ],
    }),
    defineField({
      name: 'pricingIndication',
      title: 'Pricing Indication',
      type: 'text',
      rows: 2,
      description: 'Optional: "Starts from £X" or similar. Kept simple so it feels genuine, not spammy.',
      group: 'content',
    }),
    defineField({
      name: 'steps',
      title: 'Process Steps',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'step',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
              options: {list: SERVICE_ICONS, layout: 'dropdown'},
            }),
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({name: 'description', title: 'Description', type: 'text', rows: 2}),
          ],
          preview: {select: {title: 'title', subtitle: 'description'}},
        }),
      ],
    }),
    defineField({
      name: 'faqs',
      title: 'Service FAQs',
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
      name: 'areasServed',
      title: 'Areas Served',
      type: 'array',
      description: 'Optional cross-links to area pages where this service is offered.',
      group: 'content',
      of: [defineArrayMember({type: 'reference', to: [{type: 'area'}]})],
    }),
    defineField({
      name: 'featuredProjects',
      title: 'Featured Projects',
      type: 'array',
      description:
        'Optional curated projects. If empty, the page auto-pulls projects that reference this service.',
      group: 'content',
      of: [defineArrayMember({type: 'reference', to: [{type: 'project'}]})],
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
      return {title: title || 'Service', subtitle: subtitle ? `/services/${subtitle}` : undefined, media}
    },
  },
})
