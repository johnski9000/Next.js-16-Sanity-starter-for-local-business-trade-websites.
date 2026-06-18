import {defineField, defineType, defineArrayMember} from 'sanity'
import {ComposeSparklesIcon, ControlsIcon, StarIcon} from '@sanity/icons'

/** Hide a field unless the chosen variant is in the list. */
const only =
  (...variants: string[]) =>
  ({parent}: {parent?: {variant?: string}}) =>
    !variants.includes(parent?.variant ?? 'split')

export const whyChooseUs = defineType({
  name: 'whyChooseUs',
  title: 'Why Choose Us',
  type: 'object',
  icon: StarIcon,
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
          {title: 'Split — content + side image (checklist)', value: 'split'},
          {title: 'Editorial — airy feature grid', value: 'editorial'},
          {title: 'Guarantee — promise panel + chips', value: 'guarantee'},
          {title: 'Compare — us vs. typical contractor table', value: 'compare'},
        ],
        layout: 'radio',
      },
      initialValue: 'split',
      group: 'content',
    }),

    // Shared header. For the Guarantee variant these double as the panel's
    // kicker (eyebrow) / title (heading) / body (subheading).
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      group: 'content',
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      group: 'content',
    }),
    defineField({
      name: 'subheading',
      title: 'Subheading',
      type: 'text',
      rows: 2,
      group: 'content',
      hidden: only('split', 'guarantee'),
    }),

    // ── Split variant ────────────────────────────────────────────────────────
    defineField({
      name: 'reasons',
      title: 'Reasons',
      type: 'array',
      group: 'content',
      hidden: only('split'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'reason',
          fields: [
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({name: 'description', title: 'Description', type: 'text', rows: 3}),
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'image',
              description: 'Optional SVG or icon image',
              options: {hotspot: false},
            }),
          ],
          preview: {
            select: {title: 'title', subtitle: 'description'},
            prepare({title, subtitle}) {
              return {title: title || 'Reason', subtitle}
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'image',
      title: 'Side Image',
      type: 'image',
      options: {hotspot: true},
      group: 'content',
      hidden: only('split'),
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
      name: 'button',
      title: 'Button',
      type: 'button',
      group: 'content',
      hidden: only('split'),
    }),

    // ── Editorial + Guarantee variants ───────────────────────────────────────
    defineField({
      name: 'differentiators',
      title: 'Differentiators',
      description: 'Feature items (Editorial) / supporting chips (Guarantee).',
      type: 'array',
      group: 'content',
      hidden: only('editorial', 'guarantee'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'differentiator',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
              options: {
                list: [
                  {title: 'Clock', value: 'Clock'},
                  {title: 'Money', value: 'Dollar'},
                  {title: 'Shield Check', value: 'ShieldCheck'},
                  {title: 'Award', value: 'Award'},
                  {title: 'Map Pin (local)', value: 'MapPin'},
                  {title: 'Heart', value: 'Heart'},
                ],
              },
              initialValue: 'ShieldCheck',
            }),
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({name: 'desc', title: 'Description', type: 'text', rows: 2}),
          ],
          preview: {select: {title: 'title', subtitle: 'icon'}},
        }),
      ],
    }),

    // ── Compare variant ──────────────────────────────────────────────────────
    defineField({
      name: 'usLabel',
      title: 'Your column label',
      type: 'string',
      group: 'content',
      hidden: only('compare'),
    }),
    defineField({
      name: 'themLabel',
      title: 'Comparison column label',
      type: 'string',
      initialValue: 'Typical contractor',
      group: 'content',
      hidden: only('compare'),
    }),
    defineField({
      name: 'compareRows',
      title: 'Comparison rows',
      type: 'array',
      group: 'content',
      hidden: only('compare'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'compareRow',
          fields: [
            defineField({name: 'label', title: 'Row', type: 'string'}),
            defineField({
              name: 'usHas',
              title: 'You provide this',
              type: 'boolean',
              initialValue: true,
            }),
          ],
          preview: {select: {title: 'label'}},
        }),
      ],
    }),

    // ── Editorial column count ───────────────────────────────────────────────
    defineField({
      name: 'columns',
      title: 'Columns (Editorial)',
      type: 'number',
      options: {
        list: [
          {title: '2', value: 2},
          {title: '3', value: 3},
        ],
        layout: 'radio',
      },
      initialValue: 3,
      group: 'designSystem',
      hidden: only('editorial'),
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
    defineField({
      name: 'imageAlignment',
      title: 'Image Side',
      type: 'string',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Right', value: 'right'},
        ],
        layout: 'radio',
      },
      initialValue: 'right',
      group: 'designSystem',
      hidden: ({parent}) =>
        parent?.variant !== 'split' && parent?.variant !== undefined
          ? true
          : !Boolean((parent as {image?: {asset?: unknown}})?.image?.asset),
    }),
  ],
  preview: {
    select: {title: 'heading', reasons: 'reasons', variant: 'variant'},
    prepare({title, reasons, variant}) {
      const labels: Record<string, string> = {
        split: 'Split',
        editorial: 'Editorial',
        guarantee: 'Guarantee',
        compare: 'Compare',
      }
      const n = Array.isArray(reasons) ? reasons.length : 0
      return {
        title: title || 'Why Choose Us',
        subtitle: `Why Choose Us · ${labels[variant as string] || 'Split'}${
          variant === 'split' || !variant ? ` · ${n} reason${n === 1 ? '' : 's'}` : ''
        }`,
        media: StarIcon,
      }
    },
  },
})
