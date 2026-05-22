import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Query params to strip: tracking/embed params that create duplicate URLs */
const STRIP_PARAMS = ["wtime", "trakyo_id"];

/** Prefix for the password-protected creator leaderboard */
const LEADERBOARD_PREFIX = "/campaigns/leaderboard";

/** Verify HTTP basic-auth credentials against LEADERBOARD_PASSWORD. */
function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.LEADERBOARD_PASSWORD;
  if (!expected) return false; // no password set means locked, not open
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;
  try {
    const decoded = atob(header.slice(6));
    const password = decoded.slice(decoded.indexOf(":") + 1);
    return password === expected;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { hostname, pathname, searchParams, protocol } = request.nextUrl;

  // 0. Password-gate the creator leaderboard (basic-auth, noindex via header)
  if (pathname.startsWith(LEADERBOARD_PREFIX)) {
    if (!isAuthorized(request)) {
      return new NextResponse("Authentication required.", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Vo Creations Leaderboard"',
          "X-Robots-Tag": "noindex, nofollow",
        },
      });
    }
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

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
