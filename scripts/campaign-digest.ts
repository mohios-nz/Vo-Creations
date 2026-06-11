// Campaign accountability digest — manual runner / proof harness.
//
//   npm run digest:campaign                 # dry run: render at the latest snapshot, print, do NOT post
//   npm run digest:campaign -- --strict      # apply the SYNC STALE gate (what the cron does)
//   npm run digest:campaign -- --as-of=2026-06-09   # measure at a specific date
//   npm run digest:campaign -- --post --webhook=$URL  # actually post to a channel webhook
//
// Default is DRY RUN (no Slack post) — proving correctness before scheduling is the point.
// See docs/DECISIONS topic: campaign-accountability.

import { runCampaignDigest } from "@/lib/digest/campaign-digest";
import { closeDb } from "@/lib/db/client";

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : undefined;
}
const has = (name: string) => process.argv.includes(`--${name}`);

async function main() {
  const post = has("post");
  const strict = has("strict");
  const asOf = arg("as-of");
  const target = arg("target") ? Number(arg("target")) : undefined;
  const webhookUrl = arg("webhook") || (post ? process.env.SLACK_CAMPAIGNS_WEBHOOK_URL : undefined);

  const { text, stale, posted, report } = await runCampaignDigest({
    strict,
    post,
    webhookUrl,
    asOf,
    target,
  });

  console.error(
    `[digest] asOf=${report.asOf} strict=${strict} stale=${stale} ` +
      `companies=${report.companies.length} post=${post} posted=${posted}`
  );
  console.error(
    `[digest] sync: lastRun=${report.sync.lastRunDate}/${report.sync.lastRunStatus} ` +
      `lastGood=${report.sync.lastGoodDate}`
  );
  // The digest text itself goes to stdout so it can be piped/inspected cleanly.
  console.log("\n" + text + "\n");

  if (post && !posted) {
    console.error("[digest] WARNING: --post set but nothing was sent (no webhook url, or Slack rejected).");
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
