import {
  fetchShopifyProducts,
  findSampleProduct,
  SAMPLE_PRODUCTS,
  type Product,
} from '@ecs/shared'

/** Returns the product catalog from Shopify, falling back to sample data. */
export async function getProducts(): Promise<Product[]> {
  const shopify = await fetchShopifyProducts(12)
  return shopify ?? SAMPLE_PRODUCTS
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  const products = await getProducts()
  return products.find((p) => p.handle === handle) ?? findSampleProduct(handle)
}
