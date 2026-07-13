# PORTFOLIO_AUDIT

Phase 2 audit of migueldelalama.com + its GitHub-backed CMS, judged against one goal: **a credible recruiter or hiring manager quickly understands Miguel's seniority, leadership, impact, and differentiation — then downloads the resume, opens a case study, visits LinkedIn, or starts a conversation.**

Severity scale: Critical / High / Medium / Low.
"Approval" = requires Miguel's decision before implementation.

---

## 1. Executive summary

The portfolio's craft signal is strong — a coherent glassmorphism design system, a real custom CMS, disciplined code. But the recruiting funnel is broken at every conversion point: the contact form silently discards messages, the resume download is behind a password wall that gives no way to request access, `/case-studies` dead-ends logged-out visitors at a login page, and a shared link or Google result shows a generic title with no name, no role, and no preview image. Meanwhile the "private" case studies are not actually private — their full text ships in the public JavaScript bundle and sits in a public GitHub repository — so the gate charges recruiter friction and buys no confidentiality. Content-wise, the strongest approved evidence (Atlas; Fluently's 99%-faster / 50%-fewer-defects outcomes; 30+ contributor leadership; the AT&T Senior PM role itself) is missing or buried in screenshots, while the homepage headlines two metrics that are not in the approved fact set and a Fluently savings figure that conflicts between surfaces ($7.6M vs $8M+).

## 2. Five most critical findings

| # | Finding | Severity | Why it matters most |
|---|---|---|---|
| C1 | **Contact form is a black hole.** `api/contact.ts` is a placeholder: it validates, logs the email *domain* only, returns 200, and the UI says "Message sent. Thanks for reaching out." No message is ever delivered. | Critical | The single highest-intent recruiter action fails silently. Every inbound conversation started through the form since launch has been lost, and neither side knows. |
| C2 | **Resume download requires the site password, with no way to get it.** "Download PDF" → `/resume-download` (PrivateRoute) → login wall labeled "Access case studies / Shared privately." — no request-access path, no email link. The PDF itself (`/files/cms/resume/...`) is publicly fetchable, so the gate adds 100% friction and 0% protection. | Critical | Resume download is the #1 recruiter conversion. Most recruiters will not email to ask for a password; they leave. |
| C3 | **"Private" case studies are publicly readable.** Full markdown for all case studies and deep dives is bundled into the public JS (`assets/index-*.js`, verified on the live site) via eager `import.meta.glob`, and the GitHub repo is public. The password gate protects routes, not content. | Critical | Whatever confidentiality the gate is meant to provide does not exist — while the gate still costs recruiter conversions. Either the content is safe to show (drop/reduce the gate) or it isn't (fix the leak). Decision required. |
| C4 | **Anonymous to search and social.** Title "Architected by Miguel", generic description, no Open Graph/Twitter tags, no canonical, no robots.txt/sitemap, no structured data, no per-route titles — and the full name "Miguel de la Lama" appears nowhere on the page (only a footer email). A LinkedIn/Slack/text share shows a blank, nameless card. | Critical | Recruiters arrive via shared links and Google. Today the first impression is an unbranded mystery card, and searching his name won't reliably surface the site. |
| C5 | **The evidence layer is weaker than the approved facts.** Homepage metrics include two claims outside the approved fact set ("▲ 60–70% Ops Efficiency", "+60% Engagement Lift" WebAR); Fluently savings conflict across surfaces ($7.6M home vs $8M+ resume.json vs ">$8M" approved); Atlas — an approved, quantified GenAI win (17% productivity, 25% engagement, 15% revenue) — is absent entirely; and 3 of 4 case studies carry their outcome numbers only inside screenshots (invisible to skimming, screen readers, and search). | Critical | Seniority is judged on verifiable, scannable impact. Conflicting numbers read as inflation; screenshot-only numbers read as nothing. |

## 3. Root causes

