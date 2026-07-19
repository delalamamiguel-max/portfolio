---
slug: traceguard-ai-case-study
title: TraceGuard AI: Audit-Ready Recall Readiness
summary: AI-assisted evidence capture and guided mock recalls for food companies. First customer live.
tags: [AI, B2B SaaS, Compliance, FSMA 204, Document AI, 0-to-1]
category: personal-entrepreneurship
published: true
---

## Strategic Context

![TraceGuard AI treats recall readiness as a connected-data problem](/images/cms/case-studies-traceguard-ai-case-study/diagram.webp){align=center width=100}

**Recall readiness without the crisis**

Small-to-mid food manufacturers, importers, and co-packers live under a hard regulatory expectation: when a recall happens, or an auditor simulates one, the company must trace a lot backward to its suppliers and forward to its customers, produce supplier proof, reconcile every unit of volume, and present a defensible closeout package. FSMA 204 and FSVP-era audit practice are raising that bar while the tooling most small operators actually use (spreadsheets, shared drives, and email threads) stays flat.

TraceGuard AI is a recall-readiness and traceability workspace built for exactly this gap: teams that need audit-ready mock recalls in hours, not an enterprise traceability implementation. It is live at traceguardai.com as an invite-only, multi-tenant SaaS with subscription billing, three operational roles, and a dedicated platform-administration layer.

## The Challenge

**A connected-data problem disguised as a document problem**

The insight that shaped the product: most small operators don't lack documents. They lack connections between them. A team can hold every COA, bill of lading, and shipment record and still be unable to assemble a defensible trace under time pressure, because the relationships live in people's heads.

The dependency structure is what makes recall execution hard:

  - Missing outbound data should only matter when a forward trace is in scope. Flagging it always creates noise; hiding it always creates risk
  - Supplier proof must stay visibly incomplete until a real response arrives, not when an email is sent
  - Reconciliation has to account for every volume state (in warehouse, shipped, sampled or scrapped) before 100% can be claimed
  - Closeout requires findings, corrective actions, and PCQI sign-off preserved as evidence, not as a meeting that happened

Generic checklist apps ignore these dependencies; enterprise traceability suites price out the segment entirely.

## My Role

I built all of the technology and act as the technology domain expert, taking the product from zero to one: product definition, UX design, data model, application architecture, AI ingestion design, billing and tenancy model, security hardening, and production operations.

My business partner is the industry expert. With more than a decade inside the food industry, he brings the insight into where compliance work actually breaks down, which friction points matter most, and where to focus so the product becomes a successful business rather than a clever tool. Product priorities came from that partnership: industry knowledge set the direction, and I translated it into a working system.

## Discovery & Insights

Discovery for TraceGuard AI did not come from formal user research. It came from lived expertise: my business partner has spent over ten years in the food industry, and the product encodes what that experience says about how recall drills actually fail in small operations. The regulatory frame (FSMA 204 traceability expectations, FSVP documentation, PCQI accountability) defines what must be provable. Industry experience defines why teams fail to prove it: fragmented records, supplier proof that never gets chased to completion, and volume numbers that don't reconcile on the day it matters.

Three conclusions carried directly into the product:

  - **The record is the product.** If entering operational records is painful, everything downstream is fiction. Entry friction was treated as the primary adoption risk.
  - **AI can accelerate evidence capture, but cannot be trusted to commit it.** Certificates of analysis arrive as scans, photos, and inconsistent layouts ("Batch NO.", "LOTE", "Lot #:"). Extraction is an AI problem; commitment is a human decision.
  - **The mock recall is the honest test of data quality.** Readiness isn't a dashboard score. It is whether connected records survive a timed drill.

## Product Strategy

  - **Make the Records Library the single source of truth.** Products, ingredients, suppliers, customers, lots, shipments, compositions, and documents persist as shared workspace data. The recall workflow reads the same records the team maintains daily, instead of recreating data in a drill-time silo.
  - **Reduce entry friction without removing accountability.** Manual entry and AI-assisted import converge on one editable review flow; nothing is committed without human confirmation.
  - **Design the recall around evidence dependencies.** Trace direction controls which gaps are actionable; supplier response status gates proof upload; reconciliation and closeout gate the final package.
  - **Sell readiness, not software setup.** Positioning targets a one-day setup and a drill measured in hours, with no sales calls and no enterprise implementation project. Pricing ($299 and $599 per month) sits deliberately above "checklist app" perception.

