# vocreations.com — Canonical Site Reference

Present-tense, factual overview of the site as it is on `main`. **Why things
changed lives in [DECISIONS.md](DECISIONS.md), not here** — if you want history,
read that. Payment detail: [stripe-slack-integration.md](stripe-slack-integration.md).
SEO history: [../SEO-WORK-DIARY.md](../SEO-WORK-DIARY.md).

## Stack & deploy

- Next.js 14 (App Router), TypeScript, Tailwind CSS.
- Hosted on Vercel, project `mohios/vocreations`.
- **Deploy flow:** Vercel is git-connected — pushing to `main` deploys to production
  (vocreations.com). Manual `vercel deploy --prod` is also available.
- Analytics: Vercel Analytics + Google Analytics (`G-1TESF8060F`).

## Live routes

| Route | Purpose |
|---|---|
| `/` | Homepage (agency pitch, showcase video grid, results, FAQ) |
| `/about` | About / for-brands |
| `/creators` | Trained creator network |
| `/mentorship` | Creator mentorship landing (Calendly discovery-call CTAs) |
| `/roi` | UGC ROI calculator |
| `/blog`, `/blog/text-on-screen-ugc` | Blog index + post |
| `/campaigns/maxxd` | Campaign dashboard (Maxxd) |
| `/campaigns/leaderboard` | Creator leaderboard — password-protected, `noindex` |
| `/daniel`, `/danny`, `/thienvu` | Conference/QR landing pages — `noindex`, standalone (no Nav/Footer) |
| `/pre-call` | Pre-call page |
| `/refund-policy` | Refund policy |
| `/api/stripe-webhook` | Stripe → Slack payment webhook (see Payments) |

## Positioning & copy (current / live)

- **Brand tagline:** _make them remember._ (lowercase, small-caps, trailing dot). See README brand section.
- **Agency guarantee (homepage):** "1,000,000 organic views minimum, or 50% of your fee back." No faked attribution or promised conversion rates.
- **Homepage stats:** 100M+ views generated, 30+ brands scaled, 100+ trained creators, 9 days to launch.
- **Mentorship framing:** a 4-month path toward $10–15K/month, with a first paid campaign included.

## Payments

No checkout on the website. Mentorship is sold via **direct Stripe payment links**
sent to buyers. A single Stripe webhook (`app/api/stripe-webhook/route.js`) verifies
the signature and posts `checkout.session.completed`, `invoice.paid` (auto-cancels
the subscription after 4 payments), and `invoice.payment_failed` to **Slack only**.
Full detail: [stripe-slack-integration.md](stripe-slack-integration.md).

## Creator Data Platform (warehouse + products)

An agency-owned creator-data warehouse plus products that read from it. Built in
phases per the Master Build Brief; the leaderboard is the first tenant. _Why this
architecture: [DECISIONS.md](DECISIONS.md) `topic: sideshift-api`._

- **DB:** Supabase Postgres (via the Vercel↔Supabase integration), Drizzle ORM.
  Schema in [`lib/db/schema.ts`](../lib/db/schema.ts); migrations in
  `lib/db/migrations/` (generated, never hand-edited). Runtime uses the pooled
  `POSTGRES_URL` (`lib/db/client.ts`); migrations use the direct `POSTGRES_URL_NON_POOLING`.
- **Core model:** immutable daily **snapshots** of lifetime view/post totals keyed
  at (creator + program); every leaderboard window is a subtraction between two
  snapshots. Creators auto-link across campaigns via a stable Sideshift `userId`
  (`creators.external_id`).
- **Ingest seam:** `lib/ingest/types.ts` defines a vendor-agnostic `IngestAdapter`.
  `lib/ingest/sideshift.ts` is the only module that talks to Sideshift. Adding a
  source = adding an adapter; nothing downstream changes.
- **Pipeline:** `lib/ingest/sync.ts` lands raw payloads in `raw_ingest` (immutable),
  upserts programs/creators/handles (agency-edited CRM fields preserved), and writes
  today's snapshots. Idempotent (re-running a day overwrites). One program failing
  doesn't fail the batch. Every run logs a `sync_runs` row; failures or a
  lifetime-views **decrease** post a warning to Slack (`SLACK_WEBHOOK_URL`).
- **Cron:** `app/api/cron/sync/route.ts`, scheduled daily at **09:00 UTC** via
  `vercel.json` (off-peak, avoids 06:00). Auth: `Authorization: Bearer $CRON_SECRET`.
- **Probe:** `scripts/probe-sideshift.mjs` (`npm run sideshift:probe`) is the Phase 0
  read-only discovery tool; fixtures land in `fixtures/sideshift/` (gitignored, PII).

## Environment variables

`.env.example` is the source of truth for which vars exist. Values are set in Vercel.

| Var | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe API calls in the webhook |
| `STRIPE_WEBHOOK_SECRET` | Verify Stripe webhook signatures |
| `MERCURY_WEBHOOK_SECRET` | Verify Mercury bank webhook signatures |
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhook for payment + sync notifications |
| `LEADERBOARD_DATA_URL` | _(old V1, removed in Phase 3)_ Apps Script leaderboard JSON |
| `LEADERBOARD_PASSWORD` | _(old V1, removed in Phase 3)_ Basic-auth for old leaderboard |
| `POSTGRES_URL` | Pooled Supabase connection (runtime DB handle) — injected by integration |
| `POSTGRES_URL_NON_POOLING` | Direct Supabase connection (migrations) — injected by integration |
| `SIDESHIFT_API_KEY` | Sideshift brand API key (header `x-api-key`) |
| `SIDESHIFT_BASE_URL` | `https://app.sideshift.app/api/v1` |
| `CRON_SECRET` | Bearer token the daily sync cron requires |

`STRIPE_PRICE_FULL`, `STRIPE_PRICE_PLAN`, and `GOOGLE_SHEET_WEBHOOK` still exist in
Vercel but are unused (safe to delete). See [DECISIONS.md](DECISIONS.md) `topic: payments`.
