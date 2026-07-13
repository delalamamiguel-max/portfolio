import { parseCookies, SESSION_COOKIE_NAME, verifySessionToken } from "./lib/session.js";

// Static asset prefixes that hold private content and must not be served
// without a session (the page routes that reference them are gated too).
const PRIVATE_ASSET_PREFIXES = ["/files/cms/resume/", "/images/cms/case-studies-"];

// The broad /images/cms matcher also catches public assets (e.g. the homepage
// profile image); only the private prefixes require a session.
function requiresSession(pathname: string): boolean {
  if (pathname.startsWith("/images/cms/")) {
    return PRIVATE_ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  }
  return true;
}

function redirectToLogin(request: Request): Response {
  const url = new URL(request.url);
  const next = `${url.pathname}${url.search}`;
  const loginUrl = new URL(`/login?next=${encodeURIComponent(next)}`, url.origin);
  return Response.redirect(loginUrl, 307);
}

export default async function middleware(request: Request) {
  const url = new URL(request.url);

  if (!requiresSession(url.pathname)) {
    return;
  }

  const secret = process.env.SITE_PASSWORD;

  if (!secret) {
    return redirectToLogin(request);
  }

  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  const token = cookies[SESSION_COOKIE_NAME];

  if (!token) {
    return redirectToLogin(request);
  }

  const valid = await verifySessionToken(token, secret);

  if (!valid) {
    return redirectToLogin(request);
  }

  return fetch(request);
}

export const config = {
  // ":path+" (not "*") so the bare public redirect route /case-studies stays
  // reachable while every nested detail route requires a session.
  matcher: [
    "/case-studies/:path+",
    "/deep-dive/:path+",
    "/admin/:path*",
    "/resume-download",
    "/style-guide",
    "/files/cms/resume/:path+",
    "/images/cms/:path+",
  ],
};
