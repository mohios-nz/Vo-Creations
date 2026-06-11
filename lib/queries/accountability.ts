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

export interface CompanyAccountability {
  /** the brand this section aggregates (programs.company_name; falls back to the
   *  program name for a program that has no company). One section per company. */
  company: string;
  /** the program tiers folded into this company (e.g. Inner Circle, Vo Creator L2). */
  programNames: string[];
  /** latest snapshot date present across this company's programs (YYYY-MM-DD). */
  asOf: string;
  target: number;
  /** creators de-duped by stable creator_id across the company's tiers (counted once). */
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
  /** one section per company (brand); program tiers aggregated, creators de-duped by id. */
  companies: CompanyAccountability[];
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

/** Accountability for ONE (program, creator) row: a delta when two snapshots exist,
 *  else no_data (a single snapshot is never a fabricated zero). */
function rowToEntry(r: Row, target: number): CreatorAccountability {
  if (r.prev_date == null) {
    return {
      creatorId: r.creator_id, name: r.creator_name, status: "no_data",
      postsDelta: null, viewsDelta: null, gapDays: null, expected: null,
      asOf: r.cur_date, since: null,
    };
  }
  const gapDays = Math.max(1, dayDiff(r.cur_date, r.prev_date));
  const postsDelta = Number(r.cur_posts) - Number(r.prev_posts);
  const viewsDelta = Number(r.cur_views) - Number(r.prev_views);
  const expected = target * gapDays;
  return {
    creatorId: r.creator_id, name: r.creator_name, status: classify(postsDelta, expected),
    postsDelta, viewsDelta, gapDays, expected, asOf: r.cur_date, since: r.prev_date,
  };
}

/** Collapse a creator's per-tier entries (SAME creator_id, one company) into a single
 *  company-level entry. The target is per-creator-per-day, so a creator's posts are
 *  SUMMED across the tiers they appear in and the creator is counted ONCE. Tiers where
 *  the creator has only one snapshot contribute nothing; a creator with no computable
 *  tier stays no_data. De-dup is by stable creator_id, so two distinct accounts that
 *  share a display name remain two creators. */
function mergeCreatorTiers(entries: CreatorAccountability[], target: number): CreatorAccountability {
  const { creatorId, name } = entries[0];
  const asOf = entries.reduce((m, e) => (e.asOf > m ? e.asOf : m), entries[0].asOf);
  const computable = entries.filter((e) => e.status !== "no_data");
  if (!computable.length) {
    return {
      creatorId, name, status: "no_data", postsDelta: null, viewsDelta: null,
      gapDays: null, expected: null, asOf, since: null,
    };
  }
  const postsDelta = computable.reduce((s, e) => s + (e.postsDelta ?? 0), 0);
  const viewsDelta = computable.reduce((s, e) => s + (e.viewsDelta ?? 0), 0);
  // The daily cron snapshots every tier on the same dates, so the gaps match; max is a
  // safe guard if a creator joined one tier later than another.
  const gapDays = Math.max(...computable.map((e) => e.gapDays ?? 1));
  const expected = target * gapDays;
  const since = computable.map((e) => e.since as string).sort()[0]; // earliest baseline
  return {
    creatorId, name, status: classify(postsDelta, expected),
    postsDelta, viewsDelta, gapDays, expected, asOf, since,
  };
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
    return { asOf: null, target, sync, companies: [] };
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

  // Group by COMPANY (brand), folding its program tiers together. A program with no
  // company_name stays its own section (keyed by program). Within a company, a creator
  // appearing in multiple tiers is de-duped by stable creator_id and counted ONCE
  // (their posts summed across tiers — the target is per-creator-per-day, not per-tier).
  type Group = {
    company: string;
    programNames: Set<string>;
    asOf: string;
    byCreator: Map<string, CreatorAccountability[]>;
  };
  const byCompany = new Map<string, Group>();
  for (const r of rows as unknown as Row[]) {
    const key = r.company_name ?? `program:${r.program_id}`;
    let g = byCompany.get(key);
    if (!g) {
      g = { company: r.company_name ?? r.program_name, programNames: new Set(), asOf: r.cur_date, byCreator: new Map() };
      byCompany.set(key, g);
    }
    g.programNames.add(r.program_name);
    if (r.cur_date > g.asOf) g.asOf = r.cur_date;
    const entry = rowToEntry(r, target);
    const list = g.byCreator.get(entry.creatorId);
    if (list) list.push(entry);
    else g.byCreator.set(entry.creatorId, [entry]);
  }

  const companies: CompanyAccountability[] = [];
  for (const g of Array.from(byCompany.values())) {
    const creators = Array.from(g.byCreator.values()).map((es) => mergeCreatorTiers(es, target));
    const behind = creators
      .filter((c) => c.status === "behind")
      // Lead with the worst gap (largest shortfall first), then by name.
      .sort((a, b) => {
        const sa = (a.expected ?? 0) - (a.postsDelta ?? 0);
        const sb = (b.expected ?? 0) - (b.postsDelta ?? 0);
        return sb - sa || a.name.localeCompare(b.name);
      });
    companies.push({
      company: g.company,
      programNames: Array.from(g.programNames).sort(),
      asOf: g.asOf,
      target,
      creators,
      behind,
      onTrack: creators.filter((c) => c.status === "on_track"),
      noData: creators.filter((c) => c.status === "no_data"),
    });
  }
  companies.sort((a, b) => a.company.localeCompare(b.company));

  return { asOf, target, sync, companies };
}
