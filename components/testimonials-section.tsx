import { Star, Quote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const testimonials = [
  {
    id: 1,
    name: "Sarah Thompson",
    location: "St. Louis, MO",
    rating: 5,
    text: "The quality exceeded my expectations! My custom outdoor cushions have survived two summers and still look brand new. The fabric selection process was so easy with their expert guidance.",
    product: "Outdoor Patio Cushions"
  },
  {
    id: 2,
    name: "Michael & Jennifer Davis",
    location: "Kansas City, MO",
    rating: 5,
    text: "We ordered the Jack-Mat hearth cushion when our twins started walking. It's given us such peace of mind! Plus, it looks beautiful and matches our living room perfectly.",
    product: "Jack-Mat Hearth Cushion"
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    location: "Columbia, MO",
    rating: 5,
    text: "Working with The Hearth & Home Store was a dream. They helped me choose the perfect fabric for my window seat cushions. The turnaround was quick and the fit is absolutely perfect!",
    product: "Window Seat Cushions"
  },
  {
    id: 4,
    name: "Robert Anderson",
    location: "Springfield, MO",
    rating: 5,
    text: "I've ordered monogrammed pillows as gifts three times now. Each one has been beautifully crafted and the recipients always love them. Great for weddings and housewarmings!",
    product: "Monogrammed Pillows"
  },
  {
    id: 5,
    name: "Lisa Chen",
    location: "Jefferson City, MO",
    rating: 5,
    text: "The attention to detail is incredible. They matched my exact specifications for some oddly-shaped bench cushions. You can tell everything is handmade with care.",
    product: "Custom Bench Cushions"
  },
  {
    id: 6,
    name: "David & Maria Foster",
    location: "Chesterfield, MO",
    rating: 5,
    text: "We refreshed our entire sunroom with new cushions from The Hearth & Home Store. The transformation is amazing! Love supporting a local family business with such outstanding service.",
    product: "Sunroom Cushion Set"
  }
]

export function TestimonialsSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of satisfied customers who've transformed their homes with our custom cushions and pillows.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-lg font-semibold">4.9 out of 5</span>
            <span className="text-gray-600">based on 2,500+ reviews</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <Quote className="w-8 h-8 text-amber-400 mb-4" />
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "{testimonial.text}"
                </p>
                <div className="border-t pt-4">
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.location}</p>
                  <p className="text-sm text-amber-600 mt-1">{testimonial.product}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 bg-gray-50 rounded-2xl p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900">40+</div>
              <div className="text-sm text-gray-600 mt-1">Years in Business</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">2,500+</div>
              <div className="text-sm text-gray-600 mt-1">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">100%</div>
              <div className="text-sm text-gray-600 mt-1">Made in USA</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">2-3</div>
              <div className="text-sm text-gray-600 mt-1">Week Turnaround</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}