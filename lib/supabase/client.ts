// Supabase browser client — used by the login form to start the magic-link flow
// (signInWithOtp). PKCE verifier is stored in a cookie so the server callback
// (app/auth/callback) can exchange the code for a session.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