1. **Launch-phase placeholders shipped to production and were never closed out** (contact API, deep-dive/philosophy placeholder docs, 706-byte `/resume.pdf`, placeholder data in `src/lib/case-studies.ts`).
2. **Access policy was never designed as policy.** "Private case studies" was implemented as route gating without asking what must be confidential, from whom, and at what funnel cost — producing gates that block recruiters but not content (C2, C3), middleware that captures a public redirect route (`/case-studies`), and client-only gates on `/resume-download` and `/style-guide`.
3. **The site was built product-first, audience-second.** Copy leads with brand voice ("Architected by Miguel", "Designed for calm scale") rather than recruiter-parseable facts (name, title, employer, scale). SEO/share metadata was never in scope.
4. **Content entered via screenshots instead of text** (DOCX/screenshot import workflow), so proof metrics live in images and case-study structure collapsed to one `##` heading with bold pseudo-headings.
5. **CMS and frontend drifted**: the hero headline was hard-coded in JSX for desktop line-break control (commit `a8f911b`), silently disconnecting the CMS field; resume.json section data has no renderer; the philosophy block renders empty while remaining editable and orderable in the CMS.

## 4. Recruiter journey findings

### 60-second recruiter test
| Question | Answered? | Notes |
|---|---|---|
| Who is he? | **Partial** | Role yes ("Senior Product Leader"); *name* never appears on the page; employer (AT&T) only inside a credential blurb far down |
| Current level | Yes | Hero states it |
| Roles qualified for | Partial | No target-role signal (PM vs architect ambiguity; see Positioning) |
| Strongest domains | Yes | AI/ML, platforms, personalization come through |
| Scale operated at | Yes | 30M+ users, $ figures |
| 2–3 major outcomes | Partial | Metrics present but two are unapproved and one conflicts (C5) |
| Resume available | **Fails** | Password wall (C2) |
| How to contact | **Fails** | Form is a black hole (C1); two different emails shown (hello@ vs gmail) |

### 10-minute hiring-manager test
Strategic thinking, technical fluency, and platform vocabulary come through well. What fails: (a) case studies gate immediately with no public preview beyond a one-line summary; (b) inside, 3 of 4 read as a single unstructured wall with screenshots carrying the evidence; (c) Miguel's *personal* decisions vs team outcomes are explicit only in Clockero and partially SignalAI/Fluently; (d) the deep-dive doc a curious hiring manager may open is lorem-quality placeholder ("Detailed architecture context aligned to enterprise constraints.") — actively harmful to credibility; (e) "How he operates" claims (experimentation, business cases) lack linked evidence.

### Journey defects
| Finding | Root cause | Impact | Severity | Routes | Files | Fix | Approval | Verify |
|---|---|---|---|---|---|---|---|---|
| Contact form never delivers (C1) | Placeholder API | Lost conversations, false success message | Critical | `/#contact` | `api/contact.ts`, `src/pages/home-page.tsx` | Wire to email provider, or replace form with mailto/LinkedIn CTAs until wired | **Yes** (provider = new third party) | Send test message end-to-end |
| Resume gated (C2) | Access policy drift | Lost resume downloads | Critical | `/#resume`, `/resume-download` | `src/App.tsx`, `home-page.tsx`, `private-placeholders.tsx` | Make resume CTA link directly to the public PDF; remove PrivateRoute | **Yes** (access-policy change) | Logged-out download works |
| `/case-studies` → login wall | Middleware matcher `/case-studies/:path*` also matches the bare public redirect route | Old links/dead ends | High | `/case-studies` | `middleware.ts` | Exclude exact `/case-studies` from matcher (match only `/case-studies/*` with a path segment) | No | curl logged-out → 307 to `/#case-studies` equivalent |
| Login page is a wall, not a door | No access-request design | Gated visitors bounce | High | `/login` | `src/pages/login-page.tsx` | Add "how to get access" (mailto with subject prefill) + context-aware headline | Copy: **Yes** | Manual |
| Two contact emails (hello@ vs delalama.miguel@gmail.com) | Footer hard-coded | Confusion; deliverability doubt | High | `/` | `home-page.tsx` (footer), `content/pages/contact.json` | Pick one canonical address | **Yes** — [NEEDS INPUT: is hello@migueldelalama.com a live mailbox? Which address is canonical?] | mail test |
| No LinkedIn presence above footer | — | LinkedIn is a primary recruiter action | Medium | `/` | `home-page.tsx`, contact schema | Add LinkedIn to contact methods/hero secondary actions | Content: **Yes** | Manual |
| 404 page renders without site header/nav | `*` route outside `SiteShell` | Dead end has no way back except one link | Low | any bad URL | `src/App.tsx` | Move 404 inside shell | No | Manual |

