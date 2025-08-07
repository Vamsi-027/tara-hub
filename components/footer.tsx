import Link from 'next/link'
import { Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">The Hearth and Home Store</h3>
            <p className="text-gray-300 text-sm">
              Your one-stop shop for fireplaces, stoves, inserts, and outdoor living products.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/thehearthandhomestore/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
              </a>
              <a href="https://www.instagram.com/thehearthandhomestore/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="text-gray-300 hover:text-white">Products</Link></li>
              <li><Link href="#about" className="text-gray-300 hover:text-white">About Us</Link></li>
              <li><Link href="#contact" className="text-gray-300 hover:text-white">Contact</Link></li>
              <li><Link href="/services" className="text-gray-300 hover:text-white">Our Services</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Services</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-300">Fireplace & Stove Sales</li>
              <li className="text-gray-300">Expert Installation</li>
              <li className="text-gray-300">Maintenance & Repair</li>
              <li className="text-gray-300">Chimney Services</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contact</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href="tel:7319684328" className="text-gray-300 hover:text-white">(731) 968-4328</a>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href="mailto:info@thehearthandhomestore.com" className="text-gray-300 hover:text-white">info@thehearthandhomestore.com</a>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                <span className="text-gray-300">554 W. Church St., Lexington, TN 38351</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 The Hearth and Home Store. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
