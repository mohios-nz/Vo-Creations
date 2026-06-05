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

## Environment variables

`.env.example` is the source of truth for which vars exist. Values are set in Vercel.

| Var | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe API calls in the webhook |
| `STRIPE_WEBHOOK_SECRET` | Verify Stripe webhook signatures |
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhook for payment notifications |
| `LEADERBOARD_DATA_URL` | Apps Script Web App URL returning leaderboard snapshot JSON |
| `LEADERBOARD_PASSWORD` | Basic-auth password for `/campaigns/leaderboard` (rotate quarterly) |

`STRIPE_PRICE_FULL`, `STRIPE_PRICE_PLAN`, and `GOOGLE_SHEET_WEBHOOK` still exist in
Vercel but are unused (safe to delete). See [DECISIONS.md](DECISIONS.md) `topic: payments`.
