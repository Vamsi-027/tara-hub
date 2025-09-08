export function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">About Us</h3>
            <p className="text-gray-300 text-sm">
              Your trusted source for premium fabrics and home furnishings.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/fabrics" className="text-gray-300 hover:text-white">Fabric Collection</a></li>
              <li><a href="/products" className="text-gray-300 hover:text-white">Products</a></li>
              <li><a href="/blog" className="text-gray-300 hover:text-white">Blog</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <p className="text-gray-300 text-sm">
              Email: info@hearthandhome.com<br />
              Phone: (555) 123-4567
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
          © 2024 The Hearth & Home Store. All rights reserved.
        </div>
      </div>
    </footer>
  )
}