# SEO Work Diary — vocreations.com

## 2026-04-08: Google Search Console Indexing Fixes

### Issues Found (from GSC "Why pages aren't indexed" report)

| Issue | Pages | Status |
|---|---|---|
| Not found (404) | 9 | Fixed |
| Duplicate without user-selected canonical | 5 | Fixed |
| Alternate page with proper canonical tag | 5 | Fixed |
| Page with redirect | 3 | Fixed |
| Discovered - currently not indexed | 5 | Awaiting Google recrawl |
| Crawled - currently not indexed | 3 | 2 fixed, 1 no action needed |
| Soft 404 | 0 | Clean |

### Changes Made

**1. Old Squarespace URL redirects** (`next.config.mjs`)
- `/home` → `/`
- `/terms` → `/`
- `/Full` → `/`
- `/privacy-policy-3975-8774-8031-8438-2279-3890` → `/`
- `/terms-and-conditions-4338-7294-8836-7704-3508-2366` → `/`
- `/tmp/*` → `/` (Squarespace build artifacts)
- `/landing-page` → `/`
- `/thanks-for-applying` → `/`

**2. Middleware created** (`middleware.ts`)
- Redirects `www.vocreations.com` → `vocreations.com` (301)
- Strips tracking query params (`?wtime=`, `?trakyo_id=`) that caused duplicate URLs

**3. Vercel domain config updated**
- Changed primary domain from `www.vocreations.com` to `vocreations.com`
- `www.vocreations.com` now redirects → `vocreations.com` (308 permanent)
- Previously was reversed (non-www redirected to www with 307 temporary)

### No Action Needed

- `go.vocreations.com/6396a168` — old landing page subdomain, DNS record already removed. Google will drop it on its own.
- "Discovered - currently not indexed" pages (`/about`, `/blog/text-on-screen-ugc`, `/creators`, `/mentorship`) — real pages in sitemap, just awaiting Google crawl. (`/mentorship/enroll` was later removed entirely along with website checkout, see 2026-06 note below.)

### Next Steps

- [x] Deploy changes to Vercel
- [x] Click "Validate Fix" in GSC for: 404s, Duplicate canonical, Alternate canonical, Page with redirect
- [ ] Use GSC URL Inspection → "Request Indexing" for each of the 4 discovered-but-not-indexed pages
- [ ] Re-check GSC in 1-2 weeks to confirm issues are resolving

---

## 2026-04-08: GSC Validation Status Update

All 6 issue categories now show **Validation: Started** in GSC. Google is actively recrawling affected URLs. Expected resolution in 1-2 weeks.

Note: GSC property is registered under `www.vocreations.com` — sitemap submission must use the www URL. This is fine since www redirects to non-www.

---

## 2026-06: Website checkout removed

Removed the `/mentorship/enroll` page and the `/api/checkout` route. Mentorship is no longer sold through the website; sales go through direct Stripe payment links sent to buyers. `/mentorship/enroll` was also dropped from the sitemap. Google will drop the URL on its own once it recrawls (expect a "404/removed" status, which is intended).
