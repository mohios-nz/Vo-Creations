# Vo Creations: vocreations.com

UGC agency that trains its own creators through live mentorship. Marketing site built with Next.js (App Router) + Tailwind, deployed on Vercel.

## Brand

- **Tagline:** _make them remember._ (rendered lowercase, in small caps, with the trailing period, the "dot")
- **Voice:** direct, confident, no fluff. No em dashes in site copy.
- **Themes:** Agency = amber accent (`#F5A623`) on near-black. Mentorship = green accent (`#5cff7e`).

Use the tagline in metadata, the homepage hero kicker, and the footer. Keep it styled `font-variant: small-caps` so the casing is consistent everywhere.

## Stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Deployed via Vercel CLI: `vercel deploy --prod`
- Analytics: Vercel Analytics + GA (`G-1TESF8060F`)

## Key conventions

- Metadata lives in each route's `layout.tsx` (or `page.tsx` for server pages). Root metadata + JSON-LD in `app/layout.tsx`.
- Shared chrome: `components/Nav.tsx`, `components/Footer.tsx`.
- SEO history is tracked in `SEO-WORK-DIARY.md`.
- Conference / QR landing pages live at top-level slugs (`/daniel`, `/danny`, `/thienvu`), `noindex`, standalone (no Nav/Footer).
- **Inline showcase videos** (vertical UGC clips in `bg-bg-card` cards): always use this exact setup so the first frame shows as a thumbnail on iOS Safari:
  - `src={`${v.src}#t=0.1`}`: the `#t=0.1` media fragment forces Safari to render the frame at 0.1s instead of a black box (no separate poster image needed).
  - `playsInline muted loop preload="metadata"`
  - `onMouseEnter` plays, `onMouseLeave` pauses and resets `currentTime = 0.1` (back to the thumbnail frame, not 0), `onClick` toggles mute.
  - Reference implementation: `app/page.tsx` (showcase grid). Mirrored in `app/about/page.tsx`. Keep all raw `<video>` blocks identical to this.

## Development

```bash
npm run dev      # local dev at http://localhost:3000
npm run build    # production build
vercel deploy --prod   # deploy to vocreations.com
```

## Payments

Mentorship is sold via **direct Stripe payment links** sent to buyers (Thienvu sends them directly). There is **no checkout flow on the website** — the old `/mentorship/enroll` page and `/api/checkout` route were removed.

A Stripe webhook still runs for visibility. `app/api/stripe-webhook/route.js` verifies the Stripe signature and handles `checkout.session.completed`, `invoice.paid` (auto-cancels the subscription after 4 payments), and `invoice.payment_failed`, posting each to Slack. (Google Sheets logging was removed; the webhook posts to Slack only.)

Full reference: [docs/stripe-slack-integration.md](docs/stripe-slack-integration.md). Canonical site overview: [docs/SITE.md](docs/SITE.md).

**Env vars (Vercel):**

| Var | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe API calls in the webhook |
| `STRIPE_WEBHOOK_SECRET` | Verify incoming webhook signatures |
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhook for notifications |

Unused, safe to delete from Vercel later: `STRIPE_PRICE_FULL` and `STRIPE_PRICE_PLAN` (removed website checkout), and `GOOGLE_SHEET_WEBHOOK` (removed Sheets logging).

## Creator Leaderboard (`/campaigns/leaderboard`)

Password-protected, `noindex` page ranking creators by month-to-date views across active campaigns. Refreshed daily.

**Data flow:** an Apps Script bound to the Campaign Tracker Google Sheet builds the snapshot daily at 06:30 on its own dedicated time-driven trigger, fully decoupled from the existing `syncActive()` digest (so a leaderboard failure cannot take down the daily Slack/Discord digest). It writes the top-10 JSON to a `Leaderboard-Current` tab and exposes it via a Web App `doGet()`. This page fetches that JSON (server-side, `revalidate: 3600`). Sideshift API keys never leave Apps Script; Vercel only knows the Web App URL and the page password.

- Reference copy of the Apps Script: [apps-script/campaign-tracker-v2.gs](apps-script/campaign-tracker-v2.gs). Live home is the `4-Automations/Daily Campaign Updates Slack-Descript` project.
- Page degrades gracefully: if `LEADERBOARD_DATA_URL` is unset or returns no creators, it shows a "warming up" state. No placeholder data is ever rendered.

**Env vars (Vercel):**

| Var | Purpose |
| --- | --- |
| `LEADERBOARD_DATA_URL` | The Apps Script Web App deployment URL returning the snapshot JSON. |
| `LEADERBOARD_PASSWORD` | Shared basic-auth password for the page. Rotate quarterly. |

Auth is enforced in [middleware.ts](middleware.ts) for `/campaigns/leaderboard*`; any username works, the password must match `LEADERBOARD_PASSWORD`. If `LEADERBOARD_PASSWORD` is unset the route returns 401 (locked, not open).

**Operations:**

- **Add/remove a brand:** edit the `SIDESHIFT_KEYS` Script Property in the Apps Script project (JSON map of `{ brandName: apiKey }`). No code change, no Vercel change. Next 06:30 run picks it up.
- **Rotate the password:** update `LEADERBOARD_PASSWORD` in Vercel project settings and redeploy. Share the new value with the creator roster.
- **Manual rebuild:** in the Apps Script editor, run `buildLeaderboardSnapshot()` directly; then hit the page (or wait for revalidation) to see fresh data.
- **If the Web App breaks:** the page shows the "warming up" state rather than erroring. Check the Apps Script execution logs, confirm the Web App deployment is still "Anyone with the link", and re-deploy a new version if the URL changed (then update `LEADERBOARD_DATA_URL`).
