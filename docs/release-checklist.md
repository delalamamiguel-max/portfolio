# Release Checklist

## Pre-Deploy
1. Ensure `SITE_PASSWORD` is set in Vercel (`Production`, `Preview`, `Development`).
2. Ensure CMS GitHub env vars are set in Vercel (`Production`, `Preview`, `Development`):
   - `GITHUB_TOKEN`
   - `GITHUB_OWNER`
   - `GITHUB_REPO`
   - `GITHUB_BRANCH`
3. Run `npm ci`.
4. Run `npm run lint`.
5. Run `npm run build`.
6. Run smoke tests locally:
   - `./scripts/qa-smoke.sh http://localhost:3000`
   - `./scripts/qa-smoke.sh http://localhost:3000 "<SITE_PASSWORD>"`

## Deploy
1. Pull latest from main branch.
2. Deploy to preview (`vercel`) and validate private-route redirects.
3. Validate login/logout, `next` redirect flow, and mobile nav/focus behavior.
4. Promote to production (`vercel --prod`).

## Post-Deploy
1. Confirm GitHub Actions `CI` status check completed successfully on the latest `main` commit.
2. If branch protection is enabled, verify `CI / build` is marked as a required passing check.
3. Run smoke tests against production URL:
   - `./scripts/qa-smoke.sh https://<your-domain>`
   - `./scripts/qa-smoke.sh https://<your-domain> "<SITE_PASSWORD>"`
4. Confirm private routes are inaccessible without session.
5. Confirm `/resume.pdf` downloads.
6. Confirm contact form returns success and logs intake metadata server-side.
7. CMS verification checks:
   - Create or edit a case study in `/admin/case-studies`.
   - Confirm save success panel shows `Open admin preview` and `Open live route`.
   - Confirm admin preview route resolves (`/admin/case-studies/preview/:slug`).
   - If content is intended to be public, confirm `Published` is enabled and the public route resolves after deploy.
8. DOCX import checks (case studies):
   - Import `.docx` and review warnings/errors panel.
   - Confirm generated structured content auto-populates before save.
   - Confirm auto-map creates only detected sections (no empty section headings).
   - Confirm imported images render and alt text placeholders are reviewed before publish.
9. Markdown/MDX import checks (case studies):
   - Import `.md` and `.mdx` files and confirm direct body ingestion (no structural rewrite).
   - Confirm frontmatter metadata maps to title/slug/summary/tags when present.
   - Confirm tables, code blocks, links, images, and inline HTML render in preview/front-end.
   - Confirm unordered/ordered lists and nested lists render with bullets/numbers and indentation in:
     - CMS structured content live preview
     - DOCX pre-save preview
     - Published case-study pages
   - Run `npm run qa:markdown` to verify renderer-parity usage checks.
10. Tag overflow and limits checks:
   - Create a case study with 6 tags and confirm tags wrap inside card/detail containers (no overflow).
   - Add a >24-character tag in CMS and confirm real-time validation + save blocking.
11. Back button checks:
   - Case study detail page Back button uses browser history and falls back safely.
   - CMS case studies page Back button appears above the title and uses browser history with `/admin` fallback.
   - CMS editor-level Back button (other markdown domains) uses browser history and falls back to `/admin`.
12. Theme checks (website + CMS):
   - Toggle light/dark from top-right navigation.
   - Confirm preference persists after refresh.
   - Confirm first-load theme respects system preference when localStorage is cleared.
   - Confirm cards, inputs, tags, tables, code blocks, toolbar controls, and DOCX/Markdown import panels remain readable in both themes.
   - Confirm case study index cards + tag pills + “Open case study” links all switch themes consistently (no dark-theme remnants in Light mode).
   - Confirm homepage CTA (“Explore Case Studies”) is visually balanced in Light mode (not overly saturated) and still prominent in Dark mode.
   - Confirm admin preview/save verification panels, login links, and contact form textarea follow theme tokens.
   - Confirm CMS warning/error/success states (import panel, editor validation, save status) use semantic status colors consistently in both themes.
   - Confirm `/admin/pages` profile image helper cards and preview surfaces adapt correctly in Light and Dark mode.
