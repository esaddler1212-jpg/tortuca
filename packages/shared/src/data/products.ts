import type { Product } from '../types'

/** Bundled sample catalog used when Shopify is not configured. */
export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'sample-1',
    handle: 'essential-hoodie-bone',
    title: 'Essential Hoodie — Bone',
    description:
      'Heavyweight 480gsm fleece hoodie in a washed bone colorway. Boxy fit, dropped shoulders.',
    price: 120,
    currency: 'USD',
    image:
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=60',
    available: true,
  },
  {
    id: 'sample-2',
    handle: 'box-tee-triple-black',
    title: 'Box Tee — Triple Black',
    description: 'Mid-weight boxy tee with a minimal chest hit. 100% combed cotton.',
    price: 55,
    currency: 'USD',
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=60',
    available: true,
  },
  {
    id: 'sample-3',
    handle: 'utility-cargo-sand',
    title: 'Utility Cargo — Sand',
    description: 'Relaxed cargo pant with tonal hardware and a tapered ankle.',
    price: 145,
    currency: 'USD',
    image:
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=60',
    available: true,
  },
  {
    id: 'sample-4',
    handle: 'knit-beanie-ash',
    title: 'Ribbed Knit Beanie — Ash',
    description: 'Fine-gauge ribbed beanie in a muted ash grey.',
    price: 40,
    currency: 'USD',
    image:
      'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=800&q=60',
    available: true,
  },
  {
    id: 'sample-5',
    handle: 'canvas-tote-natural',
    title: 'Heavy Canvas Tote — Natural',
    description: '16oz natural canvas tote with a screen-printed division mark.',
    price: 35,
    currency: 'USD',
    image:
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=60',
    available: false,
  },
  {
    id: 'sample-6',
    handle: 'crewneck-fog',
    title: 'Crewneck — Fog',
    description: 'Loopback cotton crewneck in a soft fog grey. Ribbed cuffs and hem.',
    price: 95,
    currency: 'USD',
    image:
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=60',
    available: true,
  },
]

export function findSampleProduct(handle: string): Product | undefined {
  return SAMPLE_PRODUCTS.find((p) => p.handle === handle)
}
