# Architected by Miguel

## Purpose and status

Strategy x Systems x Scaled Execution. A professional portfolio with case-study browsing, résumé downloads and a GitHub-backed content editor. This README describes the inspected default-branch implementation; it does not certify live deployment health or inclusion of content on other branches.

## Architecture and integrations

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui foundations
- Vercel Functions + Edge Middleware for password-gated private routes

## Setup and environments

- Required: `SITE_PASSWORD` (admin/CMS access — also grants full read access to every gated case study and the resume)
- `CASE_STUDY_PASSWORD` (viewer-only access to gated case studies and the resume; does not grant CMS write access). Public access is controlled by the explicit slug allow-list in `lib/case-study-access.ts` and its client mirror `src/lib/case-study-access.ts` (keep both files in sync). Changing a CMS category alone does not change access. Other case studies require an admin or viewer session.
- CMS (GitHub writes): `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`
- Contact and access requests are handled by direct email to hello@migueldelalama.com (no email provider or storage required); access to gated content is granted manually by sharing the viewer password

Copy local env:
- `cp .env.example .env`
- Set `SITE_PASSWORD=<your-password>` and `CASE_STUDY_PASSWORD=<your-password>`

## Local Development
1. Install dependencies: `npm install`
2. Start frontend: `npm run dev`
3. For full middleware + API behavior, run with Vercel dev: `npx vercel dev`

## Repository map

- `src/`: React routes, components, client access helpers and generated content index.
- `api/`, `lib/`, `middleware.ts`: Vercel functions, server helpers and route/asset access checks.
- `content/`: versioned page data and Markdown case studies.
- `public/`: served assets, including CMS uploads; review exposure before adding files.
- `scripts/`: content-index generation and QA utilities.
- `docs/`, root planning documents: design and release references.
- `vercel.json`, `.github/workflows/ci.yml`: hosting routing/headers and build CI.

`AGENTS.md` points to four source-of-truth files under `prd/`, but those files are absent at those paths in this checkout; matching documents exist at the repository root and are linked below. Its blanket “case studies are private” rule also predates the explicit public-slug allow-list in current source. Preserve the implemented boundary and resolve this guidance conflict with the owner before changing access behavior; this README update changes neither.

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
  - case-study cards open detail routes (`/case-studies/:slug`); explicit allow-listed slugs are public and remaining slugs follow the session middleware flow
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

## Deployment and rollback

Vercel serves the frontend, functions and middleware; `vercel.json` defines routing and response headers. CMS edits commit to the configured GitHub repository/branch and can trigger a new build. A CMS save is therefore a repository write and potentially a deployment, not an isolated preview operation. Neither CMS nor deployment commands were invoked for this README change.

For separately approved releases, verify password roles, explicit public allow-lists, target branch and asset access before promotion. Restore a compatible approved artifact/content revision for rollback; reverting the web deployment does not erase Git history, uploaded files or copies already retrieved. Current deployment settings and last-good rollback artifacts were not verified. Keep this branch local pending review and publication-safety assessment.

## Safe commands

Use `git status --short`, `git diff -- README.md` and `git diff --check` for documentation work. `npm run dev` and `npm run build` run `content:index` first; that script validates content and writes `src/generated/case-study-index.json`. They are not read-only checks. `typecheck`, `lint`, `preview`, `qa:smoke` and `qa:markdown` have distinct scopes; inspect their scripts before execution. Vercel dev and smoke checks can exercise API/authentication/network behavior.

## Testing and validation
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

## Risks and guardrails

This repository is public. Website password gates do not hide source content, uploaded assets or Git history from repository readers. Do not add confidential employer/client material, credentials or private résumé details on the assumption that a web route is protected. Keep GitHub write tokens server-side and scoped to the approved content target; viewer credentials must never grant CMS writes. Direct-email links do not imply an automated sending service.

## Related documentation

- [Agent guidance](AGENTS.md) — stale paths/access-policy caveats above.
- [Product plan](masterplan.md)
- [Implementation plan](implementation-plan.md)
- [Design guidance](design-guidelines.md)
- [Routes and roles](app-flow-pages-and-roles.md)
- [Release checklist](docs/release-checklist.md)
- [System map](PORTFOLIO_SYSTEM_MAP.md)

Existing CMS notes and historical QA reports are useful references, not newly executed validation. Preserve the owner-approved visual language and working content flows.

This README update was checked statically only. No installs, application builds/tests, provider calls, database operations, skill installations or deployments were performed. Live hosting, external URLs and runtime behavior remain unverified.
