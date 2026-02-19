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