## 5. Public-site findings (hero, positioning, IA, visual, responsive)

### A. Five-second test & hero
| Finding | Root cause | Impact | Severity | Files | Fix | Approval |
|---|---|---|---|---|---|---|
| Full name absent from the page; H1 is a category, not a person | Brand-first copy | Recruiters can't connect site↔resume↔LinkedIn; no name SEO | Critical (part of C4) | `home-page.tsx`, `content/pages/home.json`, `index.html` | Put "Miguel de la Lama" in hero/eyebrow area, title tag, footer | **Yes** (hero rewrite) |
| "Architected by Miguel" branding | Deliberate brand | Signals *architect/engineer* more than *product leader*; cute-over-clear for a general tech recruiter; conflicts with "do not present as a traditional software engineer" guardrail | High | `site-shell.tsx`, `index.html` | Recommend name-forward brand ("Miguel de la Lama — Senior Product Manager") or keep as sub-brand | **Yes** (explicitly) |
| Desktop hero headline hard-coded; CMS field renders only on mobile | Line-break control fix `a8f911b` | CMS edits silently no-op on desktop | High | `home-page.tsx:42-47` | Render CMS value with controlled line breaks (`\n` support or balanced wrapping) | No |
| Hero proof is delayed: no employer, no numbers above fold; abstract taglines ("Designed for calm scale", "The experience looks simple…") | Brand voice | Five-second test relies on scroll | High | `home.json` | Proposed positioning directions in PORTFOLIO_PLAN.md | **Yes** |
| Duplicate `<h1>` in DOM (mobile + desktop variants both render) | CSS-hide approach | Heading-structure noise for AT/SEO | Medium | `home-page.tsx` | Single h1, responsive styling | No |
| Hero eyebrow "Built for scale. Designed for trust." + side panel "Operating Model / Designed for calm scale" | — | Jargon without meaning for recruiters; hard-coded (not CMS-editable) | Medium | `home-page.tsx` | Fold into positioning rewrite | **Yes** |

### B. Positioning (assessment)
Current read: **strategic and technical, but role-ambiguous and employer-invisible.** The site reads closer to "solutions architect with product language" than "Senior PM ready for Staff/Principal/Director." Nothing states the actual title (Senior Product Manager, AT&T), years (10+ / ~7 PM), or team scale (30+ contributors) — all approved, all absent. The "Both/Company/Personal" filter labels are owner-taxonomy, not recruiter-taxonomy. Positioning is simultaneously too broad (no target-role statement) and too narrow (systems-architecture vocabulary may filter him out of growth/B2B SaaS PM searches). Two to three concrete positioning directions with headlines, proof points, best-fit roles, and risks are in PORTFOLIO_PLAN.md §Positioning. **Proposals only — approval required.**

