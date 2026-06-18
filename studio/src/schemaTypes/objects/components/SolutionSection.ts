// SolutionSection.ts

import {defineField, defineType} from 'sanity'
import {ComposeSparklesIcon, ControlsIcon, RocketIcon} from '@sanity/icons'

/** Hide a field unless the chosen variant is in the list. */
const only =
  (...variants: string[]) =>
  ({parent}: {parent?: {variant?: string}}) =>
    !variants.includes(parent?.variant ?? '')

/**
 * Solution / value section — positions the business as the answer, framed around
 * outcomes. One block, three layouts (variant selector); only the fields each
 * variant uses are shown.
 *
 * NB the `transformation` variant is the text "Before → After" layout — distinct
 * from the image-slider `beforeAfter` gallery block.
 */
export const solutionSection = defineType({
  name: 'solutionSection',
  title: 'Solution Section',
  type: 'object',
  icon: RocketIcon,
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
          {title: 'Outcome cards — 3-up benefits', value: 'outcomeCards'},
          {title: 'Before → After — transformation rows', value: 'transformation'},
          {title: 'Value promise — copy + image', value: 'valuePromise'},
        ],
        layout: 'radio',
      },
      initialValue: 'outcomeCards',
      group: 'content',
    }),

    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      group: 'content',
      hidden: only('outcomeCards', 'valuePromise'),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'text',
      rows: 2,
      group: 'content',
    }),

    // Variant A · outcomeCards
    defineField({
      name: 'outcomes',
      title: 'Outcome cards',
      type: 'array',
      group: 'content',
      hidden: only('outcomeCards'),
      of: [
        {
          type: 'object',
          name: 'outcome',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
              options: {
                list: [
                  {title: 'Smile', value: 'Smile'},
                  {title: 'Gauge (speed)', value: 'Gauge'},
                  {title: 'Shield Check', value: 'ShieldCheck'},
                ],
              },
              initialValue: 'Smile',
            }),
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({name: 'desc', title: 'Description', type: 'text', rows: 2}),
          ],
          preview: {select: {title: 'title', subtitle: 'icon'}},
        },
      ],
    }),

    // Variant B · transformation (Before → After)
    defineField({
      name: 'beforeLabel',
      title: 'Before label',
      type: 'string',
      initialValue: 'Before',
      group: 'content',
      hidden: only('transformation'),
    }),
    defineField({
      name: 'afterLabel',
      title: 'After label',
      type: 'string',
      group: 'content',
      hidden: only('transformation'),
    }),
    defineField({
      name: 'rows',
      title: 'Before → After rows',
      type: 'array',
      group: 'content',
      hidden: only('transformation'),
      of: [
        {
          type: 'object',
          name: 'transformRow',
          fields: [
            defineField({name: 'before', title: 'Before', type: 'string'}),
            defineField({name: 'after', title: 'After', type: 'string'}),
          ],
          preview: {select: {title: 'after', subtitle: 'before'}},
        },
      ],
    }),

    // Variant C · valuePromise
    defineField({
      name: 'lead',
      title: 'Lead paragraph',
      type: 'text',
      rows: 3,
      group: 'content',
      hidden: only('valuePromise'),
    }),
    defineField({
      name: 'bullets',
      title: 'Value bullets',
      type: 'array',
      group: 'content',
      hidden: only('valuePromise'),
      of: [
        {
          type: 'object',
          name: 'valueBullet',
          fields: [
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({name: 'desc', title: 'Description', type: 'string'}),
          ],
          preview: {select: {title: 'title', subtitle: 'desc'}},
        },
      ],
    }),
    defineField({
      name: 'chip',
      title: 'Floating chip',
      type: 'string',
      group: 'content',
      hidden: only('valuePromise'),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      group: 'content',
      hidden: only('valuePromise'),
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
        outcomeCards: 'Outcome cards',
        transformation: 'Before → After',
        valuePromise: 'Value promise',
      }
      return {
        title: title || 'Solution Section',
        subtitle: `Solution · ${labels[variant as string] || 'Outcome cards'}`,
      }
    },
  },
})
