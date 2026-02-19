import type { VercelRequest } from "@vercel/node";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 60;
const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }

  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(",")[0].trim();
  }

  return req.socket.remoteAddress ?? "unknown";
}

export function isRateLimited(req: VercelRequest): boolean {
  const ip = getClientIp(req);
  const now = Date.now();
  const current = rateLimitStore.get(ip);

  if (!current || current.resetAt < now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  current.count += 1;
  rateLimitStore.set(ip, current);
  return current.count > MAX_ATTEMPTS;
}
