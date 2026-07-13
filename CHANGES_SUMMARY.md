# CHANGES_SUMMARY

Branch: `feature/portfolio-audit-fixes` (8 commits on top of `main` @ `f7d4cae`).
Nothing has been merged or deployed to production. A Vercel preview deployment built successfully.

## Objective
Close the five Critical findings from PORTFOLIO_AUDIT.md under the approved decisions: everything private stays password-gated (all case studies + resume) with the gate made real; Resend for contact delivery; placeholders deleted; Atlas created.

## Changes by commit

### 1. `a76b42f` — content validation + public index (Batch 0)
- New `scripts/generate-content-index.mjs`: validates all markdown frontmatter (fails CI on bad content) and emits `src/generated/case-study-index.json` — public metadata only (slug, title, summary, tags, category) for published case studies.
- Wired as `prebuild`/`predev` and an explicit CI step.
- **Root cause addressed**: invalid committed content could blank the production site; no public/private content boundary existed.

### 2. `129f896` — funnel repairs (C1, part of C2)
- `api/contact.ts` now delivers via **Resend** (`RESEND_API_KEY`; optional `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`). Unconfigured → honest 503, never fake success. Reply-to set to the sender.
- Contact status messages: `role="status"`/`aria-live`, error in the danger color (was success-green), with a direct mailto fallback.
- Login page: context-aware headline ("Access resume" / "Access case studies" / "Owner sign-in") and a **Request access by email** mailto for visitors without the password.
- Middleware matcher `:path+` so the public `/case-studies` redirect route no longer dead-ends at login.
- Deleted the stale, corrupt 706-byte `public/resume.pdf` that was publicly served.

### 3. `7d7679a` — privacy architecture (C3, rest of C2)
- Case-study/deep-dive/philosophy markdown **no longer ships in the public JS bundle** (verified absent from `dist/` and from the preview deployment's bundle).
- New session-authenticated `api/content.ts` (filesystem-backed via `vercel.json` `includeFiles`) serves bodies to detail pages, admin editors, and admin preview.
- Homepage cards read the public metadata index.
- Middleware now also gates the **resume PDF files** (`/files/cms/resume/*` — previously public) and **case-study images** (`/images/cms/case-studies-*` — the screenshots holding impact data), plus `/resume-download` and `/style-guide` (previously client-gated only). The homepage profile image stays public.
- `X-Robots-Tag: noindex` headers on all private paths + `/login`.
- Admin preview improvement: drafts render immediately after save (fetched from the content branch) instead of waiting for a rebuild.
- Removed dead `public-placeholders.tsx`.

### 4. `d2e53fc` — identity & shareability (C4)
- `index.html`: title/description lead with **Miguel de la Lama — Senior Product Manager**; canonical; Open Graph + Twitter cards with a JPEG profile image (`public/images/og-profile.jpg`); Person JSON-LD (job title, AT&T, LinkedIn).
- `robots.txt` + `sitemap.xml`; per-route document titles (login, 404, case-study, deep-dive).
- Hero: the CMS `heroHeadline` now renders on **every** viewport as a single `h1` (desktop copy was hard-coded JSX; CMS edits silently no-oped — also removes the duplicate-H1 accessibility issue and the fragile `whitespace-nowrap`).
- Footer states name and title.

### 5. `c751de9` — placeholder removal (C5 hygiene)
- Deleted the published lorem-quality deep-dive and philosophy documents. Routes and CMS support remain.

### 6. `624b29b` — content depth (C5)
- Fluently, SignalAI, ScopeIQ restructured with real `##` headings (Strategic Context / The Challenge / The Solution / Key Design Decisions / Execution & Collaboration / Results & Impact / Learnings & What's Next). Prose preserved verbatim; the section side-nav works again.
- Impact numbers that existed only inside screenshots now exist as text, **approved facts only**: Fluently ~99% faster turnaround, ~50% fewer defects (dollar figure intentionally kept as "multi-million-dollar" — see NEEDS INPUT); SignalAI 8% CTR (A/B validated), 12% engagement, ~30M monthly users.
- **New Atlas case study** written strictly from the approved fact set (17% productivity, 25% engagement, 15% revenue across the applicable prepaid and accessories experiences), with an explicit "My Role" section that keeps the product-vs-engineering boundary clean.

### 7. `547ca1b` — QA script portability (grep fallback when ripgrep is absent).
### 8. `82d238f` — keyed homepage section blocks (fixes React list-key warning).

Plus (this commit): README env documentation, `.gitignore` hygiene, and these reports.

## Verification performed
See QA_REPORT.md. Summary: typecheck/lint/build/content-validation/markdown-parity all pass locally; the Vercel **preview deployment** was verified end-to-end through an authenticated browser session — gating matrix, robots, OG tags, single H1, five case-study cards, and zero private text in the served bundle all confirmed.

## Known limitations / manual steps
1. **Headshot not yet replaced.** The image you attached exists only inside the chat; I couldn't extract the original file. Two easy options: (a) save it to `~/Downloads/` and tell me — I'll convert, commit, and update `og-profile.jpg` to match; or (b) upload it via `/admin/pages → Upload profile image` once the branch is live (then tell me to regenerate the OG image from it).
2. **Resend env vars** must be added in Vercel (`RESEND_API_KEY`, optionally `CONTACT_TO_EMAIL`/`CONTACT_FROM_EMAIL`) for Production/Preview. Until then the form shows the honest unavailable state with a mailto fallback. For a branded sender, verify `migueldelalama.com` in Resend and set `CONTACT_FROM_EMAIL`.
3. **One-click check during your review**: log in on the preview and open any case study — this exercises the authenticated content API on Vercel infrastructure (the one path I could not drive without exposing your password).
4. **Repo flip to private**: you said you'll do this manually after — recommended, since git history still contains all case-study content and the deleted placeholder docs.
5. **CMS writes target `main`** (`GITHUB_BRANCH=main` confirmed): do not test CMS saves from the preview — they would commit to production content.

## Remaining [NEEDS INPUT] (unchanged from audit)
- Fluently savings figure: homepage still says **$7.6M**, resume.json **$8M+**; the new case-study text deliberately says "multi-million-dollar". One number must be chosen.
- Homepage metrics "▲ 60–70% Ops Efficiency" and "+60% Engagement Lift (WebAR Toyota)" remain unconfirmed against the approved fact set — left untouched.
- SignalAI "−5% build overhead" vs approved "~25% segment-time reduction" — left untouched.
- Canonical public email (`hello@migueldelalama.com` live?) — request-access and fallback links currently use `delalama.miguel@gmail.com` (known-live).
- Positioning direction (A/B/C from PORTFOLIO_PLAN.md) — hero copy is unchanged pending your pick; only the rendering parity was fixed.

## Rollback
Each commit is independently revertable (`git revert <sha>`). Deleting the branch abandons everything; `main` was never touched.
