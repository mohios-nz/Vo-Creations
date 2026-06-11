# DECISIONS — vocreations.com

Past-tense log of non-obvious calls: **why** something is the way it is, and what
changed. Append-only. Each entry has a `topic` key and a date.

**Reading rule:** the **latest entry on a `topic` wins.** A newer entry on the
same topic supersedes older ones (recency decides) — you do not need to find and
edit the old entry. For present-tense "how it works now," see
[SITE.md](SITE.md); this file is only the why/history.

---

## topic: campaign-accountability — _2026-06_

Built a daily **campaign accountability digest**: per active campaign, per creator, are
they posting vs a target (default **4 posts/creator/day**, `DAILY_POST_TARGET`). Posts to
Slack **#campaigns**. Engine: [`lib/queries/accountability.ts`](../lib/queries/accountability.ts)
(the one metric definition) → [`lib/digest/campaign-digest.ts`](../lib/digest/campaign-digest.ts)
(render + orchestrate) → `scripts/campaign-digest.ts` (`npm run digest:campaign`, dry-run
default) + `app/api/cron/campaign-digest` (strict, daily). New env
`SLACK_CAMPAIGNS_WEBHOOK_URL`; `notifySlack(text, url?)` now takes a channel webhook.

- **The only honest metric is posts/creator/day = latest − previous `lifetime_posts`.**
  Sideshift is lifetime-only with **no per-platform split per creator** (`topCreators[]` is
  `{id,name,totalViews,totalPosts}`; `platformBreakdown` is program-level only). So "1x/day
  on 4 platforms" is NOT reconstructable — it collapses to a flat per-creator posts target.
  **This is the known limitation, by data design, not a TODO.**
- **Gaps are normalized.** A failed sync skips a day, so the delta spans `latest − previous`
  snapshot dates and the target scales (`target x gapDays`). A creator with a single snapshot
  is `no_data`, never a fabricated zero.
- **Active-campaign source = `programs WHERE status='active'`** (driven by the daily sync),
  NOT the Campaign Tracker sheet. Only a program with a *fresh daily snapshot* can be held
  accountable; the sheet is human intent that drifts (verified 2026-06-10: the sheet lists
  Aonic/eComrads/CoWorker/Morphic active, but those exist in our DB only as `status=ended`
  backfill frozen at 2026-06-07 — `status='active'` correctly excludes them). The 27 backfill
  brands are all `ended`, so a frozen historical snapshot can never masquerade as today's.
- **Stop conditions (brief).** The cron runs `strict`: if the latest `sideshift` sync run is
  not status=ok AND dated today, it posts `SYNC STALE : <last good date>` and renders NO
  numbers. Ended campaigns drop out by status. Every printed number traces to a snapshots row.
- **KNOWN BLOCKER (shared with `topic: alltime-repull`): only `#Allinmotion (CPM Creators)`
  syncs live** — prod has the single `SIDESHIFT_API_KEY` (Vo Creations company), not the
  multi-brand `SIDESHIFT_KEYS`. Allinmotion is the agency's internal CPM pool, not a client
  campaign, and has posted 0 net content since 2026-06-07. The engine is campaign-agnostic and
  auto-covers Aonic/eComrads/CoWorker the moment their brand keys are added. **Verified Phase
  0/2:** DB latest snapshot posts == live Sideshift API, 25/25 exact; digest deltas trace to
  the raw snapshots rows.
- **CLIENT-ONLY FILTER — built (2026-06-10).** #campaigns is client campaigns only, so the
  internal pool is excluded at the source: `EXCLUDED_COMPANY_NAMES = { "Vo Creations" }` in
  [`lib/queries/accountability.ts`](../lib/queries/accountability.ts) drops any program whose
  `company_name` is in the set from `buildAccountabilityReport` — it cannot drive `asOf` or
  render a section (programs with a null company_name are kept). That is the **single reversal
  point**: empty the set to let the internal pool back in. Consequence today: with Allinmotion
  (company "Vo Creations") the only live program, the report is correctly **empty** until the
  client brand keys land. Verified by dry-run (below).
