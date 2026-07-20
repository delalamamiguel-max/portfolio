import type { VercelRequest, VercelResponse } from "@vercel/node";
import { CANONICAL_PORTFOLIO_EMAIL, sendEmail } from "../lib/email.js";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
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

function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const ip = getClientIp(req);

  if (isRateLimited(ip)) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }

  // Honeypot: hidden field real visitors never fill. Pretend success so bots
  // learn nothing and stop retrying.
  if (typeof req.body?.website === "string" && req.body.website.trim() !== "") {
    res.status(200).json({ ok: true });
    return;
  }

  const email = typeof req.body?.email === "string" ? req.body.email.trim().slice(0, 200) : "";
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  const sourcePage = typeof req.body?.sourcePage === "string" ? req.body.sourcePage.replace(/[\r\n]+/g, " ").trim().slice(0, 200) : "";

  if (!isValidEmail(email) || message.length < 8 || message.length > 2000) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const submittedAt = new Date().toISOString();

  const delivery = await sendEmail({
    to: CANONICAL_PORTFOLIO_EMAIL,
    subject: `Portfolio contact from ${email}`,
    replyTo: email,
    text: [
      `From: ${email}`,
      `Submitted: ${submittedAt}`,
      sourcePage ? `Source page: ${sourcePage}` : "Source page: (not provided)",
      "",
      message,
    ].join("\n"),
  });

  if (!delivery.ok) {
    const status = delivery.reason === "unconfigured" ? 503 : 502;
    res.status(status).json({ error: "Unable to send right now." });
    return;
  }

  res.status(200).json({ ok: true });
}
