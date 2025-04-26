import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  // Create a server supabase client with cookies read from the store
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // Server Components should only read cookies typically
        set() {
          // console.warn('[Supabase Server Helper] Attempted to set cookie.');
        },
        remove() {
          // console.warn('[Supabase Server Helper] Attempted to remove cookie.');
        },
      },
    }
  )
} 