import {defineField, defineType} from 'sanity'
import {EnvelopeIcon} from '@sanity/icons'

export const contactForm = defineType({
  name: 'contactForm',
  title: 'Contact Form',
  type: 'object',
  icon: EnvelopeIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
      initialValue: 'Request a Free Quote',
    }),
    defineField({
      name: 'intro',
      title: 'Intro Text',
      type: 'text',
      rows: 2,
      description: 'Short supporting line shown under the title.',
    }),
    defineField({
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
      description: 'Shown in the contact panel and used for call links. Leave blank to hide.',
    }),
    defineField({
      name: 'email',
      title: 'Email Address',
      type: 'string',
      description: 'Shown in the contact panel. Leave blank to hide.',
    }),
    defineField({
      name: 'location',
      title: 'Location / Service Area',
      type: 'string',
      description: 'e.g. the town or region you cover. Leave blank to hide.',
    }),
    defineField({
      name: 'services',
      title: 'Service Options',
      type: 'array',
      of: [{type: 'string'}],
      description:
        'Options shown in the "Service required" dropdown. Falls back to generic options if empty.',
    }),
  ],
  preview: {
    select: {title: 'title'},
    prepare({title}) {
      return {
        title: title || 'Contact Form',
        media: EnvelopeIcon,
      }
    },
  },
})
