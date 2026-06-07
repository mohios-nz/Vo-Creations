// The ONE definition of every leaderboard metric. Pages/products read here and
// nowhere else — no raw snapshot math scattered around the app.
//
// Decisions encoded (docs/DECISIONS.md topic: leaderboard-windows):
//   • 7d / 30d windows  = snapshot DELTAS (latest − baseline at/before the cutoff).
//       Clean: during an active campaign accounts aren't repurposed, so lifetime
//       totals only grow. A creator who joined mid-window baselines off their first
//       snapshot (honest partial), never off 0 (which would count pre-existing views).
//   • all-time          = MAX(lifetime_views) per (program, creator), summed across a
//       creator's programs. Built from OUR snapshots, never the live API: after a
//       campaign ends an account can be repurposed and its lifetime total erode, but
//       we stop snapshotting at campaign end (only status=active syncs), so the last
//       snapshot per (program, creator) is the clean campaign-final value.
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

/** History envelope (max/min snapshot date, span) for the in-scope programs. */
async function historyEnvelope(programId: string | null): Promise<{ asOf: string | null; days: number }> {
  const rows = await db.execute<{ as_of: string | null; days: number | null }>(sql`
    select max(snapshot_date)::text as as_of,
           coalesce(max(snapshot_date) - min(snapshot_date), 0) as days
    from snapshots
    where ${progFilter(programId)}
  `);
  const r = rows[0];
  return { asOf: r?.as_of ?? null, days: Number(r?.days ?? 0) };
}

/** 7d / 30d: per-(program,creator) delta, summed per creator across in-scope programs. */
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

/** all-time: MAX(lifetime) per (program,creator), summed per creator across programs. */
async function allTimeBoard(programId: string | null): Promise<RawRow[]> {
  const rows = await db.execute<RawRow>(sql`
    with max_pc as (
      select s.program_id, s.creator_id,
             max(s.lifetime_views) v, max(s.lifetime_posts) p
      from snapshots s where ${progFilter(programId)}
      group by s.program_id, s.creator_id
    )
    select m.creator_id, c.external_id, c.name,
           sum(m.v)::bigint as views, sum(m.p)::int as posts
    from max_pc m join creators c on c.id = m.creator_id
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

/** Attach avatars and competition-style ranks (ties share a rank: 1,2,2,4). */
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
  const { asOf, days } = await historyEnvelope(programId);

  // Warm-up only applies to the rolling windows; all-time works from day one.
  if (window !== "all-time" && days < WINDOW_DAYS[window]) {
    return { scope, window, programId, warmingUp: true, asOf, daysOfHistory: days, entries: [] };
  }

  const [rows, images] = await Promise.all([
    window === "all-time" ? allTimeBoard(programId) : deltaBoard(programId, WINDOW_DAYS[window]),
    profileImageMap(),
  ]);

  return { scope, window, programId, warmingUp: false, asOf, daysOfHistory: days, entries: toEntries(rows, images) };
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
