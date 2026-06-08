"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const redirectTo = () => `${window.location.origin}/auth/callback?next=/leaderboard`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo() },
    });
    setLoading(false);
    if (error) setErr(error.message);
    else setSent(true);
  }

  async function google() {
    setErr("");
    const supabase = createClient();
    // Staff (agency) path. Same Google client will back the Phase 4 CRM.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) setErr(error.message); // on success the browser is already redirecting
  }

  if (sent) {
    return (
      <div className="card">
        <p>
          Check your inbox. We sent a magic link to <strong>{email}</strong> — click it to see
          the leaderboard. (Check spam if it&apos;s not there in a minute.)
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <button className="cta google" type="button" onClick={google}>
        <i className="ti ti-brand-google" /> Sign in with Google
      </button>
      <div className="divider"><span>or</span></div>
      <form onSubmit={submit}>
        <input
          type="email"
          required
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="cta" type="submit" disabled={loading || !email}>
          {loading ? "Sending…" : "Email me a magic link"}
        </button>
      </form>
      {err && <div className="err">{err}</div>}
      <div className="muted">Creators: use the email you signed up to the campaign with. Staff: use Google.</div>
    </div>
  );
}
