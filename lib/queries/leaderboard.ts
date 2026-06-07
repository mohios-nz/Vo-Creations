// The ONE definition of every leaderboard metric. Pages/products read here and
// nowhere else — no raw snapshot math scattered around the app.
//
// Decisions encoded (docs/DECISIONS.md topic: leaderboard-windows):
//   • 7d / 30d windows  = snapshot DELTAS (latest − baseline at/before the cutoff).
//       Clean: during an active campaign accounts aren't repurposed, so lifetime
//       totals only grow. A creator who joined mid-window baselines off their first
//       snapshot (honest partial), never off 0 (which would count pre-existing views).
//   • all-time          = the LATEST lifetime_views per (program, creator), summed
//       across a creator's programs (full history, live values). Repurposed accounts
//       can erode a past campaign's lifetime total, but per the vendor (Daniel 2026-06)
//       that is being fixed upstream, so we do NOT build a freeze workaround. See the
//       TODO in allTimeBoard() for the fallback if the fix never lands.
//   • warm-up           = if a window needs N days of history the board doesn't have
//       yet, return warmingUp:true with NO entries — never a fake zero.
//
// Overall-agency board = the same engine with no program filter (sums a creator's
// metric across all their programs, auto-linked by the stable creators.id/external_id).

import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";

export type LeaderboardWindow = "7d" | "30d" | "all-time";

const WINDOW_DAYS: Record<Exclude<LeaderboardWindow, "all-time">, number> = {
  "7d": 7,
  "30d": 30,
};

export interface LeaderboardEntry {
  rank: number;
  creatorId: string;
  externalId: string;
  name: string;
  profileImageUrl: string | null;
  views: number;
  posts: number;
}

export interface Leaderboard {
  scope: "campaign" | "overall";
  window: LeaderboardWindow;
  programId: string | null;
  /** true → not enough history for this window yet; entries is empty by design. */
  warmingUp: boolean;
  /** latest snapshot date backing the board (YYYY-MM-DD), or null if no data. */
  asOf: string | null;
  /** best available history span in days across the in-scope program(s). */
  daysOfHistory: number;
  entries: LeaderboardEntry[];
}

type RawRow = {
  creator_id: string;
  external_id: string;
  name: string;
  views: string | number;
  posts: string | number;
};

/** program_id filter fragment: a single program, or all programs. */
function progFilter(programId: string | null) {
  return programId ? sql`program_id = ${programId}` : sql`true`;
}

/**
 * PER-PROGRAM history envelope (latest snapshot date + span in days) for the
 * in-scope programs. Warm-up and asOf/daysOfHistory are derived from THIS per-program
 * set — never a global min/max across programs. Otherwise two disjoint young programs
 * (each < N days, but far apart on the calendar) would report a long global span and
 * a non-warming board with zero entries (deltaBoard qualifies per-program, so neither
 * contributes). See DECISIONS topic: leaderboard-windows.
 */
async function programEnvelopes(programId: string | null): Promise<{ latest: string; span: number }[]> {
  const rows = await db.execute<{ latest: string; span: number | null }>(sql`
    select max(snapshot_date)::text as latest,
           (max(snapshot_date) - min(snapshot_date)) as span
    from snapshots where ${progFilter(programId)}
    group by program_id
  `);
  return rows.map((r) => ({ latest: r.latest, span: Number(r.span ?? 0) }));
}

const maxDate = (envs: { latest: string }[]): string | null =>
  envs.length ? envs.map((e) => e.latest).sort()[envs.length - 1] : null; // ISO dates sort chronologically
const maxSpan = (envs: { span: number }[]): number =>
  envs.reduce((m, e) => Math.max(m, e.span), 0);

/** 7d / 30d: per-(program,creator) delta, summed per creator across in-scope programs.
 *  PRODUCT CALLS (accepted, docs/DECISIONS leaderboard-windows):
 *   - Baseline is the snapshot AT/BEFORE `latest - N` (not interpolated to exactly N
 *     days ago). With daily snapshots this is at most ~1 day of bias; accepted, no change.
 *   - Deltas are floored at 0 (`greatest(..., 0)`): a window decrease never shows on the
 *     board. The erosion signal lives in `sync_runs.warnings` (views_decreased), not here. */
