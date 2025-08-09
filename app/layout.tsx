import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "The Hearth & Home Store - Custom Cushions & Pillows",
  description: "100% customizable cushions and pillows, handcrafted in the USA. Choose from over 100 premium fabrics. Family-owned since Missouri.",
  generator: 'The Hearth & Home Store'
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
          {children}
        </Providers>
      </body>
    </html>
  )
}
