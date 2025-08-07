import { Card, CardContent } from "@/components/ui/card"
import { Award, Globe, Palette, Users } from 'lucide-react'

export function AboutSection() {
  const features = [
    {
      icon: Globe,
      title: "Global Sourcing",
      description: "We partner with the finest mills across Europe and Asia to bring you exceptional quality fabrics."
    },
    {
      icon: Palette,
      title: "Curated Selection",
      description: "Our design team carefully selects each fabric for its quality, beauty, and versatility."
    },
    {
      icon: Award,
      title: "Premium Quality",
      description: "Every fabric meets our rigorous standards for durability, colorfastness, and performance."
    },
    {
      icon: Users,
      title: "Trade Program",
      description: "Special pricing and services for interior designers, architects, and trade professionals."
    }
  ]

  return (
    <section id="about" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Luxury Fabrics</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            For over two decades, we've been the trusted source for premium fabrics among 
            interior designers and luxury home enthusiasts worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h3>
              <p className="text-gray-600 mb-4">
                Founded in 2001, Luxury Fabrics began as a small showroom in the heart of the design district. 
                Our passion for exceptional textiles and commitment to service has made us the preferred 
                partner for leading interior designers and architects.
              </p>
              <p className="text-gray-600">
                Today, we represent over 50 mills worldwide and maintain one of the largest fabric libraries 
                in the industry. Our team of textile experts is dedicated to helping you find the perfect 
                fabric for every project.
              </p>
            </div>
            <div className="relative h-64 lg:h-80">
              <img
                src="/fabric-warehouse.png"
                alt="Fabric warehouse"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
