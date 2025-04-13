import { createServerClient } from '@supabase/ssr'
import { type NextRequest } from 'next/server' // Removed NextResponse

// Function specifically for Route Handlers
export function createRouteHandlerClient() {
  // Note: Cookies need to be accessed differently in Route Handlers vs Server Components
  // This helper might need to be called *within* the route handler itself
  // where the `request: NextRequest` object is available.
  
  // Let's define a function that ACCEPTS the request object
  const createClientForRoute = (request: NextRequest) => {
      return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            // Route Handlers should typically read session, not set/remove
            // Setting/removing cookies should happen in the response if needed
            // So, provide stubs or omit set/remove if only reading
            set() {
              console.warn('Attempted to set cookie in Route Handler client (read-only)');
            },
            remove() {
              console.warn('Attempted to remove cookie in Route Handler client (read-only)');
            },
          },
        }
      )
  }
  
  // Return the function that creates the client when needed
  return createClientForRoute;
}

// Alternatively, a simpler version if middleware handles all cookie setting:
/*
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers' // Can use this if middleware guarantees cookies are set

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // Setting/removing in Route Handler client is less common with middleware
        set(name: string, value: string, options: CookieOptions) {},
        remove(name: string, options: CookieOptions) {},
      },
    }
  )
}
*/ 