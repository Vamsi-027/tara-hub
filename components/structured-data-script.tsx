import Script from 'next/script'

export function StructuredDataScript() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "The Hearth & Home Store",
    "description": "Custom cushions and pillows handcrafted in Missouri. Family-owned for 40+ years.",
    "url": "https://thehearthandhomestore.com",
    "telephone": "(636) 337-5200",
    "email": "info@thehearthandhomestore.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "116 Easton St.",
      "addressLocality": "DeSoto",
      "addressRegion": "MO",
      "postalCode": "63020",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 38.1392,
      "longitude": -90.5553
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "17:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "08:00",
        "closes": "12:00"
      }
    ],
    "priceRange": "$$",
    "image": "https://tara-hub.vercel.app/logo.png",
    "sameAs": [
      "https://www.facebook.com/myHearthandHome/",
      "https://www.instagram.com/hearthandhomestore/",
      "https://www.pinterest.com/hearthandhomestore/"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "2500"
    }
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "The Hearth & Home Store",
    "url": "https://tara-hub.vercel.app",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://tara-hub.vercel.app/fabrics?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://tara-hub.vercel.app"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Fabrics",
        "item": "https://tara-hub.vercel.app/fabrics"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Blog",
        "item": "https://tara-hub.vercel.app/blog"
      }
    ]
  }

  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  )
}