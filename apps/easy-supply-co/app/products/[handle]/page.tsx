import { notFound } from 'next/navigation'
import { formatPrice } from '@ecs/shared'
import { getProduct } from '@/lib/catalog'
import { AddToCartButton } from '@/components/AddToCartButton'

export default async function ProductPage({
  params,
}: {
  params: { handle: string }
}) {
  const product = await getProduct(params.handle)
  if (!product) notFound()

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="aspect-[4/5] w-full overflow-hidden bg-neutral-100">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>

      <div className="md:pt-6">
        <a
          href="/products"
          className="text-xs uppercase tracking-widest text-neutral-400 hover:text-black"
        >
          ← Back to shop
        </a>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          {product.title}
        </h1>
        <p className="mt-2 text-lg text-neutral-600">
          {formatPrice(product.price, product.currency)}
        </p>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-neutral-500">
          {product.description}
        </p>
        <div className="mt-8 max-w-xs">
          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  )
}
