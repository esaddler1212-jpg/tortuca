import { ProductCard } from '@ecs/shared'
import { getProducts } from '@/lib/catalog'

export default async function HomePage() {
  const products = await getProducts()
  const featured = products.slice(0, 3)

  return (
    <div className="space-y-20">
      <section className="pt-6">
        <p className="text-xs uppercase tracking-widest text-neutral-400">
          Easy Supply Co
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Elevated everyday basics. Nothing you don&apos;t need.
        </h1>
        <p className="mt-6 max-w-xl text-neutral-500">
          Heavyweight staples in muted tones, made to order. Part of the ECS
          Network.
        </p>
        <div className="mt-8 flex gap-4">
          <a
            href="/products"
            className="bg-black px-6 py-3 text-xs uppercase tracking-widest text-white hover:opacity-80"
          >
            Shop all
          </a>
          <a
            href="/about"
            className="border border-neutral-300 px-6 py-3 text-xs uppercase tracking-widest hover:bg-neutral-50"
          >
            About
          </a>
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-lg font-medium uppercase tracking-wide">
            Featured
          </h2>
          <a
            href="/products"
            className="text-xs uppercase tracking-widest text-neutral-500 hover:text-black"
          >
            View all
          </a>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3">
          {featured.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              href={`/products/${product.handle}`}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
