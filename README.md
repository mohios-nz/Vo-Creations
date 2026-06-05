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
