import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  buildSessionCookie,
  createSessionToken,
  resumeScopeSecret,
  RESUME_SESSION_COOKIE_NAME,
  VIEWER_SESSION_COOKIE_NAME,
} from "../lib/session.js";
import { accessTokenSecret, verifyAccessToken } from "../lib/access-tokens.js";
import { findRequest, storeConfigured, updateRequest } from "../lib/access-store.js";

// Visitor-facing grant link from the approval email. Verifies the signed
// token, re-checks the live request state in the store (so revocation and
// expiry are enforced server-side on every use), then sets only the approved
// scope cookies and forwards to the content.

function page(res: VercelResponse, status: number, title: string, detail: string) {
  res.status(status).setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title><style>body{font-family:system-ui,sans-serif;max-width:560px;margin:15vh auto;padding:0 20px;color:#0f172a}h1{font-size:22px}p{color:#475569;line-height:1.6}a{color:#0f766e}</style></head><body><h1>${title}</h1><p>${detail}</p><p><a href="/request-access">Request access again</a> or go to the <a href="/">homepage</a>.</p></body></html>`,
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const token = typeof req.query.token === "string" ? req.query.token : "";
  const secret = accessTokenSecret(process.env.SITE_PASSWORD ?? "");
  const payload = token ? await verifyAccessToken(token, secret) : null;

  if (!payload || payload.act !== "grant") {
    page(res, 403, "Access link invalid or expired", "This access link is no longer valid.");
    return;
  }

  if (!storeConfigured()) {
    page(res, 500, "Temporarily unavailable", "Access checks are temporarily unavailable. Please try again later.");
    return;
  }

  const request = await findRequest(payload.rid);
  if (!request || !request.approvedScopes?.length) {
    page(res, 404, "Access not found", "This access grant does not exist.");
    return;
  }

  if (request.status === "revoked") {
    page(res, 403, "Access revoked", "This access has been revoked.");
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  if (request.status === "approved" && request.accessExpiresAt && request.accessExpiresAt <= now) {
    await updateRequest(request.id, { status: "expired" });
    page(res, 403, "Access expired", "This access link has expired.");
    return;
  }

  if (request.status !== "approved") {
    page(res, 403, "Access not active", `This request is currently ${request.status}.`);
    return;
  }

  const caseStudyPassword = process.env.CASE_STUDY_PASSWORD;
  if (!caseStudyPassword) {
    page(res, 500, "Temporarily unavailable", "Access is temporarily unavailable. Please try again later.");
    return;
  }

  const cookies: string[] = [];
  if (request.approvedScopes.includes("case-studies")) {
    cookies.push(buildSessionCookie(await createSessionToken(caseStudyPassword), VIEWER_SESSION_COOKIE_NAME));
  }
  if (request.approvedScopes.includes("resume")) {
    cookies.push(buildSessionCookie(await createSessionToken(resumeScopeSecret(caseStudyPassword)), RESUME_SESSION_COOKIE_NAME));
  }

  res.setHeader("Set-Cookie", cookies);

  // Session cookies last 12 hours; the grant link itself stays valid for the
  // full access window, so returning visitors just click it again.
  const target = request.approvedScopes.includes("case-studies") ? "/#case-studies" : "/resume-download";
  res.status(307).setHeader("Location", target);
  res.end();
}
