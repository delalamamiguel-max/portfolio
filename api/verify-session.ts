import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  parseCookies,
  resumeScopeSecret,
  RESUME_SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  verifySessionToken,
  VIEWER_SESSION_COOKIE_NAME,
} from "../lib/session.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ authenticated: false, scope: null, caseStudies: false, resume: false });
    return;
  }

  const adminSecret = process.env.SITE_PASSWORD;
  const viewerSecret = process.env.CASE_STUDY_PASSWORD;
  const cookies = parseCookies(req.headers.cookie ?? null);

  const adminToken = cookies[SESSION_COOKIE_NAME];
  if (adminSecret && adminToken && (await verifySessionToken(adminToken, adminSecret))) {
    res.status(200).json({ authenticated: true, scope: "admin", caseStudies: true, resume: true });
    return;
  }

  let caseStudies = false;
  let resume = false;

  if (viewerSecret) {
    const viewerToken = cookies[VIEWER_SESSION_COOKIE_NAME];
    if (viewerToken && (await verifySessionToken(viewerToken, viewerSecret))) {
      caseStudies = true;
    }

    const resumeToken = cookies[RESUME_SESSION_COOKIE_NAME];
    if (resumeToken && (await verifySessionToken(resumeToken, resumeScopeSecret(viewerSecret)))) {
      resume = true;
    }
  }

  if (caseStudies || resume) {
    res.status(200).json({ authenticated: true, scope: "viewer", caseStudies, resume });
    return;
  }

  res.status(200).json({ authenticated: false, scope: null, caseStudies: false, resume: false });
}