async function deltaBoard(programId: string | null, days: number): Promise<RawRow[]> {
  const rows = await db.execute<RawRow>(sql`
    with ref as (
      select program_id, max(snapshot_date) as latest, min(snapshot_date) as earliest
      from snapshots where ${progFilter(programId)}
      group by program_id
    ),
    -- only programs with at least N days of history contribute to an N-day window
    qualifying as (
      select program_id, latest, (latest - ${days}::int) as cutoff
      from ref where (latest - earliest) >= ${days}
    ),
    latest_pc as (
      select distinct on (s.program_id, s.creator_id)
        s.program_id, s.creator_id, s.lifetime_views v, s.lifetime_posts p
      from snapshots s join qualifying q on q.program_id = s.program_id
      order by s.program_id, s.creator_id, s.snapshot_date desc
    ),
    baseline_pc as (
      select distinct on (s.program_id, s.creator_id)
        s.program_id, s.creator_id, s.lifetime_views v, s.lifetime_posts p
      from snapshots s join qualifying q
        on q.program_id = s.program_id and s.snapshot_date <= q.cutoff
      order by s.program_id, s.creator_id, s.snapshot_date desc
    ),
    earliest_pc as (  -- fallback baseline for a creator who first appeared after the cutoff
      select distinct on (s.program_id, s.creator_id)
        s.program_id, s.creator_id, s.lifetime_views v, s.lifetime_posts p
      from snapshots s join qualifying q on q.program_id = s.program_id
      order by s.program_id, s.creator_id, s.snapshot_date asc
    ),
    delta_pc as (
      select l.creator_id,
        greatest(l.v - coalesce(b.v, e.v, 0), 0) as views,
        greatest(l.p - coalesce(b.p, e.p, 0), 0) as posts
      from latest_pc l
      left join baseline_pc b on b.program_id = l.program_id and b.creator_id = l.creator_id
      left join earliest_pc e on e.program_id = l.program_id and e.creator_id = l.creator_id
    )
    select d.creator_id, c.external_id, c.name,
           sum(d.views)::bigint as views, sum(d.posts)::int as posts
    from delta_pc d join creators c on c.id = d.creator_id
    group by d.creator_id, c.external_id, c.name
    order by views desc, posts desc, c.name asc
  `);
  return rows as unknown as RawRow[];
}

/** all-time: the LATEST lifetime total per (program,creator), summed per creator
 *  across programs. Uses live lifetime values (full history) per the vendor decision
 *  (docs/DECISIONS topic: leaderboard-windows).
 *
 *  TODO(vendor-repurposing-fix): if a repurposed account erodes a past campaign's
 *  lifetime total before the vendor ships their fix, and that proves material, swap
 *  the `distinct on ... order by snapshot_date desc` (latest) below for
 *  `max(lifetime_views) group by program_id, creator_id` (campaign-final freeze).
 *  Our snapshots are immutable, so the data for that is already retained. */
async function allTimeBoard(programId: string | null): Promise<RawRow[]> {
  const rows = await db.execute<RawRow>(sql`
    with latest_pc as (
      select distinct on (s.program_id, s.creator_id)
             s.program_id, s.creator_id, s.lifetime_views v, s.lifetime_posts p
      from snapshots s where ${progFilter(programId)}
      order by s.program_id, s.creator_id, s.snapshot_date desc
    )
    select m.creator_id, c.external_id, c.name,
           sum(m.v)::bigint as views, sum(m.p)::int as posts
    from latest_pc m join creators c on c.id = m.creator_id
    group by m.creator_id, c.external_id, c.name
    order by views desc, posts desc, c.name asc
  `);
  return rows as unknown as RawRow[];
}

/** creatorId → a representative avatar (handles carry the image, not the creator row). */
async function profileImageMap(): Promise<Map<string, string>> {
  const rows = await db.execute<{ creator_id: string; profile_image_url: string }>(sql`
    select distinct on (creator_id) creator_id, profile_image_url
    from campaign_accounts
    where profile_image_url is not null
    order by creator_id, first_seen_at desc
  `);
  const map = new Map<string, string>();
  for (const r of rows) map.set(r.creator_id, r.profile_image_url);
  return map;
}

