import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  console.log('[updateSession] Middleware helper invoked for:', request.nextUrl.pathname);
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = request.cookies.get(name)?.value;
          // console.log(`[updateSession] Cookie GET: ${name}`, value ? 'Found' : 'Not Found');
          return value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // console.log(`[updateSession] Cookie SET: ${name}`);
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // console.log(`[updateSession] Cookie REMOVE: ${name}`);
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - crucial!
  console.log('[updateSession] Calling supabase.auth.getUser() to refresh session...');
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
      console.error('[updateSession] Error calling getUser:', error);
  } else {
      console.log('[updateSession] getUser result:', user ? `User ID: ${user.id}` : 'No user session');
  }

  console.log('[updateSession] Returning response.');
  return response
} 