### C. Content strategy & evidence
| Finding | Severity | Detail | Fix | Approval |
|---|---|---|---|---|
| Fluently savings conflict | Critical (C5) | `home.json` "$7.6M Annual Savings" vs `resume.json` "$8M+ OPEX reduction" vs approved ">$8M" | [NEEDS INPUT: which Fluently savings figure is correct — $7.6M or $8M+? All surfaces must match.] | **Yes** |
| Unapproved metric: "▲ 60–70% Ops Efficiency" (home) / "70% planning time" (ScopeIQ summary+body) | Critical (C5) | Not in approved fact set | [NEEDS INPUT: confirm the ScopeIQ/Saatchi 60–70% planning-time claim and its correct framing, or remove/de-emphasize] | **Yes** |
| Unapproved metric: "+60% Engagement Lift — 2017 Toyota Corolla WebAR" | Critical (C5) | Toyota agency work is approved; the +60% figure is not | [NEEDS INPUT: confirm the +60% WebAR engagement figure or remove] | **Yes** |
| SignalAI impact text says "−5% build overhead"; approved fact is "~25% reduction in segment creation/implementation time"; 12% engagement appears nowhere in body text | High | Under-claims an approved outcome; numbers live in screenshots | Rewrite impact section from approved facts | **Yes** (content) |
| Fluently body contains **no outcome numbers in text** ($8M+, 99% faster, 50% fewer defects all approved, all missing or screenshot-only) | High | Strongest story, weakest scannable evidence | Add text-based Impact section | **Yes** (content) |
| Atlas missing entirely | High | Approved quantified GenAI story unused | New case study (drafted from approved facts only) | **Yes** |
| 3 of 4 case studies have one `##` heading → no section nav, one giant card | High | Long-form readability & the template's whole structure collapse | Restructure bodies with proper `##` headings (Impact, Role, Decisions…) | Content edits: **Yes** |
| Miguel's role vs team's work explicit only in Clockero | High | Staff/Principal evaluation hinges on "what did *you* decide" | Add "My role" framing per case study, respecting the product-vs-engineering guardrail | **Yes** |
| Deep-dive + philosophy docs are published placeholders | High | Credibility damage behind the gate; philosophy also renders nowhere yet is CMS-managed | [NEEDS INPUT: unpublish/delete placeholder deep-dive & philosophy docs, or write real content?] | **Yes** |
| Internal jargon: "TaaS", "psychographic", "vibe coding" tag, "att.com" tag | Medium | Recruiters won't parse; "vibe coding" undercuts seniority | Replace with recruiter-standard terms | **Yes** (content) |
| Case-study titles are label-like ("Fluently AI Case Study") | Medium | Cards read as filenames; outcome-first titles convert better | Retitle (e.g. outcome-led) | **Yes** |
| Resume section data in `resume.json` (anonymized "Enterprise Platform", "Recent") never renders | Medium | Dead CMS surface; anonymized copy conflicts with named AT&T elsewhere | Either render a real experience timeline or remove the fields | **Yes** (schema) |
| No dates/timeline anywhere (except "2017 Toyota") | Medium | Recency and progression unverifiable | Add timeline facts from resume | **Yes** (content) |
| `summary` for Fluently duplicates its title pattern; card summaries mix voice ("Thirty million users. One smarter engine.") | Low | Inconsistent scan experience | Normalize summary style | **Yes** (content) |

### Content inventory (status per section)
| Section / item | Status |
|---|---|
| Hero (headline/eyebrow/subheadline) | **Reposition** (approval) |
| Hero side panel ("Operating Model… calm scale") | **Reposition or Remove** (approval) |
| Selected Impact metrics: +8% CTR / +12% eng | Keep (approved) |
| Selected Impact: $7.6M | **[NEEDS INPUT]** (conflict) |
| Selected Impact: 60–70% Ops Efficiency | **[NEEDS INPUT]** (unapproved) |
| Selected Impact: +60% WebAR | **[NEEDS INPUT]** (unapproved) |
| Selected Impact: "AI-Powered B2B SaaS (Solo Build)" | Strengthen (name Clockero, add outcome) |
| How I Operate (3 pillars) | Strengthen (tie each bullet to evidence) |
| My Approach (narrative bullets) | Merge/Move lower (overlaps pillars) |
| Continuous Learning (credentials) | Keep, Move lower; strong institutions, verbose "applied context" |
| Case studies: SignalAI, Fluently, ScopeIQ, Clockero | Strengthen + restructure (all) |
| Atlas | **Missing — create** (approval) |
| Deep dive (placeholder) | **Unpublish/Remove** (approval) |
| Philosophy doc (placeholder, renders nowhere) | **Remove or build** (approval) |
| Resume block | Strengthen (ungate CTA; optionally render timeline) |
| Contact block | Strengthen (fix delivery, one email, add LinkedIn) |
| Style guide route | Keep (internal), exclude from any indexing |

