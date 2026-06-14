// Auth landing for both email magic links and OAuth.
//
// One-click first login: EMAIL links arrive as `?token_hash=&type=` and are verified
// with verifyOtp — this needs NO PKCE code_verifier cookie, so it works on the very
// first click in any browser (and survives email-scanner prefetch better). OAUTH
// (Google) arrives as `?code=` and uses exchangeCodeForSession. We handle both.
//
// Requires the Supabase email template's Confirmation URL to point here with the
// token hash, e.g.:
//   {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink&next=/leaderboard
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only allow same-origin LOCAL paths as the post-login destination. Reject
// protocol-relative ("//evil"), backslash ("/\\evil"), and absolute URLs
// ("https://…", "@evil") — otherwise `${origin}${next}` is an open redirect.
function safeNext(raw: string | null): string {
  const n = raw ?? "/leaderboard";
  return n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : "/leaderboard";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = createClient();

  // Email magic link (one-click, no code_verifier needed).
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // OAuth (Google) + any PKCE code links.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/leaderboard/login?error=link`);
}
