# cms.md

## Source Documents
- /prd/masterplan.md
- /prd/implementation-plan.md
- /prd/design-guidelines.md
- /prd/app-flow-pages-and-roles.md
- AGENTS.md

This CMS must not violate any non-negotiables defined in the source documents.

## Context Codex Must Understand
- Site map includes public routes: `/`, `/philosophy`, `/resume`, `/contact`, `/login`.
- Site map includes private routes: `/case-studies`, `/case-studies/[slug]`, `/deep-dive/[slug]`.
- Auth model is password-only with no user accounts.
- Session is validated server-side against `SITE_PASSWORD`.
- Middleware protects private routes and must also protect `/admin/*`.
- Session cookie requirements are `HttpOnly`, `Secure`, `SameSite=Lax`, 12-24h lifespan.
- Login flow preserves return destination via `next` query parameter.
- Redirect behavior is `/login?next=<requested-route>` for unauthorized private/admin access.
- No database is allowed for content management.
- GitHub remains the source of truth for content and code.
- Vercel deploys automatically when content commits are pushed.
- Content is stored in `/content` and rendered directly from this source.
- UI tone is executive calm with structured systems depth.
- Component discipline uses Tailwind + shadcn/ui patterns.
- CMS must preserve accessibility, restrained motion, and established design tokens.

## Non-Negotiable CMS Goal
A password-gated owner-only CMS that lets Miguel update homepage, philosophy, resume, contact, and private case studies/deep-dives without editing code, while keeping GitHub as the source of truth (content versioned in-repo).

## Current CMS Behavior (Catch-Up)

### Content Storage + Sync Model
- CMS writes directly to GitHub via Vercel API routes.
- Source-of-truth content paths used by both CMS and frontend loaders:
  - `content/pages/home.json`
  - `content/pages/resume.json`
  - `content/pages/contact.json`
  - `content/case-studies/*.md`
  - `content/philosophy/*.md`
  - `content/deep-dive/*.md`
- Frontend case study/deep-dive content is loaded at build time (`import.meta.glob`), so new content appears publicly after Vercel rebuild completes.

### Rich Markdown Editor + Inline Images
- Case study / philosophy / deep-dive editors use a structured Markdown/MDX-friendly editor with:
  - H1-H4
  - bold / italic / underline
  - bullets / numbered lists
  - indent / outdent controls (Markdown indentation)
  - quotes
  - code blocks
  - links
  - visual table builder (rows/cols, header toggle, add/remove row/column, inline cell editing)
- Inline image support is available in the editor:
  - uploads images to repo-backed `public/images/cms/...`
  - inserts MDX-friendly image syntax into body
  - supports alignment metadata (`left`, `center`, `right`, `full`)
  - supports width metadata (`width=40|60|80|100`)
  - shows a pending image preview before upload/insert
  - requires alt text before upload/insert (image upload control is disabled until alt text is provided)
  - supports updating alt text after insert via editor action at the cursor image line
  - Note: editor remains Markdown-first (split editor), not a full WYSIWYG rich text canvas.

### Case Study Import (Safe Draft Workflow)
- Case study editor includes review-first import for `.docx`, `.md`, and `.mdx` (not direct publish).
- Workflow:
  1. Upload import file (`.docx` / `.md` / `.mdx`)
  2. Detect import mode:
     - `.docx` => parse to structured intermediate blocks + convert
     - `.md` / `.mdx` => direct ingestion into structured content body (no structural rewrite)
  3. Auto-populate editor fields (title / slug / summary / tags / body)
  4. Show generated Markdown (diffable), structured JSON (diffable), and preview
  5. Show warnings/errors for unsupported or risky conversions
  6. Upload embedded images (DOCX only) and apply to editor as draft
- Supported v1 import formatting:
  - headings
  - paragraphs
  - bold / italic / underline
  - lists
  - links
  - embedded images
- Unsupported v1 (flagged in warnings and/or omitted):
  - tables
  - footnotes
  - comments
  - tracked changes
  - text boxes
  - complex layouts

### DOCX Auto-Map Heading Behavior
- Auto-map is enabled by default in the DOCX importer.
- Imported headings can be mapped into known case study sections:
  - `Strategic Context`
  - `Architecture`
  - `Trade-offs`
  - `Execution`
  - `Impact`
  - `What's Next`
- Common imported headings such as `Background`, `Challenge`, `Solution`, `Results and Impact`, and `Learnings / What's Next` are remapped automatically.
- Unmapped headings are preserved inside the current mapped section and flagged.
- Auto-map produces only sections that contain content; it does not inject empty headings.

### Flexible Content Model + Draft-First Publishing Rules
- Case study body (Markdown/MDX headings) is the source of truth for section structure.
- Frontend renders only sections that exist; if no `##` sections are present, it renders the full body as a single article.
- Missing canonical sections produce warnings only (no hard save/publish block).
- Case study tag validation (CMS + server-side write endpoint):
  - maximum 6 tags
  - maximum 24 characters per tag
- DOCX imported content is applied to the editor as `Published = false` by default.
- First save after DOCX import must be a draft save.
- Publishing is blocked if any of the following are unresolved:
  - required fields missing (slug/title/body)
  - body transfer checks fail (empty / too short / possible truncation)
  - imported image alt placeholders have not been reviewed/confirmed

### Homepage Profile Image CMS
- Homepage content supports a CMS-controlled `profileImage` field in `content/pages/home.json`:
  - `src`
  - `alt`
- `/admin/pages` supports profile image upload:
  - image is center-cropped to square client-side
  - optimized to WebP before upload
  - stored under repo-backed `public/images/cms/...`
- Homepage hero renders the square image responsively.
- If `profileImage.src` is set, `profileImage.alt` is required.

### Save Verification + Admin Preview
- CMS save response includes verification metadata for case studies:
  - file path
  - create vs update status
  - admin preview route
  - public route
- Admin preview route supports draft verification:
  - `/admin/case-studies/preview/:slug`
- Post-save CMS UI shows route links and route-check status.
- Public route availability still depends on Vercel rebuild + `published: true`.

### Theme + UI System (Website + CMS)
- Global theme toggle is available in the top-right navigation and applies to both website and CMS routes.
- Theme behavior:
  - first visit respects `prefers-color-scheme`
  - user preference persists in localStorage
  - no-flicker theme initialization is applied before app boot
- Shared UI surfaces (shell, buttons, inputs, cards, tags, tables/code blocks) are token-driven for theme adaptation.

### Dynamic Import Reliability (Production)
- Client listens for stale chunk/dynamic import failures (e.g. hashed Vite bundle no longer present after deploy).
- On first occurrence, app performs a one-time reload to recover from cache/hash mismatch.
- This reduces CMS/page load failures like “Failed to fetch dynamically imported module …/assets/index-*.js”.

### Markdown / MDX Import + Rendering Notes
- `.md` / `.mdx` imports preserve body content exactly as written (no structural rewrite).
- Frontmatter metadata is mapped when present:
  - `title`
  - `slug`
  - `summary`
  - `tags`
  - `published` (detected but import still applies draft by default)
- Markdown rendering supports:
  - tables (pipe-table syntax)
  - code blocks
  - links
  - images
  - inline HTML passthrough for owner-authored content
- Frontend tag pills are wrapped and overflow-safe for long tags or max-tag scenarios.
- Case study and CMS editors include a history-based Back button with a safe fallback route.

### Logging + Error Surfacing
- Server-side CMS write endpoint logs:
  - slug
  - file path
  - body length
  - create vs update
  - commit status (success/failed)
- CMS UI surfaces actionable validation and import errors instead of silent failures.
