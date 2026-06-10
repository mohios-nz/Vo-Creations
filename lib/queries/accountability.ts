// Campaign accountability — the ONE definition of "is this creator posting?".
// The daily Slack digest (lib/digest/campaign-digest.ts) reads here and nowhere
// else; no snapshot math lives in the renderer or the cron route.
//
// HONEST METRIC (docs/DECISIONS topic: campaign-accountability):
//   Sideshift is lifetime-only with NO per-platform split per creator, so the only
//   defensible daily signal is posts-per-creator = latest.lifetimePosts −
//   previous.lifetimePosts between a creator's two most recent snapshots in a program.
//   A "1x/day on 4 platforms" goal is NOT reconstructable from this data; it is
//   expressed as a flat target of N posts/creator/day (DAILY_POST_TARGET).
//
// Gaps are real (a failed sync skips a day), so the delta is normalized by the
// number of days it actually spans, and "expected" scales with that span. Every
// number traces to a specific snapshots row — a creator with only one snapshot is
// reported `no_data`, never a fabricated zero-gap.

import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";

/** Default daily posting target per creator (posts/day). Config constant — the
 *  brief's "4 platforms x 1/day" collapses to this because the data has no
 *  per-platform grain. Override per call via buildAccountabilityReport({ target }). */
export const DAILY_POST_TARGET = 4;

/**
 * Companies whose programs NEVER appear in the #campaigns digest. #campaigns is
 * client-campaigns only; the internal `#Allinmotion (CPM Creators)` pool belongs to
 * company "Vo Creations" (the agency's own creators, not a client accountability
 * target), so it is filtered out here at the source — it cannot drive `asOf` or show
 * up as a section. THIS IS THE SINGLE REVERSAL POINT: empty the set (or remove the
 * name) to let those programs back in. Programs with a null company_name are kept.
 * DECISION 2026-06: see docs/DECISIONS.md topic: campaign-accountability.
 */
export const EXCLUDED_COMPANY_NAMES: ReadonlySet<string> = new Set([
  "Vo Creations",
]);

/** SQL predicate dropping EXCLUDED_COMPANY_NAMES. `companyCol` is the company_name
 *  column reference for the query it is spliced into (alias differs per query).
 *  Returns empty SQL when the set is empty, i.e. the filter fully disabled. */
function excludeCompaniesSql(companyCol: ReturnType<typeof sql>) {
  const names = Array.from(EXCLUDED_COMPANY_NAMES);
  if (!names.length) return sql``;
  const list = sql.join(
    names.map((nm) => sql`${nm}`),
    sql`, `
  );
  return sql` and (${companyCol} is null or ${companyCol} not in (${list}))`;
}

export type CreatorStatus = "on_track" | "behind" | "no_data";

export interface CreatorAccountability {
  creatorId: string;
  name: string;
  status: CreatorStatus;
  /** posts added between the two most recent snapshots (null when no_data). */
  postsDelta: number | null;
  /** views added over the same span (context only; not the accountability metric). */
  viewsDelta: number | null;
  /** calendar days the delta spans (latest − previous snapshot date). */
  gapDays: number | null;
  /** target posts for this span = target x gapDays (null when no_data). */
  expected: number | null;
  /** latest snapshot date backing this row (YYYY-MM-DD). */
  asOf: string;
  /** previous snapshot date the delta is measured from (null when no_data). */
  since: string | null;
}

export interface CampaignAccountability {
  programId: string;
  programName: string;
  companyName: string | null;
  /** latest snapshot date present for this campaign (YYYY-MM-DD). */
  asOf: string;
  target: number;
  creators: CreatorAccountability[];
  behind: CreatorAccountability[];
  onTrack: CreatorAccountability[];
  noData: CreatorAccountability[];
}

export interface SyncHealth {
  /** latest daily-sync run date (YYYY-MM-DD) regardless of outcome, or null. */
  lastRunDate: string | null;
  lastRunStatus: string | null;
  /** latest SUCCESSFUL daily-sync run date, or null. */
  lastGoodDate: string | null;
}

export interface AccountabilityReport {
  /** the reference "latest" date the whole report is measured at (YYYY-MM-DD). */
  asOf: string | null;
  target: number;
  sync: SyncHealth;
  campaigns: CampaignAccountability[];
}

type Row = {
  program_id: string;
  program_name: string;
  company_name: string | null;
  creator_id: string;
  creator_name: string;
  cur_date: string;
  cur_posts: number | string;
  cur_views: number | string;
  prev_date: string | null;
  prev_posts: number | string | null;
  prev_views: number | string | null;
};

/** Whole-day difference between two YYYY-MM-DD dates (UTC midnights). */
function dayDiff(later: string, earlier: string): number {
  return Math.round((Date.parse(later) - Date.parse(earlier)) / 86_400_000);
}

/** Daily-sync health from sync_runs (source 'sideshift' only — the leaderboard
 *  backfill/repull runs are not the freshness signal). Drives the SYNC STALE gate. */
async function syncHealth(): Promise<SyncHealth> {
  const [last] = await db.execute<{ d: string; status: string }>(sql`
    select started_at::date::text d, status
    from sync_runs where source = 'sideshift'
    order by started_at desc limit 1
  `);
  const [good] = await db.execute<{ d: string }>(sql`
    select started_at::date::text d
    from sync_runs where source = 'sideshift' and status = 'ok'
    order by started_at desc limit 1
  `);
  return {
    lastRunDate: last?.d ?? null,
    lastRunStatus: last?.status ?? null,
    lastGoodDate: good?.d ?? null,
  };
}

