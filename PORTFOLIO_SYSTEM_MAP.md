# PORTFOLIO_SYSTEM_MAP

Read-only discovery output (Phase 1). No application code was modified.
Audited commit: `f7d4cae` ("style: add glassmorphism portfolio refresh", 2026-05-25) on `main`.

## 1. System overview

- **App**: Single-page React application (Vite 6 + React 18 + TypeScript 5.6 + React Router 6), styled with Tailwind CSS 3.4 and shadcn-style primitives (`class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`).
- **Hosting**: Vercel. `vercel.json` adds security headers (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`) and a SPA rewrite of all non-API/non-asset paths to `/index.html`.
- **Auth**: One shared password (`SITE_PASSWORD`). `api/login.ts` issues an HMAC-SHA256-signed session token (12-hour expiry) in an `HttpOnly` cookie. Vercel Edge middleware (`middleware.ts`) guards `/case-studies/*`, `/deep-dive/*`, `/admin/*` at the document level; the React `PrivateRoute` wrapper re-checks via `/api/verify-session` for client-side navigation.
- **CMS**: Custom React admin at `/admin/*`. All writes go through Vercel Functions (`api/cms/*`) that commit directly to GitHub (`delalamamiguel-max/portfolio`) via the Contents API using `GITHUB_TOKEN`/`GITHUB_OWNER`/`GITHUB_REPO`/`GITHUB_BRANCH`. Git history confirms CMS commits land on `main` — **the production branch**.
- **Content**: Build-time loaded. `src/lib/content-loader.ts` eagerly bundles all JSON page content and all markdown (case studies, deep dives, philosophy) into the client JS via `import.meta.glob`. New/edited content appears publicly only after Vercel rebuilds from the CMS commit.
- **Repo visibility**: The GitHub repository is **public** (verified via `gh repo view`).

Local working-copy note: the parent folder `Migs Portfolio/` is **not** a git repo (stale copy + planning docs + `_Credentials/`). The authoritative clone is `Migs Portfolio/repo-check/`, clean and up to date with `origin/main`.

## 2. Route inventory

| URL | Access | Purpose | Main component | Content source | Notes / problems |
|---|---|---|---|---|---|
| `/` | Public | Single-page portfolio (hero, proof metrics, pillars, custom sections, case-study cards, resume CTA, contact) | `HomePage` (src/pages/home-page.tsx) | `content/pages/*.json` + case-study frontmatter | Desktop hero headline hard-coded in JSX; CMS `heroHeadline` renders only on mobile |
| `/login` | Public | Password entry, `?next=` redirect | `LoginPage` | — | No way to request access; headline always "Access case studies" |
| `/case-studies` | Intended public redirect → `/#case-studies` | Legacy route | `Navigate` | — | **Captured by auth middleware** — logged-out users get a login wall instead of the redirect |
| `/case-studies/:slug` | Private (middleware + PrivateRoute) | Case-study detail | `CaseStudyDetailPage` → `CaseStudyTemplate` | `content/case-studies/*.md` | Content also present in public JS bundle |
| `/philosophy` | Public redirect → `/` | Legacy | `Navigate` | — | — |
| `/resume` | Public redirect → `/#resume` | Legacy | `Navigate` | — | — |
| `/resume-download` | Private (PrivateRoute only — **not** in middleware matcher) | Redirects to resume PDF | `ResumeDownloadPage` | `content/pages/resume.json → downloadablePdfUrl` | Client-gated but the PDF itself is public; blocks recruiters |
| `/contact` | Public redirect → `/#contact` | Legacy | `Navigate` | — | — |
| `/deep-dive/:slug` | Private | Deep-dive detail | `DeepDiveDetailPage` → `CaseStudyTemplate` | `content/deep-dive/*.md` | Only doc is placeholder text, `published: true` |
| `/style-guide` | Private (PrivateRoute only — not in middleware matcher) | Design-system reference | `StyleGuidePage` | hard-coded | Inconsistent protection |
| `/admin` | Private | CMS dashboard | `AdminHomePage` | — | — |
| `/admin/pages` | Private | Homepage structure + home/resume/contact JSON editor; resume PDF + profile image upload | `AdminPagesPage` (821 lines) | `content/pages/*` | — |
| `/admin/philosophy` | Private | Philosophy markdown CRUD | `AdminPhilosophyPage` → `MarkdownDomainEditor` | `content/philosophy/*` | Philosophy never renders publicly (renderer returns `<></>`) |
| `/admin/case-studies` | Private | Case-study CRUD + DOCX/MD/MDX import | `AdminCaseStudiesPage` → `MarkdownDomainEditor` | `content/case-studies/*` | — |
| `/admin/case-studies/preview/:slug` | Private | Draft preview using public template | `AdminCaseStudyPreviewPage` | same | — |
| `/admin/deep-dive` | Private | Deep-dive CRUD | `AdminDeepDivePage` | `content/deep-dive/*` | — |
| `*` | Public | 404 | `NotFoundPage` | — | Rendered outside `SiteShell` (no header/nav) |

Unrouted/dead components: `CaseStudiesIndexPage` (src/pages/private-placeholders.tsx), `src/pages/public-placeholders.tsx`, hard-coded placeholder data in `src/lib/case-studies.ts` (only its `ArchitectureDiagram` type is imported, by an otherwise-unused `architecture-diagram.tsx`).

## 3. API inventory (Vercel Functions)

| Endpoint | Method | Auth | Purpose | Guards |
|---|---|---|---|---|
| `/api/login` | POST | password | Issue session cookie | timing-safe compare, in-memory IP rate limit (8/15 min) |
| `/api/logout` | POST | none | Clear cookie | — |
| `/api/verify-session` | GET | cookie | Session check for SPA | — |
| `/api/contact` | POST | none | Contact intake | rate limit (10/15 min), email/message validation. **Placeholder: logs and discards the message; nothing is delivered** |
| `/api/cms/csrf` | GET | none | Issue CSRF token (double-submit cookie) | — |
| `/api/cms/write-file` | POST | session + CSRF | Commit markdown/JSON to GitHub | path allowlist, frontmatter/slug/tag validation, rate limit (60/15 min) |
| `/api/cms/delete-file` | POST | session + CSRF | Delete content file from GitHub | prefix allowlist (`case-studies/`, `philosophy/`, `deep-dive/`) |
| `/api/cms/upload-image` | POST | session + CSRF | Commit image to `public/images/cms/...` | MIME allowlist (jpeg/png/webp/gif/**svg**), ~9 MB cap, filename slugification |
| `/api/cms/upload-file` | POST | session + CSRF | Commit PDF to `public/files/cms/...` | PDF-only, ~18 MB cap |

## 4. Content architecture and lifecycle

```
CMS UI (/admin/*)
  → client validation (src/lib/content-schema.ts mirrors) 
  → /api/cms/write-file (server re-validation, path allowlist)
  → GitHub Contents API commit → branch: main
  → Vercel auto-build (CI also builds on push)
  → import.meta.glob bundles content into client JS at build time
  → public render
```

- **Source of truth**: files in `content/` on `main`. Git history is the only rollback mechanism (no UI for it).
- **Draft model**: `published: false` frontmatter. Drafts are excluded from public lists but are still **bundled into the public JS** (loader imports all files, filters at runtime) and still committed to the public repo.
- **Validation**: `content-schema.ts` throws on invalid content at module load → malformed committed content can break the public build/render. Server-side write validation reduces but does not eliminate this (e.g., JSON page content is validated client-side only; `write-file` checks markdown domains only).
- **Frontmatter parsing**: custom single-line `key: value` parser (`src/lib/markdown.ts`); no YAML nesting; `api/cms/write-file.ts` has a second, slightly different parser (duplication).
- **Markdown rendering**: custom `markdownToHtml` (headings, lists incl. nesting, tables, images with `{align= width=}` metadata, code, inline HTML passthrough) injected via `dangerouslySetInnerHTML`. Shared by public pages, admin preview, and editor preview (good parity by construction).
- **Case-study sections**: `## ` headings split the body into cards + side-nav anchors. 3 of 4 published case studies have only one `## Strategic Context` heading (authors used bold text as pseudo-headings), so the section nav/structure collapses.
- **Fields that never render publicly**: `resume.json.sections[]` (role/company/timeline/highlights/metrics/tags — the public resume block is CTA-only), philosophy documents (block renderer returns empty), `home-structure.json` philosophy entry, `MarkdownDoc.summary` for deep dives (rendered), `cmsLabel` (intentional, CMS-only).
- **Public content not manageable in CMS**: desktop hero headline (hard-coded JSX), hero side-panel copy ("Operating Model", "Platform thinking", "Measurable momentum"), section headings like "Case Studies"/"Resume"/"Contact" body copy, footer LinkedIn/email, login-page copy, meta title/description.

## 5. Authentication flow

1. Anonymous request to a matched private path → middleware 307 → `/login?next=<path>`.
2. `POST /api/login` with password → timing-safe compare → signed token (`{iat, exp}` + HMAC) in `miguel_session` HttpOnly/Secure/SameSite=Lax cookie, 12 h.
3. Middleware and API handlers verify signature + expiry. No session store, no revocation (valid until expiry unless `SITE_PASSWORD` rotates), no logout-side invalidation beyond cookie clearing.
4. `PrivateRoute` gates client-side navigation via `/api/verify-session`; login page redirects back to `next`.

## 6. Deployment flow

- Push (human or CMS commit) to `main` → GitHub Actions CI (`npm ci && npm run build`) + Vercel production build.
- No staging branch; no preview flow is used by the CMS (writes go straight to `main`).
- Chunk-load recovery: client auto-reloads once when a stale hashed bundle 404s after a deploy.
- Local: `npm run dev` (no middleware/APIs) or `npx vercel dev` (full behavior; needs env vars).

## 7. Main dependencies

Runtime: react, react-dom, react-router-dom, mammoth (DOCX import; correctly isolated in a lazy ~500 kB admin chunk), lucide-react, cva/clsx/tailwind-merge.
Dev: vite 6, typescript 5.6, tailwind 3.4, eslint 9, @vercel/node.
External services at runtime: Google Fonts (render-blocking stylesheet), GitHub API (CMS writes). No analytics.

## 8. Verification performed

- `npm ci`, `npm run typecheck` (clean), `npm run lint` (3 pre-existing errors in `docx-case-study-importer.tsx`, 1 warning), `npm run build` (clean; main bundle 249 kB / 83 kB gzip; admin DOCX chunk 501 kB lazy).
- Live site inspected in browser (desktop + 375 px mobile), console clean, network verified (homepage loads main bundle + home chunk only).
- Auth verified end-to-end via API (login 200 → verify 200 → /admin 200) using the owner-provided credentials file; the password was never printed, stored, or committed.
- Middleware behavior verified for all six protected/edge routes (see route table).

## 9. Known risks

- Private case-study text ships in the public JS bundle and lives in a public GitHub repo (see audit: Critical).
- CMS writes commit directly to the production branch with no preview step; invalid content can break the production build.
- In-memory rate limiting resets per serverless instance (best-effort only).
- Custom markdown renderer allows inline-HTML passthrough into `dangerouslySetInnerHTML` (owner-authored content only, but it is an XSS surface; SVG uploads are also allowed).
- `content-schema.ts` validators throw at module scope — one bad committed file can blank the site.
- No session revocation; single shared password for both viewing and CMS write access.

## 10. Areas requiring additional access or input

- Vercel project settings (env values, preview deployment config, domains) — repo is not `vercel link`ed locally and the Vercel MCP connector is unauthenticated in this session. `GITHUB_BRANCH=main` inferred from commit history, not read from env.
- Interactive browser QA of authenticated pages (`/admin/*`, case-study detail rendering) was limited: the sandbox policy correctly blocked materializing the session credential into the browser. CMS behavior was audited from source; API-level auth checks were done via curl.
- Whether `hello@migueldelalama.com` is a live mailbox.
