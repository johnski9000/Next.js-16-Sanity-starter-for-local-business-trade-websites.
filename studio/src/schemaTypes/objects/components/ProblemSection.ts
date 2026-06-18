// ProblemSection.ts

import {defineField, defineType} from 'sanity'
import {ComposeSparklesIcon, ControlsIcon, HelpCircleIcon} from '@sanity/icons'

/** Hide a field unless the chosen variant is in the list. */
const only =
  (...variants: string[]) =>
  ({parent}: {parent?: {variant?: string}}) =>
    !variants.includes(parent?.variant ?? '')

/**
 * Problem / pain-acknowledgment section — makes a visitor feel understood before
 * the pitch. One block, three layouts (variant selector); only the fields each
 * variant uses are shown.
 */
export const problemSection = defineType({
  name: 'problemSection',
  title: 'Problem Section',
  type: 'object',
  icon: HelpCircleIcon,
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
          {title: 'Pain cards — empathy headline + card grid', value: 'painCards'},
          {title: 'Sound familiar? — checklist → relief card', value: 'soundFamiliar'},
          {title: 'Pull quote — emotional quote → reassurance', value: 'pullQuote'},
        ],
        layout: 'radio',
      },
      initialValue: 'painCards',
      group: 'content',
    }),

    // Shared headline (painCards + soundFamiliar)
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      group: 'content',
      hidden: only('painCards', 'soundFamiliar'),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'text',
      rows: 2,
      group: 'content',
      hidden: only('painCards', 'soundFamiliar'),
    }),

    // Variant A · painCards
    defineField({
      name: 'lead',
      title: 'Lead paragraph',
      type: 'text',
      rows: 3,
      group: 'content',
      hidden: only('painCards'),
    }),
    defineField({
      name: 'pains',
      title: 'Pain cards',
      type: 'array',
      group: 'content',
      hidden: only('painCards'),
      of: [
        {
          type: 'object',
          name: 'painCard',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
              options: {
                list: [
                  {title: 'Clock', value: 'Clock'},
                  {title: 'Calendar (missed)', value: 'CalendarX'},
                  {title: 'Money', value: 'Dollar'},
                  {title: 'Alert', value: 'Alert'},
                ],
              },
              initialValue: 'Clock',
            }),
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({name: 'desc', title: 'Description', type: 'text', rows: 2}),
          ],
          preview: {select: {title: 'title', subtitle: 'icon'}},
        },
      ],
    }),
    defineField({
      name: 'reassurance',
      title: 'Reassurance pill',
      type: 'string',
      group: 'content',
      hidden: only('painCards'),
    }),

    // Variant B · soundFamiliar
    defineField({
      name: 'painList',
      title: 'Pain checklist',
      type: 'array',
      of: [{type: 'string'}],
      group: 'content',
      hidden: only('soundFamiliar'),
    }),
    defineField({
      name: 'reliefKicker',
      title: 'Relief kicker',
      type: 'string',
      group: 'content',
      hidden: only('soundFamiliar'),
    }),
    defineField({
      name: 'reliefLead',
      title: 'Relief lead',
      type: 'text',
      rows: 2,
      group: 'content',
      hidden: only('soundFamiliar'),
    }),
    defineField({
      name: 'fixes',
      title: 'How we do it differently',
      type: 'array',
      of: [{type: 'string'}],
      group: 'content',
      hidden: only('soundFamiliar'),
    }),

    // Variant C · pullQuote
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 3,
      group: 'content',
      hidden: only('pullQuote'),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      group: 'content',
      hidden: only('pullQuote'),
    }),
    defineField({
      name: 'reliefTitle',
      title: 'Reassurance title',
      type: 'string',
      group: 'content',
      hidden: only('pullQuote'),
    }),
    defineField({
      name: 'reliefBody',
      title: 'Reassurance body',
      type: 'text',
      rows: 2,
      group: 'content',
      hidden: only('pullQuote'),
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
    select: {title: 'title', quote: 'quote', variant: 'variant'},
    prepare({title, quote, variant}) {
      const labels: Record<string, string> = {
        painCards: 'Pain cards',
        soundFamiliar: 'Sound familiar?',
        pullQuote: 'Pull quote',
      }
      return {
        title: title || quote || 'Problem Section',
        subtitle: `Problem · ${labels[variant as string] || 'Pain cards'}`,
      }
    },
  },
})
