import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  console.log(`[MW] Invoked for: ${request.nextUrl.pathname}`);
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
          console.log(`[MW Cookie Get] ${name}: ${value ? '******' : 'Not Found'}`); // Log found status
          return value;
        },
        set(name: string, value: string, options: CookieOptions) {
          console.log(`[MW Cookie Set] Setting ${name}...`);
          // Purposefully update request (SSR client reads this) AND response (browser needs this)
           try {
             request.cookies.set({ name, value, ...options }); // Update request copy for client init
             response = NextResponse.next({ // Recreate response to reflect potential header changes? (Might not be needed)
               request: { headers: request.headers },
             });
             response.cookies.set({ name, value, ...options }); // Set cookie on the response
           } catch (error) {
              console.error(`[MW Cookie Set] Error setting cookie ${name}:`, error);
              // If set from server component, error is expected, ignore
           }
        },
        remove(name: string, options: CookieOptions) {
          console.log(`[MW Cookie Remove] Removing ${name}...`);
           try {
               request.cookies.set({ name, value: '', ...options });
               response = NextResponse.next({
                 request: { headers: request.headers },
               });
               response.cookies.set({ name, value: '', ...options });
           } catch(error) {
               console.error(`[MW Cookie Remove] Error removing cookie ${name}:`, error);
           }
        },
      },
    }
  )

  // Refresh session if expired - crucial!
  console.log('[MW] Calling supabase.auth.getUser()...');
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
      console.error('[MW] getUser Error:', error.name, error.message);
  } else {
      console.log('[MW] getUser Result:', user ? `User ID: ${user.id}` : 'No user session from middleware');
  }

  console.log('[MW] Returning response.');
  return response
} 