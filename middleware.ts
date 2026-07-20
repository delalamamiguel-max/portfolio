import {
  parseCookies,
  resumeScopeSecret,
  RESUME_SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  verifySessionToken,
  VIEWER_SESSION_COOKIE_NAME,
} from "./lib/session.js";
import { PUBLIC_CASE_STUDY_SLUGS } from "./lib/case-study-access.js";

const CASE_STUDY_PATH = /^\/case-studies\/([a-z0-9-]+)$/;
const CASE_STUDY_IMAGE_PATH = /^\/images\/cms\/case-studies-([a-z0-9-]+)\//;

async function hasAdminSession(request: Request): Promise<boolean> {
  const secret = process.env.SITE_PASSWORD;
  if (!secret) return false;

  const token = parseCookies(request.headers.get("cookie"))[SESSION_COOKIE_NAME];
  return Boolean(token) && verifySessionToken(token, secret);
}

async function hasViewerSession(request: Request): Promise<boolean> {
  const secret = process.env.CASE_STUDY_PASSWORD;
  if (!secret) return false;

  const token = parseCookies(request.headers.get("cookie"))[VIEWER_SESSION_COOKIE_NAME];
  return Boolean(token) && verifySessionToken(token, secret);
}

async function hasResumeSession(request: Request): Promise<boolean> {
  const secret = process.env.CASE_STUDY_PASSWORD;
  if (!secret) return false;

  const token = parseCookies(request.headers.get("cookie"))[RESUME_SESSION_COOKIE_NAME];
  return Boolean(token) && verifySessionToken(token, resumeScopeSecret(secret));
}

function redirectToLogin(request: Request): Response {
  const url = new URL(request.url);
  const next = `${url.pathname}${url.search}`;
  const loginUrl = new URL(`/login?next=${encodeURIComponent(next)}`, url.origin);
  return Response.redirect(loginUrl, 307);
}

export default async function middleware(request: Request) {
  const { pathname } = new URL(request.url);

  // Admin surfaces: strictly admin-scope, a viewer session is not enough.
  if (pathname.startsWith("/admin") || pathname === "/style-guide" || pathname.startsWith("/deep-dive/")) {
    if (!(await hasAdminSession(request))) return redirectToLogin(request);
    return fetch(request);
  }

  // Case-study document routes: public slugs pass through untouched; the
  // rest require admin or viewer.
  const caseStudySlug = pathname.match(CASE_STUDY_PATH)?.[1];
  if (caseStudySlug) {
    if (PUBLIC_CASE_STUDY_SLUGS.has(caseStudySlug)) return fetch(request);
    if (!((await hasAdminSession(request)) || (await hasViewerSession(request)))) return redirectToLogin(request);
    return fetch(request);
  }

  // Case-study images live under /images/cms/case-studies-<slug>/... and
  // follow the same public/gated split as the document route above. Other
  // /images/cms/* assets (e.g. the homepage profile photo) are untouched.
  const imageSlug = pathname.match(CASE_STUDY_IMAGE_PATH)?.[1];
  if (imageSlug) {
    if (PUBLIC_CASE_STUDY_SLUGS.has(imageSlug)) return fetch(request);
    if (!((await hasAdminSession(request)) || (await hasViewerSession(request)))) return redirectToLogin(request);
    return fetch(request);
  }

  // Resume: its own scope. A case-study-only grant must not open the resume,
  // so this checks the resume cookie, never the case-study one.
  if (pathname.startsWith("/files/cms/resume/") || pathname === "/resume-download") {
    if (!((await hasAdminSession(request)) || (await hasResumeSession(request)))) return redirectToLogin(request);
    return fetch(request);
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
