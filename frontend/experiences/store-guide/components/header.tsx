import Link from 'next/link'

export function Header() {
  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              The Hearth & Home Store
            </Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link href="/fabrics" className="text-gray-700 hover:text-gray-900">
              Fabrics
            </Link>
            <Link href="/products" className="text-gray-700 hover:text-gray-900">
              Products
            </Link>
            <Link href="/blog" className="text-gray-700 hover:text-gray-900">
              Blog
            </Link>
            <Link href="/posts" className="text-gray-700 hover:text-gray-900">
              Posts
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}