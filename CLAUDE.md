# CLAUDE.md — vocreations.com

<!-- Embedded build rules: website-build-rules v1 (single source: Projects/website-build-rules.md — re-sync, don't hand-edit this block) -->

## What this is
Marketing site for Vo Creations, a UGC agency that trains its own creators through live mentorship.

## Stack
Next.js 14 (App Router), TypeScript, Tailwind CSS. Hosted on Vercel, git-connected (main→prod).

## Run / deploy
- `npm run dev` — local at http://localhost:3000
- `npm run build` — production build
- Deploy: merge to `main`; Vercel's git integration builds and ships to vocreations.com. Do NOT `vercel deploy --prod` from a branch and expect it to stick — the next `main` deploy overwrites it (see DECISIONS `topic: deploy`).
<!-- docs gate: `npm run docs:check` (scripts/docs-check.mjs) — see website-build-rules.md — Enforcement -->

## Docs
- [docs/SITE.md](docs/SITE.md) — how it works now (present tense): wiring, routes, env, payments.
- [docs/DECISIONS.md](docs/DECISIONS.md) — why / what changed (past tense; latest entry per `topic:` wins).
- [docs/stripe-slack-integration.md](docs/stripe-slack-integration.md) — payments / webhook detail.
- [SEO-WORK-DIARY.md](SEO-WORK-DIARY.md) — SEO change history.
- [README.md](README.md) — human onboarding + brand voice.

## Decisions index (consult DECISIONS.md before re-deciding any of these)
- `sideshift-api` — Creator Data Platform: API base `app.sideshift.app/api/v1`, `x-api-key` auth, lifetime totals → daily snapshot subtraction. Wiring in SITE.md.
- `leaderboard-windows` — join key locked; all-time built from our own snapshots (MAX per program+creator), NOT live API (repurposed-account erosion); orphan creators upserted. 7d/30d are clean deltas.
- `payments` — no website checkout; direct Stripe links; webhook → Slack (#ka-ching)
- `mercury-webhook` — Mercury bank events → Slack #ka-ching (incoming only)
- `marketing-2026-06` — guarantee + mentorship reframe (supersedes the old 3M / two-month framing)
- `leaderboard` — removed 2026-06, rebuilding from scratch on the data platform (old Apps Script/middleware path scrapped)
- `canonical-domain` — non-www is canonical; www 308-redirects
- `showcase-video` — `#t=0.1` media fragment for iOS Safari thumbnails
- `content-assets` — `content/` binaries gitignored, live in Google Drive
- `docs-standard` — adopted website-build-rules v1 (this doc set + `docs:check`)

## Known-broken
<!-- Capped ~1 screen. Each entry: what + recheck-by + clearing condition. Past recheck-by → verify against code, don't trust. -->
- (none)

## Repo conventions
- **No em dashes in site copy** (use commas/colons/periods). Tagline: _make them remember._ (lowercase, small-caps, trailing dot).
- Metadata lives in each route's `layout.tsx` (or `page.tsx` for server pages); root metadata + JSON-LD in `app/layout.tsx`.

## Doc-discipline rules (do every session)
- Touched wiring? Update [docs/SITE.md](docs/SITE.md) in the same change. SITE points at `app/` + `.env.example`, never copies them.
- Made a non-obvious choice? Append a past-tense [docs/DECISIONS.md](docs/DECISIONS.md) entry (and a line in the Decisions index above). If it constrains code, leave `// DECISION yyyy-mm: <what> — see docs/DECISIONS.md` at the code site.
- Keep Known-broken current: each entry carries a `recheck-by` + clearing condition; delete when fixed.
- Present = SITE, past = DECISIONS; no fact in both. Run `npm run docs:check` before pushing.