- **Metric APPROVED (Danny, 2026-06-10); NOT activated.** The posts/creator/day metric and the
  behind vs no-data distinction are signed off, and the engine is merged to `main` ready to run.
  But the digest does NOT post and the cron does NOT fire until the checklist below. Two
  independent off-switches keep it dark: (a) `/api/cron/campaign-digest` is absent from
  `vercel.json` `crons` (never scheduled), and (b) `SLACK_CAMPAIGNS_WEBHOOK_URL` is unset, so
  `notifySlack` returns false (no post). **Do NOT activate against `#Allinmotion` alone** — it is
  the internal Vo Creations pool, not the client accountability target.

**Activation checklist — flip the digest live to #campaigns (do ALL, in order):**
1. **Add the client brand keys.** Put the Aonic, eComrads, and CoWorker Sideshift API keys into
   `SIDESHIFT_KEYS` (Vercel **and** `.env.local`), **and include the Allinmotion key too** so the
   internal pool keeps ingesting (see the `SIDESHIFT_KEYS` replaces `SIDESHIFT_API_KEY` caveat below).
   Until this, the only `status='active'` program is the internal `#Allinmotion` pool, so there is
   nothing real to post — do not activate first.
2. **Verify ingest.** After the next 09:00 UTC sync, confirm `programs WHERE status='active'`
   includes the client campaigns with a snapshot dated today, then run `npm run digest:campaign`
   (dry-run) and check they render with real deltas.
3. **Internal-pool exclusion — already built, nothing to do.** The client-only filter
   (`EXCLUDED_COMPANY_NAMES`, see above) keeps Allinmotion / company "Vo Creations" out of the
   digest permanently. To include it again, empty that set in `lib/queries/accountability.ts`.
4. **Set the channel webhook.** Create a Slack Incoming Webhook bound to #campaigns; set
   `SLACK_CAMPAIGNS_WEBHOOK_URL` in Vercel (and `.env.local` for local posting).
5. **Register the cron.** Add to `vercel.json` `crons`:
   `{ "path": "/api/cron/campaign-digest", "schedule": "30 9 * * *" }` (after the 09:00 sync; uses
   the existing `CRON_SECRET` Bearer). Deploy by merging to `main`.
- **Deactivate / rollback:** remove the `vercel.json` cron entry, or unset
  `SLACK_CAMPAIGNS_WEBHOOK_URL` (posts become no-ops). No code change needed either way.

**`SIDESHIFT_KEYS` REPLACES `SIDESHIFT_API_KEY` entirely (Allinmotion caveat) — verified 2026-06-11.**
The multi-key adapter reads `SIDESHIFT_KEYS || SIDESHIFT_API_KEY`: the single `SIDESHIFT_API_KEY` is
used ONLY when `SIDESHIFT_KEYS` is empty (it is a fallback, not a merge). So the moment `SIDESHIFT_KEYS`
is set, `SIDESHIFT_API_KEY` (the Allinmotion / "Vo Creations" key) is never read. The Allinmotion key
is **not** one of the client brand keys in the map, so the prod `SIDESHIFT_KEYS` value MUST include it
explicitly — **29 entries (28 brands + Allinmotion), not 28** — or the internal pool stops being
ingested and goes stale on the leaderboard. (Until the multi-key adapter merges to `main` it lives only
on `feat/multikey-sync-alltime-repull`; prod still uses the single `SIDESHIFT_API_KEY` and ignores
`SIDESHIFT_KEYS` entirely — so the keys do not ingest in prod until that branch merges.)

**Process learning — one branch/worktree per feature.** Two unrelated features (the multi-key sync and
this digest) once shared a single uncommitted working tree across sessions and got fused into one
`git stash`, which was slow and risky to untangle. Going forward: create a dedicated branch or
`git worktree` per feature BEFORE the first edit; commit a checkpoint before switching context; and keep
code and doc changes on **separate** branches (e.g. this learning shipped on `docs/digest-activation-learnings`,
the company-regroup on `feat/digest-group-by-company` — not bundled).

