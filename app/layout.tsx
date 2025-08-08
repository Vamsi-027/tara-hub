import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { Providers } from "@/components/providers"
import { SidebarProvider } from "@/components/ui/sidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Luxury Fabrics - Premium Textile Showcase",
  description: "Discover our curated collection of premium fabrics for interior design and upholstery projects.",
    generator: 'Heart & Homes'
}

export default function RootLayout({
  children,
}: {
 children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
 <Providers>
 <SidebarProvider>
          {children}
 </SidebarProvider>
        </Providers>
      </body>
    </html>
  )
}
