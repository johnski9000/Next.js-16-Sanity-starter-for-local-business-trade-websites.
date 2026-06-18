import {defineField, defineType} from 'sanity'
import {ComposeSparklesIcon, ControlsIcon, BellIcon} from '@sanity/icons'

export const emergencyCtaStrip = defineType({
  name: 'emergencyCtaStrip',
  title: 'Emergency CTA Strip',
  type: 'object',
  icon: BellIcon,
  groups: [
    {name: 'content', icon: ComposeSparklesIcon, default: true},
    {name: 'designSystem', icon: ControlsIcon},
  ],
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      group: 'content',
    }),
    defineField({
      name: 'subheading',
      title: 'Subheading',
      type: 'string',
      group: 'content',
    }),
    defineField({
      name: 'phoneNumber',
      title: 'Phone Number',
      type: 'string',
      description: 'Displayed prominently and used as the tel: link, e.g. 0161 123 4567',
      group: 'content',
    }),
    defineField({
      name: 'button',
      title: 'Secondary Button',
      type: 'button',
      description: 'Optional second action, e.g. "Book Online"',
      group: 'content',
    }),
    defineField({
      name: 'theme',
      title: 'Theme',
      type: 'string',
      options: {
        list: [
          {title: 'Brand (default)', value: 'brand'},
          {title: 'Dark', value: 'dark'},
          {title: 'Light', value: 'light'},
        ],
        layout: 'radio',
      },
      initialValue: 'brand',
      group: 'designSystem',
    }),
  ],
  preview: {
    select: {
      title: 'heading',
      phone: 'phoneNumber',
    },
    prepare({title, phone}) {
      return {
        title: title || 'Emergency CTA Strip',
        subtitle: phone,
        media: BellIcon,
      }
    },
  },
})