import { timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildSessionCookie, createSessionToken } from "../lib/session.js";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
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

function isRateLimited(ip: string): boolean {
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

function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");

  if (aBuf.length !== bBuf.length) {
    return false;
  }

  return timingSafeEqual(aBuf, bBuf);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const ip = getClientIp(req);

  if (isRateLimited(ip)) {
    res.status(429).json({ error: "Incorrect password. Try again." });
    return;
  }

  const expectedPassword = process.env.SITE_PASSWORD;

  if (!expectedPassword) {
    res.status(500).json({ error: "Server misconfigured." });
    return;
  }

  const providedPassword = typeof req.body?.password === "string" ? req.body.password : "";

  if (!safeCompare(providedPassword, expectedPassword)) {
    res.status(401).json({ error: "Incorrect password. Try again." });
    return;
  }

  const token = await createSessionToken(expectedPassword);

  res.setHeader("Set-Cookie", buildSessionCookie(token));
  res.status(200).json({ ok: true });
}
