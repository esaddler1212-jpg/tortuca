import type { Product } from '../types'
import { formatPrice } from '../utils/format'

interface ProductCardProps {
  product: Product
  href?: string
  /** Optional action slot (e.g. an "Add to cart" button). */
  action?: React.ReactNode
}

export function ProductCard({ product, href, action }: ProductCardProps) {
  const inner = (
    <>
      <div className="aspect-[4/5] w-full overflow-hidden bg-neutral-100">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-widest text-neutral-400">
            No image
          </div>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">{product.title}</h3>
          <p className="mt-0.5 text-sm text-neutral-500">
            {formatPrice(product.price, product.currency)}
          </p>
        </div>
        {!product.available && (
          <span className="text-[10px] uppercase tracking-widest text-neutral-400">
            Sold out
          </span>
        )}
      </div>
    </>
  )

  return (
    <div className="group">
      {href ? (
        <a href={href} className="block">
          {inner}
        </a>
      ) : (
        inner
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
