import {defineField, defineType, defineArrayMember} from 'sanity'
import {ComposeSparklesIcon, ControlsIcon, HelpCircleIcon} from '@sanity/icons'

/** Hide a field unless the chosen variant is in the list. */
const only =
  (...variants: string[]) =>
  ({parent}: {parent?: {variant?: string}}) =>
    !variants.includes(parent?.variant ?? 'split')

export const faq = defineType({
  name: 'faq',
  title: 'FAQ',
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
          {title: 'Split — sticky heading + accordion', value: 'split'},
          {title: 'Accordion — centred expand/collapse', value: 'accordion'},
          {title: 'Grid — open Q&A (all answers visible, snippet-friendly)', value: 'grid'},
        ],
        layout: 'radio',
      },
      initialValue: 'split',
      group: 'content',
    }),
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
      initialValue: 'Frequently Asked Questions',
      group: 'content',
    }),
    defineField({
      name: 'subheading',
      title: 'Subheading',
      type: 'text',
      rows: 2,
      group: 'content',
      hidden: only('split', 'grid'),
    }),
    defineField({
      name: 'items',
      title: 'Questions',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          fields: [
            defineField({
              name: 'question',
              title: 'Question',
              type: 'string',
            }),
            defineField({
              name: 'answer',
              title: 'Answer',
              type: 'blockContentTextOnly',
            }),
          ],
          preview: {
            select: {title: 'question'},
            prepare({title}) {
              return {title: title || 'Question', media: HelpCircleIcon}
            },
          },
        }),
      ],
    }),

    // ── Grid variant: CTA cell ────────────────────────────────────────────────
    defineField({
      name: 'ctaTitle',
      title: 'CTA title',
      type: 'string',
      initialValue: 'Still have a question?',
      group: 'content',
      hidden: only('grid'),
    }),
    defineField({
      name: 'ctaText',
      title: 'CTA text',
      type: 'string',
      group: 'content',
      hidden: only('grid'),
    }),
    defineField({
      name: 'ctaButton',
      title: 'CTA button',
      type: 'button',
      group: 'content',
      hidden: only('grid'),
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
    select: {title: 'heading', items: 'items', variant: 'variant'},
    prepare({title, items, variant}) {
      const labels: Record<string, string> = {
        split: 'Split',
        accordion: 'Accordion',
        grid: 'Grid',
      }
      const n = Array.isArray(items) ? items.length : 0
      return {
        title: title || 'FAQ',
        subtitle: `FAQ · ${labels[variant as string] || 'Split'} · ${n}`,
        media: HelpCircleIcon,
      }
    },
  },
})
