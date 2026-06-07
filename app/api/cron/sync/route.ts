// Daily snapshot cron. Vercel Cron calls this once a day (see vercel.json).
//
// Auth: Vercel sends `Authorization: Bearer $CRON_SECRET`. We require it so the
// route can't be triggered by the public. Manual runs: pass the same header.
//
// Node runtime (postgres.js needs it), never cached, generous timeout for a
// multi-program sync.

import { NextResponse } from "next/server";
import { runSync } from "@/lib/ingest/sync";
import { sideshiftAdapter } from "@/lib/ingest/sideshift";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed if not configured
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await runSync(sideshiftAdapter);
    const code = result.status === "ok" ? 200 : 500;
    return NextResponse.json(result, { status: code });
  } catch (err) {
    // runSync already logs to sync_runs + Slack for handled failures; this is the
    // last-resort guard for an unexpected throw.
    return NextResponse.json(
      { status: "error", error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
