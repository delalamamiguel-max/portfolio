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
1. Run smoke tests against production URL:
   - `./scripts/qa-smoke.sh https://<your-domain>`
   - `./scripts/qa-smoke.sh https://<your-domain> "<SITE_PASSWORD>"`
2. Confirm private routes are inaccessible without session.
3. Confirm `/resume.pdf` downloads.
4. Confirm contact form returns success and logs intake metadata server-side.
5. CMS verification checks:
   - Create or edit a case study in `/admin/case-studies`.
   - Confirm save success panel shows `Open admin preview` and `Open live route`.
   - Confirm admin preview route resolves (`/admin/case-studies/preview/:slug`).
   - If content is intended to be public, confirm `Published` is enabled and the public route resolves after deploy.
6. DOCX import checks (case studies):
   - Import `.docx` and review warnings/errors panel.
   - Confirm generated structured content auto-populates before save.
   - Confirm auto-map creates only detected sections (no empty section headings).
   - Confirm imported images render and alt text placeholders are reviewed before publish.
7. Markdown/MDX import checks (case studies):
   - Import `.md` and `.mdx` files and confirm direct body ingestion (no structural rewrite).
   - Confirm frontmatter metadata maps to title/slug/summary/tags when present.
   - Confirm tables, code blocks, links, images, and inline HTML render in preview/front-end.
8. Homepage profile image CMS checks:
   - Upload square profile image from `/admin/pages`.
   - Confirm `home.json` saves.
   - Confirm homepage hero renders the profile image responsively.