### F. IA & navigation
- Nav labels fine (Case Studies / Resume / Contact) but "Both" as the default filter label is meaningless standalone — recruiters read "Both what?"; labels come from owner taxonomy (High, `home-structure.json`/filter UI).
- Anchor scrolling under the sticky header works (scroll-margin handled); active-section tracking rewrites the URL on every scroll via `history.replaceState` (Medium: history noise/perf; use `location.hash`-free state instead).
- Logo click from a case study goes home (fine); Back button component correct.
- Philosophy block: orderable/enabled in CMS, renders `<></>` (Medium; remove from structure options or render it).
- Footer minimal (LinkedIn + gmail); no name, no copyright (Low).
- Every page has a next action **except** the login wall (C2) and 404 (no shell).

### G. Visual design
The glass system is credible and restrained; typography (IBM Plex) is appropriate. Issues, not redesign:
| Finding | Severity | Files |
|---|---|---|
| Error messages rendered in `text-impact-green` (success color) — contact failure looks like success | High | `home-page.tsx:360`, tokens exist (`danger`) but unused here |
| Metric strings wrap awkwardly ("+8% CTR / +12%\nEngagement") — composite metrics in one string | Medium | `home.json`, `metric-block.tsx` |
| Backdrop-blur(24px) on many stacked surfaces — GPU cost, scroll jank on low-end mobile; also renders blank in some capture contexts | Medium | `index.css` glass tokens |
| Reveal animation initial-hidden state: content invisible until JS runs (no-JS/failed-JS = blank page below hero) | Medium | `index.css [data-reveal]`, `home-page.tsx` |
| Case-study screenshots at `width=100` centered, some low-res/cropped desktop captures | Medium | content files |
| Dark mode: verified token system present with `.theme-dark`; no contrast failures found in code review; needs visual pass in QA phase | — | — |

### H. Responsive
Code review + 375px/785px/1280px live checks: no horizontal overflow found; mobile menu works; `whitespace-nowrap` on the hard-coded desktop hero line "Senior Product Leader." is fragile between 640–830px (near-overflow at ~800px observed; fix together with hero un-hardcoding, High). Mobile hero pushes all proof/photo below the fold (eyebrow + 4-line headline + subhead + 2 CTAs first) — Medium, part of hero rework. Filter buttons and tag pills meet ~36px height; body touch targets acceptable. Full 320/768/1024/1440 matrix deferred to QA phase (Phase 5) — no blockers expected from code.

## 6. Case-study access & privacy (E)
| Finding | Severity | Detail |
|---|---|---|
| Gate protects nothing (C3) | Critical | Content in public bundle + public repo. Decide: (a) make company case studies truly private (runtime-fetch behind auth, private repo) or (b) accept they're public and reduce/remove the gate. [NEEDS INPUT: is the GitHub repo intentionally public? What must actually remain confidential — and per case study, is gating still desired?] |
| No public preview layer | High | Cards show one line + tags; a recruiter can't evaluate before hitting the wall. Add outcome-rich public summaries (approved facts) regardless of gate decision. |
| Clockero (personal product) gated like AT&T work | Medium | Nothing confidential; could be fully public as a differentiator. Approval required. |
| Post-login redirect works (`?next=` preserved, verified) | OK | — |
| Session 12 h, no revocation; one password for viewing *and* CMS admin | High (security, see §11) | A recruiter with the case-study password can edit the site. Split roles or accept risk. |
| Protected pages & indexing | Medium | No robots directives at all; login/redirect URLs indexable; decide `noindex` for `/login`, admin, and gated routes via headers/meta + robots.txt. |

