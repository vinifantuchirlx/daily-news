import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { sessionCookie, verifySessionToken } from "./lib/auth";

const intlMiddleware = createIntlMiddleware(routing);

const PUBLIC_PATHS = ["/login"];

function isPublicPath(pathname: string): boolean {
  // strip locale prefix (e.g. /pt-BR/login -> /login)
  const stripped = pathname.replace(/^\/(en|pt-BR)(?=\/|$)/, "") || "/";
  return PUBLIC_PATHS.some((p) => stripped === p || stripped.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth for API routes (they do their own checks) and static assets.
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  if (!isPublicPath(pathname)) {
    const token = request.cookies.get(sessionCookie.name)?.value;
    const ok = token ? await verifySessionToken(token) : false;
    if (!ok) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except internals / static files.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
