// Per-creator access resolution for the gated leaderboard (Phase 3).
// Session email → creator → the campaigns they're on. Like lib/queries/leaderboard.ts,
// this is the ONLY place these access facts are defined.

import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";

export interface CreatorIdentity {
  id: string;
  externalId: string;
  name: string;
  email: string | null;
}

export interface CreatorProgram {
  id: string;
  externalId: string;
  name: string;
  companyName: string | null;
}

/** Resolve a logged-in email to a creator — matches the primary OR the alt email
 *  (case-insensitive, input trimmed). Active only. Alt emails are login-eligible
 *  (DECISIONS topic: leaderboard-access). null → "unknown email" (directed screen). */
export async function getCreatorByEmail(email: string): Promise<CreatorIdentity | null> {
  const e = email.trim().toLowerCase();
  const rows = await db.execute<{ id: string; external_id: string; name: string; email: string | null }>(sql`
    select id, external_id, name, email
    from creators
    where status = 'active'
      and (lower(trim(email)) = ${e} or lower(trim(alt_email)) = ${e})
    order by updated_at desc
    limit 1
  `);
  const r = rows[0];
  return r ? { id: r.id, externalId: r.external_id, name: r.name, email: r.email } : null;
}

/** Staff bypass: Google-authed agency staff see the FULL dashboard (all campaigns,
 *  unscoped), not a creator's scoped view, and are not ranked. Allow-list via
 *  STAFF_EMAILS (comma-separated emails) OR STAFF_EMAIL_DOMAINS (comma-separated
 *  domains; defaults to the agency domains). Pure env check — no DB.
 *  (DECISIONS topic: leaderboard-access.) */
export function isStaffEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  const at = e.lastIndexOf("@");
  if (at < 0) return false;
  const list = (v: string | undefined, fallback = "") =>
    (v ?? fallback).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (list(process.env.STAFF_EMAILS).includes(e)) return true;
  return list(process.env.STAFF_EMAIL_DOMAINS, "mohios.com,vocreations.com").includes(e.slice(at + 1));
}

/** The campaigns this creator is on (program_creators). Powers the switcher and
 *  is the authorization list for per-campaign boards. Only programs with snapshot
 *  data appear, so a creator never lands on an empty campaign board. */
export async function getCreatorPrograms(creatorId: string): Promise<CreatorProgram[]> {
  const rows = await db.execute<{ id: string; external_id: string; name: string; company_name: string | null }>(sql`
    select distinct p.id, p.external_id, p.name, p.company_name
    from program_creators pc
    join programs p on p.id = pc.program_id
    where pc.creator_id = ${creatorId}
      and exists (select 1 from snapshots s where s.program_id = p.id)
    order by p.name asc
  `);
  return rows.map((r) => ({ id: r.id, externalId: r.external_id, name: r.name, companyName: r.company_name }));
}

/** creatorId → a representative {platform, handle} for board rows. Scoped to a
 *  program for a campaign board; any handle for the overall board. */
export async function getCreatorHandles(
  programId: string | null
): Promise<Map<string, { platform: string; handle: string }>> {
  const rows = await db.execute<{ creator_id: string; platform: string; handle: string }>(sql`
    select distinct on (creator_id) creator_id, platform, handle
    from campaign_accounts
    where ${programId ? sql`program_id = ${programId}` : sql`true`}
    order by creator_id, first_seen_at desc
  `);
  const map = new Map<string, { platform: string; handle: string }>();
  for (const r of rows) map.set(r.creator_id, { platform: r.platform, handle: r.handle });
  return map;
}
