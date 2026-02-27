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
13. Dynamic import resilience checks:
   - After a new deployment, reload an older open tab and confirm stale bundle errors recover with a one-time reload.
14. Homepage profile image CMS checks:
   - Upload square profile image from `/admin/pages`.
   - Confirm `home.json` saves.
   - Confirm homepage hero renders the profile image responsively.
