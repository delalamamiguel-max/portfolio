# Architected by Miguel

Strategy x Systems x Scaled Execution.

## Stack
- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui foundations
- Vercel Functions + Edge Middleware for password-gated private routes

## Environment Variables
- Required: `SITE_PASSWORD`
- CMS (GitHub writes): `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`

Copy local env:
- `cp .env.example .env`
- Set `SITE_PASSWORD=<your-password>`

## Local Development
1. Install dependencies: `npm install`
2. Start frontend: `npm run dev`
3. For full middleware + API behavior, run with Vercel dev: `npx vercel dev`

## Routes
Public:
- `/`
- `/philosophy`
- `/resume`
- `/contact`
- `/login`

Private:
- `/case-studies`
- `/case-studies/:slug`
- `/deep-dive/:slug`
- `/style-guide`
- `/admin`
- `/admin/pages`
- `/admin/philosophy`
- `/admin/case-studies`
- `/admin/case-studies/preview/:slug`
- `/admin/deep-dive`

## CMS Notes (Current)
- Content edits are GitHub-backed and versioned in-repo via Vercel Functions.
- Public case studies/deep dives are build-time loaded; new content appears publicly after Vercel rebuild completes.
- Theme system:
  - global light/dark toggle in top-right navigation (website + CMS)
  - persists user preference in localStorage
  - first visit respects system preference
  - no-flicker theme init script in `index.html`
- Case Study CMS supports:
  - rich Markdown/MDX-friendly editor toolbar (block style picker, icon-style controls, lists, indent/outdent, links, code/quote)
  - visual table builder (rows/cols, header row, inline cell editing) -> inserts clean Markdown tables
  - inline image uploads (`public/images/cms/...`)
  - image insert preview with alignment and width metadata (`align`, `width`)
  - `.docx`, `.md`, `.mdx` safe-draft import workflow with warnings/preview
  - optional auto-map of imported headings to known case study sections (soft warnings only)
  - post-save verification links (admin preview + public route)
- Case study tag safeguards:
  - max 6 tags
  - max 24 characters per tag
  - real-time validation in CMS and save blocking on violations
- DOCX imports default to draft and require a draft save before publish.
- Case study body Markdown/MDX headings are the source of truth for frontend section structure (dynamic rendering).
- Chunk load recovery: client auto-reloads once when a stale hashed dynamic-import bundle is requested after deployment.

## Production Deploy (Vercel)
1. Ensure `SITE_PASSWORD` is configured in Vercel for `Production`, `Preview`, and `Development`.
2. Validate locally:
   - `npm run lint`
   - `npm run build`
3. Deploy preview: `vercel`
4. Promote to production: `vercel --prod`

## QA
- Manual checklist: `docs/release-checklist.md`
- Automated smoke checks:
  - `./scripts/qa-smoke.sh https://<your-domain>`
  - `./scripts/qa-smoke.sh https://<your-domain> "<SITE_PASSWORD>"`
