// Campaign accountability digest — renders the report (lib/queries/accountability.ts)
// into a Slack message and (optionally) posts it. Audit tone, leads with who is
// behind, names creators, shows the gap. One section per active campaign.
//
// Repo rule: NO em dashes in any copy (use ":", "·", "to", "->").
//
// Two callers: the dry-run script (scripts/campaign-digest.ts) and the daily cron
// (app/api/cron/campaign-digest). The cron runs in `strict` mode, which enforces the
// brief's stop conditions: if the latest daily sync failed or is not from today, it
// posts "SYNC STALE" with the last good date and renders NO numbers (never carry a
// stale figure). The dry run measures the latest snapshot present, gate off.

import {
  buildAccountabilityReport,
  type AccountabilityReport,
  type CompanyAccountability,
  type CreatorAccountability,
  type SyncHealth,
} from "@/lib/queries/accountability";
import { notifySlack } from "@/lib/notify/slack";

/** Today (UTC) as YYYY-MM-DD — the snapshot/sync day key. */
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

const n = (x: number) => x.toLocaleString("en-US");

/** A creator's delta is stale if the sync did not run cleanly today. The digest
 *  must never print a number it cannot trace to a fresh run. */
export function isSyncStale(sync: SyncHealth, today = todayUTC()): boolean {
  return sync.lastRunStatus !== "ok" || sync.lastRunDate !== today;
}

export function formatSyncStale(sync: SyncHealth): string {
  const last = sync.lastGoodDate ?? "never";
  const detail =
    sync.lastRunStatus && sync.lastRunStatus !== "ok"
      ? ` Latest run (${sync.lastRunDate}) status: ${sync.lastRunStatus}.`
      : "";
  return (
    `:rotating_light: *SYNC STALE* — last good sync ${last}.${detail}\n` +
    `Holding the campaign accountability digest: not posting numbers off stale data.`
  ).replace(/—/g, ":"); // belt and suspenders on the no-em-dash rule
}

function creatorLine(c: CreatorAccountability): string {
  const posts = c.postsDelta ?? 0;
  const span = c.gapDays ?? 1;
  const dayWord = span === 1 ? "day" : "days";
  const views = c.viewsDelta ? `, +${n(c.viewsDelta)} views` : "";
  return `• ${c.name}: ${n(posts)} posts in ${span} ${dayWord} (target ${n(c.expected ?? 0)})${views}`;
}

function companySection(c: CompanyAccountability): string {
  const tierCount = c.programNames.length;
  const tierWord = tierCount === 1 ? "tier" : "tiers";
  const head = `*${c.company}*  ·  ${tierCount} ${tierWord} · as of ${c.asOf}, target ${c.target}/creator/day`;
  const tally =
    `:red_circle: ${c.behind.length} behind` +
    `   :white_check_mark: ${c.onTrack.length} on track` +
    (c.noData.length ? `   :grey_question: ${c.noData.length} no data` : "");

  const parts = [head, tally];

  if (c.behind.length) {
    parts.push("Behind:");
    parts.push(c.behind.map(creatorLine).join("\n"));
  }
  if (c.onTrack.length) {
    parts.push(`On track: ${c.onTrack.map((x) => x.name).join(", ")}`);
  }
  if (c.noData.length) {
    parts.push(`No data (single snapshot, nothing to compare): ${c.noData.map((x) => x.name).join(", ")}`);
  }
  return parts.join("\n");
}

/** Render the whole report to a Slack message. Assumes the stale gate already
 *  passed (the orchestrator calls formatSyncStale instead when it has not). */
export function formatDigest(report: AccountabilityReport): string {
  if (!report.companies.length) {
    return (
      `:bar_chart: *Campaign Accountability* (${report.asOf ?? "no data"})\n` +
      `No active campaigns are syncing fresh data. Nothing to report.`
    );
  }
  const header =
    `:bar_chart: *Campaign Accountability* · ${report.asOf}\n` +
    `One section per client. Posts added since each creator's previous snapshot, vs a ` +
    `target of ${report.target}/creator/day (summed across a creator's tiers, counted ` +
    `once). Sideshift has no per-platform grain, so this is total posts/creator ` +
    `(see DECISIONS topic: campaign-accountability).`;
  const sections = report.companies.map(companySection);
  return [header, ...sections].join("\n\n");
}

export interface RunResult {
  text: string;
  stale: boolean;
  posted: boolean;
  report: AccountabilityReport;
}

/**
 * Build + render + (optionally) post the digest.
 *   - strict: enforce the SYNC STALE gate (cron uses true). If stale, the message
 *     is the stale notice and NO numbers are rendered.
 *   - post: actually send to Slack (default false = dry run, returns text only).
 *   - webhookUrl: target channel webhook (default SLACK_CAMPAIGNS_WEBHOOK_URL).
 *   - asOf: reference latest date; omit to measure the latest snapshot present.
 */
export async function runCampaignDigest(opts?: {
  strict?: boolean;
  post?: boolean;
  webhookUrl?: string;
  asOf?: string;
  target?: number;
}): Promise<RunResult> {
  const report = await buildAccountabilityReport({ asOf: opts?.asOf, target: opts?.target });
  const stale = opts?.strict ? isSyncStale(report.sync) : false;
  const text = stale ? formatSyncStale(report.sync) : formatDigest(report);

  let posted = false;
  if (opts?.post) {
    const url = opts.webhookUrl ?? process.env.SLACK_CAMPAIGNS_WEBHOOK_URL;
    posted = await notifySlack(text, url);
  }
  return { text, stale, posted, report };
}
