---
slug: bidflare-case-study
title: BidFlare: Explainable Contract Matching
summary: Deterministic scoring with bounded AI review for California public-sector opportunities.
tags: [AI, GovTech, B2B SaaS, Recommendations, Document AI, 0-to-1]
category: personal-entrepreneurship
published: true
---

## Strategic Context

![BidFlare match score: 40/35/25 weighting with a hard-gate cap and bounded AI review](/images/cms/case-studies-bidflare-case-study/diagram.webp){align=center width=100}

**A fragmented market, an explainability problem**

California's public-sector market is enormous and shattered: 5,000+ public agencies (483 municipalities, 58 counties, 1,100+ school districts, 3,400+ special districts) publishing opportunities across Cal eProcure, DGS, Caltrans, SAM.gov, and local portals. For a small marketing or communications agency, the question isn't whether work exists. It is whether any given opportunity is worth proposal time, and that answer hides in eligibility fine print and hundred-page attachments.

BidFlare is an opportunity-intelligence platform built end to end for that question: it ingests opportunities from public sources, scores each against the agency's profile with a transparent deterministic engine, explains the result in plain English, and, for the opportunities worth pursuing, reads every attachment and produces a verified, citation-grounded brief of what the response actually requires. It is deployed at bidflare.io (marketing) and app.bidflare.io (product), in English and Spanish, and is preparing for formal launch.

## The Challenge

**Aggregation doesn't solve prioritization**

Existing tools surface volume; they don't answer the small agency's three real questions: Can we legally compete? Does this fit our sweet spot? Do we have an edge worth the proposal effort?

The failure modes the product was designed against:

  - **Confident false positives.** Keyword-overlap scores rank an opportunity highly even when a required set-aside certification or an unserviceable on-site location makes it unwinnable
  - **Opaque AI scores.** A pure-LLM score can't be challenged or reproduced, which is fatal for a tool whose job is justifying where a small team spends its week
  - **Hidden inventory.** Default keyword filters silently hide most of the market behind the user's first search term
  - **The buried requirements problem.** The decisive details (mandatory pre-bid meetings, insurance minimums, submission formats, addendum changes) live in attachments nobody has time to read

## My Role

I built all of the technology and act as the technology domain expert, taking the product from zero to one: product definition, scoring-model design, search and recommendation behavior, onboarding funnel, document-intelligence architecture, multi-source ingestion, billing and entitlements, release operations, and the marketing site.

My business partner is the industry expert. With more than twenty years in marketing, he brings the insight into how small agencies actually find, evaluate, and pursue work, which friction points matter most, and where to focus so the product becomes a successful business. Industry knowledge set the direction; I translated it into a working system.

## Discovery & Insights

Discovery for BidFlare did not come from formal user research. It came from two sources: my business partner's twenty-plus years of marketing-industry experience, which defined the target customer and the real economics of proposal effort, and shipped corrections to my own initial assumptions, documented in the product itself.

  - **Search that defaulted to the user's primary keyword silently hid most of the database.** I replaced it with browse-all by default: every biddable opportunity visible, ranked by fit, keyword applied only when the user asks. A search should never be a dead end. If a keyword matches few rows, the full listing appends below rather than showing a wall of nothing.
  - **A "hybrid" agency saw far-out-of-state on-site contracts as high matches.** The fix encoded real-world travel logic: remote preference ignores distance, hybrid serves within twice the stated radius, local is strict. A blank place of performance is treated as unknown (the distance check applies), not remote.
  - **Trust requires showing the blocker, not just the score.** Scores map to plain labels, weak matches get visual subordination, and AI-adjusted results display an explanation of exactly what nuance changed the number.

## Product Strategy

  - **Transparent rules before AI.** The core score is deterministic and reproducible: Eligibility 40% (can they compete and deliver), Fit 35% (is it their sweet spot), Edge 25% (do they have an advantage), computed at read time from profile and opportunity data, never stored stale.
  - **Blockers are blockers.** A missing required set-aside certification or out-of-area on-site work caps the score at 39, so a real blocker can never read as a strong match; an explicitly excluded keyword caps it at 20.
  - **AI for bounded nuance only.** An LLM reviews top candidates for what structured fields can't capture (intent, industry context, implicit on-site requirements, staffing scale), with authority limited to an adjustment between minus 15 and plus 15 points. It can never lift a hard-gated score, returns zero when the score is right, is cached by opportunity and profile hash, and fails safely to the deterministic result.
  - **Meet the market's language.** Full English and Spanish product, reflecting the agencies the product serves.

