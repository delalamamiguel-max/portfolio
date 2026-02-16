⸻

masterplan.md

⸻

Architected by Miguel

Strategy × Systems × Scaled Execution

⸻

30-Second Elevator Pitch

Architected by Miguel is a strategic portfolio platform designed to signal executive-level product thinking with visible systems depth.

It communicates:
	•	Enterprise-scale impact
	•	Architecture literacy and ML fluency
	•	Strategic clarity under governance constraints
	•	Measurable business outcomes

This is not a resume site.

It is a scope amplifier for Senior PM (FAANG), Principal, Director, and Product × AI Strategy roles.

Executive calm draws them in.
Systems depth proves readiness.

⸻

Problem & Mission

The Problem

Hiring leaders:
	•	Skim in under 2 minutes.
	•	Struggle to differentiate feature PMs from system-level operators.
	•	Rarely see product leaders who understand ML platforms and governance deeply.

Most portfolios:
	•	Feel decorative.
	•	Lack structured thinking.
	•	Don’t communicate altitude.

⸻

The Mission

Build a portfolio that:
	•	Signals strategic authority in 8 seconds.
	•	Reveals systems thinking through structured exploration.
	•	Demonstrates measurable enterprise impact.
	•	Positions Miguel for cross-altitude roles without over-indexing on title.

This portfolio optimizes for scope readiness, not job labels.

⸻

Target Audience

Primary
	•	VP / SVP Product
	•	CTOs evaluating product leaders with architecture literacy
	•	Heads of Platform / Data
	•	Executive hiring panels

Secondary
	•	FAANG recruiters hiring Senior PM
	•	Growth-stage companies hiring Principal / Director
	•	Companies seeking Product × AI Strategy hybrid leadership

⸻

Strategic Positioning

This portfolio signals:
	•	Senior PM-level rigor for FAANG environments
	•	Principal/Director-level system ownership
	•	Data + ML platform fluency
	•	Governance-aware innovation
	•	Product × AI Strategy leadership potential

The framing centers capability, not title.

⸻

Core Features

⸻

1. Executive Homepage (Public)

Goal: Authority in 8 seconds.

Above the fold:

Headline:
Senior Product Leader — Strategy, Data Platforms & ML Systems

Subheadline:
I concept, architect, and scale intelligent systems that drive measurable business outcomes.

Proof blocks:
	•	+8% CTR lift via ML modernization
	•	+12% engagement through experimentation systems
	•	$8M+ OPEX reduction via platform strategy

Strategic Pillars:
	•	Strategy → Vision, TAM modeling, roadmap clarity
	•	Architecture → Platform thinking, governance, ML lifecycle
	•	Execution → Shipping velocity, experimentation systems
	•	Leadership → Cross-functional influence in regulated environments

Primary CTA: Explore Case Studies
Secondary CTA: Download Resume

Tone: Calm. Structured. Premium.

⸻

2. Case Studies (Private — Password Protected)

These are the core proof assets.

Each case study follows the same structure:
	1.	Strategic Context
	2.	System Architecture
	3.	Trade-offs & Governance Constraints
	4.	Execution Model
	5.	Measurable Impact
	6.	What I’d Evolve Next

Optional: Strategy Lens toggle
	•	Strategic View
	•	Architecture View
	•	Execution View

Purpose:
	•	Reveal multi-altitude thinking.
	•	Demonstrate architecture literacy.
	•	Show decision quality under constraints.

Tone shifts slightly more technical but remains executive.

⸻

3. Philosophy Page (Public)

Short essays demonstrating systems thinking:
	•	Product as systems design
	•	Governance as acceleration
	•	Data as compounding asset
	•	Building experimentation cultures
	•	Concept → Architecture → Scale

This page positions Miguel beyond feature PM identity.

⸻

4. Resume Page (Public Recommended)
	•	Structured, scannable layout
	•	Downloadable PDF
	•	Highlighted metrics
	•	Competency tags:
	•	Strategy
	•	ML Systems
	•	Experimentation
	•	Platform Governance
	•	AI Strategy

Goal: Skimmable in under 60 seconds.

⸻

5. Contact Page (Public)

Minimal.

Headline:
“If you’re building intelligent platforms at scale, let’s talk.”

No fluff. No unnecessary form fields.

⸻

Hybrid Authentication Model

Public
	•	/ (Homepage)
	•	/philosophy
	•	/resume
	•	/contact
	•	/login

Private
	•	/case-studies
	•	/case-studies/[slug]
	•	/deep-dive/[slug]

Mechanism
	•	Password stored as SITE_PASSWORD in Vercel environment variables.
	•	Password validated server-side.
	•	Secure session cookie set:
	•	HttpOnly
	•	Secure
	•	SameSite=Lax
	•	Middleware protects private routes.
	•	Redirect flow:
	•	/case-studies/xyz → /login?next=/case-studies/xyz
	•	After login → return to intended page.