13. Mobile navigation checks:
   - Verify header/nav at `320`, `375`, `390`, `414`, and `768` widths in portrait and landscape.
   - Confirm no horizontal page scrolling from nav overflow.
   - Confirm mobile nav items open via Menu button and do not truncate or overlap.
   - Confirm theme toggle remains visible and aligned in mobile header.
14. Single-page anchor navigation checks:
   - Confirm top nav items scroll to sections on `/` without full page reload.
   - Confirm sticky header offset is respected (section heading is not hidden under header).
   - Confirm active nav state updates while scrolling through `#case-studies`, `#resume`, and `#contact`.
   - Confirm deep-linking works (open `/#resume` directly and verify scroll lands in Resume section).
   - Confirm browser Back/Forward navigation steps through hash anchors correctly.
15. Homepage interaction quality checks:
   - Confirm hero profile image appears larger/editorial and remains balanced on mobile.
   - Confirm resume section renders only one action button (`Download PDF`) and opens PDF in a new tab.
   - Confirm floating `Top` button appears after first viewport and does not obstruct core content.
   - Confirm `Philosophy` section is absent and layout collapses without empty spacing.
   - Confirm footer renders LinkedIn and email links with correct targets.
   - Confirm homepage reveal animations are subtle, staggered, and disabled when reduced-motion is enabled.
16. Case studies detail access checks:
   - Confirm homepage case-study cards navigate to `/case-studies/:slug`.
   - Confirm unauthenticated users are redirected to `/login?next=...`.
   - Confirm authenticated users open detail pages directly without re-prompt.
   - Confirm detail page back button returns to home (`/`) safely.
17. Case study category filter checks:
   - Confirm `Both` is selected by default when homepage loads.
   - Switch to `Company Products` and `Personal / Entrepreneurship`; confirm card list updates without page reload.
   - Confirm no layout flashing/overflow during filter switching.
   - Confirm each case study's `category` frontmatter value controls its visibility in filters.
18. Dynamic import resilience checks:
   - After a new deployment, reload an older open tab and confirm stale bundle errors recover with a one-time reload.
19. Homepage profile image CMS checks:
   - Upload square profile image from `/admin/pages`.
   - Confirm `home.json` saves.
   - Confirm homepage hero renders the profile image responsively.
20. Resume PDF upload checks:
   - Upload a `.pdf` from `/admin/pages` via `Upload Resume (PDF)`.
   - Confirm `downloadablePdfUrl` updates to `/files/cms/resume/...`.
   - Save JSON pages and confirm homepage `Download PDF` opens uploaded file in new tab.
   - Temporarily clear URL and confirm homepage renders disabled fallback button.
21. Homepage repeatable impact checks:
   - Add 4+ `Selected Impact` items in `/admin/pages`.
   - Confirm cards render with consistent two-line headline + two-line support structure and equal heights.
   - Confirm cards wrap into additional rows without overflow in both themes.
22. Homepage strategic pillars CMS checks:
   - Edit pillar `headline`, `subheadline`, and bullets in `/admin/pages`.
   - Save JSON pages and confirm homepage pillar cards update with edited values.
23. Homepage flexible custom section checks:
   - Add one `Narrative` custom section and one `Credential Stack` section in `/admin/pages`.
   - Confirm CMS labels are visible only in admin and never rendered on the public homepage.
   - Confirm custom sections respect layout type and render consistently in light/dark mode.
24. Homepage drag-and-drop order checks:
   - Reorder `Selected Impact`, `Strategic Pillars`, and `Custom Content Sections` items in CMS.
   - Save and confirm published order matches CMS order.
