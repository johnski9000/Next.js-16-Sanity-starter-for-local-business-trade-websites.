import {defineField, defineType, defineArrayMember} from 'sanity'
import {ComposeSparklesIcon, ControlsIcon, OlistIcon} from '@sanity/icons'

const ICON_OPTIONS = [
  {title: 'Phone', value: 'Phone'},
  {title: 'Clipboard List', value: 'ClipboardList'},
  {title: 'Colour Palette', value: 'Palette'},
  {title: 'Ruler (Prep)', value: 'Ruler'},
  {title: 'Paint Roller', value: 'PaintRoller'},
  {title: 'Paint Brush', value: 'Paintbrush'},
  {title: 'Sparkles (Finish)', value: 'Sparkles'},
  {title: 'Badge Check', value: 'BadgeCheck'},
  {title: 'Message Square', value: 'MessageSquare'},
  {title: 'Calendar', value: 'Calendar'},
  {title: 'Search', value: 'Search'},
  {title: 'Truck', value: 'Truck'},
  {title: 'User', value: 'User'},
  {title: 'File Text', value: 'FileText'},
  {title: 'Check Circle', value: 'CheckCircle2'},
  {title: 'Star', value: 'Star'},
  {title: 'Shield Check', value: 'ShieldCheck'},
]

export const processSection = defineType({
  name: 'processSection',
  title: 'Process Section',
  type: 'object',
  icon: OlistIcon,
  groups: [
    {name: 'content', icon: ComposeSparklesIcon, default: true},
    {name: 'designSystem', icon: ControlsIcon},
  ],
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      initialValue: 'How It Works',
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
      name: 'subheading',
      title: 'Subheading',
      type: 'text',
      rows: 2,
      group: 'content',
    }),
    defineField({
      name: 'steps',
      title: 'Steps',
      type: 'array',
      group: 'content',
      description: 'Add 3–5 steps. Step numbers are assigned automatically by order.',
      validation: (Rule) => Rule.min(3).max(5).error('Add between 3 and 5 steps.'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'processStep',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
              options: {list: ICON_OPTIONS, layout: 'dropdown'},
              initialValue: 'CheckCircle2',
            }),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
            }),
          ],
          preview: {
            select: {title: 'title', subtitle: 'description'},
            prepare({title, subtitle}) {
              return {title: title || 'Step', subtitle, media: OlistIcon}
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'variant',
      title: 'Layout Variant',
      type: 'string',
      options: {
        list: [
          {title: 'Steps grid — icon circles + connector', value: 'grid'},
          {title: 'Connected flow — horizontal numbered nodes', value: 'flow'},
          {title: 'Timeline — vertical rail', value: 'timeline'},
          {title: 'Big numbers — bold outlined numerals', value: 'bigNumber'},
        ],
        layout: 'radio',
      },
      initialValue: 'grid',
      group: 'designSystem',
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
    select: {title: 'heading', steps: 'steps', variant: 'variant'},
    prepare({title, steps}) {
      const n = Array.isArray(steps) ? steps.length : 0
      return {
        title: title || 'Process Section',
        subtitle: `${n} step${n === 1 ? '' : 's'}`,
        media: OlistIcon,
      }
    },
  },
})
