---
slug: clockero-case-study
title: Clockero Case Study
summary: Clockero is a B2B SaaS product built to serve industries with distributed field teams: construction, agriculture, logistics, maintenance, and similar operations. The target custome
tags: [ai, B2B, SaaS, experimentation, governance, vibe coding]
published: true
---

## Strategic Context

How I designed and shipped a full-stack field-workforce platform solo in a single sprint

**At a Glance**

![Image](/images/cms/case-studies-clockero-case-study/2026/02/screenshot-2026-02-27-at-5-37-27-pm-455783.webp){align=center width=100}

**01  |  Background**

Clockero is a B2B SaaS product built to serve industries with distributed field teams: construction, agriculture, logistics, maintenance, and similar operations. The target customer is a business owner or operations manager overseeing 5–50 workers who report from job sites every day.

The product verifies time and daily work logs for field-based teams. From GPS-verified check-in to an AI-structured daily report—every shift is fully accounted for, with zero paper.

![Image](/images/cms/case-studies-clockero-case-study/2026/02/screenshot-2026-02-27-at-5-36-21-pm-397075.webp){align=center width=100}


Field supervisors and operations managers face a persistent documentation problem: paper sign-in sheets get lost, filled out retroactively, or skipped entirely. Manual daily logs take 10–20 minutes per worker to compile—time that should be spent on the job. And without GPS verification, there is no auditable proof of presence.

**Why it mattered**

- No verified proof of worker presence creates liability exposure and billing disputes
- Manual log compilation wastes supervisor time and introduces transcription errors
- Paper-based systems cannot feed analytics, payroll integrations, or compliance reports
- Field workers are phone-first—existing solutions assumed desktop access

**Key constraints**

- Workers often have limited connectivity in the field → offline-first architecture required
- Many field workers lack regular email access → SMS-based authentication needed
- No dedicated dev team or budget → every technology choice had to minimize operational overhead

**03  |  What I Built**

Clockero replaces paper logs with a lightweight mobile PWA that any worker can install directly from a browser—no app store required. The core loop: clock in with GPS verification, record a quick voice note, and let AI structure it into a daily report. The PDF is auto-generated and emailed within seconds.

**Core modules shipped**

![Image](/images/cms/case-studies-clockero-case-study/2026/02/screenshot-2026-02-27-at-5-38-21-pm-515921.webp){align=center width=100}


## Trade-offs

Every architectural choice was a deliberate tradeoff. This is where the product thinking lives.

**PWA over native app**

React Native or Flutter would have required app store submissions, separate codebases, and longer release cycles. A PWA is installable from any browser, ships from the same codebase as the web app, and requires zero app store approval. The tradeoff: limited access to background GPS. Accepted—foreground check-in is sufficient for the core use case.

**Supabase as the full backend**

Rather than standing up a Node/Express API server, I used Supabase for PostgreSQL + Auth + Edge Functions in a single managed platform. Row Level Security (RLS) enforces multi-tenant isolation at the database level—so even a bug in client-side JavaScript cannot leak cross-tenant data. This was a deliberate security and complexity tradeoff: RLS policies are harder to debug, but the security guarantee is stronger than any application-layer filter.

**SMS OTP authentication**

Field workers are phone-first. Many do not check email regularly or have a stable email address. Twilio-powered SMS OTP through Supabase Auth removes the email dependency entirely. The cost is linear Twilio spend—acceptable at this stage, and the right call for the audience.

**Client-side PDF generation**

jsPDF generates reports directly in the browser. This eliminates a server-side rendering dependency and keeps infrastructure simple. Workers get their PDF immediately, even on slow connections, because the generation happens on-device.

**Shared database with RLS over schema-per-tenant**

A single Supabase project with organization\_id scoping is faster to develop, cheaper to operate, and easier to maintain at this stage. The upgrade path is documented: partition the checkins table at 100K users, add read replicas for global deployments. Starting simple on purpose.

**05  |  How I Worked**

**Tools & stack**

![Image](/images/cms/case-studies-clockero-case-study/2026/02/screenshot-2026-02-27-at-5-39-28-pm-587878.webp){align=center width=100}


**Approach**

I operated as PM, designer, and developer simultaneously—a constraint that forced ruthless prioritization. Every feature started with a user job-to-be-done: “Submit a verified, structured daily work log in under 2 minutes.” If a decision didn't serve that job, it was deferred.

Vibe coding tools (Antigravity + Codex) dramatically compressed implementation time, but required disciplined architectural oversight: AI-generated code was reviewed for security implications, RLS coverage, and edge cases before merging. The tools accelerated execution; product judgment guided direction.

## Impact

Clockero is a production-grade product—not a prototype. Below are the qualitative outcomes and the design intent behind each metric:

**What was delivered**

- A fully installable PWA with offline support—workers can clock in without connectivity
- An AI-powered voice-to-report pipeline that reduces log time from ~15 minutes to under 2 minutes
- A self-serve signup wizard with Stripe seat-based billing—zero manual onboarding required
- Multi-tenant architecture with database-level isolation (RLS)—enterprise-grade security at startup cost
- A super admin console for platform-wide operations management—ready to support early customers

**Skills demonstrated**

- Full product ownership: discovery → architecture → build → deploy → iterate
- Security-conscious engineering: RLS, CSP headers, Turnstile, HTTPS by default
- Modern AI integration: voice pipeline, not just a chatbot wrapper
- Cost-awareness: every vendor choice balanced capability against per-unit cost
- Documented tradeoffs: upgrade paths defined for 10K, 100K, and global scale

**07  |  What I Learned**

**AI-assisted development requires architectural discipline**

Vibe coding tools are powerful accelerators but they don’t understand multi-tenancy, RLS policy interactions, or security header implications. The faster you can generate code, the more important it becomes to have a clear mental model of the system’s security boundaries before you start.

**The right auth model is the one your user can actually use**

Email/password would have been faster to implement. SMS OTP was the right choice because field workers are phone-first. Designing for the actual user context—not the convenient one—changes every downstream decision about authentication, session management, and device support.

**Offline-first is a feature, not a nice-to-have**

Field workers lose connectivity regularly. Building offline support with IndexedDB from the start meant the core job (check in + log) works regardless of signal. This was a non-negotiable product decision, not an enhancement.

## What's Next

- MFA  for Admin accounts — enterprise-readiness requirement
- Dev/prod environment separation — second Supabase project for safe experimentation
- Industry-specific AI prompt tuning — better log quality for construction vs. agriculture vs. logistics
- Native mobile app — background GPS tracking for continuous location verification
- Advanced analytics dashboard — attendance trends, compliance rates, org-level insights
