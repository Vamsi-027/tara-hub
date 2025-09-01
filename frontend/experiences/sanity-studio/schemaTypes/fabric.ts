import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'fabric',
  title: 'Fabric Product',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Fabric Name',
      type: 'string',
      description: 'The display name of the fabric',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'sku',
      title: 'SKU',
      type: 'string',
      description: 'Product SKU code',
      validation: (Rule) => Rule.required().max(50),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Detailed description of the fabric',
      validation: (Rule) => Rule.max(500),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Upholstery', value: 'upholstery'},
          {title: 'Drapery', value: 'drapery'},
          {title: 'Multipurpose', value: 'multipurpose'},
          {title: 'Outdoor', value: 'outdoor'},
          {title: 'Wallcovering', value: 'wallcovering'},
        ],
      },
      initialValue: 'upholstery',
    }),
    defineField({
      name: 'collection',
      title: 'Collection',
      type: 'string',
      description: 'Fabric collection or line name',
    }),
    defineField({
      name: 'price',
      title: 'Price per Yard',
      type: 'number',
      description: 'Price in dollars',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'swatchPrice',
      title: 'Swatch Price',
      type: 'number',
      description: 'Price for fabric swatch in dollars',
      initialValue: 5,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'images',
      title: 'Product Images',
      type: 'array',
      of: [
        {
          type: 'image',
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
        },
      ],
      validation: (Rule) => Rule.max(5),
    }),
    defineField({
      name: 'swatchImage',
      title: 'Swatch Image',
      type: 'image',
      description: 'Primary swatch image for display',
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
      name: 'color',
      title: 'Color Name',
      type: 'string',
      description: 'Human-readable color name',
      validation: (Rule) => Rule.required().max(50),
    }),
    defineField({
      name: 'color_family',
      title: 'Color Family',
      type: 'string',
      options: {
        list: [
          {title: 'Red', value: 'red'},
          {title: 'Orange', value: 'orange'},
          {title: 'Yellow', value: 'yellow'},
          {title: 'Green', value: 'green'},
          {title: 'Blue', value: 'blue'},
          {title: 'Purple', value: 'purple'},
          {title: 'Pink', value: 'pink'},
          {title: 'Brown', value: 'brown'},
          {title: 'Neutral', value: 'neutral'},
          {title: 'Black', value: 'black'},
          {title: 'White', value: 'white'},
          {title: 'Gray', value: 'gray'},
        ],
      },
    }),
    defineField({
      name: 'color_hex',
      title: 'Color Hex Code',
      type: 'string',
      description: 'Hex color code (e.g., #ff0000)',
      validation: (Rule) =>
        Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
          name: 'hex',
          invert: false,
        }).error('Please enter a valid hex color code'),
    }),
    defineField({
      name: 'pattern',
      title: 'Pattern',
      type: 'string',
      options: {
        list: [
          {title: 'Solid', value: 'solid'},
          {title: 'Stripe', value: 'stripe'},
          {title: 'Plaid', value: 'plaid'},
          {title: 'Geometric', value: 'geometric'},
          {title: 'Floral', value: 'floral'},
          {title: 'Textured', value: 'textured'},
          {title: 'Abstract', value: 'abstract'},
          {title: 'Animal Print', value: 'animal'},
          {title: 'Damask', value: 'damask'},
          {title: 'Paisley', value: 'paisley'},
        ],
      },
      initialValue: 'solid',
    }),
    defineField({
      name: 'usage',
      title: 'Usage',
      type: 'string',
      options: {
        list: [
          {title: 'Indoor', value: 'indoor'},
          {title: 'Outdoor', value: 'outdoor'},
          {title: 'Both', value: 'both'},
        ],
      },
      initialValue: 'indoor',
    }),
    defineField({
      name: 'properties',
      title: 'Properties',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Water Resistant', value: 'water_resistant'},
          {title: 'Stain Resistant', value: 'stain_resistant'},
          {title: 'UV Resistant', value: 'uv_resistant'},
          {title: 'Mildew Resistant', value: 'mildew_resistant'},
          {title: 'Fire Retardant', value: 'fire_retardant'},
          {title: 'Anti-Microbial', value: 'antimicrobial'},
          {title: 'Washable', value: 'washable'},
          {title: 'Light Filtering', value: 'light_filtering'},
          {title: 'Blackout', value: 'blackout'},
        ],
      },
    }),
    defineField({
      name: 'composition',
      title: 'Composition',
      type: 'string',
      description: 'Fabric composition (e.g., 100% Cotton)',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'width',
      title: 'Width',
      type: 'string',
      description: 'Fabric width (e.g., 54 inches)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'weight',
      title: 'Weight',
      type: 'string',
      options: {
        list: [
          {title: 'Light', value: 'light'},
          {title: 'Medium', value: 'medium'},
          {title: 'Heavy', value: 'heavy'},
          {title: 'Extra Heavy', value: 'extra_heavy'},
        ],
      },
    }),
    defineField({
      name: 'durability',
      title: 'Durability Rating',
      type: 'string',
      description: 'Durability in double rubs (e.g., 50,000 double rubs)',
    }),
    defineField({
      name: 'care_instructions',
      title: 'Care Instructions',
      type: 'text',
      description: 'How to care for this fabric',
    }),
    defineField({
      name: 'minimum_order_yards',
      title: 'Minimum Order (Yards)',
      type: 'number',
      description: 'Minimum yards required for fabric orders',
      initialValue: 1,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'in_stock',
      title: 'In Stock',
      type: 'boolean',
      description: 'Is this fabric currently in stock?',
      initialValue: true,
    }),
    defineField({
      name: 'swatch_in_stock',
      title: 'Swatch In Stock',
      type: 'boolean',
      description: 'Are swatches available?',
      initialValue: true,
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Active', value: 'active'},
          {title: 'Discontinued', value: 'discontinued'},
          {title: 'Coming Soon', value: 'coming_soon'},
        ],
      },
      initialValue: 'active',
    }),
    defineField({
      name: 'featured',
      title: 'Featured Product',
      type: 'boolean',
      description: 'Show this fabric in featured sections',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order for sorting (lower numbers appear first)',
      validation: (Rule) => Rule.integer().min(0),
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'sku',
      media: 'swatchImage',
      category: 'category',
      price: 'price',
      inStock: 'in_stock',
    },
    prepare(selection) {
      const {title, subtitle, category, price, inStock} = selection
      return {
        title,
        subtitle: `${subtitle} • ${category} • $${price} ${inStock ? '(In Stock)' : '(Out of Stock)'}`,
        media: selection.media,
      }
    },
  },
})