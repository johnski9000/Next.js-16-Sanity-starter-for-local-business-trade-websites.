import {defineArrayMember, defineField, defineType} from 'sanity'
import {ComposeSparklesIcon, ControlsIcon, ImagesIcon} from '@sanity/icons'

export const heroCarousel = defineType({
  name: 'heroCarousel',
  title: 'Hero Carousel (legacy)',
  description:
    'Legacy block. For new pages use the Hero Banner block and set its Layout Variant to "Carousel" — same slides, one unified hero block. Kept so existing carousels keep working.',
  type: 'object',
  icon: ImagesIcon,
  groups: [
    {name: 'content', icon: ComposeSparklesIcon, default: true},
    {name: 'designSystem', icon: ControlsIcon},
  ],
  fields: [
    defineField({
      name: 'slides',
      title: 'Slides',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'heroSlide'})],
      validation: (r) => r.min(1),
    }),
    defineField({
      name: 'textAlignment',
      title: 'Text Alignment',
      type: 'string',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Center', value: 'center'},
        ],
        layout: 'radio',
      },
      initialValue: 'left',
      group: 'designSystem',
    }),
    defineField({
      name: 'autoPlay',
      title: 'Auto Play',
      type: 'boolean',
      initialValue: true,
      group: 'designSystem',
    }),
    defineField({
      name: 'interval',
      title: 'Interval (seconds)',
      type: 'number',
      initialValue: 5,
      validation: (r) => r.min(2).max(20),
      hidden: ({parent}) => !parent?.autoPlay,
      group: 'designSystem',
    }),
  ],
  preview: {
    select: {slides: 'slides'},
    prepare({slides}) {
      const n = Array.isArray(slides) ? slides.length : 0
      return {
        title: 'Hero Carousel',
        subtitle: `${n} slide${n === 1 ? '' : 's'}`,
        media: ImagesIcon,
      }
    },
  },
})
