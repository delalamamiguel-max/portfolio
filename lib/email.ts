// Shared Resend delivery used by the contact form and the access-request
// workflow. One canonical portfolio address, one sender configuration, one
// sanitized error-logging path.

export const CANONICAL_PORTFOLIO_EMAIL = process.env.CONTACT_TO_EMAIL || "delalama.miguel@gmail.com";
const DEFAULT_FROM_EMAIL = "Miguel de la Lama <onboarding@resend.dev>";

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
};

type SendEmailResult = { ok: true; id: string } | { ok: false; reason: "unconfigured" | "provider" };

export async function sendEmail({ to, subject, text, replyTo }: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("[email] RESEND_API_KEY is not configured; message not delivered.", { subject });
    return { ok: false, reason: "unconfigured" };
  }

  // The visitor's address goes in Reply-To only. The From address must be a
  // Resend-verified sender or SPF/DKIM/DMARC will fail delivery.
  const from = process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM_EMAIL;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("[email] delivery failed", { subject, status: response.status, detail: detail.slice(0, 300) });
      return { ok: false, reason: "provider" };
    }

    const payload = (await response.json()) as { id?: string };
    return { ok: true, id: payload.id ?? "unknown" };
  } catch (error) {
    console.error("[email] request error", { subject, message: error instanceof Error ? error.message : "unknown" });
    return { ok: false, reason: "provider" };
  }
}
