export interface Product {
  id: string
  handle: string
  title: string
  description: string
  price: number
  currency: string
  image: string
  available: boolean
}

export interface CartLine {
  product: Product
  quantity: number
}

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  coverImage?: string
  author: string
  publishedAt: string
  tags?: string[]
}

export interface Division {
  slug: string
  name: string
  tagline: string
  description: string
  accent: string
}

export interface ContactSubmission {
  name: string
  email: string
  company?: string
  message: string
}

export interface NavLink {
  label: string
  href: string
  external?: boolean
}
