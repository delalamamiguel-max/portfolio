import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parseCookies, SESSION_COOKIE_NAME, verifySessionToken, VIEWER_SESSION_COOKIE_NAME } from "../lib/session.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ authenticated: false, scope: null });
    return;
  }

  const adminSecret = process.env.SITE_PASSWORD;
  const viewerSecret = process.env.CASE_STUDY_PASSWORD;
  const cookies = parseCookies(req.headers.cookie ?? null);

  const adminToken = cookies[SESSION_COOKIE_NAME];
  if (adminSecret && adminToken && (await verifySessionToken(adminToken, adminSecret))) {
    res.status(200).json({ authenticated: true, scope: "admin" });
    return;
  }

  const viewerToken = cookies[VIEWER_SESSION_COOKIE_NAME];
  if (viewerSecret && viewerToken && (await verifySessionToken(viewerToken, viewerSecret))) {
    res.status(200).json({ authenticated: true, scope: "viewer" });
    return;
  }

  res.status(200).json({ authenticated: false, scope: null });
}
