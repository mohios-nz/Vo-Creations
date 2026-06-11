// Daily campaign accountability digest cron. Vercel Cron calls this once a day,
// AFTER the 09:00 UTC snapshot sync (see vercel.json), so it reads fresh data.
//
// Auth: Vercel sends `Authorization: Bearer $CRON_SECRET` (same secret as /api/cron/sync).
// strict=true enforces the stop conditions: if today's sync failed or is missing, it
// posts "SYNC STALE" and renders no numbers (never carries a stale figure).
//
// Posts to #campaigns via SLACK_CAMPAIGNS_WEBHOOK_URL (channel-bound incoming webhook).

import { NextResponse } from "next/server";
import { runCampaignDigest } from "@/lib/digest/campaign-digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

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
    const { stale, posted, report } = await runCampaignDigest({ strict: true, post: true });
    return NextResponse.json({
      status: "ok",
      stale,
      posted,
      asOf: report.asOf,
      companies: report.companies.length,
    });
  } catch (err) {
    return NextResponse.json(
      { status: "error", error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
