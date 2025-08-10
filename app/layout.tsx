import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { Providers } from "@/components/providers"
import { StructuredData } from "@/components/structured-data"

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

export default function RootLayout({
  children,
}: {
 children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <StructuredData />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
