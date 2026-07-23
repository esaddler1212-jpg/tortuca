// Types
export type {
  Product,
  CartLine,
  BlogPost,
  Division,
  ContactSubmission,
  NavLink,
} from './types'

// Utils
export { formatPrice, formatDate } from './utils/format'

// Supabase (browser-safe)
export { getBrowserSupabase, isSupabaseConfigured } from './supabase/browser'

// Auth (client)
export { AuthProvider, useAuth } from './auth/AuthProvider'

// Shopify (storefront)
export { fetchShopifyProducts, isShopifyConfigured } from './shopify/storefront'

// Sample data
export { SAMPLE_PRODUCTS, findSampleProduct } from './data/products'
export { SAMPLE_POSTS } from './data/posts'
export { DIVISIONS } from './data/divisions'

// Components
export { SiteHeader, SiteFooter, ProductCard, BlogCard } from './components'
