import {defineField, defineType, defineArrayMember} from 'sanity'
import {ComposeSparklesIcon, ControlsIcon, UsersIcon} from '@sanity/icons'

/** Hide a field unless the chosen variant is in the list. */
const only =
  (...variants: string[]) =>
  ({parent}: {parent?: {variant?: string}}) =>
    !variants.includes(parent?.variant ?? 'cards')

const statMember = defineArrayMember({
  type: 'object',
  name: 'proofStat',
  fields: [
    defineField({name: 'value', title: 'Value', type: 'string'}),
    defineField({name: 'label', title: 'Label', type: 'string'}),
  ],
  preview: {select: {title: 'value', subtitle: 'label'}},
})

export const testimonials = defineType({
  name: 'testimonials',
  title: 'Testimonials',
  type: 'object',
  icon: UsersIcon,
  groups: [
    {name: 'content', icon: ComposeSparklesIcon, default: true},
    {name: 'designSystem', icon: ControlsIcon},
  ],
  fields: [
    defineField({
      name: 'variant',
      title: 'Layout Variant',
      type: 'string',
      options: {
        list: [
          {title: 'Cards — testimonial grid', value: 'cards'},
          {title: 'Case study — photo + story + result stats', value: 'caseStudy'},
          {title: 'Results + CTA — featured quote, stats & a button', value: 'resultsCTA'},
        ],
        layout: 'radio',
      },
      initialValue: 'cards',
      group: 'content',
    }),

    // Header (Cards + Case study; Case study uses eyebrow=label, heading=title)
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      group: 'content',
      hidden: only('cards', 'caseStudy'),
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      initialValue: 'What Our Customers Say',
      group: 'content',
      hidden: only('cards', 'caseStudy'),
    }),

    // ── Cards + Results (the testimonial list; Results features the first one) ──
    defineField({
      name: 'items',
      title: 'Testimonials',
      type: 'array',
      group: 'content',
      hidden: only('cards', 'resultsCTA'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'testimonialItem',
          fields: [
            defineField({name: 'quote', title: 'Quote', type: 'text', rows: 4}),
            defineField({name: 'authorName', title: 'Author Name', type: 'string'}),
            defineField({
              name: 'authorLocation',
              title: 'Location',
              type: 'string',
              description: 'e.g. town or city',
            }),
            defineField({
              name: 'rating',
              title: 'Rating',
              type: 'number',
              initialValue: 5,
              validation: (Rule) => Rule.min(1).max(5).integer(),
              options: {list: [1, 2, 3, 4, 5], layout: 'radio'},
            }),
            defineField({name: 'avatar', title: 'Avatar', type: 'image', options: {hotspot: true}}),
          ],
          preview: {
            select: {title: 'authorName', subtitle: 'quote', media: 'avatar.asset'},
            prepare({title, subtitle, media}) {
              return {title: title || 'Testimonial', subtitle, media}
            },
          },
        }),
      ],
    }),

    // ── Cards: reviews call-to-action ─────────────────────────────────────────
    defineField({
      name: 'reviewsUrl',
      title: 'Reviews URL',
      type: 'url',
      description:
        'Optional link to your public reviews page (e.g. Facebook, Google). The reviews call-to-action is only shown when this is set.',
      group: 'content',
      hidden: only('cards'),
    }),
    defineField({
      name: 'aggregateRatingValue',
      title: 'Aggregate Rating (out of 5)',
      type: 'number',
      description:
        'Optional. When set alongside review count + source, the reviews button shows "★★★★★ 5.0 · 19 reviews on Facebook".',
      validation: (Rule) => Rule.min(0).max(5),
      group: 'content',
      hidden: only('cards'),
    }),
    defineField({
      name: 'aggregateReviewCount',
      title: 'Aggregate Review Count',
      type: 'number',
      description: 'Optional. The number of reviews the aggregate rating is based on.',
      validation: (Rule) => Rule.min(0).integer(),
      group: 'content',
      hidden: only('cards'),
    }),
    defineField({
      name: 'aggregateSourceName',
      title: 'Aggregate Source',
      type: 'string',
      description: 'Optional. Where the aggregate comes from (e.g. "Facebook", "Google").',
      group: 'content',
      hidden: only('cards'),
    }),
    defineField({
      name: 'leaveReviewUrl',
      title: 'Leave a Review URL',
      type: 'url',
      description: 'Optional link where customers can leave a review.',
      group: 'content',
      hidden: only('cards'),
    }),

    // ── Case study variant ────────────────────────────────────────────────────
    defineField({
      name: 'caseBody',
      title: 'Story',
      type: 'text',
      rows: 4,
      group: 'content',
      hidden: only('caseStudy'),
    }),
    defineField({
      name: 'caseImage',
      title: 'Job photo',
      type: 'image',
      options: {hotspot: true},
      group: 'content',
      hidden: only('caseStudy'),
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (Rule) =>
            Rule.custom((alt, ctx) => {
              const hasAsset = Boolean((ctx.parent as any)?.asset?._ref)
              if (hasAsset && !alt) return 'Alt text is required when an image is set'
              return true
            }),
        }),
      ],
    }),
    defineField({
      name: 'caseStats',
      title: 'Result stats',
      type: 'array',
      group: 'content',
      hidden: only('caseStudy'),
      of: [statMember],
    }),
    defineField({
      name: 'caseCustomer',
      title: 'Customer name',
      type: 'string',
      group: 'content',
      hidden: only('caseStudy'),
    }),
    defineField({
      name: 'caseLocation',
      title: 'Customer location',
      type: 'string',
      group: 'content',
      hidden: only('caseStudy'),
    }),
    defineField({
      name: 'caseBadge',
      title: 'Badge',
      type: 'string',
      initialValue: 'Verified job',
      group: 'content',
      hidden: only('caseStudy'),
    }),

    // ── Results + CTA variant ─────────────────────────────────────────────────
    defineField({
      name: 'resultsStats',
      title: 'Results stats',
      type: 'array',
      group: 'content',
      hidden: only('resultsCTA'),
      of: [statMember],
    }),
    defineField({
      name: 'ctaButton',
      title: 'CTA button',
      type: 'button',
      group: 'content',
      hidden: only('resultsCTA'),
    }),
    defineField({
      name: 'resultsNote',
      title: 'CTA note',
      type: 'string',
      description: 'Small reassurance line under the button.',
      group: 'content',
      hidden: only('resultsCTA'),
    }),

    defineField({
      name: 'theme',
      title: 'Theme',
      type: 'string',
      options: {
        list: [
          {title: 'Light', value: 'light'},
          {title: 'Dark', value: 'dark'},
        ],
        layout: 'radio',
      },
      initialValue: 'light',
      group: 'designSystem',
    }),
  ],
  preview: {
    select: {title: 'heading', count: 'items', variant: 'variant'},
    prepare({title, count, variant}) {
      const labels: Record<string, string> = {
        cards: 'Cards',
        caseStudy: 'Case study',
        resultsCTA: 'Results + CTA',
      }
      const n = Array.isArray(count) ? count.length : 0
      return {
        title: title || 'Testimonials',
        subtitle: `Testimonials · ${labels[variant as string] || 'Cards'}${
          !variant || variant === 'cards' ? ` · ${n}` : ''
        }`,
        media: UsersIcon,
      }
    },
  },
})
