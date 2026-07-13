# PORTFOLIO_PLAN

Implementation plan derived from PORTFOLIO_AUDIT.md. **Nothing here is implemented yet.** All work happens on a dedicated feature branch with Vercel preview deployments; nothing merges to `main` without explicit approval.

## Ground rules
- Branch: `feature/portfolio-audit-fixes` (name to be confirmed at kickoff).
- One batch = one concern = one reviewable commit group. No mixed copy/design/CMS/tech commits.
- CMS testing uses throwaway content on the feature branch (via `GITHUB_BRANCH` override in a preview env), never production content on `main`.
- Every factual copy change traces to the approved fact set or carries `[NEEDS INPUT]`.
- Rollback for every batch: `git revert` of the batch commits; content files additionally recoverable from git history.

---

## Batch sequence

### Batch 0 — Safety rails (Small, low risk) — *autonomous after plan approval*
Create branch; add a build-time content-validation script (runs existing schema validators against `content/` so bad content fails CI, not production render); no behavior change.
Files: `scripts/`, `package.json`, `.github/workflows/ci.yml`.
Verify: CI green on branch; intentionally-broken fixture fails locally.

### Batch 1 — Funnel repairs (Small–Medium, low risk) — *mostly autonomous; two decisions gated*
1. Fix `/case-studies` middleware capture (matcher excludes the bare path). *(autonomous)*
2. Contact error message: correct color token + `role="status"` announcements. *(autonomous)*
3. Contact delivery — **gated on decision #12**: interim option (no new dependency): replace form success path with honest failure or a `mailto:` fallback; full option: wire provider.
4. Resume ungating — **gated on decision #8**: point CTA at the public PDF, drop `/resume-download` PrivateRoute.
5. Remove stale `/resume.pdf` — **gated on decision #6**.
6. Login page: add access-request path (mailto w/ subject) + context-aware copy — copy needs approval.
Risk: Low. Verify: curl route matrix, form E2E, logged-out download.

