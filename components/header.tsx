"use client"

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, X } from 'lucide-react'
import { mainNavigation } from '@/lib/navigation' // Import mainNavigation
import { config } from '@/lib/config'

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 lg:h-24">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="The Hearth & Home Store"
                width={60}
                height={60}
                className="lg:w-20 lg:h-20"
                priority
              />
              <span className="ml-3 text-xl lg:text-2xl font-bold text-gray-900 hidden sm:block">
                The Hearth & Home Store
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {mainNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href={config.etsyFabricListingUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                Start Your Custom Order
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Menu</h2>
                  </div>
                  <nav className="flex flex-col space-y-4">
                    {mainNavigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="text-gray-700 hover:text-gray-900 px-3 py-2 text-base font-medium transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                  <div className="flex flex-col space-y-2 pt-4 border-t">
                    <Link href={config.etsyFabricListingUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button variant="outline" className="w-full">
                        Start Your Custom Order
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
