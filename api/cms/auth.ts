import type { VercelRequest } from "@vercel/node";
import { parseCookies, SESSION_COOKIE_NAME, verifySessionToken } from "../../lib/session.js";

export async function assertCmsAuthorized(req: VercelRequest): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
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
