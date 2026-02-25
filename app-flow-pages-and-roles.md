⸻

App Flow, Pages, and Roles

Architected by Miguel

This document defines:
	•	Site structure
	•	Access control logic
	•	User roles
	•	Core journeys
	•	Redirect behavior
	•	Authority signaling at each stage

The goal:
Zero confusion.
Clear structure.
Executive-grade flow.

⸻

1. Site Map (Top-Level Pages Only)

⸻

Public Routes

/
 /philosophy
 /resume
 /contact
 /login


⸻

Private Routes (Password Required)

/case-studies
/case-studies/[slug]
/deep-dive/[slug]

Private routes are protected via middleware and secure session cookie.

⸻

2. Purpose of Each Page (One Line Each)

⸻

/ — Homepage

Establish strategic altitude and measurable impact within 8 seconds.

Primary objective:
Drive qualified viewers to case studies.

⸻

/philosophy

Position Miguel as a systems thinker and Product × AI Strategy leader.

Signals long-term leadership potential.

⸻

/resume

Provide a scannable, metrics-forward summary of experience.

Optimized for recruiter efficiency.

⸻

/contact

Minimal and confident path to conversation.

Signals executive composure.

⸻

/login

Password gate to access private case studies.

Intentional, not defensive.

⸻

/case-studies

Index of case studies with summaries and tags.

Gateway to depth.

⸻

/case-studies/[slug]

Structured, executive-ready case study:
	1.	Strategic Context
	2.	Architecture
	3.	Trade-offs
	4.	Execution
	5.	Impact
	6.	Evolution

Core proof asset.

⸻

/deep-dive/[slug] (Optional)

Extended architecture diagrams, governance detail, execution templates.

Feels like internal documentation.

⸻

3. Access Model (Hybrid Auth)

⸻

Public Visitor

Access:
	•	Homepage
	•	Philosophy
	•	Resume
	•	Contact
	•	Login

