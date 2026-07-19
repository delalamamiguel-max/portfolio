import type { VercelRequest, VercelResponse } from "@vercel/node";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const rateLimitStore = new Map<string, RateLimitEntry>();

const DEFAULT_TO_EMAIL = "delalama.miguel@gmail.com";
const DEFAULT_FROM_EMAIL = "Portfolio Contact <onboarding@resend.dev>";

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

  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";

  if (!isValidEmail(email) || message.length < 8 || message.length > 2000) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("[contact] RESEND_API_KEY is not configured; message not delivered.");
    res.status(503).json({ error: "Contact form is temporarily unavailable." });
    return;
  }

  const toEmail = process.env.CONTACT_TO_EMAIL || DEFAULT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM_EMAIL;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject: `Portfolio contact from ${email}`,
        text: `From: ${email}\n\n${message}`,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("[contact] Resend delivery failed", { status: response.status, detail: detail.slice(0, 500) });
      res.status(502).json({ error: "Unable to send right now. Please email directly." });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[contact] Resend request error", { message: error instanceof Error ? error.message : "unknown" });
    res.status(502).json({ error: "Unable to send right now. Please email directly." });
  }
}
