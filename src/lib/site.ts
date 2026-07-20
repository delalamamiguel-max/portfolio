// Single source of truth for the portfolio's contact address. Every visible
// email on the site renders through this constant (via EmailLink) so the
// address can never drift between surfaces again.
export const CONTACT_EMAIL = "hello@migueldelalama.com";

export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;

export function contactMailto(subject?: string): string {
  return subject ? `${CONTACT_MAILTO}?subject=${encodeURIComponent(subject)}` : CONTACT_MAILTO;
}
