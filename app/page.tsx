import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { AboutSection } from "@/components/about-section"
import { CustomProcessSection } from "@/components/custom-process-section"
import { FeaturedFabrics } from "@/components/featured-fabrics"
import { ContactSection } from "@/components/contact-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <AboutSection />
      <CustomProcessSection />
      <FeaturedFabrics />
      <ContactSection />
      <Footer />
    </div>
  )
}