### Batch 2 — Identity & shareability (Medium, low risk) — *autonomous except name/title strings*
Per-route titles + meta (lightweight head manager, no new dep if possible), OG/Twitter tags + share image, canonical, robots.txt, sitemap.xml, `noindex` policy for `/login` + gated routes, Person JSON-LD, single H1, footer name/copyright. Title/description strings and the name-forward brand string are content — approved wording required (decision #11 + positioning direction).
Files: `index.html`, `src/` (head handling), `public/`, `vercel.json` (headers).
Risk: Low. Verify: link-preview debuggers, HTML validation, Lighthouse SEO.

### Batch 3 — Metrics truth pass (Small, content-only) — *fully gated on decisions #1–4*
Align Fluently figure everywhere; keep/replace/remove the two unapproved homepage metrics; correct SignalAI impact text; ensure every number on any surface matches the approved set.
Files: `content/pages/home.json`, `content/pages/resume.json`, case-study markdown.
Risk: Low technically; high factual sensitivity — every change quoted for review before commit.

### Batch 4 — Positioning & hero (Medium) — *fully gated on positioning choice*
Implement chosen direction (below): hero copy, eyebrow, side-panel, CTA labels; un-hardcode desktop headline so the CMS field renders everywhere (technical part autonomous); name placement.
Files: `home-page.tsx`, `content/pages/home.json`, `site-shell.tsx`.
Verify: 320–1440px hero rendering, CMS edit round-trip on preview.

### Batch 5 — Case-study depth (Large, content) — *gated on decisions #7–10 + per-story review*
Restructure each case study with real `##` sections (restores side-nav), move impact numbers from screenshots into text (approved facts only), add explicit "My role" framing, fix jargon/tags/titles, public preview summaries; create Atlas case study (draft for approval); unpublish/delete placeholders per decision #9; access-policy implementation per #7/#8 (if "truly private" is chosen: move gated content out of the client bundle to an authenticated content API — Medium-Large technical sub-batch; if "public" is chosen: simplify gate).
Risk: Medium (content migration). Every rewritten story reviewed by Miguel before commit.

### Batch 6 — CMS safety & parity (Medium) — *autonomous*
Unsaved-changes guard; delete confirmation; shared frontmatter parser; server-side JSON validation for page saves; CSRF stale-token retry; resume.json dead-fields resolution (**schema part gated**, decision in §audit 7); philosophy surface resolution (**gated**, decision #9).
Verify: CMS E2E on preview deployment with test content (create/edit/import/upload/delete/recover), then cleanup.

### Batch 7 — Hardening & performance (Medium) — *autonomous*
Markdown sanitizer allowlist; drop or sanitize SVG uploads; exact-origin CSRF match; path normalization on write/delete; trimmed error surfaces; self-hosted fonts; image dimensions in renderer; CSP (careful with inline theme script); optional viewer/admin secret split (**gated** — access-policy change).
Verify: XSS fixture corpus through renderer; Lighthouse before/after; full regression.

### Batch 8 — Measurement (Small) — *fully gated on decision #13*
Vercel Web Analytics (or chosen alternative) + custom events: resume download, LinkedIn click, contact submit, case-study open, login attempt/success.

### Batch 9 — Cleanup pass (Small) — *autonomous* (Phase 4 of engagement)
Dead code: `src/lib/case-studies.ts` placeholders (+ type relocation), `CaseStudiesIndexPage`, `public-placeholders.tsx`, orphaned `case-studies-experimentation-platform` images, empty `public/v2/`, stale `AGENTS.md` paths, lint errors in DOCX importer. Documented separately from feature commits.

### Batch 10 — QA + docs (Phase 5/6)
Full matrix (viewports 320–1440, keyboard, screen-reader pass, dark/light, CMS workflows on preview), then `CHANGES_SUMMARY.md` + `QA_REPORT.md`. Preview URL delivered for Miguel's production-review approval. **No merge without explicit approval.**

Dependency notes: 2 depends on 4's wording only for final strings (can ship with current strings and re-title later); 3 blocks 5 (case-study numbers); 5's access sub-batch blocks parts of 7 (CSP/content API interplay). No new runtime dependency is planned except (a) optional email provider SDK (gated), (b) possibly a tiny head-manager (will try without).

---

## Positioning directions (proposals — choose one, or direct edits)

### Direction A — "AI Product Leader at enterprise scale" *(recommended)*
- **Headline:** Miguel de la Lama — Senior Product Manager. I ship AI products used by 30 million people.
- **Sub:** 10+ years in digital product, ~7 leading product at enterprise scale (AT&T). I take AI from business case to production: personalization, GenAI content systems, and platform replacements that cut $8M+ in annual cost.*(figure pending #1)*
- **Proof points:** SignalAI (+8% CTR/+12% eng, 30M MAU), Fluently ($8M+ OPEX, 99% faster), Atlas (17%/25%/15%), 30+ cross-functional contributors.
- **Best fit:** Senior/Staff/Principal PM — AI products, personalization, martech, platform.
- **Advantages:** Name + title + employer + scale in five seconds; strongest approved facts up front; matches the guardrail (product leader, not engineer).
- **Risks:** Less distinctive voice than current brand; leans on AT&T permissioning of specifics (already public in the content).

### Direction B — "Builder-operator PM"
- **Headline:** Miguel de la Lama — Senior Product Manager who ships: enterprise AI platforms by day, solo-built SaaS on nights and weekends.
- **Sub:** ~7 years of product leadership at AT&T scale, plus hands-on prototypes and B2B SaaS (React/Next.js/Supabase) built end-to-end.
- **Proof:** Fluently/SignalAI/Atlas + Clockero as the differentiator.
- **Best fit:** Staff/Principal PM in AI-native startups and scaleups; agentic-product roles.
- **Advantages:** Rare combination; credibly "technical PM" without claiming engineering.
- **Risks:** Big-company Director-track readers may weight the solo-builder angle lower; must keep the product-vs-engineering line crisp.

### Direction C — "Platform & experimentation product leader"
- **Headline:** Miguel de la Lama — Product leader for AI/ML platforms, personalization, and experimentation systems.
- **Sub:** I build the systems other teams build on — personalization serving 30M users, GenAI content platforms, experiment-driven launches with 30+ contributors.
- **Best fit:** Platform PM, growth-systems, martech leadership; Director-track platform orgs.
- **Advantages:** Cleanest fit to platform/growth searches; matches existing site vocabulary (least copy churn).
- **Risks:** Narrower memorability for general PM roles; "platform" reads infra-flavored to some recruiters.

All three: primary CTA = Download resume (ungated), secondary = View case studies; LinkedIn visible in hero or header.

---

## Complexity summary
| Batch | Complexity | Risk | Autonomous? |
|---|---|---|---|
| 0 Safety rails | S | Low | Yes |
| 1 Funnel | S–M | Low | Partial (3 gated items) |
| 2 Identity/SEO | M | Low | Partial (strings gated) |
| 3 Metrics truth | S | Content-sensitive | No |
| 4 Hero/positioning | M | Low | No (copy) / Yes (parity fix) |
| 5 Case-study depth | L | Medium | No |
| 6 CMS safety | M | Low | Mostly |
| 7 Hardening/perf | M | Low–Med | Mostly |
| 8 Measurement | S | Low | No |
| 9 Cleanup | S | Low | Yes |
| 10 QA/docs | M | — | Yes |

## Decisions required before the gated batches
See PORTFOLIO_AUDIT.md §14 — items 1–15. Minimum set to start Batches 1–2 fully: #6, #8, #11, #12 (+ positioning choice for final strings).
