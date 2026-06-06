import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Query params to strip: tracking/embed params that create duplicate URLs */
const STRIP_PARAMS = ["wtime", "trakyo_id"];

// DECISION 2026-04: non-www is canonical; www permanent-redirects here and tracking
// params are stripped to kill duplicate URLs. See docs/DECISIONS.md (topic: canonical-domain).
export function middleware(request: NextRequest) {
  const { hostname, pathname, searchParams } = request.nextUrl;

  // 1. Redirect www → non-www
  if (hostname === "www.vocreations.com") {
    const url = new URL(`https://vocreations.com${pathname}`);
    // Preserve non-junk query params
    searchParams.forEach((value, key) => {
      if (!STRIP_PARAMS.includes(key)) {
        url.searchParams.set(key, value);
      }
    });
    return NextResponse.redirect(url, 301);
  }

  // 2. Strip tracking query params that cause duplicate indexing
  let stripped = false;
  const cleanParams = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (STRIP_PARAMS.includes(key)) {
      stripped = true;
    } else {
      cleanParams.set(key, value);
    }
  });

  if (stripped) {
    const url = request.nextUrl.clone();
    url.search = cleanParams.toString() ? `?${cleanParams.toString()}` : "";
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    "/((?!_next/static|_next/image|favicon\\.png|icon\\.png|apple-icon\\.png|og-image\\.png|robots\\.txt|sitemap\\.xml|api/).*)",
  ],
};
