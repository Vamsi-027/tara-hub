import { Pencil, Palette, Package, Heart } from 'lucide-react'

export function CustomProcessSection() {
  const steps = [
    {
      icon: Pencil,
      title: "Design Your Vision",
      description: "Share your measurements, style preferences, and any special requirements. No shape is too unique!"
    },
    {
      icon: Palette,
      title: "Select Your Fabric",
      description: "Choose from over 100 premium fabrics - indoor, outdoor, patterns, solids, and textures galore."
    },
    {
      icon: Package,
      title: "Handcrafted with Care",
      description: "Our skilled artisans in Missouri create your custom piece with meticulous attention to detail."
    },
    {
      icon: Heart,
      title: "Delivered to Your Door",
      description: "Your unique cushion or pillow arrives ready to transform your space with comfort and style."
    }
  ]

  return (
    <section className="py-16 bg-amber-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How We Create Your Perfect Cushion
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From concept to creation, we make custom cushions simple and enjoyable. 
            Every step is personalized just for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 text-white rounded-full mb-4">
                  <step.icon className="w-8 h-8" />
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-amber-300 -translate-x-1/2" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center justify-center p-6 bg-white rounded-lg shadow-lg">
            <div className="text-left">
              <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Special Feature</p>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Jack-Mat Hearth Safety Cushion</h3>
              <p className="text-gray-600 max-w-md">
                Featured on NBC TODAY Show! Our innovative fireproof cushion protects babies and toddlers 
                from hearth injuries while maintaining your home's aesthetic.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}