import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "cutflow_session";
const PUBLIC_PATHS = ["/login", "/register"];

/**
 * Who may embed this app in an iframe.
 * Default: self + the Arena preview sandbox. Override with
 * FRAME_ANCESTORS="'self'" in .env to lock embedding down completely.
 */
const FRAME_ANCESTORS =
  process.env.FRAME_ANCESTORS ??
  "'self' https://*.arena.site https://arena.site https://*.arena.ai https://arena.ai https://*.e2b.app";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  let res: NextResponse;
  if (!hasSession && !isPublic) {
    const to = req.nextUrl.clone();
    to.pathname = "/login";
    to.searchParams.set("next", pathname);
    res = NextResponse.redirect(to);
  } else if (hasSession && isPublic) {
    const to = req.nextUrl.clone();
    to.pathname = "/";
    to.search = "";
    res = NextResponse.redirect(to);
  } else {
    res = NextResponse.next();
  }

  // --- security headers (defense in depth) ---
  // NOTE: no legacy X-Frame-Options — it cannot express an allow-list and
  // breaks trusted preview/embed hosts. CSP frame-ancestors below is the
  // modern, strictly-scoped replacement.
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), geolocation=(), payment=(), microphone=(self)");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://img.youtube.com https://i.ytimg.com",
      "media-src 'self' blob: data:",
      "connect-src 'self' https://api.openai.com",
      `frame-ancestors ${FRAME_ANCESTORS}`,
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)"],
};
