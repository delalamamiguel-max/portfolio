import type { VercelRequest, VercelResponse } from "@vercel/node";
import { CANONICAL_PORTFOLIO_EMAIL, sendEmail } from "../lib/email.js";
import { accessTokenSecret, createAccessToken, verifyAccessToken } from "../lib/access-tokens.js";
import { findRequest, storeConfigured, updateRequest, type AccessScope } from "../lib/access-store.js";

// Owner-only review actions. These endpoints are reachable only through
// HMAC-signed, expiring links that are emailed exclusively to the canonical
// portfolio address, so possession of a valid token IS the authorization.

const GRANT_TTL_SECONDS = 60 * 60 * 24 * 90; // approved access lasts 90 days
const SCOPE_LABELS: Record<AccessScope, string> = {
  "case-studies": "the private case studies",
  resume: "the resume",
};

function page(res: VercelResponse, status: number, title: string, detail: string) {
  res.status(status).setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title><style>body{font-family:system-ui,sans-serif;max-width:560px;margin:15vh auto;padding:0 20px;color:#0f172a}h1{font-size:22px}p{color:#475569;line-height:1.6}</style></head><body><h1>${title}</h1><p>${detail}</p></body></html>`,
  );
}

function requestBaseUrl(req: VercelRequest): string {
  const host = req.headers.host ?? "www.migueldelalama.com";
  const proto = (req.headers["x-forwarded-proto"] as string) ?? "https";
  return `${proto}://${host}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const token = typeof req.query.token === "string" ? req.query.token : "";
  const secret = accessTokenSecret(process.env.SITE_PASSWORD ?? "");
  const payload = token ? await verifyAccessToken(token, secret) : null;

  if (!payload || payload.act === "grant") {
    page(res, 403, "Link invalid or expired", "This review link is no longer valid. Ask the visitor to submit a new request if needed.");
    return;
  }

  if (!storeConfigured()) {
    page(res, 500, "Storage unavailable", "The access-request store is not configured, so this request cannot be updated.");
    return;
  }

  const request = await findRequest(payload.rid);
  if (!request) {
    page(res, 404, "Request not found", "This access request does not exist in the registry.");
    return;
  }

  const reviewedAt = new Date().toISOString();

  if (payload.act === "decline") {
    if (request.status !== "pending") {
      page(res, 200, "Already handled", `This request is already marked ${request.status}. No change was made.`);
      return;
    }
    await updateRequest(request.id, { status: "declined", reviewedAt });
    page(res, 200, "Request declined", `${request.name} (${request.email}) was declined. No email was sent to the visitor.`);
    return;
  }

  if (payload.act === "revoke") {
    if (request.status !== "approved") {
      page(res, 200, "Nothing to revoke", `This request is marked ${request.status}, so there is no active access to revoke.`);
      return;
    }
    await updateRequest(request.id, { status: "revoked", reviewedAt });
    page(res, 200, "Access revoked", `Access for ${request.name} (${request.email}) is revoked. Their access link stops working immediately.`);
    return;
  }

  // Approve
  if (request.status === "approved") {
    page(res, 200, "Already approved", `${request.name} already has access. Use the revoke link from your confirmation email to withdraw it.`);
    return;
  }
  if (request.status === "revoked" || request.status === "declined") {
    page(res, 200, "Request closed", `This request was previously ${request.status}. Ask the visitor to submit a new request to grant access.`);
    return;
  }

  const accessExpiresAt = Math.floor(Date.now() / 1000) + GRANT_TTL_SECONDS;
  const approvedScopes = request.requestedScopes;

  await updateRequest(request.id, { status: "approved", approvedScopes, reviewedAt, accessExpiresAt });

  const base = requestBaseUrl(req);
  const grantToken = await createAccessToken({ rid: request.id, act: "grant", exp: accessExpiresAt }, secret);
  const grantUrl = `${base}/api/access-grant?token=${grantToken}`;
  const scopeText = approvedScopes.map((scope) => SCOPE_LABELS[scope]).join(" and ");

  const visitorDelivery = await sendEmail({
    to: request.email,
    subject: "Your access to Miguel de la Lama's portfolio",
    text: [
      `Hi ${request.name},`,
      "",
      `Your request for access to ${scopeText} has been approved.`,
      "",
      `Open this personal access link to unlock the content in your browser:`,
      grantUrl,
      "",
      "Notes:",
      "- The link is personal to you. Please do not forward it.",
      "- It unlocks only the content you requested.",
      "- Access lasts 90 days. If it expires, just submit a new request.",
      "",
      "Thanks for your interest,",
      "Miguel de la Lama",
    ].join("\n"),
  });

  if (!visitorDelivery.ok) {
    // Roll back so the request can be re-approved once email works again.
    await updateRequest(request.id, { status: "pending", approvedScopes: undefined, reviewedAt: undefined, accessExpiresAt: undefined });
    page(res, 502, "Approval not sent", "The visitor email could not be delivered, so the request stays pending. Check email configuration and click approve again.");
    return;
  }

  const revokeToken = await createAccessToken({ rid: request.id, act: "revoke", exp: accessExpiresAt }, secret);
  await sendEmail({
    to: CANONICAL_PORTFOLIO_EMAIL,
    subject: `Approved: ${request.name} (${request.company})`,
    text: [
      `You approved access for ${request.name} (${request.email}) to ${scopeText}.`,
      `Access expires automatically in 90 days.`,
      "",
      `Revoke at any time: ${base}/api/access-review?token=${revokeToken}`,
    ].join("\n"),
  });

  page(res, 200, "Approved and sent", `${request.name} (${request.email}) now has access to ${scopeText}. They received their access link by email, and you received a revoke link.`);
}
