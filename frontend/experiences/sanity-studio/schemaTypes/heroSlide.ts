import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'heroSlide',
  title: 'Hero Carousel Slide',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Header 1 (Main Title)',
      type: 'string',
      description: 'Main headline for the slide',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'subtitle',
      title: 'Header 2 (Subtitle)',
      type: 'string',
      description: 'Supporting text below the title',
      validation: (Rule) => Rule.required().max(150),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Detailed description text',
      validation: (Rule) => Rule.required().max(300),
    }),
    defineField({
      name: 'features',
      title: 'Features',
      type: 'array',
      description: 'Feature list displayed with checkmarks',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'text',
              title: 'Feature Text',
              type: 'string',
              validation: (Rule) => Rule.required().max(50),
            },
            {
              name: 'color',
              title: 'Icon Color',
              type: 'string',
              options: {
                list: [
                  {title: 'Amber', value: 'amber'},
                  {title: 'Green', value: 'green'},
                  {title: 'Blue', value: 'blue'},
                  {title: 'Purple', value: 'purple'},
                  {title: 'Red', value: 'red'},
                ],
              },
              initialValue: 'blue',
            },
          ],
          preview: {
            select: {
              title: 'text',
              subtitle: 'color',
            },
            prepare(selection) {
              return {
                title: selection.title,
                subtitle: `${selection.subtitle} icon`,
              }
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(2).max(6),
    }),
    defineField({
      name: 'searchPlaceholder',
      title: 'Search Box Placeholder',
      type: 'string',
      description: 'Placeholder text for the search input',
      initialValue: 'Search fabrics by designer, style, color...',
    }),
    defineField({
      name: 'ctaText',
      title: 'CTA Button Text',
      type: 'string',
      description: 'Text for the call-to-action button',
      validation: (Rule) => Rule.required().max(30),
    }),
    defineField({
      name: 'ctaLink',
      title: 'CTA Link',
      type: 'string',
      description: 'URL for the call-to-action button (e.g., /browse)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'backgroundGradient',
      title: 'Background Gradient',
      type: 'string',
      options: {
        list: [
          {title: 'Blue', value: 'blue'},
          {title: 'Purple', value: 'purple'},
          {title: 'Green', value: 'green'},
          {title: 'Orange', value: 'orange'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'textColor',
      title: 'Text Color',
      type: 'string',
      options: {
        list: [
          {title: 'Black', value: 'black'},
          {title: 'White', value: 'white'},
        ],
      },
      initialValue: 'black',
    }),
    defineField({
      name: 'image',
      title: 'Right Side Image',
      type: 'image',
      description: 'Image displayed on the right side of the carousel',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Important for SEO and accessibility',
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Show this slide in the carousel',
      initialValue: true,
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order in which slides appear (1, 2, 3, etc.)',
      validation: (Rule) => Rule.required().integer().positive(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'subtitle',
      media: 'image',
      order: 'order',
      isActive: 'isActive',
    },
    prepare(selection) {
      const {title, subtitle, order, isActive} = selection
      return {
        title: `${order}. ${title}`,
        subtitle: `${subtitle} ${isActive ? '(Active)' : '(Inactive)'}`,
        media: selection.media,
      }
    },
  },
})