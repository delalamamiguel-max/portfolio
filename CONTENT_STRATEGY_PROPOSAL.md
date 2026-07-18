# Content Strategy Proposal: AI at the Foundation

Phases 1 and 2 of the repositioning engagement. Nothing here is implemented. Baseline audited: `feature/portfolio-audit-fixes` (production `main` differs only by that branch's pending improvements).

Style rule applied throughout: no em dashes, per your standing direction.

---

## Phase 1: Content audit

### Current positioning and primary narrative

The site currently positions you as a **generalist systems-minded product leader**. The narrative reads: senior product leader, complex systems made simple, operating with strategy, architecture, and execution rigor. AI appears as an attribute of individual projects (metric descriptors, credential blurbs, case-study tags) but never as the identity claim. The brand voice ("Architected by Miguel", "Built for scale. Designed for trust.", "Designed for calm scale") is atmosphere rather than argument: it sounds senior without saying what you are senior *at*.

### Where the message is generic, repetitive, or undersells AI leadership

| Location | Problem |
|---|---|
| Hero headline "Senior Product Leader. Complex systems, simple experiences." | Role-generic; interchangeable with thousands of PM portfolios; zero AI signal |
| Hero sub "The experience looks simple. The systems behind it aren't." | Clever but contentless; restates the headline |
| Eyebrow "Built for scale. Designed for trust." | Generic platitude; duplicates the scale theme used again below |
| Side panel "Operating Model / Designed for calm scale" | Brand-speak; unexplained; hard-coded in JSX, not CMS-editable |
| "How I Operate" pillars | Solid content, consulting-flavored framing ("I design decision systems, not feature roadmaps"); no AI thread |
| "My Approach" section | Four bullets that restate the pillars; pure repetition ("AI embedded into workflow" here is the single best line on the site and it is buried) |
| Repetition across sections | "scale" appears in the eyebrow, headline area, pillars, approach, and contact; "systems" in five places |
| Case-study cards | Titles are filenames ("Fluently AI Case Study"); summaries mix voices; the AI-at-the-core pattern across all five stories is never named |
| CTAs | "Explore Case Studies" / "Contact" are functional but flat; contact headline "If you're building at scale, let's talk." addresses founders more than hiring managers |
| The unstated asset | Every single case study is a product where AI is the core mechanism, not a feature. Enterprise (SignalAI, Atlas, Fluently), agency (ScopeIQ), and founder-built (Clockero, plus TraceGuard and BidFlare in draft). The portfolio never claims this pattern. That is the underselling. |

### What controls the affected copy

| Surface | Source | CMS-editable? |
|---|---|---|
| Hero eyebrow, headline, subheadline, CTAs | `content/pages/home.json` | Yes (/admin/pages) |
| Hero side panel copy ("Operating Model", "Platform thinking", "Measurable momentum") | hard-coded in `src/pages/home-page.tsx` | No |
| Selected Impact heading/subtext + 5 metric tiles | `home.json` | Yes |
| Pillars heading/subtext + 3 pillars | `home.json` (`strategicPillars*`) | Yes |
| "My Approach" + "Continuous Learning" | `home.json` (`customSections`) | Yes |
| Section order + nav labels | `content/pages/home-structure.json` | Yes |
| Section headings "Case Studies", "Resume", "Contact" + case-study section intro line | hard-coded in `home-page.tsx` | No |
| Case-study titles, summaries, tags | frontmatter in `content/case-studies/*.md` | Yes (/admin/case-studies) |
| Contact headline/subtext | `content/pages/contact.json` | Yes |
| Brand wordmark "Architected by Miguel" | `src/components/layout/site-shell.tsx` | No |
| Meta title/description, OG copy | `index.html` | No |
| Login-page copy | `src/pages/login-page.tsx` | No |
| Localization files | None; the site is English-only (noted because the brief mentioned translations) |

### How the positioning should flow

Foundation claim (hero) → measured proof (impact tiles) → the pattern demonstrated (case studies, moved up) → the method behind the pattern (pillars, reframed) → the credentials that back it (learning) → conversion (resume, contact). Each case study then opens with the same three-beat logic: the operational problem, intelligence at the core, the measured result. CTAs carry one consistent verb set from hero to contact.

---

## Phase 2: Proposed content strategy

### Positioning statement

> Miguel de la Lama is a senior product leader who builds products with AI at the foundation. Across a decade of digital product work, at AT&T scale and in SaaS ventures he has shipped end to end, the pattern repeats: find a high-stakes operational problem, put intelligence at the core of the product rather than bolting a model on, prove it through experimentation, and scale it into measured business impact.

This adapts the foundation-first idea to an individual operator. It is defensible from existing approved facts: 10+ years, ~7 years PM, AT&T Senior PM, 30M-user personalization, Fluently, Atlas, experimentation strengths, self-built SaaS. It avoids venture-studio, consulting, and generic-AI-builder framing because the subject is always the product he led and the measured outcome.

### Hero (proposed)

| Element | Current | Proposed |
|---|---|---|
| Eyebrow | Built for scale. Designed for trust. | Miguel de la Lama · Senior Product Leader |
| Headline | Senior Product Leader. Complex systems, simple experiences. | I build products with AI at the foundation. |
| Subheadline | The experience looks simple. The systems behind it aren't. | Not features with a model bolted on. Products where intelligence is the core: personalization serving 30 million users, generative AI that moved revenue, and AI-native SaaS shipped end to end. |
| Primary CTA | Explore Case Studies | See the work |
| Secondary CTA | Contact | Get the resume |
| Side panel label/tagline | Operating Model / Designed for calm scale | The pattern / Problem → intelligence at the core → proof → scale |
| Side panel card 1 | Platform thinking: Reusable systems, governance loops... | Enterprise scale: AT&T platforms and personalization serving 30M+ monthly users |
| Side panel card 2 | Measurable momentum: Proof points, signal clarity... | Founder execution: AI-native SaaS designed, built, and shipped end to end |

Notes: the name in the eyebrow closes the identity gap flagged in the original audit. "Generative AI that moved revenue" is backed by Atlas (15% revenue improvement, approved). The side-panel arrow line uses the arrow character already used elsewhere on the site, not an em dash.

### Section hierarchy and narrative flow (proposed)

| # | Current | Proposed | Rationale |
|---|---|---|---|
| 1 | Hero | Hero (repositioned) | Foundation claim |
| 2 | Selected Impact | Selected Impact, retitled **Proof** (nav label already "Proof") | Numbers immediately after the claim |
| 3 | How I Operate | **Case Studies, moved up**, intro line names the pattern | Evidence before method; recruiters click work, not philosophy |
| 4 | My Approach + Continuous Learning (custom sections) | **How I Build** (pillars, reframed; absorbs the best "My Approach" lines) | One method section instead of two overlapping ones |
| 5 | Case Studies | Continuous Learning (condensed) | Credential support, lower priority |
| 6 | Resume | Resume | Conversion |
| 7 | Contact | Contact | Conversion |

Implementation note: order and labels live in `home-structure.json`; removing "My Approach" as a separate section is a CMS content edit, not a schema change.

### Section-level copy (proposed)

**Proof (Selected Impact)**
- Heading: "Proof" · Subtext: "Shipped products. Measured outcomes." (replaces "Real products. Real scale. Real results.")
- Metric tiles: unchanged pending your open decisions on the three flagged figures (Fluently dollar amount, 60-70% ops efficiency, +60% WebAR). Recommendation: once resolved, the five tiles should be SignalAI, Fluently, Atlas, plus one agency and one founder tile, so every tile maps to an openable case study.

**Case Studies**
- Section heading: "The work" (hard-coded change) · Intro: "Seven products. One pattern: intelligence at the core, proven by measurement." (count adjusts to what is published)

**How I Build (pillars reframed, same underlying content)**
| Current pillar | Proposed pillar | Content carried over |
|---|---|---|
| Strategy: "I design decision systems, not feature roadmaps." | **Find the leverage.** "AI earns its place by moving a business number." | Tie AI capability to measurable outcomes; business cases that unlock executive funding; sequencing against scale and governance constraints |
| Systems Architecture: "I treat platforms as operating models." | **Intelligence at the core.** "Architecture built around the model, not squeezed around it." | Data as product; ML lifecycle design (telemetry to retraining to deployment); governance from day one |
| Execution at Scale: "Complex systems require structured alignment." | **Prove it, then scale.** "Experimentation over opinion, every launch." | A/B-validated launches; MVPs that de-risk investment; leading 30+ contributors across Product, Engineering, Data Science, and partners |

**Continuous Learning**: keep the five credentials; tighten each "Applied Context" line to one clause; closing line unchanged.

**Contact**
- Headline: "Hiring for AI product leadership? Let's talk." (replaces "If you're building at scale, let's talk.")
- Subtext: "No pitch decks. No formalities. Just a conversation." (keep)
- Button: "Start a conversation" (replaces "Send")

**Resume**: CTA "Get the resume" with the one-line support: "Full history, metrics, and references on request." (only if accurate; otherwise CTA alone).

### Case-study titles and summaries (proposed)

Slugs and URLs stay unchanged. Titles drop the "Case Study" suffix and lead with the outcome.

| Current title | Proposed title | Proposed summary |
|---|---|---|
| SignalAI Case Study | SignalAI: Personalization at 30-Million-User Scale | How AT&T replaced manual segmentation with ML personalization, lifting CTR 8% and engagement 12%. |
| Fluently AI Case Study | Fluently AI: The Platform That Replaced Outsourcing | An in-house AI translation platform that cut turnaround ~99% and content defects ~50% at AT&T. |
| Atlas Case Study | Atlas: Generative Copy at the Speed of Targeting | GenAI copy variations at scale: 17% productivity, 25% engagement, 15% revenue improvement. |
| ScopeIQ Case Study | ScopeIQ: Getting a Distrusted Model Adopted | How listening, explainability, and an MVP rollout turned a shelved planning model into core process. |
| Clockero Case Study | Clockero: AI-Native Field Accountability, Built Solo | GPS-verified check-ins, voice-to-report AI, production SaaS shipped by one person. |
| (draft) TraceGuard AI | TraceGuard AI: Audit-Ready Recall Readiness | AI-assisted evidence capture and guided mock recalls for food companies. First customer live. |
| (draft) BidFlare | BidFlare: Explainable Contract Matching | Deterministic scoring with bounded AI review for California public-sector opportunities. |

Framing change inside each study: the opening section leads with the three-beat pattern (operational problem, intelligence at the core, measured result). SignalAI, Fluently, and ScopeIQ should also gain a short "My Role" section to match Atlas and the new drafts; that is a content addition requiring your facts and approval.

### Brand and metadata

- Wordmark: recommend "Miguel de la Lama" with "Architected by Miguel" retired or demoted to a footer signature. Your call from the earlier open decision; the new hero works either way.
- Meta title stays name-led; description updates to the foundation line. Login and 404 copy unaffected.

### What this proposal deliberately avoids

- No invented metrics, clients, or roles; every proposed line traces to the approved fact set or existing published content.
- No venture-studio voice: the subject is always "products I led", never "companies we build".
- No consulting voice: no "we help clients", no service language.
- The three flagged metric conflicts remain flagged; this proposal does not resolve them.

---

## Approval needed

1. Positioning statement and hero (the core decision).
2. Section reorder and the merge of "My Approach" into the pillars.
3. Case-study retitling set.
4. Contact/CTA language.
5. Wordmark decision.

On approval, copy changes land as CMS-content commits (home.json, home-structure.json, contact.json, case-study frontmatter) plus small code edits for the hard-coded strings, each in separate reviewable commits on the feature branch.
