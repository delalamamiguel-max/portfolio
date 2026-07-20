# Email and Access-Request Setup

## The one manual step that unblocks everything: Resend

Email delivery (contact form, access requests, approval emails) requires a Resend account. This cannot be automated on your behalf.

1. Sign up at https://resend.com using delalama.miguel@gmail.com.
2. Create an API key (Dashboard > API Keys > Create). Full access or sending access is fine.
3. Add it to Vercel for all three environments:
   `vercel env add RESEND_API_KEY production` (repeat for `preview` and `development`), or via the Vercel dashboard.
4. Redeploy (or just merge the next change). The contact form and access requests start working immediately.

At this point emails send from `onboarding@resend.dev`. Resend only allows that sender to deliver to your own account email, which is exactly the contact-form and request-notification case (they go to delalama.miguel@gmail.com). **Visitor-facing approval emails will not deliver until the domain is verified**, so do step 2 below before approving requests.

## Verified sender domain (required for approval emails to visitors)

1. In Resend: Domains > Add Domain > `migueldelalama.com`.
2. Resend shows DNS records (typically one MX + one TXT for SPF on a `send` subdomain, plus a DKIM TXT record). Add them in Cloudflare (the domain's DNS host), all as DNS-only.
3. Wait for Resend to show Verified, then set the sender:
   `vercel env add CONTACT_FROM_EMAIL production` with a value like `Miguel de la Lama <hello@send.migueldelalama.com>` (repeat for preview/development).

Note: this verifies sending only. It does not create a receiving mailbox; incoming mail keeps going to delalama.miguel@gmail.com, which is the canonical portfolio address used across the site.

## Environment variables

| Variable | Status | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | **Missing, required** | All email delivery. Without it the contact form returns an honest failure and access requests are disabled |
| `CONTACT_FROM_EMAIL` | Optional | Verified sender once the domain is set up; defaults to `onboarding@resend.dev` |
| `CONTACT_TO_EMAIL` | Optional | Where contact messages and access requests arrive; defaults to `delalama.miguel@gmail.com` |
| `SITE_PASSWORD` | Set | Admin scope; also signs the review/grant links (rotating it kills all outstanding links) |
| `CASE_STUDY_PASSWORD` | Set | Viewer scope password; also derives the resume-scope cookie secret |
| `BLOB_READ_WRITE_TOKEN` | Set (auto) | Private `portfolio-access` Blob store holding the access-request registry |

## How the access workflow runs

1. Visitor submits the form at `/request-access` (name, work email, company, optional reason, requested content). No account needed.
2. You receive one email per request with the details and two signed links: Approve (grants exactly the requested content) and Decline. Links expire in 14 days. Nothing is ever sent to the visitor automatically.
3. Clicking Approve emails the visitor a personal access link and emails you a confirmation containing a Revoke link. The visitor's link sets browser sessions for only the approved scopes and stays valid for 90 days (sessions last 12 hours; they re-click the link to renew).
4. States: pending (submitted), approved, declined, revoked (via your revoke link, effective immediately), expired (90 days after approval, enforced on every use).
5. Duplicates: an open request from the same email for overlapping content is acknowledged without creating a new record or emailing you again.

Scope separation is enforced with separate cookies signed by separate secrets: a case-studies grant cannot open the resume and vice versa. The shared password (`CASE_STUDY_PASSWORD`) still unlocks both, since it predates the split and is only handed out by you directly.

## Verifying delivery end to end (after the key is added)

1. Submit the contact form on the live site with a real message.
2. Confirm the email arrives at delalama.miguel@gmail.com (check spam the first time).
3. Submit an access request, approve it from the email, and confirm the approval email arrives at the requesting address.
