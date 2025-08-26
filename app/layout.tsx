import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import { Providers } from "../components/providers";
import "../styles/globals.css";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL('https://tara-hub.vercel.app'),
  title: {
    default: "The Hearth & Home Store - Custom Cushions & Pillows | Made in USA",
    template: '%s | The Hearth & Home Store'
  },
  description: "100% customizable cushions and pillows, handcrafted in the USA. Choose from over 100 premium fabrics. Family-owned for 40+ years. Featured on NBC TODAY Show.",
  generator: 'The Hearth & Home Store',
  applicationName: 'The Hearth & Home Store',
  referrer: 'origin-when-cross-origin',
  keywords: ['custom cushions', 'custom pillows', 'made in USA', 'Missouri', 'fabric selection', 'Jack-Mat', 'monogrammed pillows'],
  authors: [{ name: 'The Hearth & Home Store' }],
  creator: 'The Hearth & Home Store',
  publisher: 'The Hearth & Home Store',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

// This is the root layout for the entire application.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    "priceRange": "$$",
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}