import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthSessionProvider from '@/components/providers/session-provider'

// Optimized font configuration - using only Inter for better performance
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  weight: ['300', '400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: 'Custom Fabric Designs - Premium Fabric Collections',
  description: 'Discover exquisite fabric collections from our curated selection of premium textiles. Perfect for discerning interior designers and premium home projects.',
  keywords: 'custom fabric designs, premium fabrics, premium textiles, designer fabrics, fabric samples, upholstery, interior design, home decor, fabric swatches',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f8f8f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-inter antialiased" suppressHydrationWarning>
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  )
}