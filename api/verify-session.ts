import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parseCookies, SESSION_COOKIE_NAME, verifySessionToken } from "../lib/session.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ authenticated: false });
    return;
  }

  const secret = process.env.SITE_PASSWORD;

  if (!secret) {
    res.status(500).json({ authenticated: false });
    return;
  }

  const cookies = parseCookies(req.headers.cookie ?? null);
  const token = cookies[SESSION_COOKIE_NAME];

  if (!token) {
    res.status(200).json({ authenticated: false });
    return;
  }

  const authenticated = await verifySessionToken(token, secret);
  res.status(200).json({ authenticated });
}