Cannot access:
	•	Any /case-studies/*
	•	Any /deep-dive/*

⸻

Authenticated Viewer (Password Verified)

Access:
	•	All public routes
	•	All private case studies
	•	All deep-dive content

Session persists via secure cookie.

⸻

Site Owner (Miguel)

Responsibilities:
	•	Update content via owner-only in-app CMS (GitHub-backed)
	•	Rotate password via Vercel env var
	•	Manage public vs private routes
	•	Maintain content quality (section structure is flexible; CMS surfaces warnings)
	•	Review import warnings before publishing imported case studies

No user accounts exist.
No database required.
CMS writes create versioned commits in GitHub and trigger Vercel rebuilds.
Case study frontend rendering adapts to existing Markdown/MDX headings and does not require a rigid section schema.

⸻

4. Authentication Flow

⸻

Scenario A — Direct Private Access Attempt
	1.	Visitor lands on:
/case-studies/ml-modernization
	2.	Middleware detects no valid session cookie.
	3.	Redirect:
/login?next=/case-studies/ml-modernization
	4.	User enters password.
	5.	Password validated against SITE_PASSWORD.
	6.	Secure session cookie set.
	7.	Redirect to originally requested page.

No lost context.
No broken flow.

⸻

Scenario B — CTA from Homepage
	1.	Visitor clicks “Explore Case Studies.”
	2.	If not authenticated → redirect to login.
	3.	After login → redirect to /case-studies.

Smooth transition from executive surface to technical depth.

⸻

Scenario C — Returning Visitor
	1.	Cookie still valid.
	2.	Private pages load without interruption.

Experience feels seamless.

⸻

Scenario D — Owner CMS Save + Verification
	1.	Owner updates content in `/admin/*` and clicks save.
	2.	CMS commits content to GitHub via secure server-side API routes.
	3.	CMS returns verification links (`admin preview` / `live route`) and Vercel rebuild note.
	4.	Owner validates in admin preview immediately; public route updates after Vercel rebuild.

No silent success.
Clear verification path.

⸻

Scenario E — Owner Markdown/DOCX Import Editing
	1.	Owner imports `.docx`, `.md`, or `.mdx` into `/admin/case-studies`.
	2.	CMS auto-populates metadata/body, shows warnings, and applies draft.
	3.	Owner refines content with Markdown toolbar + visual table builder (including tables/images) and saves.

Editor remains Markdown/MDX-first to preserve Git-readable output.

⸻

Scenario F — Appearance Toggle + Reliable Reload Recovery
	1.	User toggles Light/Dark mode from the top-right navigation.
	2.	Preference persists and applies across website + CMS.
	3.	If a stale deployment chunk is requested, the app performs a one-time reload recovery.

This improves perceived reliability during frequent deployments.

⸻

5. Primary User Journeys (3 Steps Max Each)

⸻

Journey 1 — Executive Skim → Depth → Conversation
	1.	Land on /
	2.	Click “Explore Case Studies” → unlock → open case study
	3.	Click “Contact”

Signals:

Authority → Systems Depth → Leadership Readiness

⸻

Journey 2 — Recruiter → Resume → Download
	1.	Land on /
	2.	Click “Resume”
	3.	Download PDF

Frictionless.

⸻

Journey 3 — CTO / Platform Leader → Architecture Depth
	1.	Land on /
	2.	Unlock case studies
	3.	Jump directly to “System Architecture” section

Optional:
→ Navigate to /deep-dive/*

Signals architecture fluency.

⸻

Journey 4 — Product Leader → Philosophy → Systems Identity
	1.	Land on /
	2.	Click “Philosophy”
	3.	Read essays

Signals strategic thinking beyond features.

⸻

6. Page-Level Authority Goals

Each page must answer one implicit question.

⸻

Homepage

Question:
“Is this person operating at my level?”

Answer: Yes — immediately.

Operational note:
Homepage hero supports a CMS-controlled square profile image with responsive rendering.

⸻

Case Study

Question:
“Can this person handle system-level complexity?”

Answer: Clearly.

⸻

Deep Dive

Question:
“Do they understand architecture trade-offs?”

Answer: Yes, structurally.

⸻

Philosophy

Question:
“Do they think beyond execution?”

Answer: Yes, conceptually.

⸻

Resume

Question:
“Do the metrics support the narrative?”

Answer: Quantifiably.

⸻

7. Navigation Structure

⸻

Primary Nav (Top)
	•	Case Studies
	•	Philosophy
	•	Resume
	•	Contact

If locked:
	•	Case Studies → redirects to login

⸻

Sticky Case Study Nav (Right Side Desktop)

Sections:
	•	Strategic Context
	•	Architecture
	•	Trade-offs
	•	Execution
	•	Impact
	•	What’s Next

Purpose:

Reduce scroll friction.
Encourage structured reading.

⸻

8. Redirect & Error Handling Rules

⸻

Invalid Password

Message:

“Incorrect password. Try again.”

No detail. No system hints.

⸻

Expired Session
	•	Redirect to /login
	•	Preserve intended route

⸻

404

Tone:

Calm and professional.

Example:

“This page doesn’t exist yet.”

⸻

9. Content Governance Rules

To maintain authority:
	•	Every case study follows identical structure.
	•	Every impact section includes measurable metrics.
	•	No long unstructured paragraphs.
	•	No marketing fluff.
	•	Architecture sections clearly labeled.
	•	Strategy always precedes execution.

Consistency signals discipline.

⸻

10. Expansion Hooks (Future-Proofing)

Routes reserved for future growth:

/speaking
/frameworks
/ai-strategy
/resources

These can remain hidden until needed.

Design system must support expansion without redesign.

⸻

11. Flow Validation Checklist

Before launch, confirm:
	•	Public → Private redirect works.
	•	Return-to behavior works.
	•	Mobile navigation intuitive.
	•	Sticky nav does not break layout.
	•	All routes accessible via keyboard.
	•	No page feels cluttered.
	•	No route exposes private content unintentionally.

⸻

12. Success Criteria

The app flow succeeds when:
	•	Visitors never feel confused.
	•	Case studies feel intentional and protected.
	•	Public pages feel open and confident.
	•	The transition from surface to depth feels deliberate.
	•	Navigation feels obvious without explanation.

No cognitive friction.

⸻

End of app-flow-pages-and-roles.md

⸻
