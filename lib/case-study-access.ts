// Explicit allow-list of case studies that require NO password at all.
// Everything else under /case-studies/:slug requires an admin or viewer
// session. This mirrors the `category` field in content/case-studies/*.md
// (personal-entrepreneurship = public here; company-products = gated) but is
// kept as an explicit list rather than derived from file content, so the
// access boundary is reviewable in one place and never silently changes
// because a CMS edit changed a category. Keep this in sync with
// src/lib/case-study-access.ts (the client-side mirror).
export const PUBLIC_CASE_STUDY_SLUGS = new Set([
  "bidflare-case-study",
  "clockero-case-study",
  "traceguard-ai-case-study",
]);
