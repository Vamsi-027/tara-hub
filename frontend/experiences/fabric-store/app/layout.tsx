import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthSessionProvider from '@/components/providers/session-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Custom Design Fabrics - Premium Fabric Samples',
  description: 'Order free fabric samples from our curated collection of premium fabrics. Perfect for interior designers and home decorators.',
  keywords: 'fabric samples, upholstery fabric, designer fabric, free swatches, interior design',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  )
}