## 7. CMS findings (usability L, parity M)

Strengths worth preserving: shared renderer across editor preview/admin preview/public (parity by construction); DOCX import with draft-first enforcement, truncation checks, and alt-text review gates; tag limits enforced client+server; post-save links to preview and live route; deployment note in save response.

| Finding | Root cause | Owner impact | Severity | Files | Fix | Approval |
|---|---|---|---|---|---|---|
| No unsaved-changes warning anywhere (0 `beforeunload` hits) | Not built | Navigation/refresh loses long edits | High | admin editors | Add dirty-state guard | No |
| Delete is one click, no confirmation, immediate GitHub commit | Not built | Accidental permanent deletion of a case study (recoverable only via git) | High | `markdown-domain-editor.tsx:380` | Confirm dialog + type-slug-to-confirm | No |
| CMS writes go straight to `main`/production | Architecture choice | A bad save can break the production build; no preview deployment step | High | `api/cms/*`, env | Document risk now; optional draft-branch flow later | **Yes** (workflow change) |
| Hero headline CMS field silently ignored on desktop | Parity break | Owner edits don't appear; trust in CMS erodes | High | `home-page.tsx` | Fix renderer | No |
| `resume.json` section fields editable but never rendered | Dead surface | Wasted editing effort | Medium | `admin-pages.tsx`, schema | Render or remove | **Yes** (schema) |
| Philosophy fully manageable, never rendered | Dead surface | Confusion | Medium | multiple | Decide fate | **Yes** |
| Client and server frontmatter parsers differ (`src/lib/markdown.ts` vs `api/cms/write-file.ts`) | Duplication | Divergent validation edge cases | Medium | both | Share one parser | No |
| JSON page saves validated client-side only (server allowlist checks path, not shape) | Gap | Malformed JSON commit → build break | Medium | `write-file.ts` | Server-side JSON schema validation | No |
| Success message says "saved to GitHub" but deployment status isn't tracked (no build-status polling) | Not built | Owner doesn't know when the public site actually updated | Medium | editors | Add "deploy in progress" hint w/ timestamp guidance (full status polling = larger) | No (copy), status-API **Yes** |
| Image alt-text: required at upload for profile image, placeholder-review gate for DOCX; direct editor image insert allows empty alt? (insert flow requires alt in dialog — verified in code) | OK-ish | — | Low | — | Keep |
| CSRF token cached in JS var; expires after 24 h cookie → stale-token 403 after long sessions with no auto-retry | Edge case | Confusing save failure after idle | Low | `cms-client.ts` | Refresh token on 403 once | No |
| Mobile CMS editing: dense toolbars, split editor not optimized under 768px | Not designed for mobile | Owner can't edit from phone comfortably | Low | editors | Defer | — |

## 8. Accessibility findings (I)
| Finding | Severity | Files |
|---|---|---|
| Duplicate H1 (responsive hero variants) | Medium | `home-page.tsx` |
| Case-study markdown allows `#` → stray extra H1s inside detail pages | Medium | `markdown.ts` (map `#`→h2 depth shift or author guidance) |
| Contact form status messages not announced (`role="status"`/`aria-live` missing); error styled green (also a visual-semantics failure) | High | `home-page.tsx` |
| Screenshot images carry the actual evidence; alt text like "Image"/"Results" | High | content files |
| No `aria-current` on active nav item (visual-only state) | Low | `site-shell.tsx` |
| Skip link present, focus rings consistent, labels on all form fields, reduced-motion respected, semantic landmarks (`header/main/nav/footer`) present | Pass | — |
| Markdown tables emit plain `<table>` without `scope`/`<th>` handling verification | Low | `markdown.ts` (verify in QA) |
| Keyboard: no custom traps found; mobile menu uses `aria-expanded`/`aria-controls` correctly | Pass (code) | verify interactively in QA |

