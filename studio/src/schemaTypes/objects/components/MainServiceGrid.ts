import {defineField, defineType, defineArrayMember} from 'sanity'
import {ComposeSparklesIcon, ControlsIcon, ThListIcon} from '@sanity/icons'

const ICON_OPTIONS = [
  {title: 'Paint Roller', value: 'PaintRoller'},
  {title: 'Paint Brush', value: 'Paintbrush'},
  {title: 'Paint Bucket', value: 'PaintBucket'},
  {title: 'Colour Palette', value: 'Palette'},
  {title: 'Brush', value: 'Brush'},
  {title: 'Spray Can', value: 'SprayCan'},
  {title: 'Ruler (Prep)', value: 'Ruler'},
  {title: 'Layers (Wallpaper)', value: 'Layers'},
  {title: 'Sparkles (Finish)', value: 'Sparkles'},
  {title: 'Home (Interior)', value: 'Home'},
  {title: 'Building (Commercial)', value: 'Building2'},
  {title: 'Shield Check', value: 'ShieldCheck'},
  {title: 'Clock', value: 'Clock'},
  {title: 'Star', value: 'Star'},
  {title: 'Check Circle', value: 'CheckCircle2'},
]

export const mainServiceGrid = defineType({
  name: 'mainServiceGrid',
  title: 'Main Service Grid',
  type: 'object',
  icon: ThListIcon,
  groups: [
    {name: 'content', icon: ComposeSparklesIcon, default: true},
    {name: 'designSystem', icon: ControlsIcon},
  ],
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      initialValue: 'What We Can Help With',
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
      name: 'items',
      title: 'Service Items',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'serviceItem',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
              options: {list: ICON_OPTIONS, layout: 'dropdown'},
              initialValue: 'Paintbrush',
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
              rows: 3,
            }),
            defineField({
              name: 'bullets',
              title: 'Bullet Points',
              type: 'array',
              of: [{type: 'string'}],
              description: 'Optional short bullet points inside the card.',
            }),
            defineField({
              name: 'cta',
              title: 'Card Link',
              type: 'button',
            }),
          ],
          preview: {
            select: {title: 'title', subtitle: 'description'},
            prepare({title, subtitle}) {
              return {title: title || 'Service Item', subtitle, media: ThListIcon}
            },
          },
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
      name: 'columns',
      title: 'Columns',
      type: 'number',
      description: 'Number of columns in the card grid.',
      options: {
        list: [
          {title: '2', value: 2},
          {title: '3', value: 3},
          {title: '4', value: 4},
        ],
        layout: 'radio',
      },
      initialValue: 3,
      group: 'designSystem',
    }),
  ],
  preview: {
    select: {title: 'heading', items: 'items'},
    prepare({title, items}) {
      const n = Array.isArray(items) ? items.length : 0
      return {
        title: title || 'Main Service Grid',
        subtitle: `${n} item${n === 1 ? '' : 's'}`,
        media: ThListIcon,
      }
    },
  },
})
