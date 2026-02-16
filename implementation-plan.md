
⸻

Implementation Plan

Architected by Miguel

Ship fast.
Polish intentionally.
Protect depth.

Target: 4–6 weeks to interview-ready MVP

⸻

Build Philosophy
	•	Design system before screens.
	•	Structure before aesthetics.
	•	Authority before features.
	•	Protect private depth from day one.
	•	Ship in thin, testable layers.

This portfolio must feel intentional — not iterative chaos.

⸻

Phase 0 — Foundation (Week 1)

1. Repository & Infrastructure Setup

GitHub
	•	Create new repository (e.g., architected-by-miguel)
	•	Connect to existing GitHub account: delalamamiguel-max
	•	Enable:
	•	Branch protection for main
	•	Pull request previews
	•	Clear README describing positioning

Vercel
	•	Connect repository to Vercel
	•	Enable preview deployments per branch
	•	Add environment variable:

SITE_PASSWORD=<your-password>

Definition of Done
	•	Empty app deploys successfully.
	•	Preview deploy works on PR.
	•	Environment variable accessible server-side.

⸻

2. Core Project Architecture

Tech Stack Setup
	•	Vite
	•	React
	•	TypeScript
	•	Tailwind CSS
	•	shadcn/ui

Base Folder Structure

/components
  /ui
  /layout
  /case-study
/pages
/content
  /case-studies
  /philosophy
/lib
/middleware
/styles

Content Strategy

Case studies and essays stored in-repo:

