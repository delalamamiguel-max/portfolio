import { timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildSessionCookie, createSessionToken, SESSION_COOKIE_NAME, VIEWER_SESSION_COOKIE_NAME } from "../lib/session.js";

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

  const adminSecret = process.env.SITE_PASSWORD;
  const viewerSecret = process.env.CASE_STUDY_PASSWORD;

  if (!adminSecret) {
    res.status(500).json({ error: "Server misconfigured." });
    return;
  }

  const providedPassword = typeof req.body?.password === "string" ? req.body.password : "";

  if (safeCompare(providedPassword, adminSecret)) {
    const token = await createSessionToken(adminSecret);
    res.setHeader("Set-Cookie", buildSessionCookie(token, SESSION_COOKIE_NAME));
    res.status(200).json({ ok: true, scope: "admin" });
    return;
  }

  if (viewerSecret && safeCompare(providedPassword, viewerSecret)) {
    const token = await createSessionToken(viewerSecret);
    res.setHeader("Set-Cookie", buildSessionCookie(token, VIEWER_SESSION_COOKIE_NAME));
    res.status(200).json({ ok: true, scope: "viewer" });
    return;
  }

  res.status(401).json({ error: "Incorrect password. Try again." });
}
