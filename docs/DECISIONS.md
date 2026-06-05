# DECISIONS — vocreations.com

Past-tense log of non-obvious calls: **why** something is the way it is, and what
changed. Append-only. Each entry has a `topic` key and a date.

**Reading rule:** the **latest entry on a `topic` wins.** A newer entry on the
same topic supersedes older ones (recency decides) — you do not need to find and
edit the old entry. For present-tense "how it works now," see
[SITE.md](SITE.md); this file is only the why/history.

---

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