## 9. Performance findings (J)
| Finding | Severity | Detail |
|---|---|---|
| Google Fonts render-blocking stylesheet + two families/six weights | Medium | Self-host with `font-display: swap` subset; removes third-party dependency and a privacy hop |
| Main bundle 249 kB (83 kB gz) includes *all* content markdown + all page JSON | Medium | Content-as-code inflates every visitor's payload and is the C3 leak vector; runtime/static-JSON split solves both |
| Backdrop-filter-heavy rendering | Medium | See §5G |
| Markdown images: no intrinsic `width`/`height` → CLS inside case studies; `loading="lazy"` present (good) | Medium | Emit dimensions or aspect-ratio |
| Hero profile image `loading="eager"` (correct for LCP); 188 kB webp acceptable; consider `fetchpriority="high"` | Low | — |
| Admin DOCX chunk (501 kB) correctly lazy — loads only in admin | Pass | — |
| No third-party scripts, no analytics beacons | Pass | — |
| Stale-chunk auto-reload recovery implemented | Pass | — |

## 10. SEO & shareability findings (K)
| Finding | Severity |
|---|---|
| No Open Graph / Twitter card tags, no share image | Critical (C4) |
| Title/description generic; name absent (C4) | Critical |
| No canonical URL (www is canonical via 307 from apex; tags absent) | High |
| No robots.txt, no sitemap.xml | High |
| No per-route `<title>`/meta (SPA, no head manager) | High |
| No structured data (Person/ProfilePage schema) | Medium |
| Login/redirect/gated routes have no `noindex` policy | Medium |
| Single meaningful public page (one-pager) — fine, but heading content should carry name + role for snippet quality | Medium |
| `/resume.pdf` 706-byte stale file publicly served — could appear in search results as the resume | High |

## 11. Security & reliability findings (N)
| Finding | Severity | Detail |
|---|---|---|
| Repo public + content bundled → private-content exposure (C3) | Critical | Also: all CMS commit history (drafts, past resume PDFs, removed content) is permanently public |
| One shared password grants both viewer and full CMS write; sessions non-revocable for 12 h | High | Split viewer vs admin secret, or accept documented risk |
| `markdownToHtml` re-enables arbitrary inline HTML (incl. event-handler attributes) into `dangerouslySetInnerHTML` | High (surface) / Low (exploitability: owner-only authors) | Sanitize allowlist (u/strong/em/br…) instead of generic tag passthrough |
| SVG uploads allowed → scriptable asset if opened directly | Medium | Drop `image/svg+xml` or sanitize |
| In-memory rate limiting per serverless instance (login brute-force best-effort only) | Medium | Acceptable for scope; note Vercel WAF option |
| CSRF: double-submit + origin check — sound; `origin.includes(host)` is a weak comparison (e.g. evil host containing the string) | Low | Exact-match origin |
| GitHub token: scope unverifiable from repo; recommend fine-grained token limited to this repo, contents:write | Medium | [NEEDS INPUT: confirm current token type/scope] |
| Path allowlists on write/delete are prefix-based and reject traversal implicitly (no `..` normalization though — `content/case-studies/../../x` passes `startsWith`? It does **not** start with an allowed prefix after literal check — it *does* literally start with `content/case-studies/`. GitHub API resolves the path server-side; risk is writing outside intended dirs in-repo) | Medium | Normalize + reject `..` segments explicitly |
| Error messages surface raw GitHub API text to the CMS UI (could include repo details; owner-only viewer) | Low | Trim |
| Content validators throw at module scope → one malformed committed file blanks the public site (build may still pass since validation is runtime) | High | Try/catch with graceful fallback + build-time content check script |
| `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` present; no CSP | Medium | Add CSP (needs care with inline theme script) |
| Secrets: `.env` gitignored; no secrets found in repo; local `_Credentials/` folder sits *outside* the repo (plaintext RTF on disk — recommend a password manager, out of scope) | Note | — |