**Why:** an audit-tone "who is behind today" digest mirrors the sales-CRM daily intelligence,
pointed at creator posting. Proving it against live data before scheduling was the explicit
gate — the data turned out to expose that only one (internal) campaign is wired, which is the
real finding to act on (supply brand keys) rather than ship a digest over frozen data.

## topic: security — _2026-06_

Enabled **Row Level Security on every public table** (migration
`0002_enable_rls_public.sql`), with **no policies**.

**Why:** Supabase serves a PostgREST data API at `https://<ref>.supabase.co/rest/v1/<table>`
authenticated by the **anon key — which is public** (it ships to the browser for auth).
With RLS off, anyone with that key could read/write the tables directly (verified: anon
`GET /rest/v1/creators` returned live PII before the fix). The app does **not** use that
API — confirmed all data access is Drizzle over the direct/pooled Postgres connection
(`supabase.*` calls are auth-only: signInWithOtp/OAuth, getUser, exchangeCodeForSession,
signOut). That connection is the `postgres` role (`rolbypassrls = true`), so RLS does not
affect it.

**Effect:** RLS enabled + zero policies = deny-all for the `anon`/`authenticated` PostgREST
roles; the Drizzle app path bypasses RLS and is unaffected. Verified after: anon SELECT → 0
rows on all 7 tables, anon INSERT → 401 "violates row-level security policy", Drizzle reads
still return all rows. No `service_role` key is referenced anywhere in the codebase (clients
use only `NEXT_PUBLIC_SUPABASE_ANON_KEY`). If a product ever needs the Supabase data API,
add real policies then — do not just disable RLS.

## topic: sideshift-api — _2026-06_

Phase 0 probe (`scripts/probe-sideshift.mjs`) confirmed the real Sideshift API
against a live key. The brief's assumed endpoints were close but the specifics
matter, so they are pinned here:

- **Base URL:** `https://app.sideshift.app/api/v1` (the public API; note the
  `app.` host + `/api/v1` path. `app.sideshift.app/api/*` without `/v1` is the
  web app's internal API and wants a Firebase token — not for us.)
- **Auth:** header `x-api-key: <key>` (NOT `Authorization: Bearer`).
- **Identity (brief confirmed):** the stable creator id is a Firebase uid, exposed
  identically as `topCreators[].id`, `handles[].userId`, and `/creators[].id` —
  this is the auto-link key (`creators.external_id`).
- **Endpoints the adapter uses:**
  - `GET /programs?status=active` — paginated `{data, page, total, totalPages}`.
    Each program: `id, name, companyId, companyName, status, startsAt/endsAt`
    (unix **seconds**), plus aggregate `stats` and a `handles[]` registry.
  - `GET /creators?programId=X&limit=200` — paginated full roster (default page
    size 25): `{id, name, email, phone, profileImageUrl, campaigns[]}`, where
    `campaigns[].handles[]` are the per-program handles. → CRM + campaign_accounts.
  - `GET /analytics/overview?programId=X&topCreatorsLimit=1000` — `data.topCreators[]`
    = `{id, name, totalViews, totalPosts}`, the **per-creator lifetime totals** =
    snapshot rows. Only creators with activity appear (verified: Σ topCreators
    views == summary.totalViews exactly, so it's the complete metrics set).
- **Date range:** `/analytics/overview` takes `topCreatorsLimit` (creator count),
  not a date range. Date-range params return 200 but don't change the payload →
  totals are **lifetime**; windows come from snapshot subtraction (as the brief
  assumed). The `topCreatorsLimit` knob is the one simplification found.

**Why pinned:** the adapter (`lib/ingest/sideshift.ts`) is the only place that
talks to this API; everything else reads normalized data. If the API changes,
this entry + that file are the two things to update.

## topic: leaderboard-windows — _2026-06_

How the leaderboard derives its numbers. Verified against the live API + fixtures
(program `WDeIefXYKcb5SIeMLhst`), not assumed. Refines `topic: sideshift-api`.

- **Population — rank only creators who POSTED (vendor-confirmed, Daniel 2026-06):**
  the ranked set is exactly `topCreators[]` (== `summary.uniqueCreators`). NO filtering
  by `creators.approved` (that tracks approved contracts, == `summary.activeContracts`,
  not the metric grain) and NO roster-membership filter. Identity joins from `handles[]`
  by `userId`; metrics from `topCreators[]` by `id` (join key LOCKED, live-tested 10/10).
- **Full metric set:** the knob is `topCreatorsLimit` (not `limit`/`topN`, which are
  ignored). `=1000` returns all `summary.uniqueCreators`. The adapter throws if it gets
  fewer than `uniqueCreators`, so silent truncation can't slip through.
- **All-time = LIVE lifetime totals (vendor will fix repurposing, Daniel 2026-06):**
  accounts get **repurposed** across campaigns — old content deleted, warm account kept —
  so a per-(creator, campaign) *lifetime* total can DECREASE after a campaign ends,
  contaminating **all-time** boards (7d/30d are clean — active campaigns, no repurposing
  that soon). The vendor confirmed they will fix the carried-over stats on their end
  (timeline unknown). **Decision: do NOT build the all-time-freeze workaround.** All-time
  uses the **latest** `lifetime_views` per (creator, program), summed across a creator's
  programs by stable `external_id` (full history, live values). **TODO (remove when
  vendor ships the fix):** if contamination proves material before then, build a freeze
  fallback (`MAX(lifetime_views)` per program+creator) — our `snapshots` are immutable,
  so the historical data for it is already preserved with zero loss.
- **Orphan creators → UPSERT (decided):** a `topCreators` metric can reference a creator
  absent from the current `/creators` roster (a repurposed one). The pipeline upserts the
  creator from the metric's `id`+`name` (already in `lib/ingest/sync.ts`) rather than
  skipping, so the posted-content population above is fully ranked. The `sync_runs`
  "views decreased" warning remains the erosion signal.

- **Window qualification is PER-PROGRAM (recorded choice):** a program contributes to an
  N-day window only if it individually has ≥ N days of snapshot history; warm-up + `asOf`
  + `daysOfHistory` derive from that same qualifying set, never a global min/max. Known
  gap: a creator active across two *disjoint young* campaigns (each < N days) sees the
  overall N-day board as warming up rather than stitched across campaigns — accepted.
- **Deltas floored at 0:** a 7d/30d window decrease never shows on the board
  (`greatest(delta, 0)`). The erosion signal is `sync_runs.warnings` (views_decreased),
  not the board. Tie ranking is **views-only** (equal views share a rank; `posts`/`name`
  set display order only). Delta baseline is the snapshot **at/before** `latest − N`
  (≤ ~1 day bias with daily snapshots) — accepted, no change.

**Why:** these are the difference between a correct board and a plausible-but-wrong one.
All of it lives ONLY in `lib/queries/leaderboard.ts`, proven by a committed, re-runnable
test (`scripts/test-leaderboard.ts`, CI job `leaderboard-test`). _Supersedes the earlier
all-time-freeze plan, dropped after the vendor confirmed an upstream fix._

## topic: leaderboard-access — _2026-06_

The leaderboard (`/leaderboard`, → `leaderboard.vocreations.com`) launched with
**per-creator magic-link auth (Supabase Auth)**, not a shared password.

- **Auth:** Supabase Auth, **magic links only** for launch (Google OAuth deferred —
  needs a Google Cloud client; follow-up). `lib/supabase/*` handles sessions; session
  refresh runs in `middleware.ts` for `/leaderboard` + `/auth` only.
- **Identity → data:** `session.email → creators.email → creator_id` (case-insensitive,
  `lib/queries/creator-access.ts`). All board data still comes from Drizzle keyed off
  the resolved creator — **no Supabase RLS** (Supabase is auth-only; our `creators`
  table is the authz source).
- **Access model:** a recognized creator sees the **overall** board + only the
  campaigns they're on (`program_creators`); the switcher lists only their campaigns;
  an unknown/unauthorized campaign param silently falls back to overall (enforced
  server-side in `page.tsx` against `getCreatorPrograms(creator.id)`, not the UI).
- **Overall-board cross-creator visibility is INTENDED (decided):** the overall board
  shows every creator's name + aggregate views across all campaigns to any recognized
  creator. This is by design (a shared agency board), not a leak — recorded so it's a
  conscious choice.
- **Alt emails are login-eligible (decided):** `creators.alt_email` (nullable, additive
  migration `0001`). `getCreatorByEmail` matches `email` OR `alt_email` (case-insensitive,
  input trimmed). The seed maps `email_primary → email`, `email_alt → alt_email`.
- **Open-redirect guard:** `/auth/callback` accepts only same-origin LOCAL `next` paths
  (must start with `/`, not `//` or `/\`); anything else falls back to `/leaderboard`.
- **Verification caveats (carry forward):**
  (a) The cross-campaign tamper defense (`page.tsx` resolves `c` only against the
  creator's own `getCreatorPrograms`) was verified by **code-path equivalence** — prod
  currently has a single active program, so there's no second campaign to tamper toward.
  **Re-verify with real data when a second campaign goes live.**
  (b) F1's **success-path** redirect branch (valid code → `${origin}${next}`) is exercised
  only after a real magic-link round-trip, which needs the SMTP cutover. **Pending the
  cutover round-trip test.**
- **YOU highlight** renders on both the list (ranks 4+) and the podium (top-3 card carries
  a YOU badge + teal treatment) — the motivational hook must be visible at launch.
- **Host rewrite for the subdomain:** `leaderboard.vocreations.com` rewrites any
  non-`/leaderboard`, non-`/auth` path to `/leaderboard` (in `middleware.ts`) — without
  it the subdomain root serves the marketing homepage. Uses the same
  `request.nextUrl.hostname` pattern as the www-redirect (only exercisable in production;
  `next dev` ignores a spoofed Host header). **VERIFIED in prod 2026-06-08** (commit
  `58b2f21`, DNS = CNAME → vercel-dns): `/` → 307 `/leaderboard/login`; `/about` → 307
  `/leaderboard/login` (rewritten, not the marketing page); `/auth/callback` → 307
  `/leaderboard/login?error=link` (the `?error=link` proves the callback route ran, i.e.
  `/auth` is NOT rewritten); apex `vocreations.com/` still 200 (marketing intact).
- **Staff access = Google OAuth + allow-list (decided):** agency staff sign in with Google
  (Supabase Google provider) and get the FULL dashboard — overall + ALL campaign boards,
  switcher unscoped, "staff view" badge, no YOU (staff aren't ranked). Allow-list is
  `STAFF_EMAILS` (comma-separated) OR `STAFF_EMAIL_DOMAINS` (default `vocreations.com`; set
  to `""` to disable domain matching), checked in `isStaffEmail()` before creator resolution.
  (Note: `@mohios.com` is NOT staff-by-domain — add such addresses to `STAFF_EMAILS`.)
  Non-staff unknown emails still get
  the directed screen. The magic-link + OAuth flows share `/auth/callback` (PKCE). **This
  same Google client is the planned auth for the Phase 4 CRM.**
- **Unknown email → directed screen (not a dead end):** "We don't recognize this email
  yet — DM Danny on Slack with the email you want to use." No data shown.
- **Seeding:** `scripts/seed-creator-emails.mjs` loads `creators.email` from a CSV
  (matches by Sideshift `external_id` / handle / name; dry-run by default).
- `noindex` (layout `robots`), standalone (no marketing nav).

**Why:** logging in as themselves is both the gate and the personalization (the "YOU"
row). Supersedes the interim shared-password / overall-board-only plan. **Supersedes
the old `Phase 5` "creator auth" step — pulled forward into launch.**

## topic: leaderboard-backfill — _2026-06_

Backfilled 7 months of history (2025-11-10 → 2026-06-07) so the 7d/30d boards render
real rankings instead of "warming up" (live snapshots only started 2026-06-07).
Tool: `scripts/backfill-snapshots.mjs` (dry-run by default; `--apply` writes).

- **Source data:** a per-brand CSV export (`backfill-input.csv`, 27 brands × 78 creators,
  brand-grain) + `handles-by-campaign.csv`. Gitignored (PII) — never committed.
- **Append-only:** `insert … on conflict (snapshot_date, program_id, creator_id) do
  nothing`. The live cron's rows are authoritative; the CSV only fills history before them.
- **Brand → program:** reuse an existing program by name; else create (`source='backfill'`,
  `status='ended'`). The 27 backfill brands were all net-new (Allinmotion, the only live
  program, was NOT in this export — its history is a separate follow-up backfill).
- **One human = one creator_id (condition A):** before creating, each backfill creator is
  matched to `active-creators-consolidated.csv` (the master roster) by normalized name; on
  match the row uses the master's **canonical name** so the email seed converges on it
  later (emails arrive via the seed, not here). 67/77 matched the master, 10 net-new
  (tagged in `creators.notes`; 4 are `Ghost: @handle` unattributed accounts).
- Also writes `program_creators` (participation, so the per-creator switcher works) and
  enriches `campaign_accounts` from the handles file.
- **Connection:** uses the DIRECT connection (`POSTGRES_URL_NON_POOLING`), not the
  transaction pooler — the pooler closes long multi-statement transactions; inserts are
  batched (chunks of 500) to keep it short.
- **Applied:** 27 programs, 77 creators, +714 campaign_accounts, 15,682 snapshots.
  Verified 5/5 spot-check (CSV lifetime == DB). **No-seam reconciliation (backfill latest
  ≈ live) is deferred to the Allinmotion follow-up** (disjoint datasets until then).

## topic: payments — _2026-06_

Removed the website checkout (`app/mentorship/enroll/` page and `app/api/checkout/`
route) and the Google Sheets logging in the Stripe webhook (`logToSheet`,
`GOOGLE_SHEET_WEBHOOK`).

**Why:** mentorship is no longer sold through the website — sales go via direct
Stripe payment links sent to buyers. Payment visibility is handled by Slack
notifications alone, so the Sheets path and the on-site checkout were dead weight.
The webhook (`app/api/stripe-webhook/route.js`) stays, posting to Slack only.
`STRIPE_PRICE_FULL` / `STRIPE_PRICE_PLAN` / `GOOGLE_SHEET_WEBHOOK` are now unused
in Vercel (safe to delete).

## topic: marketing-2026-06 — _2026-06_

Shipped a marketing refresh. Supersedes the previous framing.

- **Guarantee** (homepage): now "1,000,000 organic views minimum, or 50% of your
  fee back" — replaces the old "3M+ view baselines" language. (Note: `/creators`
  still references "3M+"; left as-is, not yet reconciled.)
- **Mentorship:** reframed as a 4-month path toward $10–15K/month, replacing the
  old "two months / $3–5K" framing.
- **New routes:** `/daniel`, `/danny`, `/thienvu` (conference/QR landings,
  `noindex`, standalone — no Nav/Footer), plus `/pre-call` and `/refund-policy`.

**Why:** stronger, more concrete positioning and dedicated conversion surfaces for
in-person/QR traffic. These are LIVE on `main` (an earlier SITE.md draft described
them as "not yet live" — that was stale and has been corrected).

## topic: leaderboard-trigger — _2026-06_

The `/campaigns/leaderboard` snapshot is built by an Apps Script on its **own**
time-driven trigger (06:30 daily), fully decoupled from the existing `syncActive()`
digest — installed as a separate trigger, not added inside `syncActive()`.

**Why:** a leaderboard failure must not be able to take down the daily Slack/Discord
campaign digest. Independent triggers isolate the blast radius. Sideshift API keys
stay in Apps Script; Vercel only knows the Web App URL + page password.

## topic: leaderboard — _2026-06_

Removed the creator leaderboard entirely: deleted `app/campaigns/leaderboard/`, the
basic-auth gate in `middleware.ts`, and the `LEADERBOARD_DATA_URL` /
`LEADERBOARD_PASSWORD` env vars (also removed from Vercel). **Supersedes
`topic: leaderboard-trigger`.**

**Why:** the V1 implementation wasn't good enough and is being rebuilt from scratch.
Removed now so the rebuild starts clean rather than extending dead code. The
out-of-repo Apps Script reference copy (`apps-script/campaign-tracker-v2.gs`) is
left in place because the same script still serves the daily campaign digest; its
leaderboard functions are dormant until the rebuild decides what to reuse.

## topic: canonical-domain — _2026-04_

Made **non-www** (`vocreations.com`) the canonical/primary domain; `www` now
308-redirects to it (previously reversed, with a 307). Added `middleware.ts` to
enforce the redirect and strip tracking query params (`?wtime=`, `?trakyo_id=`)
that created duplicate URLs. Added Squarespace legacy-URL redirects in
`next.config.mjs`.

**Why:** GSC flagged duplicate-without-canonical and 404 issues from the old
Squarespace site. Full SEO history: [../SEO-WORK-DIARY.md](../SEO-WORK-DIARY.md).

## topic: showcase-video — _(convention)_

Inline showcase `<video>` blocks always use `src={`${v.src}#t=0.1`}` plus
`playsInline muted loop preload="metadata"`, with `onMouseLeave` resetting
`currentTime = 0.1`.

**Why:** the `#t=0.1` media fragment forces iOS Safari to render the frame at 0.1s
as a thumbnail instead of a black box — no separate poster image needed. Reference:
`app/page.tsx`. Keep all raw `<video>` blocks identical.

## topic: content-assets — _2026-06_

Binary/internal assets under `content/` are gitignored (`*.png/jpg/jpeg/webp`
and `content/UGC Trackr/`); only `content/*.md` notes are tracked. The assets
(LinkedIn banners, source QR/photo files, and the "UGC Trackr" brief +
screenshots) live in Google Drive instead.

**Why:** none are referenced by the site (only `public/` is served; the QR/photo
sources are already duplicated under `public/`). Committing ~15MB of unreferenced
binaries would bloat git history permanently. The UGC Trackr brief is for a
separate project (`voc-trackr-internal` → `trackr.vocreations.com`) and, per the
brief itself, should not live in the marketing repo.

## topic: mercury-webhook — _2026-06_

Added `app/api/mercury-webhook/route.js`: Mercury bank `transaction.created`
events → Slack (#ka-ching, the same `SLACK_WEBHOOK_URL` as the Stripe webhook).
Posts **incoming payments only** (`amount > 0`). Parses Mercury's Events API
envelope (`resourceType` / `operationType` / `mergePatch`), NOT a `{type,data}`
shape. New env var: `MERCURY_WEBHOOK_SECRET`.

**Why:** the team wanted an "agency ka-ching" feed of incoming revenue alongside
the mentorship Stripe alerts. Signature is HMAC-SHA256 over `"<ts>.<body>"`
(`Mercury-Signature` header) with replay protection. Mercury has no test-event
feature, so the handler logs the full payload and falls back to a raw message on
an unexpected shape, to be refined from the first real event.

## topic: deploy — _2026-06_

Deploy by **merging to `main`**; Vercel's git integration builds and ships to
production. Do not deploy prod-only changes via `vercel deploy --prod` from a
branch and expect them to persist.

**Why:** production always resets to `main` on the next git deploy. A CLI/branch
deploy that was never merged silently reverted a live `/about` update when an
unrelated PR merged (recovered by cherry-picking the orphaned commit). Supersedes
the earlier "always deploy via CLI" practice.

## topic: docs-standard — _2026-06_

Adopted **website-build-rules v1**: `CLAUDE.md` router (with the embedded version
marker), `docs/SITE.md` (present-tense wiring, points at `app/` + `.env.example`,
does not enumerate routes/env), this file, and `scripts/docs-check.mjs` +
`.github/workflows/docs-check.yml` (env-sync, dead-links, version-skew).

**Why:** single source of truth for docs across website repos; the version-skew
check replaces the previous hand-rolled "known-broken 30-day expiry" check.
`build.yml` (runs `next build` on PRs) is kept separately, outside the standard.
