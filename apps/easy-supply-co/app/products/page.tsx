import { ProductCard, isShopifyConfigured } from '@ecs/shared'
import { getProducts } from '@/lib/catalog'

export const metadata = {
  title: 'Shop — Easy Supply Co',
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <h1 className="text-2xl font-semibold uppercase tracking-wide">Shop</h1>
        {!isShopifyConfigured() && (
          <span className="text-xs uppercase tracking-widest text-neutral-400">
            Sample catalog
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            href={`/products/${product.handle}`}
          />
        ))}
      </div>
    </div>
  )
}
