"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/leaderboard` },
    });
    setLoading(false);
    if (error) setErr(error.message);
    else setSent(true);
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
    <form className="card" onSubmit={submit}>
      <input
        type="email"
        required
        autoFocus
        placeholder="you@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button className="cta" type="submit" disabled={loading || !email}>
        {loading ? "Sending…" : "Email me a magic link"}
      </button>
      {err && <div className="err">{err}</div>}
      <div className="muted">Use the email you signed up to the campaign with.</div>
    </form>
  );
}
