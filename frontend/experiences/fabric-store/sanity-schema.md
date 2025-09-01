# Sanity CMS Schema for Hero Carousel

This document outlines the Sanity CMS schema needed for the hero carousel component with the new layout (content left, image right).

**Project Details:**
- **Project ID**: d1t5dcup
- **Organization ID**: oUaypVdK3

## Hero Slide Schema

Create a new document type called `heroSlide` in your Sanity studio with the following fields:

```javascript
// schemas/heroSlide.js
export default {
  name: 'heroSlide',
  title: 'Hero Carousel Slide',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Header 1 (Main Title)',
      type: 'string',
      description: 'Main headline for the slide',
      validation: Rule => Rule.required().max(100)
    },
    {
      name: 'subtitle',
      title: 'Header 2 (Subtitle)',
      type: 'string',
      description: 'Supporting text below the title',
      validation: Rule => Rule.required().max(150)
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Detailed description text',
      validation: Rule => Rule.required().max(300)
    },
    {
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
              validation: Rule => Rule.required().max(50)
            },
            {
              name: 'color',
              title: 'Icon Color',
              type: 'string',
              options: {
                list: [
                  { title: 'Amber', value: 'amber' },
                  { title: 'Green', value: 'green' },
                  { title: 'Blue', value: 'blue' },
                  { title: 'Purple', value: 'purple' },
                  { title: 'Red', value: 'red' }
                ]
              },
              initialValue: 'blue'
            }
          ],
          preview: {
            select: {
              title: 'text',
              subtitle: 'color'
            },
            prepare(selection) {
              return {
                title: selection.title,
                subtitle: `${selection.subtitle} icon`
              }
            }
          }
        }
      ],
      validation: Rule => Rule.required().min(2).max(6)
    },
    {
      name: 'searchPlaceholder',
      title: 'Search Box Placeholder',
      type: 'string',
      description: 'Placeholder text for the search input',
      initialValue: 'Search fabrics by designer, style, color...'
    },
    {
      name: 'ctaText',
      title: 'CTA Button Text',
      type: 'string',
      description: 'Text for the call-to-action button',
      validation: Rule => Rule.required().max(30)
    },
    {
      name: 'ctaLink',
      title: 'CTA Link',
      type: 'string',
      description: 'URL for the call-to-action button (e.g., /browse)',
      validation: Rule => Rule.required()
    },
    {
      name: 'backgroundGradient',
      title: 'Background Gradient',
      type: 'string',
      options: {
        list: [
          { title: 'Blue', value: 'blue' },
          { title: 'Purple', value: 'purple' },
          { title: 'Green', value: 'green' },
          { title: 'Orange', value: 'orange' }
        ]
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'textColor',
      title: 'Text Color',
      type: 'string',
      options: {
        list: [
          { title: 'Black', value: 'black' },
          { title: 'White', value: 'white' }
        ]
      },
      initialValue: 'black'
    },
    {
      name: 'image',
      title: 'Right Side Image',
      type: 'image',
      description: 'Image displayed on the right side of the carousel',
      options: {
        hotspot: true
      },
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Important for SEO and accessibility'
        }
      ],
      validation: Rule => Rule.required()
    },
    {
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Show this slide in the carousel',
      initialValue: true
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order in which slides appear (1, 2, 3, etc.)',
      validation: Rule => Rule.required().integer().positive()
    }
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'subtitle',
      media: 'image',
      order: 'order',
      isActive: 'isActive'
    },
    prepare(selection) {
      const { title, subtitle, order, isActive } = selection
      return {
        title: `${order}. ${title}`,
        subtitle: `${subtitle} ${isActive ? '(Active)' : '(Inactive)'}`,
        media: selection.media
      }
    }
  }
}
```

## Setup Instructions

1. **Create Sanity Project**:
   ```bash
   npm install -g @sanity/cli
   sanity init
   ```

2. **Add the Schema**:
   - Copy the schema above to `schemas/heroSlide.js`
   - Add to your `schemas/index.js`:
     ```javascript
     import heroSlide from './heroSlide'
     
     export const schemaTypes = [heroSlide]
     ```

3. **Deploy Schema**:
   ```bash
   sanity deploy
   ```

4. **Get Project Details**:
   - Project ID: Found in `sanity.config.js`
   - Dataset: Usually 'production'
   - API Token: Generate in Sanity dashboard (for write access)

5. **Add Environment Variables**:
   ```env
   NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
   NEXT_PUBLIC_SANITY_DATASET=production
   SANITY_API_TOKEN=your-api-token
   ```

## Sample Data

Create 3 hero slides in your Sanity studio:

### Slide 1 (Order: 1)
- **Title**: "Experience Luxury Fabrics First-Hand"
- **Subtitle**: "Touch the Difference Quality Makes"
- **Description**: "Discover our curated collection of premium fabric samples from world-renowned mills. Each professionally mounted sample includes complete specifications."
- **CTA Text**: "Explore Collections"
- **CTA Link**: "/browse"
- **Background Gradient**: Blue
- **Text Color**: Black

### Slide 2 (Order: 2)
- **Title**: "Designer Collections Now Available"
- **Subtitle**: "Exclusive Access to Trade-Only Fabrics"
- **Description**: "Get access to premium designer collections from heritage mills. Perfect for interior designers and luxury projects."
- **CTA Text**: "Browse Designer Lines"
- **CTA Link**: "/browse?featured=true"
- **Background Gradient**: Purple
- **Text Color**: Black

### Slide 3 (Order: 3)
- **Title**: "Free Fabric Swatches"
- **Subtitle**: "See & Feel Before You Buy"
- **Description**: "Order up to 5 fabric swatches completely free. Professional presentation with full specifications included."
- **CTA Text**: "Order Free Swatches"
- **CTA Link**: "/browse"
- **Background Gradient**: Green
- **Text Color**: Black

## Features

- ✅ Dynamic content management
- ✅ Image optimization with Sanity CDN
- ✅ Order management for slide sequence
- ✅ Active/inactive toggle for slides
- ✅ Multiple background gradient options
- ✅ Responsive image handling
- ✅ Fallback data if Sanity is unavailable
- ✅ TypeScript support
- ✅ SEO-friendly alt text