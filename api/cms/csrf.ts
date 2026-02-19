import { randomBytes } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const CSRF_COOKIE_NAME = "cms_csrf";

function parseCookie(cookieHeader: string | null | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const pairs = cookieHeader.split(";").map((entry) => entry.trim());
  for (const pair of pairs) {
    const [key, ...rest] = pair.split("=");
    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return undefined;
}

export function getCsrfCookie(req: VercelRequest): string | undefined {
  return parseCookie(req.headers.cookie, CSRF_COOKIE_NAME);
}

export function csrfCookieHeader(token: string): string {
  return [
    `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "Secure",
    "SameSite=Lax",
    "Max-Age=86400",
  ].join("; ");
}

export function assertCsrf(req: VercelRequest): { ok: true } | { ok: false; status: number; error: string } {
  const origin = req.headers.origin;
  const host = req.headers.host;
  const headerToken = req.headers["x-cms-csrf"];
  const cookieToken = getCsrfCookie(req);

  if (!host || !origin || !origin.includes(host)) {
    return { ok: false, status: 403, error: "CSRF validation failed." };
  }

  if (typeof headerToken !== "string" || !cookieToken || headerToken !== cookieToken) {
    return { ok: false, status: 403, error: "CSRF validation failed." };
  }

  return { ok: true };
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const token = randomBytes(24).toString("hex");
  res.setHeader("Set-Cookie", csrfCookieHeader(token));
  res.status(200).json({ csrfToken: token });
}
