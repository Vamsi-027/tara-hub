import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Image
                src="/logo.png"
                alt="The Hearth & Home Store"
                width={40}
                height={40}
                className="rounded-full bg-white p-1"
              />
              <h3 className="text-xl font-bold">The Hearth & Home Store</h3>
            </div>
            <p className="text-gray-300 text-sm">
              Custom cushions and pillows handcrafted in the USA. 100% customizable with over 100 fabric choices.
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
              <li><Link href="/fabrics" className="text-gray-300 hover:text-white">Fabric Collection</Link></li>
              <li><Link href="#about" className="text-gray-300 hover:text-white">About Us</Link></li>
              <li><Link href="#contact" className="text-gray-300 hover:text-white">Contact</Link></li>
              <li><Link href="/#process" className="text-gray-300 hover:text-white">How It Works</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Our Products</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-300">Custom Cushions</li>
              <li className="text-gray-300">Custom Pillows</li>
              <li className="text-gray-300">Jack-Mat Hearth Safety</li>
              <li className="text-gray-300">Monogrammed Pillows</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contact</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href="tel:6363375200" className="text-gray-300 hover:text-white">(636) 337-5200</a>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href="mailto:info@thehearthandhomestore.com" className="text-gray-300 hover:text-white">info@thehearthandhomestore.com</a>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                <span className="text-gray-300">116 Easton St., DeSoto, MO 63020</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 The Hearth & Home Store. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
