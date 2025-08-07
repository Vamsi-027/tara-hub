import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Award, Globe, Users, Palette } from 'lucide-react'

export function AboutSection() {
  const features = [
    {
      icon: Award,
      title: "Premium Quality",
      description: "Sourced from the world's finest mills and manufacturers"
    },
    {
      icon: Globe,
      title: "Global Sourcing",
      description: "Fabrics from Europe, Asia, and the Americas"
    },
    {
      icon: Users,
      title: "Trade Program",
      description: "Special pricing and services for design professionals"
    },
    {
      icon: Palette,
      title: "Custom Solutions",
      description: "Bespoke fabric solutions for unique projects"
    }
  ]

  return (
    <section id="about" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Crafting Beautiful Interiors Since 1985
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              For nearly four decades, Hearth & Home Fabrics has been the trusted partner 
              for interior designers, architects, and homeowners seeking exceptional textiles. 
              Our curated collection represents the finest in global fabric manufacturing.
            </p>
            <p className="text-lg text-gray-600 mb-8">
              From luxurious silks and velvets to performance fabrics and outdoor textiles, 
              we offer an unparalleled selection that meets the demands of both residential 
              and commercial projects.
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
          
          <div className="relative">
            <Image
              src="/fabric-warehouse.png"
              alt="Fabric warehouse and showroom"
              width={600}
              height={400}
              className="rounded-lg shadow-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
