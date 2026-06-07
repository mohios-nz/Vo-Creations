// The daily snapshot pipeline — source-agnostic.
//
// For each active program from the adapter:
//   1. land every raw payload in raw_ingest (immutable);
//   2. upsert program → creators → program_creators → campaign_accounts (CRM,
//      auto-linked by the stable external_id; agency-edited fields preserved);
//   3. write today's snapshot per active creator (idempotent: re-running a day
//      overwrites, never double-counts).
// One program failing does not fail the batch. A sync_runs row logs every run;
// failures or lifetime-views-decreased anomalies post a warning to Slack.
//
// This file talks ONLY to the IngestAdapter interface + the DB — never a vendor.

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  programs, creators, programCreators, campaignAccounts, snapshots, rawIngest, syncRuns,
} from "@/lib/db/schema";
import { notifySlack } from "@/lib/notify/slack";
import type { IngestAdapter, NormalizedProgram, RawPayload } from "./types";

/** Today's date as YYYY-MM-DD (UTC) — the snapshot key. */
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

type Warning = Record<string, unknown>;

export interface SyncResult {
  runId: string;
  status: "ok" | "error";
  programsSynced: number;
  rowsWritten: number;
  warnings: Warning[];
}

export async function runSync(adapter: IngestAdapter): Promise<SyncResult> {
  const today = todayUTC();
  const warnings: Warning[] = [];
  let programsSynced = 0;
  let rowsWritten = 0;

  const [run] = await db
    .insert(syncRuns)
    .values({ source: adapter.source, status: "running" })
    .returning({ id: syncRuns.id });
  const runId = run.id;

  let status: "ok" | "error" = "ok";
  try {
    const { programs: programList, raw: listRaw } = await adapter.listActivePrograms();
    await landRaw(adapter.source, listRaw);

    for (const program of programList) {
      try {
        rowsWritten += await syncProgram(adapter, program, today, warnings);
        programsSynced++;
      } catch (err) {
        // Isolate per-program: log a warning and keep going.
        warnings.push({
          kind: "program_failed",
          program: program.externalId,
          name: program.name,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    status = "error";
    warnings.push({
      kind: "sync_failed",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  await db
    .update(syncRuns)
    .set({
      finishedAt: new Date(),
      status,
      programsSynced,
      rowsWritten,
      warnings: warnings.length ? warnings : null,
    })
    .where(eq(syncRuns.id, runId));

  if (status === "error" || warnings.length) {
    await notifySlack(formatSlack(adapter.source, status, programsSynced, rowsWritten, warnings));
  }

  return { runId, status, programsSynced, rowsWritten, warnings };
}

/** Sync one program. Returns the number of snapshot rows written. */
async function syncProgram(
  adapter: IngestAdapter,
  program: NormalizedProgram,
  today: string,
  warnings: Warning[]
): Promise<number> {
  const data = await adapter.fetchProgramData(program);
  await landRaw(adapter.source, data.raw);

  // ── program ──────────────────────────────────────────────────────────────
  const [prog] = await db
    .insert(programs)
    .values({
      source: adapter.source,
      externalId: program.externalId,
      name: program.name,
      companyId: program.companyId ?? null,
      companyName: program.companyName ?? null,
      status: program.status ?? "active",
      startsAt: program.startsAt ?? null,
      endsAt: program.endsAt ?? null,
    })
    .onConflictDoUpdate({
      target: [programs.source, programs.externalId],
      set: {
        name: program.name,
        companyId: program.companyId ?? null,
        companyName: program.companyName ?? null,
        status: program.status ?? "active",
        startsAt: program.startsAt ?? null,
        endsAt: program.endsAt ?? null,
      },
    })
    .returning({ id: programs.id });
  const programId = prog.id;

  // ── roster → creators / program_creators / campaign_accounts ──────────────
  const creatorIdByExternal = new Map<string, string>();
  for (const entry of data.roster) {
    const creatorId = await upsertCreator(adapter.source, entry.externalId, entry.name, entry.email, entry.profileImageUrl);
    creatorIdByExternal.set(entry.externalId, creatorId);

    await db
      .insert(programCreators)
      .values({ programId, creatorId, status: entry.participationStatus ?? "active" })
      .onConflictDoUpdate({
        target: [programCreators.programId, programCreators.creatorId],
        set: { status: entry.participationStatus ?? "active" },
      });

    for (const acc of entry.accounts) {
      await db
        .insert(campaignAccounts)
        .values({
          programId,
          creatorId,
          platform: acc.platform,
          handle: acc.handle,
          profileImageUrl: acc.profileImageUrl ?? null,
          active: true,
        })
        .onConflictDoUpdate({
          target: [campaignAccounts.programId, campaignAccounts.creatorId, campaignAccounts.platform, campaignAccounts.handle],
          set: { profileImageUrl: acc.profileImageUrl ?? null, active: true },
        });
    }
  }

  // ── metrics → snapshots (with views-decreased detection) ──────────────────
  const priorViews = await latestPriorViews(programId, today);
  let written = 0;
  for (const m of data.metrics) {
    let creatorId = creatorIdByExternal.get(m.externalId);
    if (!creatorId) {
      // A creator with metrics but absent from the roster — register minimally.
      creatorId = await upsertCreator(adapter.source, m.externalId, m.name, null, null);
      creatorIdByExternal.set(m.externalId, creatorId);
    }

    const prev = priorViews.get(creatorId);
    if (prev !== undefined && m.lifetimeViews < prev) {
      warnings.push({
        kind: "views_decreased",
        program: program.externalId,
        creator: m.name,
        creatorId,
        previous: prev,
        current: m.lifetimeViews,
      });
    }

    await db
      .insert(snapshots)
      .values({
        snapshotDate: today,
        programId,
        creatorId,
        lifetimeViews: m.lifetimeViews,
        lifetimePosts: m.lifetimePosts,
      })
      .onConflictDoUpdate({
        target: [snapshots.snapshotDate, snapshots.programId, snapshots.creatorId],
        set: { lifetimeViews: m.lifetimeViews, lifetimePosts: m.lifetimePosts, capturedAt: new Date() },
      });
    written++;
  }
  return written;
}

/** Upsert a creator by stable (source, external_id). Preserves agency-edited CRM
 *  fields (bio, notes, portfolioUrl, status) — only refreshes source-derived ones. */
async function upsertCreator(
  source: string,
  externalId: string,
  name: string,
  email: string | null | undefined,
  profileImageUrl: string | null | undefined
): Promise<string> {
  const [row] = await db
    .insert(creators)
    .values({ source, externalId, name, email: email ?? null })
    .onConflictDoUpdate({
      target: [creators.source, creators.externalId],
      set: { name, email: email ?? null, updatedAt: new Date() },
    })
    .returning({ id: creators.id });
  return row.id;
}

/** Most-recent lifetime_views per creator for this program, before `today`.
 *  Used to flag a lifetime total that went DOWN (a data-quality red flag). */
async function latestPriorViews(programId: string, today: string): Promise<Map<string, number>> {
  const rows = await db.execute<{ creator_id: string; lifetime_views: number }>(sql`
    select distinct on (creator_id) creator_id, lifetime_views
    from ${snapshots}
    where program_id = ${programId} and snapshot_date < ${today}
    order by creator_id, snapshot_date desc
  `);
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.creator_id, Number(r.lifetime_views));
  return map;
}

/** Immutably land raw source payloads. Never updated or deleted. */
async function landRaw(source: string, raw: RawPayload[]): Promise<void> {
  if (!raw.length) return;
  await db.insert(rawIngest).values(
    raw.map((r) => ({
      source,
      endpoint: r.endpoint,
      programExternalId: r.programExternalId ?? null,
      payload: r.payload as object,
    }))
  );
}

function formatSlack(
  source: string,
  status: string,
  programsSynced: number,
  rowsWritten: number,
  warnings: Warning[]
): string {
  const head =
    status === "error"
      ? `:rotating_light: *${source} sync FAILED*`
      : `:warning: *${source} sync completed with ${warnings.length} warning(s)*`;
  const lines = warnings.slice(0, 10).map((w) => `• \`${w.kind}\` ${JSON.stringify(w)}`);
  const more = warnings.length > 10 ? `\n…and ${warnings.length - 10} more` : "";
  return `${head}\nprograms: ${programsSynced} · snapshots: ${rowsWritten}\n${lines.join("\n")}${more}`;
}
