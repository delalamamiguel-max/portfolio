// Client-side mirror of lib/case-study-access.ts (repo-root, used by
// middleware.ts and api/content.ts). Duplicated because Vite only bundles
// src/, and the two runtimes (Vercel Functions vs. the browser) don't share
// an import graph. Keep both lists identical.
export const PUBLIC_CASE_STUDY_SLUGS = new Set([
  "bidflare-case-study",
  "clockero-case-study",
  "traceguard-ai-case-study",
]);
