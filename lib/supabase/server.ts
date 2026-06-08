// Supabase server client — used ONLY for auth (magic-link sessions): getUser(),
// exchangeCodeForSession(), signOut(). All leaderboard DATA comes from Drizzle
// (lib/db) keyed off the resolved creator, so there is no RLS to manage here.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // In a Server Component cookies are read-only; the middleware refresh
          // (lib/supabase/middleware.ts) is what actually persists rotated tokens.
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            /* called from an RSC — safe to ignore */
          }
        },
      },
    }
  );
}
