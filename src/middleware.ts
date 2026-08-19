import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// CORS headers needed because the Kunfupay iframe sandbox
// doesn't include allow-same-origin, making the iframe's origin "null".
// All fetch calls from the embedded page become cross-origin.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const intlMiddleware = createIntlMiddleware(routing);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api")) {
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
    }
    const res = NextResponse.next();
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      res.headers.set(key, value);
    }
    return res;
  }

  return intlMiddleware(req);
}

export const config = {
  // Match all paths except Next.js internals and static files.
  matcher: ["/((?!_next|.*\\..*).*)", "/api/:path*"],
};
