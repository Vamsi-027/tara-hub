import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { FeaturedFabrics } from "@/components/featured-fabrics"
import { AboutSection } from "@/components/about-section"
import { ContactSection } from "@/components/contact-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <FeaturedFabrics />
      <AboutSection />
      <ContactSection />
      <Footer />
    </div>
  )
}