## 12. Conversion measurement (O)
Nothing is measured — resume downloads, LinkedIn clicks, case-study opens, login attempts, form submissions are all invisible. Recommendation (approval required, new third party): **Vercel Web Analytics** (already on the platform, cookieless, privacy-respecting, free tier) plus lightweight custom events on the five conversion actions. Alternative: Plausible/Fathom if independence from Vercel is preferred. Defer any decision until C1/C2 are fixed — measuring a broken funnel first is wasted signal.

## 13. Conflicting claims register
1. **Fluently savings**: $7.6M (home.json) vs $8M+ (resume.json) vs ">$8M" (approved facts). Not resolved by me — [NEEDS INPUT].
2. **Segment-creation efficiency**: approved "~25% reduction in time to create/implement audience segments" vs SignalAI body "−5% build overhead". [NEEDS INPUT: which framing is correct?]
3. **Engagement lift**: approved personalization outcome is 12%; homepage pairs it with CTR correctly, but SignalAI body text never states it (screenshot-only).

## 14. Complete [NEEDS INPUT] list
1. Fluently savings figure: $7.6M or $8M+/">$8M"? All surfaces must align.
2. ScopeIQ "60–70% ops efficiency / 70% planning-time reduction": confirm figure + framing, or remove from homepage metrics.
3. Toyota WebAR "+60% engagement lift": confirm or remove.
4. SignalAI "−5% build overhead" vs approved "25% segment-time reduction": which is correct?
5. Canonical contact email: is `hello@migueldelalama.com` live? Keep it, or standardize on gmail?
6. Stale public `/resume.pdf` (706 bytes): delete? Which resume file is current?
7. Is the GitHub repo intentionally public? What, concretely, must remain confidential (per case study)?
8. Case-study gating: keep password for AT&T case studies? Make Clockero public? Ungate resume?
9. Placeholder deep-dive and philosophy docs: unpublish/delete, or write real content?
10. Atlas case study: approve creating it from the approved facts?
11. Branding: keep "Architected by Miguel" or move name-forward?
12. Contact delivery: approve an email provider (e.g. Resend) or replace form with direct links for now?
13. Analytics: approve Vercel Web Analytics (or none)?
14. GitHub token scope: classic or fine-grained; repo-limited?
15. Positioning direction: choose from the options in PORTFOLIO_PLAN.md.

## 15. Recommended order of operations
1. **Restore the funnel (no positioning changes needed)**: contact delivery decision + interim mailto, ungate resume (pending approval), fix `/case-studies` middleware capture, fix error-message color/announcement, delete stale `/resume.pdf` (pending #6).
2. **Identity & shareability**: name/title/OG/canonical/robots/sitemap/per-route titles/Person schema; single H1.
3. **Truth pass on metrics**: resolve NEEDS INPUT #1–4, align every surface to approved facts.
4. **Access-policy decision + implementation**: repo visibility, gate scope, public previews of case studies.
5. **Content depth**: case-study restructuring (headings, text-based impact, "my role"), Atlas creation, placeholder cleanup, positioning rewrite per chosen direction.
6. **CMS safety**: unsaved-changes guard, delete confirmation, parity fixes (hero field, resume fields), server-side JSON validation.
7. **Hardening & polish**: sanitizer, SVG policy, CSP, path normalization, perf items (fonts, image dimensions), measurement (post-approval).

Full sequencing with batches, risks, and rollback: see PORTFOLIO_PLAN.md.
