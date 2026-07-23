// Server-only exports. Do not import from client components.
export { getAdminSupabase, isAdminConfigured } from './supabase/admin'
export type {
  Product,
  BlogPost,
  ContactSubmission,
} from './types'
