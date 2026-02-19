import { parseCookies, SESSION_COOKIE_NAME, verifySessionToken } from "./lib/session.js";

function redirectToLogin(request: Request): Response {
  const url = new URL(request.url);
  const next = `${url.pathname}${url.search}`;
  const loginUrl = new URL(`/login?next=${encodeURIComponent(next)}`, url.origin);
  return Response.redirect(loginUrl, 307);
}

export default async function middleware(request: Request) {
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
  matcher: ["/case-studies/:path*", "/deep-dive/:path*", "/admin/:path*"],
};