/** Attach avatars and competition-style ranks (ties share a rank: 1,2,2,4).
 *  PRODUCT CALL: ties are broken by VIEWS ONLY — equal views share a rank. The
 *  `posts desc, name asc` in the SQL ORDER BY only sets a stable DISPLAY order among
 *  tied rows; it does NOT split their rank. (Decided, docs/DECISIONS leaderboard-windows.) */
function toEntries(rows: RawRow[], images: Map<string, string>): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];
  let lastViews: number | null = null;
  let lastRank = 0;
  rows.forEach((r, i) => {
    const views = Number(r.views);
    const rank = lastViews !== null && views === lastViews ? lastRank : i + 1;
    lastViews = views;
    lastRank = rank;
    entries.push({
      rank,
      creatorId: r.creator_id,
      externalId: r.external_id,
      name: r.name,
      profileImageUrl: images.get(r.creator_id) ?? null,
      views,
      posts: Number(r.posts),
    });
  });
  return entries;
}

async function buildBoard(
  scope: "campaign" | "overall",
  programId: string | null,
  window: LeaderboardWindow
): Promise<Leaderboard> {
  const envs = await programEnvelopes(programId);

  if (window !== "all-time") {
    // A program contributes to an N-day window only if IT has >= N days of history
    // (the same rule deltaBoard's `qualifying` CTE applies). Warm-up + asOf +
    // daysOfHistory are derived from this SAME set, so they can never disagree with
    // what actually contributed (the disjoint-young-programs bug).
    const need = WINDOW_DAYS[window];
    const qualifying = envs.filter((e) => e.span >= need);
    if (qualifying.length === 0) {
      // Nothing has enough history yet — honest warm-up. daysOfHistory reports the
      // best any single program has, so callers can say "best is X days, need N".
      return {
        scope, window, programId, warmingUp: true,
        asOf: maxDate(envs), daysOfHistory: maxSpan(envs), entries: [],
      };
    }
    const [rows, images] = await Promise.all([deltaBoard(programId, need), profileImageMap()]);
    return {
      scope, window, programId, warmingUp: false,
      asOf: maxDate(qualifying), daysOfHistory: maxSpan(qualifying),
      entries: toEntries(rows, images),
    };
  }

  // all-time: never warming up; describe all in-scope programs that have data.
  const [rows, images] = await Promise.all([allTimeBoard(programId), profileImageMap()]);
  return {
    scope, window, programId, warmingUp: false,
    asOf: maxDate(envs), daysOfHistory: maxSpan(envs),
    entries: toEntries(rows, images),
  };
}

/** Per-campaign board for one program (by internal programs.id). */
export function getCampaignLeaderboard(programId: string, window: LeaderboardWindow): Promise<Leaderboard> {
  return buildBoard("campaign", programId, window);
}

/** Overall-agency board: a creator's metric summed across all their programs. */
export function getOverallLeaderboard(window: LeaderboardWindow): Promise<Leaderboard> {
  return buildBoard("overall", null, window);
}

export interface LeaderboardProgram {
  id: string;
  externalId: string;
  name: string;
  companyName: string | null;
  asOf: string | null;
  daysOfHistory: number;
}

/** Programs that have any snapshot data — powers the campaign switcher. */
export async function getLeaderboardPrograms(): Promise<LeaderboardProgram[]> {
  const rows = await db.execute<{
    id: string; external_id: string; name: string; company_name: string | null;
    as_of: string | null; days: number | null;
  }>(sql`
    select p.id, p.external_id, p.name, p.company_name,
           max(s.snapshot_date)::text as as_of,
           coalesce(max(s.snapshot_date) - min(s.snapshot_date), 0) as days
    from programs p join snapshots s on s.program_id = p.id
    group by p.id, p.external_id, p.name, p.company_name
    order by p.name asc
  `);
  return rows.map((r) => ({
    id: r.id,
    externalId: r.external_id,
    name: r.name,
    companyName: r.company_name,
    asOf: r.as_of,
    daysOfHistory: Number(r.days ?? 0),
  }));
}