/content/case-studies/*.md
/content/philosophy/*.md

Why:
	•	Version control
	•	Portability
	•	Builder credibility
	•	No CMS complexity

Definition of Done
	•	Base layout renders.
	•	Tailwind working.
	•	Typography tokens applied globally.

⸻

Phase 1 — Hybrid Auth (Week 1–2)

This is non-negotiable from the start.

⸻

3. Password Gate Implementation

Flow
	1.	User clicks private route.
	2.	Redirect to /login?next=<requested-route>.
	3.	User enters password.
	4.	Server validates against SITE_PASSWORD.
	5.	On success:
	•	Set secure session cookie.
	•	Redirect to original route.

⸻

4. Cookie Requirements
	•	HttpOnly
	•	Secure
	•	SameSite=Lax
	•	Expiration: 12–24 hours

No persistent accounts.
No database.

⸻

5. Route Protection

Protect:
	•	/case-studies
	•	/case-studies/*
	•	/deep-dive/*

Middleware behavior:

If cookie missing:
→ Redirect to /login.

⸻

6. Security Enhancements
	•	Basic rate limiting on login endpoint.
	•	Generic error message:
“Incorrect password.”
	•	No verbose error leaks.

⸻

7. Auth Definition of Done
	•	Direct URL access blocked.
	•	Redirect preserves intended route.
	•	Password rotation works via Vercel env change.
	•	Login works on desktop + mobile.
	•	Keyboard accessible.

⸻

Phase 2 — Design System First (Week 2)

Before finishing pages, lock emotional tone.

⸻

8. Typography System

Implement:
	•	H1–H4 scale
	•	Body text
	•	Monospace accent
	•	Line-height ≥ 1.6
	•	Consistent margin rhythm

Create internal /style-guide page (private).

⸻

9. Color Tokens

Define Tailwind theme tokens:
	•	Executive Navy
	•	Strategic Blue
	•	Systems Teal
	•	Impact Green
	•	Primary + Muted text

Validate AA+ contrast.

⸻

10. Spacing System
	•	8pt grid
	•	Standard section padding
	•	Card padding rules
	•	Container max width

No arbitrary spacing.

⸻

11. Component Library

Build reusable components:
	•	Button (primary / secondary / subtle)
	•	Card (default / metric / case study)
	•	Section wrapper
	•	Sticky side nav
	•	Tag pill
	•	Metric block

Definition of Done:
	•	Components reusable without overrides.
	•	No inline styling hacks.

⸻

Phase 3 — Homepage (Week 3)

Build in layers.

⸻

12. Hero Section
	•	Strong headline
	•	Subheadline
	•	CTA
	•	Controlled whitespace

Usability Test:

Ask 3 people:

“What level is this person operating at?”

If unclear, rewrite.

⸻

13. Metrics Section
	•	3 impact proof blocks
	•	Green used sparingly
	•	Short explanation below each metric

⸻

14. Strategic Pillars
	•	4 structured cards
	•	Clear headers
	•	2–3 bullets each

⸻

15. Homepage Definition of Done
	•	Authority visible in 8 seconds.
	•	No decorative noise.
	•	Mobile layout preserves hierarchy.
	•	Lighthouse performance strong.

⸻

Phase 4 — Case Study Engine (Week 3–4)

This is the core asset.

⸻

16. Case Study Template

Reusable layout:
	•	Sticky navigation
	•	Section anchors
	•	Clean reading rhythm

Sections:
	1.	Strategic Context
	2.	Architecture
	3.	Trade-offs
	4.	Execution Model
	5.	Impact
	6.	What’s Next

⸻

17. Architecture Section
	•	Optional diagram block
	•	Monospace labels
	•	Slightly denser layout

Signals builder identity.

⸻

18. Strategy Lens Toggle (Optional V1)

Toggle between:
	•	Strategic
	•	Architecture
	•	Execution

Implementation:
	•	Filter visible sections
	•	Maintain URL state if needed

⸻

19. Case Study Definition of Done
	•	Feels like internal executive doc.
	•	Structured.
	•	No long unbroken text.
	•	Metrics clear.
	•	Sticky nav smooth.

⸻

Phase 5 — Supporting Pages (Week 4)

⸻

20. Philosophy Page
	•	Essay layout
	•	Large margins
	•	Minimal distractions

Feels like reading a quiet strategy memo.

⸻

21. Resume Page
	•	Timeline layout
	•	Metrics bolded
	•	Tags visible
	•	Downloadable PDF

Skimmable in under 60 seconds.

⸻

22. Contact Page
	•	Minimal form
	•	Secure submission (serverless)
	•	Clear confirmation state

No unnecessary fields.

⸻

Phase 6 — Performance & Polish (Week 5)

⸻

23. Performance
	•	Optimize images
	•	Lazy-load diagrams
	•	Preload key fonts
	•	Ensure mobile performance

⸻

24. Accessibility Audit
	•	Semantic headings correct
	•	Focus states visible
	•	Keyboard navigation works
	•	Contrast AA+

⸻

25. Emotional Audit

Ask:
	•	Does this feel calm?
	•	Does it feel strategic?
	•	Is anything ornamental?
	•	Does the technical layer overpower the executive tone?

Remove anything unnecessary.

⸻

Monthly Ritual (Non-Negotiable)

Every 30 days:

30-minute usability test with:
	•	1 PM
	•	1 Engineer
	•	1 Hiring Manager (if possible)

Ask:
	•	What confused you?
	•	What felt impressive?
	•	What felt unclear?

Log top 3 issues.
Fix those first.

⸻

Deployment Workflow

For every change:
	1.	Create branch.
	2.	Deploy preview on Vercel.
	3.	Review mobile + desktop.
	4.	Merge after review.
	5.	Share link selectively.

Never push directly to production without preview.

⸻

Definition of Done (MVP)

The portfolio is ready when:
	•	Homepage signals authority instantly.
	•	At least 2 case studies polished.
	•	Hybrid auth seamless.
	•	Resume downloadable.
	•	Mobile optimized.
	•	Design feels intentional.
	•	Performance strong.

⸻

Stretch Roadmap

After MVP:
	•	Strategy Lens toggle
	•	Interactive system maps
	•	AI-powered case study reframing
	•	Public speaking section
	•	Executive-ready architecture briefs
	•	AI Strategy framework library

⸻

End of implementation-plan.md

⸻

