import { Metadata } from 'next'
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { AboutSection } from "@/components/about-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { CustomProcessSection } from "@/components/custom-process-section"
import { FeaturedFabrics } from "@/components/featured-fabrics"
import { BlogPreview } from "@/components/blog-preview"
import { EtsyFeaturedProducts } from "@/components/etsy-featured-products"
import { ContactSection } from "@/components/contact-section"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: 'Custom Cushions & Pillows | The Hearth & Home Store | Made in USA',
  description: 'Custom cushions and pillows handcrafted in Missouri. 100+ fabric choices, 40+ years family-owned. Featured on NBC TODAY Show. Free design consultation.',
  keywords: 'custom cushions, custom pillows, made in USA, Missouri cushions, Jack-Mat hearth cushion, monogrammed pillows, outdoor cushions, fabric selection',
  openGraph: {
    title: 'The Hearth & Home Store - Custom Cushions & Pillows',
    description: 'Transform your home with custom cushions and pillows. 100% customizable, handcrafted in USA.',
    type: 'website',
    locale: 'en_US',
    url: 'https://tara-hub.vercel.app',
    siteName: 'The Hearth & Home Store',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Custom Cushions & Pillows | The Hearth & Home Store',
    description: 'Handcrafted custom cushions and pillows. 100+ fabrics, made in USA.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://tara-hub.vercel.app',
  }
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <AboutSection />
      <TestimonialsSection />
      <CustomProcessSection />
      <FeaturedFabrics />
      <EtsyFeaturedProducts />
      <BlogPreview />
      <ContactSection />
      <Footer />
    </div>
  )
}
