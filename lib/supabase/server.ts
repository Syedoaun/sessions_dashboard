import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Auth-aware Supabase client for Server Components and Route Handlers.
// Reads/writes the session cookie. Used only for identity (who is logged in) —
// data access still goes through the service-role client in `admin.ts`.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Called from a Server Component where cookies are read-only.
            // The proxy refreshes the session cookie, so this is safe to ignore.
          }
        },
      },
    },
  )
}
