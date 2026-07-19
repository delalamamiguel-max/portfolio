import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clearSessionCookie, SESSION_COOKIE_NAME, VIEWER_SESSION_COOKIE_NAME } from "../lib/session.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  res.setHeader("Set-Cookie", [
    clearSessionCookie(SESSION_COOKIE_NAME),
    clearSessionCookie(VIEWER_SESSION_COOKIE_NAME),
  ]);
  res.status(200).json({ ok: true });
}
