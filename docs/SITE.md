# SITE — vocreations.com (how it works now)

Present-tense wiring map. **Why things changed → [DECISIONS.md](DECISIONS.md)**;
payments detail → [stripe-slack-integration.md](stripe-slack-integration.md); SEO
history → [../SEO-WORK-DIARY.md](../SEO-WORK-DIARY.md). This file points at code; it
does not copy routes or env vars (those rot).

## Stack & deploy

Next.js 14 (App Router), TypeScript, Tailwind on Vercel (`mohios/vocreations`),
**git-connected: merge to `main` → production** (vocreations.com). Analytics: Vercel
Analytics + GA `G-1TESF8060F`. See [DECISIONS.md](DECISIONS.md) `topic: deploy`.

## Routes

Routes are the `app/` tree — read it, don't trust a copy here. Non-obvious wiring
only:

- `/daniel`, `/danny`, `/thienvu` — conference/QR landings: `noindex`, standalone
  (no Nav/Footer).
- `app/api/stripe-webhook` — Stripe payment events → Slack (#ka-ching).
- `app/api/mercury-webhook` — Mercury bank events → Slack (#ka-ching), incoming only.

## Environment

Env vars are declared in [`../.env.example`](../.env.example) — the source of truth
(`npm run docs:check` enforces code↔example sync). Real values are set in Vercel
(`mohios/vocreations`).

## Payments

No on-site checkout — mentorship is sold via direct Stripe payment links. Two
webhooks post to Slack #ka-ching: Stripe (`app/api/stripe-webhook/route.js`) and
Mercury (`app/api/mercury-webhook/route.js`). Detail:
[stripe-slack-integration.md](stripe-slack-integration.md); rationale in
[DECISIONS.md](DECISIONS.md) (`topic: payments`, `topic: mercury-webhook`).

## Creator Data Platform

Agency-owned creator-data warehouse + products that read it (Master Build Brief;
the leaderboard is the first tenant). Read the code, not a copy here. _Why:
[DECISIONS.md](DECISIONS.md) `topic: sideshift-api`._

- **DB:** Supabase Postgres + Drizzle. Schema [`lib/db/schema.ts`](../lib/db/schema.ts);
  migrations `lib/db/migrations/` (generated, never hand-edited). Runtime → pooled
  `POSTGRES_URL` (`lib/db/client.ts`); migrations → direct `POSTGRES_URL_NON_POOLING`.
- **Model:** immutable daily **snapshots** of lifetime view/post totals keyed at
  (creator + program); every window is a snapshot subtraction. Creators auto-link
  across campaigns via a stable Sideshift `userId` (`creators.external_id`).
- **Ingest seam:** vendor-agnostic `IngestAdapter` ([`lib/ingest/types.ts`](../lib/ingest/types.ts));
  [`lib/ingest/sideshift.ts`](../lib/ingest/sideshift.ts) is the only module touching the vendor.
- **Pipeline:** [`lib/ingest/sync.ts`](../lib/ingest/sync.ts) — immutable `raw_ingest`,
  upserts (agency CRM fields preserved), idempotent snapshots, `sync_runs` log, Slack
  warn on failure or a lifetime-views decrease. One program failing doesn't fail the batch.
- **Metrics (one definition):** [`lib/queries/leaderboard.ts`](../lib/queries/leaderboard.ts)
  — per-campaign + overall boards × {7d, 30d, all-time}. 7d/30d are snapshot deltas;
  all-time is `MAX(lifetime_views)` per (program, creator) from our snapshots (see
  DECISIONS `topic: leaderboard-windows`). Returns a `warmingUp` state, never a fake zero.
- **Cron:** `app/api/cron/sync` daily 09:00 UTC (`vercel.json`), Bearer `CRON_SECRET`.
- **Campaign accountability digest:** [`lib/queries/accountability.ts`](../lib/queries/accountability.ts)
  computes posts/creator/day (latest − previous `lifetime_posts`) per `status='active'` program
  vs a target (`DAILY_POST_TARGET`); [`lib/digest/campaign-digest.ts`](../lib/digest/campaign-digest.ts)
  renders + posts to **#campaigns** (`SLACK_CAMPAIGNS_WEBHOOK_URL`). Manual:
  `npm run digest:campaign` (dry-run default). Cron: `app/api/cron/campaign-digest`
  (`strict` → SYNC STALE gate). **Currently DRY-RUN ONLY** — not in `vercel.json` `crons` and
  `SLACK_CAMPAIGNS_WEBHOOK_URL` unset, so it never posts. _Activation checklist + known limits
  (no per-platform grain; only Allinmotion syncs live): DECISIONS `topic: campaign-accountability`._
- **Probe:** `scripts/probe-sideshift.mjs` (Phase 0 discovery; fixtures gitignored, PII).
- **Leaderboard (`app/leaderboard/`):** gated creator board (→ `leaderboard.vocreations.com`).
  Supabase **magic-link** auth (`lib/supabase/*`, session refresh in `middleware.ts`);
  `session.email → creator` via `lib/queries/creator-access.ts`; reads the Phase 2 query
  layer. Shows overall + the creator's own campaigns; directed unknown-email screen;
  `noindex`. Re-skinned from `design/leaderboard-fun-prototype.html`. Email seeding:
  `scripts/seed-creator-emails.mjs`. Why: DECISIONS `topic: leaderboard-access`.
