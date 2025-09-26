import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fabric Sample Bundles | Curated Collections',
  description: 'Shop our pre-selected fabric sample bundles. Perfect for designers and DIY enthusiasts.',
};

// Temporary mock data for bundles - replace with Medusa API call
const mockBundles = [
  {
    id: 'bundle-1',
    handle: 'designers-choice-5-bundle',
    title: "Designer's Choice - 5 Swatch Bundle",
    description: 'This bundle includes one 4x6 inch sample of each: Emerald Green Velvet, Natural Linen, Charcoal Grey Wool, Navy Blue Performance Weave, Classic White Cotton Twill',
    price: 10.99,
    swatchCount: 5,
    badge: 'Best Seller',
  },
  {
    id: 'bundle-2',
    handle: 'color-explorer-10-bundle',
    title: 'Color Explorer - 10 Swatch Bundle',
    description: 'A vibrant collection of 10 fabric samples featuring Ruby Red Silk, Sapphire Blue Satin, Golden Yellow Canvas, Forest Green Tweed, and more colorful textures.',
    price: 18.99,
    swatchCount: 10,
    badge: 'Most Popular',
  },
  {
    id: 'bundle-3',
    handle: 'texture-collection-15-bundle',
    title: 'Texture Collection - 15 Swatch Bundle',
    description: 'Experience 15 different fabric textures from smooth silks to rough tweeds. Perfect for understanding fabric feel and drape.',
    price: 24.99,
    swatchCount: 15,
    badge: 'Free Shipping',
  },
  {
    id: 'bundle-4',
    handle: 'professional-pack-20-bundle',
    title: 'Professional Pack - 20 Swatch Bundle',
    description: 'Our most comprehensive bundle with 20 carefully selected fabric samples covering all major categories and uses.',
    price: 29.99,
    swatchCount: 20,
    badge: 'Best Value',
  },
];

export default function BundlesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Curated Sample Bundles</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore our carefully selected fabric sample collections.
          Each bundle is thoughtfully curated to showcase our best fabrics
          at unbeatable prices.
        </p>
      </div>

      {/* Value Props */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="text-center">
          <div className="text-3xl mb-2">📦</div>
          <h3 className="font-semibold mb-1">Pre-Selected</h3>
          <p className="text-sm text-gray-600">
            Expertly curated fabric combinations
          </p>
        </div>
        <div className="text-center">
          <div className="text-3xl mb-2">💰</div>
          <h3 className="font-semibold mb-1">Great Value</h3>
          <p className="text-sm text-gray-600">
            Save up to 50% vs individual samples
          </p>
        </div>
        <div className="text-center">
          <div className="text-3xl mb-2">🚚</div>
          <h3 className="font-semibold mb-1">Fast Shipping</h3>
          <p className="text-sm text-gray-600">
            Ships within 24 hours
          </p>
        </div>
      </div>

      {/* Bundle Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockBundles.map((bundle) => (
          <div key={bundle.id} className="group">
            <a href={`/products/${bundle.handle}`}>
              <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                {/* Bundle Image */}
                <div className="aspect-square bg-gray-100 relative">
                  <div className="flex items-center justify-center h-full">
                    <span className="text-6xl">📦</span>
                  </div>

                  {/* Bundle Size Badge */}
                  <div className="absolute top-2 right-2 bg-black text-white
                                  rounded-full w-12 h-12 flex items-center
                                  justify-center font-bold">
                    {bundle.swatchCount}
                  </div>

                  {/* Special Badge */}
                  {bundle.badge && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white
                                    text-xs px-2 py-1 rounded-full">
                      {bundle.badge}
                    </div>
                  )}
                </div>

                {/* Bundle Details */}
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{bundle.title}</h3>

                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      ${bundle.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500">
                      (${(bundle.price / bundle.swatchCount).toFixed(2)} per sample)
                    </span>
                  </div>

                  {/* Quick Description */}
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {bundle.description}
                  </p>

                  {/* CTA Button */}
                  <button className="w-full mt-4 bg-black text-white py-2 px-4
                                     rounded hover:bg-gray-800 transition-colors">
                    View Bundle
                  </button>
                </div>
              </div>
            </a>
          </div>
        ))}
      </div>

      {/* Additional Info Section */}
      <div className="mt-16 bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4 text-center">Why Choose Our Bundles?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold mb-2">Perfect for Designers</h3>
            <p className="text-gray-600">
              Our bundles are carefully curated to include complementary colors
              and textures that work well together in design projects.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Try Before You Buy</h3>
            <p className="text-gray-600">
              Sample our premium fabrics before committing to larger orders.
              Each sample is a generous 4x6 inches, perfect for evaluation.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Educational Resource</h3>
            <p className="text-gray-600">
              Ideal for fashion students and DIY enthusiasts learning about
              different fabric types, weights, and characteristics.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Gift Ready</h3>
            <p className="text-gray-600">
              Our bundles make perfect gifts for crafters, quilters, and
              anyone who loves working with beautiful fabrics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}