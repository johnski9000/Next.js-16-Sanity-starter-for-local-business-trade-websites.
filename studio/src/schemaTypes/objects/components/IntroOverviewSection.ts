import {defineField, defineType, defineArrayMember} from 'sanity'
import {ComposeSparklesIcon, ControlsIcon, DocumentTextIcon} from '@sanity/icons'

/** Hide a field unless the chosen variant is in the list. */
const only =
  (...variants: string[]) =>
  ({parent}: {parent?: {variant?: string}}) =>
    !variants.includes(parent?.variant ?? 'split')

export const introOverviewSection = defineType({
  name: 'introOverviewSection',
  title: 'Intro Overview Section',
  type: 'object',
  icon: DocumentTextIcon,
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
          {title: 'Split — copy + stats/checklist + optional image', value: 'split'},
          {title: 'Editorial — oversized lead + two-column body', value: 'editorial'},
          {title: 'Facts — copy + "at a glance" panel', value: 'facts'},
          {title: 'Centered — centred overview + inline stats', value: 'centered'},
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
      validation: (Rule) => Rule.required(),
      group: 'content',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContentTextOnly',
      group: 'content',
    }),
    defineField({
      name: 'stats',
      title: 'Stats',
      type: 'array',
      group: 'content',
      description: 'Highlight stats (Split + Centered layouts), e.g. "15+ Years experience".',
      hidden: only('split', 'centered'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'stat',
          fields: [
            defineField({name: 'value', title: 'Value', type: 'string', description: 'e.g. 15+'}),
            defineField({name: 'label', title: 'Label', type: 'string', description: 'e.g. Years experience'}),
          ],
          preview: {
            select: {title: 'value', subtitle: 'label'},
            prepare({title, subtitle}) {
              return {title: title || 'Stat', subtitle}
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'facts',
      title: 'Facts',
      type: 'array',
      group: 'content',
      description: '"At a glance" key → value rows (Facts layout), e.g. "Founded" → "2009".',
      hidden: only('facts'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'fact',
          fields: [
            defineField({name: 'label', title: 'Label', type: 'string', description: 'e.g. Founded'}),
            defineField({name: 'value', title: 'Value', type: 'string', description: 'e.g. 2009 · family-owned'}),
          ],
          preview: {
            select: {title: 'label', subtitle: 'value'},
            prepare({title, subtitle}) {
              return {title: title || 'Fact', subtitle}
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'checklist',
      title: 'Checklist',
      type: 'array',
      group: 'content',
      description: 'Optional bullet points with tick icons (Split layout).',
      hidden: only('split'),
      of: [{type: 'string'}],
    }),
    defineField({
      name: 'cta',
      title: 'Primary Button',
      type: 'button',
      group: 'content',
    }),
    defineField({
      name: 'secondaryCta',
      title: 'Secondary Button',
      type: 'button',
      group: 'content',
      hidden: only('split'),
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
        (parent?.variant ?? 'split') !== 'split' ||
        !Boolean((parent as {image?: {asset?: unknown}})?.image?.asset),
    }),
  ],
  preview: {
    select: {title: 'heading', subtitle: 'eyebrow', variant: 'variant'},
    prepare({title, subtitle, variant}) {
      const labels: Record<string, string> = {
        split: 'Split',
        editorial: 'Editorial',
        facts: 'Facts',
        centered: 'Centered',
      }
      return {
        title: title || 'Intro Overview Section',
        subtitle: `Intro · ${labels[variant as string] || 'Split'}${subtitle ? ` · ${subtitle}` : ''}`,
        media: DocumentTextIcon,
      }
    },
  },
})