No user accounts.
No database.
Fast password rotation via Vercel.

This reinforces intentional depth and executive discretion.

⸻

High-Level Tech Stack

Frontend
	•	Vite + React + TypeScript
→ Modern, performant, maintainable
	•	Tailwind CSS
→ Precise spacing and executive minimalism
	•	shadcn/ui
→ System-driven component architecture

⸻

AI Assistance
	•	OpenAI Codex
→ Speeds scaffolding, refactors, component generation, and structured content integration.

Used for:
	•	Boilerplate components
	•	Repetitive UI scaffolding
	•	Content structuring
	•	Refactor acceleration

⸻

Hosting & Infrastructure
	•	Vercel
→ Global deployment
→ Preview per PR
→ Environment variable management
→ Middleware support

⸻

Source of Truth
	•	GitHub: delalamamiguel-max
→ Code and content version-controlled
→ Case studies stored as Markdown/JSON in /content
→ Vercel auto-deploy on merge

Signals builder credibility.

⸻

Content Architecture

Content stored in-repo:

/content
  /case-studies
  /philosophy

Each case study:
	•	Title
	•	Strategic Context
	•	Architecture
	•	Trade-offs
	•	Execution Model
	•	Metrics
	•	Evolution Notes
	•	Tags

Structured and extensible.

⸻

Conceptual Data Model (ERD in Words)

Entities:

CaseStudy
	•	id
	•	title
	•	summary
	•	strategicContext
	•	architecture
	•	tradeoffs
	•	executionModel
	•	metrics
	•	nextEvolution
	•	tags

PhilosophyEssay
	•	id
	•	title
	•	summary
	•	body
	•	tags

ResumeSection
	•	role
	•	company
	•	metrics
	•	timeline

Relationships:
	•	CaseStudy tagged by Strategic Pillar.
	•	Essays tagged by themes (AI, Governance, Systems).

Simple. Structured. Scalable.

⸻

UI Design Principles

(Aligned with the kindness philosophy from design-tips.md)

⸻

1. Executive Calm First

Large whitespace.
Clear hierarchy.
No decorative noise.

First impression: control.

⸻

2. Depth Revealed, Not Forced

Homepage = breathable.
Case studies = structured density.

Users choose to go deeper.

⸻

3. Emotional Intelligence in Design

Inspired by kindness principles:
	•	Motion is gentle (200–300ms).
	•	Error states are calm.
	•	Microcopy never blames.
	•	Defaults respect user attention.
	•	No urgency manipulation.

Capability + care.

⸻

4. 8-Second Authority Rule

A VP must understand:
	•	Scope
	•	Metrics
	•	Strategic altitude

In under 8 seconds.

If not, simplify.

⸻

Security & Compliance Notes
	•	HTTPS enforced
	•	Password stored in environment variable
	•	No persistent PII storage
	•	Secure cookie practices
	•	Basic rate limiting on login
	•	AA+ accessibility contrast
	•	No invasive analytics

Executive trust requires discipline.

⸻

Phased Roadmap

⸻

MVP (Weeks 1–4)
	•	Homepage
	•	2 polished case studies
	•	Resume page
	•	Contact page
	•	Hybrid password gate
	•	Base design system

Goal: Interview-ready.

⸻

V1 (Weeks 5–6)
	•	Strategy Lens toggle
	•	3–5 total case studies
	•	Diagram components
	•	SEO refinement
	•	Performance tuning

Goal: Standout differentiation.

⸻

V2
	•	Interactive architecture maps
	•	AI-powered case study reframing
	•	Public speaking section
	•	Downloadable executive briefs
	•	AI Strategy frameworks

Goal: Product × AI Strategy authority.

⸻

Risks & Mitigations

Risk: Too technical

Mitigation:
	•	Metrics before architecture
	•	Homepage non-technical

⸻

Risk: Feels like a blog

Mitigation:
	•	Structured templates
	•	Executive tone
	•	No long unstructured essays

⸻

Risk: Over-designed

Mitigation:
	•	Emotional audit:
	•	Calm?
	•	Intentional?
	•	Strategic?
	•	Remove ornamental elements.

⸻

Future Expansion
	•	Public AI strategy whitepapers
	•	Speaking engagements page
	•	Strategy newsletter
	•	Gated deep-dive technical briefings
	•	Public systems diagrams library

⸻

Definition of Success

The portfolio succeeds when:
	•	A VP immediately recognizes strategic altitude.
	•	A CTO sees architecture fluency.
	•	A recruiter understands scope readiness.
	•	Case studies feel like internal executive documents.
	•	The experience feels calm, structured, and kind.

⸻

End of masterplan.md

⸻
