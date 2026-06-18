// PricingSection.ts

import {defineField, defineType, defineArrayMember} from 'sanity'
import {ComposeSparklesIcon, ControlsIcon, TagIcon} from '@sanity/icons'

/** Hide a field unless the chosen variant is in the list. */
const only =
  (...variants: string[]) =>
  ({parent}: {parent?: {variant?: string}}) =>
    !variants.includes(parent?.variant ?? 'promise')

const PRICING_ICONS = [
  {title: 'File / Quote', value: 'FileText'},
  {title: 'Wrench (Repair)', value: 'Wrench'},
  {title: 'Repeat (Plan)', value: 'Repeat'},
  {title: 'Clipboard (Scope)', value: 'Clipboard'},
  {title: 'Package (Materials)', value: 'Package'},
  {title: 'Clock (Timing)', value: 'Clock'},
  {title: 'Map Pin (Access)', value: 'MapPin'},
]

/**
 * "How pricing works" — friction-reducing pricing explainers built for service
 * businesses (quoting language, NOT dollar figures). One block, three layouts.
 */
export const pricingSection = defineType({
  name: 'pricingSection',
  title: 'Pricing Section',
  type: 'object',
  icon: TagIcon,
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
          {title: 'Promise — transparency statement + principles', value: 'promise'},
          {title: 'Factors — what goes into a quote + reassurance bar', value: 'factors'},
          {title: 'Options — quote paths (no prices, quoting language)', value: 'options'},
        ],
        layout: 'radio',
      },
      initialValue: 'promise',
      group: 'content',
    }),
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string', group: 'content'}),
    defineField({name: 'title', title: 'Title', type: 'text', rows: 2, group: 'content'}),

    // Promise
    defineField({
      name: 'body',
      title: 'Body',
      type: 'text',
      rows: 3,
      group: 'content',
      hidden: only('promise'),
    }),
    defineField({
      name: 'principles',
      title: 'Pricing principles',
      type: 'array',
      group: 'content',
      hidden: only('promise'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'pricingPrinciple',
          fields: [
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({name: 'desc', title: 'Description', type: 'text', rows: 2}),
          ],
          preview: {select: {title: 'title', subtitle: 'desc'}},
        }),
      ],
    }),

    // Factors
    defineField({
      name: 'factors',
      title: 'Quote factors',
      type: 'array',
      group: 'content',
      hidden: only('factors'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'pricingFactor',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
              options: {list: PRICING_ICONS},
              initialValue: 'Clipboard',
            }),
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({name: 'desc', title: 'Description', type: 'text', rows: 2}),
          ],
          preview: {select: {title: 'title', subtitle: 'icon'}},
        }),
      ],
    }),
    defineField({
      name: 'reassurance',
      title: 'Reassurance line',
      type: 'string',
      group: 'content',
      hidden: only('factors'),
    }),

    // Options
    defineField({
      name: 'options',
      title: 'Quote options',
      description: 'Each "price" is quoting LANGUAGE (e.g. "Free", "Flat rate"), not a number.',
      type: 'array',
      group: 'content',
      hidden: only('options'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'pricingOption',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
              options: {list: PRICING_ICONS},
              initialValue: 'FileText',
            }),
            defineField({name: 'name', title: 'Name', type: 'string'}),
            defineField({
              name: 'price',
              title: 'Price (quoting language)',
              type: 'string',
              description: 'e.g. "Free", "Flat rate", "Plan pricing" — not a number.',
            }),
            defineField({name: 'note', title: 'Note', type: 'string'}),
            defineField({name: 'who', title: 'Who it’s for', type: 'string'}),
            defineField({
              name: 'includes',
              title: 'Includes',
              type: 'array',
              of: [{type: 'string'}],
            }),
            defineField({name: 'featured', title: 'Featured', type: 'boolean', initialValue: false}),
            defineField({name: 'cta', title: 'Button', type: 'button'}),
          ],
          preview: {select: {title: 'name', subtitle: 'price'}},
        }),
      ],
    }),
    defineField({
      name: 'badgeText',
      title: 'Featured badge text',
      type: 'string',
      initialValue: 'Most popular',
      group: 'content',
      hidden: only('options'),
    }),

    // Promise + Factors section CTA
    defineField({
      name: 'ctaButton',
      title: 'CTA button',
      type: 'button',
      group: 'content',
      hidden: only('promise', 'factors'),
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
    select: {title: 'title', variant: 'variant'},
    prepare({title, variant}) {
      const labels: Record<string, string> = {
        promise: 'Promise',
        factors: 'Factors',
        options: 'Options',
      }
      return {
        title: title || 'Pricing Section',
        subtitle: `Pricing · ${labels[variant as string] || 'Promise'}`,
      }
    },
  },
})
