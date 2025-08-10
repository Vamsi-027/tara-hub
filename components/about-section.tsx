import Image from 'next/image'
import { Heart, Palette, Home, Star } from 'lucide-react'

export function AboutSection() {
  const features = [
    {
      icon: Palette,
      title: "100% Customizable",
      description: "No limit to your creativity - every detail is yours to choose."
    },
    {
      icon: Home,
      title: "Made in USA",
      description: "Handcrafted with pride in Missouri by skilled artisans."
    },
    {
      icon: Heart,
      title: "Family-Owned",
      description: "Personal service with warmth and attention to detail."
    },
    {
      icon: Star,
      title: "Featured on NBC TODAY",
      description: "Recognized by Good Housekeeping Institute."
    }
  ]

  return (
    <section id="about" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Together We'll Unleash Your Inner Designer
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              The Hearth and Home Store is your destination for custom cushions and pillows that transform any space into your personal sanctuary. With over 100 premium fabrics to choose from, we bring your vision to life with unmatched quality and care.
            </p>
            <p className="text-lg text-gray-600 mb-8">
              From unique shapes to personalized monograms, every piece is handcrafted in the USA with meticulous attention to detail. Whether you're refreshing your living room, creating an outdoor oasis, or protecting little ones with our innovative Jack-Mat hearth cushions, we make comfort beautiful.
            </p>
            
            <div className="grid grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative h-80 lg:h-full">
            <Image
              src="/luxury-fabric-showroom.png"
              alt="Luxury fabric showroom"
              fill
              style={{objectFit: 'cover'}}
              className="rounded-lg shadow-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
