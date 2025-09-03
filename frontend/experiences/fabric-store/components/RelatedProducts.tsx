import ProductCard from './ProductCard'
import { transformMedusaToFabric } from '../lib/medusa-api'

export default function RelatedProducts({ products }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product: any) => (
        <ProductCard key={product.id} product={transformMedusaToFabric(product) as any} />
      ))}
    </div>
  )
}