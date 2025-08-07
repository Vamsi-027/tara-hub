import Image from 'next/image'
import { ShieldCheck, Wrench, Users, CalendarClock } from 'lucide-react'

export function AboutSection() {
  const features = [
    {
      icon: ShieldCheck,
      title: "Quality Products",
      description: "We carry the most trusted brands in the industry."
    },
    {
      icon: Wrench,
      title: "Expert Installation",
      description: "Our certified technicians ensure a safe and perfect setup."
    },
    {
      icon: Users,
      title: "Family-Owned",
      description: "Proudly serving our community with a personal touch."
    },
    {
      icon: CalendarClock,
      title: "40+ Years of Experience",
      description: "Decades of expertise in home heating solutions."
    }
  ]

  return (
    <section id="about" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Your Home for Warmth & Comfort for Over 40 Years
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              The Hearth and Home Store is a family-owned and operated business dedicated to bringing warmth, comfort, and style to your home. For decades, we've been the trusted local source for high-quality fireplaces, stoves, and inserts.
            </p>
            <p className="text-lg text-gray-600 mb-8">
              Our commitment is to provide you with superior products, expert installation, and unmatched customer service. Whether you're building a new home or upgrading your current space, our knowledgeable team is here to help you find the perfect solution.
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
              src="/cozy-fireplace.png"
              alt="A cozy living room with a modern fireplace"
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
