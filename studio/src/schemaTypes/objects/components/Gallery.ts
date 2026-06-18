import {defineField, defineType, defineArrayMember} from 'sanity'
import {ComposeSparklesIcon, ControlsIcon, ImagesIcon} from '@sanity/icons'

export const gallery = defineType({
  name: 'gallery',
  title: 'Gallery',
  type: 'object',
  icon: ImagesIcon,
  groups: [
    {name: 'content', icon: ComposeSparklesIcon, default: true},
    {name: 'designSystem', icon: ControlsIcon},
  ],
  fields: [
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
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'image',
          name: 'galleryImage',
          options: {hotspot: true},
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
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
              description: 'Optional caption shown on hover / under the image.',
            }),
          ],
          preview: {
            select: {title: 'caption', subtitle: 'alt', media: 'asset'},
            prepare({title, subtitle, media}) {
              return {title: title || 'Image', subtitle, media}
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'number',
      description: 'Number of columns in the gallery grid.',
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
    select: {title: 'heading', images: 'images'},
    prepare({title, images}) {
      const n = Array.isArray(images) ? images.length : 0
      return {
        title: title || 'Gallery',
        subtitle: `${n} image${n === 1 ? '' : 's'}`,
        media: ImagesIcon,
      }
    },
  },
})
