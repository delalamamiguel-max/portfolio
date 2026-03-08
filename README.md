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
- `/login`

Private:
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
  - semantic theme tokens drive shared surfaces (`bg`, `card`, `text`, `muted`, `border`, `primary`, `accent`, `link`) across website + CMS
  - semantic status tokens (`success`, `warning`, `danger`) drive CMS warnings/errors/success states
  - Light mode primary CTA palette is intentionally softened (desaturated slate-blue) to avoid overly saturated blue while preserving contrast
- Navigation responsiveness:
  - mobile-first header behavior below `md` uses a Menu toggle (links move to collapsible mobile nav)
  - inline desktop nav is only rendered at `md+`
  - theme toggle remains available in the top-right control cluster on mobile and desktop
  - primary nav is hash-anchor based (`/#case-studies`, `/#resume`, `/#contact`) for single-page flow
- Homepage architecture:
  - single-page section composition driven by `content/pages/home-structure.json`
  - ordered block rendering on `/` with semantic section IDs and scroll offset handling
  - old public routes (`/case-studies`, `/resume`, `/contact`) now redirect to section anchors on `/`
  - `Philosophy` section is removed from the live homepage flow
  - case-study cards on homepage open private detail routes (`/case-studies/:slug`) protected by existing session middleware flow
  - case-study filter controls on homepage support three categories:
    - ordered as: `Both`, `Company Products`, `Personal / Entrepreneurship`
    - `Company Products`
    - `Personal / Entrepreneurship`
    - `Both` (default selected on page load)
  - `Both` filter always returns the full case-study list (all categories)
  - filter changes update case-study cards client-side without route reload
  - resume block on homepage is intentionally CTA-only (`Download PDF`, opens in new tab)
  - footer includes direct LinkedIn and email contact links
  - hero profile image uses an editorial treatment (larger, unframed, high-contrast monochrome)
  - floating `Top` button appears after first viewport and smooth-scrolls upward
  - floating `Top` button appears as soon as user starts scrolling and remains fixed in lower-right
  - subtle scroll-reveal animation is applied to homepage blocks and respects `prefers-reduced-motion`
- Case Study CMS supports:
  - rich Markdown/MDX-friendly editor toolbar (block style picker, icon-style controls, lists, indent/outdent, links, code/quote)
  - visual table builder (rows/cols, header row, inline cell editing) -> inserts clean Markdown tables
  - inline image uploads (`public/images/cms/...`)
  - image insert preview with alignment and width metadata (`align`, `width`)
  - `.docx`, `.md`, `.mdx` safe-draft import workflow with warnings/preview
  - optional auto-map of imported headings to known case study sections (soft warnings only)
  - post-save verification links (admin preview + public route)
  - required category radio per case study:
    - `Company Products`
    - `Personal / Entrepreneurship`
    - `Both`
  - selected category is stored in frontmatter (`category`) and drives homepage filter visibility
  - list rendering parity: editor preview/import preview/published pages all use the same shared Markdown renderer + `.markdown-content` styles (bullets/numbers/nested indentation)
- Admin pages CMS supports single-page homepage structure management from `/admin/pages`:
  - drag-and-drop section reordering
  - editable section IDs + nav labels
  - duplicate/format validation before save
  - unified save for `home-structure.json`, `home.json`, `resume.json`, and `contact.json`
  - CMS-only labels for all major editorial groups (internal only, never rendered publicly)
  - `Selected Impact (Repeatable)` builder with unlimited items (`metric`, `descriptor`, optional `description`)
  - `Strategic Pillars (Repeatable)` builder with unlimited pillars (`headline`, `subheadline`, repeatable bullets)
  - `Custom Content Sections (Flexible Blocks)` builder with unlimited sections and layout toggle:
    - `Narrative` (`body`, optional bullets, optional closing statement)
    - `Credential Stack` (repeatable `programTitle`, `institution`, `appliedContext`, optional closing statement)
  - Resume PDF upload support:
    - `/admin/pages` includes `Upload Resume (PDF)` control (PDF-only)
    - uploaded file is committed to repo under `public/files/cms/resume/...`
    - `downloadablePdfUrl` updates automatically to uploaded file URL
    - homepage Resume CTA falls back to disabled state if URL is missing
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
- Markdown rendering parity check:
  - `npm run qa:markdown`

## CI Status Check
- GitHub Actions workflow: `.github/workflows/ci.yml`
- Trigger: pushes to `main` and pull requests
- Job: `npm ci` then `npm run build`
- This provides the branch status check shown in GitHub Branches and commit checks.
