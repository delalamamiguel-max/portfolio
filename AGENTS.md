# AGENTS.md — Architected by Miguel

## Source of truth (must read first)
- /prd/masterplan.md
- /prd/implementation-plan.md
- /prd/design-guidelines.md
- /prd/app-flow-pages-and-roles.md

## Non-negotiables
- Homepage is public.
- Case studies are private behind password auth.
- Auth is password-only (no user accounts), with return-to redirect.
- Tone: executive calm on the surface, systems depth underneath.
- Follow the design system exactly (typography scale, colors, spacing, motion, accessibility).

## Build targets
- React + TypeScript + Vite
- Tailwind + shadcn/ui
- Hosted on Vercel
- GitHub is the source of truth for content + code.

## Working style
- Before coding: summarize planned changes + files to touch.
- After coding: run relevant checks (build/lint) and report results.
- Keep components reusable and consistent with the design guidelines.
- If PRD conflicts appear, call them out and propose a resolution.