## Key Design Decisions

**Human-reviewed AI import over autonomous record creation**

The Upload Records flow accepts COAs as PDFs, scans, or photos. Digital PDFs use their text layer; scans go through OCR; each document gets one semantic-extraction pass through a multimodal LLM. Everything after that is deterministic application code: label-alias normalization, validation, deduplication, and mapping. Extracted values prefill the standard manual-entry flow with per-field AI badges, confidence scores, and low-confidence highlights. Every field stays editable, and every extraction is audited with the raw model output. The tradeoff: more clicks than "magic import." Accepted, because in a compliance product an unreviewed wrong lot number is worse than no automation.

**A connected evidence package over a narrative report**

The exportable FSVP Master Folder is a ZIP containing a branded PDF report plus the actual evidence: lot-level documents, supplier response proofs, traceability detail, reconciliation data, and closeout record. Placeholder-only folders are deliberately not generated. An auditor opening an empty folder destroys credibility faster than a missing feature.

**Workspace tenancy over user-local data**

PostgreSQL is the operational source of truth; document binaries live in private object storage; all visibility is scoped by workspace with server-side authorization on every document download. Company lifecycle (active, disabled, archived), seat limits with audited overrides, and a Support Mode that lets platform admins assist inside a tenant were built in from the start rather than retrofitted.

**Guided phases over an open-ended workflow**

The mock recall runs as explicit phases: initiate and trace, supplier outreach with proof, volume reconciliation with a live gauge and tolerance handling, then closeout with PCQI determination and signature. Backward trace is required; forward trace is optional and controls which gaps count. Rigid? Somewhat. But the rigidity is the audit logic.

## How I Worked

The operating constraint: one person building the technology, production standards, with an industry expert setting direction. Every feature traced to the core job (produce a defensible recall package under time pressure), and anything that didn't serve it was deferred to a written roadmap rather than half-built.

Production discipline was non-negotiable: CI runs lint, typecheck, 113 contract tests, dependency audit (blocking on critical and high), and build on every push; production gets end-to-end smoke plus authenticated flows against the live domain; error tracking, structured logging, health checks, and uptime monitoring back operations; security includes per-request CSP nonces, bcrypt, edge-validated JWT sessions, and billing webhook idempotency. Known limitations (in-memory rate limiting, no pagination for very large tenants, contract tests rather than live-database integration tests) are documented openly rather than hidden.

## Results & Impact

**Where the product stands today**

TraceGuard AI is a production system with its first customer live: World Foods and Flavors (worldfoodsandflavors.com), a global food sourcing and ingredient supply company with operations across the US, Europe, Latin America, and Asia. They recently began using TraceGuard AI for their recall-readiness work; early feedback has been enthusiastic, and formal reviews and measured outcomes will follow as usage matures.

What is verifiably delivered:

  - A live multi-tenant SaaS on a custom domain with invite-only signup, three roles, subscription billing (Starter and Growth), and a full platform-administration console
  - An AI document-ingestion pipeline (OCR, multimodal LLM extraction, confidence-scored human review, audit trail) for the messiest input in the domain: real-world COAs
  - A complete four-phase mock recall workflow producing an audit-ready evidence package as its output
  - Operational maturity uncommon at this stage: CI quality gates, end-to-end checks against production, error tracking, health monitoring, documented runbooks
  - A pre-production staging environment and a documented four-tier pricing strategy

As adoption grows, the metrics that matter here are drill completion time versus a spreadsheet baseline, reconciliation completeness, and audit outcomes. Those are being established with the first customer now rather than claimed in advance.

## Learnings & What's Next

**Industry expertise is a product input, not a marketing asset.** The partnership model worked because domain knowledge shaped what got built, not just how it was sold. The dependency-aware recall design came directly from knowing how drills fail in real operations.

**Trust is the product in regulated workflows.** AI earns its place by accelerating evidence capture while surfacing its own uncertainty: confidence scores, editable fields, audit trails. The moment extraction becomes invisible, the tool becomes an audit liability.

**Documented limitations are a feature.** Writing down what the system doesn't yet do, and the upgrade path, is what separates a credible production system from a demo.

Next: deepen the first customer deployment into measured outcomes, validate pricing against real willingness to pay, add live-database integration tests, and sequence the enterprise roadmap (SSO, MFA, integrations) against actual customer pull rather than speculation.
