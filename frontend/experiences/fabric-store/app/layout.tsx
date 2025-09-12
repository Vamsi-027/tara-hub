import type { Metadata } from 'next'
import { Inter, Playfair_Display, Source_Sans_3 } from 'next/font/google'
import './globals.css'
import AuthSessionProvider from '@/components/providers/session-provider'

// Luxury font configurations
const playfairDisplay = Playfair_Display({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['400', '500', '600', '700']
})

const sourceSans3 = Source_Sans_3({ 
  subsets: ['latin'], 
  display: 'swap',
  variable: '--font-body',
  weight: ['300', '400', '600']
})

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-ui',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'Custom Fabric Designs - Premium Fabric Collections',
  description: 'Discover exquisite fabric collections from our curated selection of premium textiles. Perfect for discerning interior designers and premium home projects.',
  keywords: 'custom fabric designs, premium fabrics, premium textiles, designer fabrics, fabric samples, upholstery, interior design, home decor, fabric swatches',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${sourceSans3.variable} ${inter.variable}`}>
      <body className="font-body antialiased" suppressHydrationWarning>
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  )
}