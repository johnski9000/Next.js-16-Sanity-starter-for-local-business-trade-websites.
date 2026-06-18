import {defineArrayMember, defineField, defineType} from 'sanity'

export const footerColumn = defineType({
  name: 'footerColumn',
  title: 'Footer Column',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'links',
      title: 'Links',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'footerLink',
          title: 'Footer Link',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'link',
              title: 'Link',
              type: 'link',
              validation: (r) => r.required(),
            }),
          ],
          preview: {select: {title: 'label'}},
        }),
      ],
      validation: (rule) => rule.min(1),
    }),
  ],
})

export const socialLink = defineType({
  name: 'socialLink',
  title: 'Social Link',
  type: 'object',
  fields: [
    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({name: 'url', title: 'URL', type: 'url', validation: (r) => r.required()}),
  ],
  preview: {
    select: {title: 'platform', subtitle: 'url'},
  },
})

export const legalLink = defineType({
  name: 'legalLink',
  title: 'Legal Link',
  type: 'object',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'link', title: 'Link', type: 'link', validation: (r) => r.required()}),
  ],
})
