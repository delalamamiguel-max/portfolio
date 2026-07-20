import { randomUUID } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isRateLimited } from "./cms/rate-limit.js";
import { CANONICAL_PORTFOLIO_EMAIL, emailConfigured, sendEmail } from "../lib/email.js";
import { accessTokenSecret, createAccessToken } from "../lib/access-tokens.js";
import { addRequest, findOpenRequestByEmail, storeConfigured, type AccessScope } from "../lib/access-store.js";

export const RECEIVED_MESSAGE =
  "Request received. Access is reviewed personally and is not granted automatically. If approved, you'll receive an email with access instructions.";

const SCOPE_LABELS: Record<AccessScope, string> = {
  "case-studies": "Case studies",
  resume: "Resume",
};

const REVIEW_LINK_TTL_SECONDS = 60 * 60 * 24 * 14; // owner has 14 days to act

function requestBaseUrl(req: VercelRequest): string {
  const host = req.headers.host ?? "www.migueldelalama.com";
  const proto = (req.headers["x-forwarded-proto"] as string) ?? "https";
  return `${proto}://${host}`;
}

function normalizeScopes(input: unknown): AccessScope[] | null {
  if (input === "case-studies") return ["case-studies"];
  if (input === "resume") return ["resume"];
  if (input === "both") return ["case-studies", "resume"];
  return null;
}

function cleanLine(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, maxLength);
}

function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (isRateLimited(req)) {
    res.status(429).json({ error: "Too many requests. Please try again later." });
    return;
  }

  // Honeypot: real visitors never see or fill this field. Pretend success so
  // bots learn nothing.
  if (typeof req.body?.website === "string" && req.body.website.trim() !== "") {
    res.status(200).json({ ok: true, message: RECEIVED_MESSAGE });
    return;
  }

  const name = cleanLine(req.body?.name, 120);
  const email = cleanLine(req.body?.email, 200).toLowerCase();
  const company = cleanLine(req.body?.company, 160);
  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0, 1000) : "";
  const scopes = normalizeScopes(req.body?.requestedContent);

  if (!name || !company || !scopes || !isValidEmail(email)) {
    res.status(400).json({ error: "Please fill in your name, work email, company, and the content you are requesting." });
    return;
  }

  if (!emailConfigured()) {
    console.error("[access-request] email is not configured; request cannot be forwarded for review.");
    res.status(503).json({ error: "Requests are temporarily unavailable. Please email me directly." });
    return;
  }

  try {
    // Duplicate suppression: an open (pending or still-valid approved) request
    // for an overlapping scope from the same email is acknowledged without
    // creating a new record or re-notifying.
    if (storeConfigured()) {
      const existing = await findOpenRequestByEmail(email, scopes);
      if (existing) {
        res.status(200).json({ ok: true, message: RECEIVED_MESSAGE });
        return;
      }
    }

    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const secret = accessTokenSecret(process.env.SITE_PASSWORD ?? "");
    const exp = Math.floor(Date.now() / 1000) + REVIEW_LINK_TTL_SECONDS;
    const base = requestBaseUrl(req);

    const approveToken = await createAccessToken({ rid: id, act: "approve", exp }, secret);
    const declineToken = await createAccessToken({ rid: id, act: "decline", exp }, secret);

    const scopeText = scopes.map((scope) => SCOPE_LABELS[scope]).join(" + ");
    const lines = [
      "New access request for the portfolio.",
      "",
      `Name: ${name}`,
      `Work email: ${email}`,
      `Company: ${company}`,
      `Requested content: ${scopeText}`,
      reason ? `Reason: ${reason}` : "Reason: (not provided)",
      `Submitted: ${createdAt}`,
      "",
      `Approve (${scopeText}): ${base}/api/access-review?token=${approveToken}`,
      `Decline: ${base}/api/access-review?token=${declineToken}`,
      "",
      "Approval emails the visitor a secure access link limited to the requested content.",
      "Review links expire in 14 days. Nothing is sent to the visitor unless you approve.",
    ];

    const delivery = await sendEmail({
      to: CANONICAL_PORTFOLIO_EMAIL,
      subject: `Access request: ${name} (${company}) for ${scopeText}`,
      text: lines.join("\n"),
      replyTo: email,
    });

    if (!delivery.ok) {
      res.status(502).json({ error: "Your request could not be submitted right now. Please email me directly." });
      return;
    }

    // Persist only after the notification email succeeds. A failed email must
    // not leave an orphaned pending row that dedupe-blocks the visitor's retry
    // behind a false acknowledgement.
    if (storeConfigured()) {
      try {
        await addRequest({
          id,
          name,
          email,
          company,
          reason: reason || undefined,
          requestedScopes: scopes,
          status: "pending",
          createdAt,
        });
      } catch (storeError) {
        // The owner already has the emailed request; a missing row only means
        // the review link will report not-found and the visitor can resubmit.
        console.error("[access-request] store write failed after notification", {
          message: storeError instanceof Error ? storeError.message : "unknown",
        });
      }
    }

    res.status(200).json({ ok: true, message: RECEIVED_MESSAGE });
  } catch (error) {
    console.error("[access-request] failed", { message: error instanceof Error ? error.message : "unknown" });
    res.status(500).json({ error: "Your request could not be submitted right now. Please email me directly." });
  }
}