function classify(postsDelta: number, expected: number): CreatorStatus {
  return postsDelta >= expected ? "on_track" : "behind";
}

/**
 * Build the accountability report across every ACTIVE program (status='active'),
 * minus the internal-pool companies in EXCLUDED_COMPANY_NAMES (client-only digest).
 * Ended/backfill campaigns are excluded by status, so a frozen historical snapshot
 * can never masquerade as today's accountability.
 *
 * `asOf` (YYYY-MM-DD) is the reference latest date. Omit it to measure at the latest
 * snapshot any active program has (proof/dev mode). The cron passes today's date and
 * enforces the SYNC STALE gate separately via `sync` — this function never invents
 * data, it just measures what is present at/<= asOf.
 */
export async function buildAccountabilityReport(opts?: {
  target?: number;
  asOf?: string;
}): Promise<AccountabilityReport> {
  const target = opts?.target ?? DAILY_POST_TARGET;
  const sync = await syncHealth();

  // Reference date: caller-supplied, else the latest snapshot across active programs.
  let asOf = opts?.asOf ?? null;
  if (!asOf) {
    const [r] = await db.execute<{ d: string | null }>(sql`
      select max(s.snapshot_date)::text d
      from snapshots s join programs p on p.id = s.program_id
      where p.status = 'active'${excludeCompaniesSql(sql`p.company_name`)}
    `);
    asOf = r?.d ?? null;
  }
  if (!asOf) {
    return { asOf: null, target, sync, campaigns: [] };
  }

  // For each active program + creator: the two most recent snapshots at/<= asOf.
  const rows = await db.execute<Row>(sql`
    with active_progs as (
      select id, name, company_name from programs
      where status = 'active'${excludeCompaniesSql(sql`company_name`)}
    ),
    ranked as (
      select s.program_id, s.creator_id, s.snapshot_date,
             s.lifetime_posts, s.lifetime_views,
             row_number() over (
               partition by s.program_id, s.creator_id
               order by s.snapshot_date desc
             ) rn
      from snapshots s
      join active_progs ap on ap.id = s.program_id
      where s.snapshot_date <= ${asOf}
    )
    select ap.id        as program_id,
           ap.name      as program_name,
           ap.company_name,
           c.id         as creator_id,
           c.name       as creator_name,
           cur.snapshot_date::text  as cur_date,
           cur.lifetime_posts       as cur_posts,
           cur.lifetime_views       as cur_views,
           prev.snapshot_date::text as prev_date,
           prev.lifetime_posts      as prev_posts,
           prev.lifetime_views      as prev_views
    from active_progs ap
    join ranked cur on cur.program_id = ap.id and cur.rn = 1
    join creators c on c.id = cur.creator_id
    left join ranked prev
      on prev.program_id = ap.id and prev.creator_id = cur.creator_id and prev.rn = 2
    order by ap.name asc, c.name asc
  `);

  const byProgram = new Map<string, CampaignAccountability>();
  for (const r of rows as unknown as Row[]) {
    let camp = byProgram.get(r.program_id);
    if (!camp) {
      camp = {
        programId: r.program_id,
        programName: r.program_name,
        companyName: r.company_name,
        asOf: r.cur_date,
        target,
        creators: [],
        behind: [],
        onTrack: [],
        noData: [],
      };
      byProgram.set(r.program_id, camp);
    }
    // track the freshest snapshot seen for this campaign
    if (r.cur_date > camp.asOf) camp.asOf = r.cur_date;

    let entry: CreatorAccountability;
    if (r.prev_date == null) {
      // Only one snapshot for this creator → no measurable window. Never a fake 0.
      entry = {
        creatorId: r.creator_id,
        name: r.creator_name,
        status: "no_data",
        postsDelta: null,
        viewsDelta: null,
        gapDays: null,
        expected: null,
        asOf: r.cur_date,
        since: null,
      };
    } else {
      const gapDays = Math.max(1, dayDiff(r.cur_date, r.prev_date));
      const postsDelta = Number(r.cur_posts) - Number(r.prev_posts);
      const viewsDelta = Number(r.cur_views) - Number(r.prev_views);
      const expected = target * gapDays;
      entry = {
        creatorId: r.creator_id,
        name: r.creator_name,
        status: classify(postsDelta, expected),
        postsDelta,
        viewsDelta,
        gapDays,
        expected,
        asOf: r.cur_date,
        since: r.prev_date,
      };
    }
    camp.creators.push(entry);
  }

  const campaigns = Array.from(byProgram.values());
  for (const camp of campaigns) {
    camp.behind = camp.creators.filter((c) => c.status === "behind");
    camp.onTrack = camp.creators.filter((c) => c.status === "on_track");
    camp.noData = camp.creators.filter((c) => c.status === "no_data");
    // Lead with the worst gap (largest shortfall first), then by name.
    camp.behind.sort((a, b) => {
      const sa = (a.expected ?? 0) - (a.postsDelta ?? 0);
      const sb = (b.expected ?? 0) - (b.postsDelta ?? 0);
      return sb - sa || a.name.localeCompare(b.name);
    });
  }
  campaigns.sort((a, b) => a.programName.localeCompare(b.programName));

  return { asOf, target, sync, campaigns };
}
