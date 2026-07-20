import type { VercelRequest } from "@vercel/node";
import { parseCookies, SESSION_COOKIE_NAME, verifySessionToken, VIEWER_SESSION_COOKIE_NAME } from "../../lib/session.js";

type AuthResult = { ok: true } | { ok: false; status: number; error: string };

/** Admin-only: gates every CMS write endpoint and the /admin/* pages. A
 * viewer-scope session (company-product case studies + resume) must never
 * satisfy this check. */
export async function assertCmsAuthorized(req: VercelRequest): Promise<AuthResult> {
  const secret = process.env.SITE_PASSWORD;

  if (!secret) {
    return { ok: false, status: 500, error: "Server misconfigured." };
  }

  const cookies = parseCookies(req.headers.cookie ?? null);
  const token = cookies[SESSION_COOKIE_NAME];

  if (!token) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const valid = await verifySessionToken(token, secret);

  if (!valid) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return { ok: true };
}

/** Admin OR viewer: gates read access to gated case-study content and the
 * resume. An admin session always satisfies this (the owner never needs a
 * second login to see their own gated content). */
export async function assertAdminOrViewerAuthorized(req: VercelRequest): Promise<AuthResult> {
  const adminResult = await assertCmsAuthorized(req);
  if (adminResult.ok) {
    return adminResult;
  }

  const viewerSecret = process.env.CASE_STUDY_PASSWORD;
  if (!viewerSecret) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const cookies = parseCookies(req.headers.cookie ?? null);
  const token = cookies[VIEWER_SESSION_COOKIE_NAME];

  if (!token) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const valid = await verifySessionToken(token, viewerSecret);

  if (!valid) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return { ok: true };
}