## Key Design Decisions

**Deterministic core, bounded AI: not an AI score with rules bolted on**

This ordering is the product's spine. The deterministic engine makes every recommendation inspectable and free to compute; the AI layer is selective (only candidates scoring at least 30 with real descriptions), cached with a seven-day TTL, and instantly invalidated when scoring-relevant profile fields change. The tradeoff: the system occasionally under-uses AI judgment. Accepted, because in a trust-critical ranking product explainability compounds and opacity churns.

**Attachments as a knowledge base, briefs with a verification pass**

For opportunities worth pursuing, BidFlare processes every attachment (RFPs, addenda, exhibits, spreadsheets, templates) through a scheduled extraction pipeline that never scrapes inside a user's request, into classified, citation-addressable document records. Document types carry authority rules: an addendum or official Q&A controls the base document for the facts it restates. The Opportunity Intelligence Brief then reads the combined document set and produces an executive brief plus a submission checklist where every item quotes its source text and file. Generation runs as two LLM passes: one to draft, and one independent QA pass that re-reads the sources and corrects or removes anything that doesn't trace back. Only verified output is persisted, cached by content hash so briefs regenerate only when documents actually change. Generation is staged and resumable (documents, draft, and verification each persist), so a retry continues instead of starting over.

**Derived, never stored**

Profile-dependent outputs (match scores, Match Criteria, Have and Missing checklist statuses) are computed at read time, never persisted. A profile edit is reflected everywhere immediately; there is no stale-score class of bug.

**Value before signup**

Onboarding asks six questions and shows a real match preview before the account wall. Answers persist locally with a 24-hour TTL so an interrupted user resumes instead of restarting, and the teaser scores the real database while returning only non-sensitive fields. The full eight-section profile editor lives post-signup, with a "complete profile" nudge when sparse.

**A server-side opportunity store over live upstream reads**

All user-facing reads hit the product's own store, keeping search fast and the product usable even when a procurement portal is down. Paid features are enforced server-side, and billing entitlements fail closed when verification is unavailable.

## How I Worked

One person building the technology, production discipline, with an industry expert setting direction. Release operations run through an isolated pre-production environment (separate domains, separate database) with promotion to production only via reviewed pull request: no manual production deploys, no promoting feature previews. Pragmatic engineering judgment shows up in small places: state-centroid distance estimation instead of a geocoding dependency; a same-origin proxy for auth calls after discovering DNS-level adblockers were breaking login; structured retryable-versus-permanent error contracts on the brief pipeline.

## Results & Impact

**Where the product stands today**

BidFlare has not formally launched yet, and this case study says so plainly: there are no users or revenue to report. What exists is a launch-ready product and the infrastructure behind it:

  - A bilingual, multi-source opportunity-intelligence product with deterministic explainable scoring, bounded AI review, and citation-grounded document briefs, deployed on separate marketing and app domains
  - A document pipeline that turns unread RFP attachments into verified requirement checklists with quoted sources: the feature that converts a search tool into an intelligence product
  - A value-first onboarding funnel engineered to demonstrate fit before asking for an account
  - Monetization infrastructure ready in pre-production: a one-time intelligence report ($149) and a subscription ($199 per month or $1,908 per year) with server-side entitlements
  - Documented expansion research for local-government coverage (PlanetBids, OpenGov, Euna) reusing the source-adapter model

The launch plan is deliberate: instrument the funnel end to end first, so the first cohort produces evidence (screening time saved, recommendation acceptance, onboarding conversion, paid conversion) instead of anecdotes.

## Learnings & What's Next

**Responsible AI ranking starts with constraints the model can't negotiate away.** Hard gates being immutable, meaning the model can never lift a blocked score, is the single design choice that makes the AI layer trustworthy rather than threatening.

**A recommendation layer must never hide the market it ranks.** The browse-all correction was the product's most important humility lesson: defaults that filter are defaults that deceive.

**Verification is what makes AI-generated content shippable.** The brief's independent QA pass, which re-reads sources and deletes anything untraceable, is the difference between a demo feature and something an agency can act on.

Next: formal launch, end-to-end funnel instrumentation, moving monetization from pre-production to production, expanding local-portal coverage behind the adapter model, and letting observed behavior choose between deepening match quality and broadening coverage.
