import type { Product } from '../types'

interface ShopifyImage {
  url: string
}

interface ShopifyMoney {
  amount: string
  currencyCode: string
}

interface ShopifyProductNode {
  id: string
  handle: string
  title: string
  description: string
  availableForSale: boolean
  featuredImage: ShopifyImage | null
  priceRange: { minVariantPrice: ShopifyMoney }
}

const PRODUCTS_QUERY = `
  query Products($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
          availableForSale
          featuredImage { url }
          priceRange { minVariantPrice { amount currencyCode } }
        }
      }
    }
  }
`

export function isShopifyConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN &&
      process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN,
  )
}

/**
 * Fetches products from the Shopify Storefront API. Returns `null` when the
 * store is not configured (or the request fails) so callers can fall back to
 * bundled sample products.
 */
export async function fetchShopifyProducts(
  first = 12,
): Promise<Product[] | null> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN
  const apiVersion = process.env.SHOPIFY_STOREFRONT_API_VERSION || '2024-07'

  if (!domain || !token) return null

  try {
    // `next` is a Next.js-specific extension to the fetch RequestInit.
    const init: RequestInit & { next?: { revalidate?: number } } = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({
        query: PRODUCTS_QUERY,
        variables: { first },
      }),
      // Cache Storefront responses for a minute in the Next data cache.
      next: { revalidate: 60 },
    }

    const res = await fetch(
      `https://${domain}/api/${apiVersion}/graphql.json`,
      init,
    )

    if (!res.ok) return null

    const json = (await res.json()) as {
      data?: { products?: { edges: { node: ShopifyProductNode }[] } }
    }

    const edges = json.data?.products?.edges
    if (!edges) return null

    return edges.map(({ node }) => ({
      id: node.id,
      handle: node.handle,
      title: node.title,
      description: node.description,
      price: Number(node.priceRange.minVariantPrice.amount),
      currency: node.priceRange.minVariantPrice.currencyCode,
      image: node.featuredImage?.url ?? '',
      available: node.availableForSale,
    }))
  } catch {
    return null
  }
}
