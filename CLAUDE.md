# CLAUDE.md — vocreations.com

Router for AI agents. **Read this first, every session.** This repo follows the
website docs standard: a fact lives in exactly ONE file, and this file points you
to it.

## Doc map — where facts live

- **Present-tense "what is it / how is it wired" →** [docs/SITE.md](docs/SITE.md)
- **Past-tense "why it changed" →** [docs/DECISIONS.md](docs/DECISIONS.md)
- **SEO change history →** [SEO-WORK-DIARY.md](SEO-WORK-DIARY.md)
- **Payments detail →** [docs/stripe-slack-integration.md](docs/stripe-slack-integration.md)
- **Human onboarding + brand voice →** [README.md](README.md)

**Discriminators:** present state → SITE; why it changed → DECISIONS; never the
same fact in both. Within DECISIONS, **the latest entry on a topic wins** (a newer
entry silently supersedes an older one on the same `topic:` key — recency decides).

## Decisions index — consult DECISIONS.md before re-deciding any of these

- `payments` — no website checkout; direct Stripe links + Slack-only webhook
- `marketing-2026-06` — guarantee + mentorship reframe shipped (supersedes the old 3M / two-month framing)
- `leaderboard-trigger` — runs on its own Apps Script trigger, decoupled from `syncActive()`
- `canonical-domain` — non-www is canonical; www 308-redirects
- `showcase-video` — `#t=0.1` media fragment for iOS Safari thumbnails

## Known-broken / WIP (cap: ~1 screen — if this overflows, stop and fix the code)

Each entry is **dated**. Treat any entry older than 30 days as suspect: verify
against the code before trusting it. `npm run docs:check` (and CI) fails on any
entry past 30 days, forcing a re-confirm (bump the date) or delete.

- (none — repo is clean)

## Standing instructions

- **Deploy:** `vercel deploy --prod` (or push to `main`; Vercel is git-connected).
- **No em dashes** in site copy. Tagline: _make them remember._ (lowercase, small-caps, trailing dot).
- When you change wiring or env vars, update [docs/SITE.md](docs/SITE.md) **and** `.env.example` in the same change (`npm run docs:check` enforces env↔code sync).
- When you make a non-obvious call, append it to [docs/DECISIONS.md](docs/DECISIONS.md) **and** add a one-line `topic` to the Decisions index above.
- Run `npm run docs:check` before pushing.
