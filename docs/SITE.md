# vocreations.com — Canonical Site Reference

Concise, factual overview of the site. Reflects the committed (`main`) state. For payment
details see [stripe-slack-integration.md](stripe-slack-integration.md); for SEO history see
[../SEO-WORK-DIARY.md](../SEO-WORK-DIARY.md).

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
| `/api/stripe-webhook` | Stripe → Slack payment webhook (see Payments) |

## Positioning & copy (current / live)

- **Brand tagline:** _make them remember._ (lowercase, small-caps, trailing dot). Documented as
  the brand line; see Brand section of the README.
- **Agency guarantee (homepage FAQ):** "minimum view baselines (3M+ for a well-matched product)";
  no faked attribution or promised conversion rates.
- **Homepage stats:** 100M+ views generated, 30+ brands scaled, 100+ trained creators, 9 days to launch.
- **Mentorship framing:** "From zero to paid creator. In two months." First paid campaign
  included ($500 from the agency); top creators earn $3–5K/month.

> **Pending (uncommitted) refresh — not yet live.** A marketing revision is in progress (currently
> stashed, not deployed) that would: roll the tagline into the nav/footer/metadata, change the
> agency guarantee to "1,000,000 organic views minimum, or 50% of your fee back", reframe the
> mentorship as a 4-month path to $10–15K/month, and add pages `/daniel`, `/danny`, `/thienvu`
> (conference/QR landings), `/pre-call`, and `/refund-policy`. Update this section when that ships.

## Payments

No checkout on the website. Mentorship is sold via **direct Stripe payment links** sent to buyers.
A single Stripe webhook (`app/api/stripe-webhook/route.js`) verifies the signature and posts
`checkout.session.completed`, `invoice.paid` (auto-cancels the subscription after 4 payments), and
`invoice.payment_failed` to **Slack only**. Full detail: [stripe-slack-integration.md](stripe-slack-integration.md).

## Environment variables (Vercel)

| Var | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe API calls in the webhook |
| `STRIPE_WEBHOOK_SECRET` | Verify Stripe webhook signatures |
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhook for payment notifications |
| `LEADERBOARD_DATA_URL` | Apps Script Web App URL returning leaderboard snapshot JSON |
| `LEADERBOARD_PASSWORD` | Basic-auth password for `/campaigns/leaderboard` (rotate quarterly) |

**Unused — safe to delete from Vercel later:**

| Var | Why unused |
|---|---|
| `STRIPE_PRICE_FULL` | Only used by the removed website checkout |
| `STRIPE_PRICE_PLAN` | Only used by the removed website checkout |
| `GOOGLE_SHEET_WEBHOOK` | Sheets logging removed; webhook is Slack-only |

## Removed / deprecated

| Item | Removed | Reason |
|---|---|---|
| `app/mentorship/enroll/` (enroll page) | 2026-06 | No longer selling through the website; sales go via direct Stripe links |
| `app/api/checkout/route.ts` | 2026-06 | Backed the enroll page; obsolete with website checkout gone |
| Google Sheets logging in the webhook (`logToSheet`, `GOOGLE_SHEET_WEBHOOK`) | 2026-06 | Unused; payment visibility is handled by Slack notifications alone |
