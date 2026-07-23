import type { BlogPost } from '../types'

/** Bundled sample posts used when the Supabase CMS is not configured. */
export const SAMPLE_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    slug: 'introducing-ecs-network',
    title: 'Introducing ECS Network',
    excerpt:
      'One studio, four divisions. A look at how 2EASY, Easy2See, Easy Supply and North Star fit together.',
    content:
      'ECS Network is a creative holding company operating across apparel, media, retail and ventures. This is our starting line.',
    author: 'ECS Editorial',
    publishedAt: '2026-06-01T12:00:00.000Z',
    tags: ['company', 'launch'],
    coverImage:
      'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1200&q=60',
  },
  {
    id: 'post-2',
    slug: 'easy-supply-co-fw26',
    title: 'Easy Supply Co — FW26 Preview',
    excerpt:
      'Heavyweight basics, muted palettes, and a tighter edit. A first look at the fall/winter drop.',
    content:
      'The FW26 range leans into tonal layering and elevated staples built for everyday rotation.',
    author: 'Design Team',
    publishedAt: '2026-06-18T12:00:00.000Z',
    tags: ['easy-supply', 'drops'],
    coverImage:
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=60',
  },
  {
    id: 'post-3',
    slug: 'north-star-ventures',
    title: 'North Star: Betting on Builders',
    excerpt:
      'How our ventures arm partners with early founders across culture and commerce.',
    content:
      'North Star backs founders at the intersection of culture and technology with capital and creative support.',
    author: 'North Star',
    publishedAt: '2026-07-02T12:00:00.000Z',
    tags: ['north-star', 'ventures'],
    coverImage:
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=60',
  },
]
