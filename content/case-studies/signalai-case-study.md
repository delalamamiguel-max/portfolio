---
slug: signalai-case-study
title: SignalAI: Personalization at 30-Million-User Scale
summary: How AT&T replaced manual segmentation with ML personalization, lifting CTR 8% and engagement 12%.
tags: [ML Personalization, Real-Time Engagement, A/B Testing, CTR Optimization, Enterprise AI, MarTech]
category: company-products
published: true
---

## Strategic Context

![SignalAI: a decoupled, self-optimizing personalization microservice](/images/cms/case-studies-signalai-case-study/diagram.webp){align=center width=100}

How AT&T Moved from Manual Segmentation to ML-Powered Personalization and Drove an 8% CTR Lift Across the Customer Platform

![Image](/images/cms/case-studies-signalai-case-study/2026/02/screenshot-2026-02-27-at-6-31-28-pm-699581.webp){align=center width=100}




**Context: Who & What**

AT&T's dot-com platform serves millions of customers across consumer and business segments. During a major CMS platform migration, the product team identified a critical opportunity: replace a slow, manual content personalization process with an ML-driven system capable of adapting to user behavior in real time.

This case study covers the end-to-end product work spanning stakeholder alignment through architecture design and A/B-validated launch that made the transition possible.

## The Challenge

**Conflicting Priorities, Static Outputs**

Manual content segmentation was creating compounding problems across teams. The existing approach required analysts to hand-build audience segments, producing outputs that were static, slow to update, and blind to real-time user signals like cart abandonment or browsing recency.

![Image](/images/cms/case-studies-signalai-case-study/2026/02/screenshot-2026-02-27-at-6-32-00-pm-733447.webp){align=center width=100}


Key pain points included:

- Time delays in segment creation prevented rapid response to changing user behavior
- Static segments could not adapt as users moved through the purchase funnel
- Marketing and engineering were misaligned on what 'success' looked like, stalling prioritization
- Infrastructure concerns about ML inference load had no proposed solution, creating engineering resistance

## The Solution

**ML-Based Personalization, Built for Scale**

The solution was a decoupled ML personalization microservice integrated into the CMS platform. It was designed so marketing could act on high-value segments immediately while engineering retained full confidence in infrastructure stability.

## Key Architecture Decisions

**How We Built It**

- Decoupled microservice architecture. Personalization logic was separated into its own service, enabling independent scaling based on model usage and removing dependency on the CMS release cycle.
- Redis caching for frequent recommendations reduced inference calls by 40%, directly addressing engineering concerns about server load and latency under traffic spikes.
- Feedback loops for self-optimization. User interactions including clicks, dwell time, and cart behavior were fed back into the model, enabling continuous improvement without manual retraining cycles.
- Phased roadmap with scalability prioritized early. Infrastructure concerns were addressed in the first sprint, reducing engineering resistance and creating alignment before feature work began.

## Execution & Collaboration

**Aligning Four Teams Around One Roadmap**

The most complex part of this engagement was not the technology. It was the stakeholder alignment. Marketing, engineering, data science, and platform operations each had distinct success criteria. Four teams were brought together through a structured workshop series designed to surface trade-offs transparently and build a shared prioritization model.

Key execution steps:

- Ran cross-functional workshops with marketing and engineering leads to surface conflicting assumptions and align on shared KPIs before any technical work began
- Used third-party research to build a data-backed business case for ML, demonstrating the specific inefficiencies of manual segmentation including time-to-publish delays and engagement ceilings
- Partnered with data scientists and marketing analysts to identify highest-value segments: repeat purchasers, high-frequency buyers, and cart abandoners. These cohorts showed the strongest revenue signal.
- Designed and ran an A/B test comparing the ML recommendation variant against the manual segmentation control, establishing clean measurement before scaling
- Worked with engineering to finalize the microservice architecture, caching strategy, and feedback loop implementation, with infrastructure concerns formally addressed in the roadmap before feature delivery

## Results & Impact

**Measurable Wins Across the Board**

Headline outcomes:

- 8% click-through rate improvement, validated through A/B testing against the manual segmentation control
- 12% engagement improvement across personalized experiences
- Deployed at scale on a platform serving approximately 30 million monthly users

![Image](/images/cms/case-studies-signalai-case-study/2026/02/screenshot-2026-02-27-at-6-32-44-pm-803460.webp){align=center width=100}


Beyond the headline metrics, the project delivered meaningful qualitative outcomes:

- Engineering and marketing aligned on a shared roadmap for the first time in the platform's history, reducing future prioritization conflict
- The microservice architecture established a reusable pattern for future ML integrations across the CMS platform
- Segment creation time dropped by approximately 25%, freeing capacity for higher-leverage strategic initiatives
- The Redis caching implementation became a reference architecture for other inference-heavy services on the platform

## Learnings

**Key Takeaways**

- Infrastructure concerns are a prioritization blocker, not a technical afterthought. Addressing the caching and scaling architecture before feature work eliminated the primary source of engineering resistance.
- Shared workshops outperform async alignment on cross-functional problems. The structured workshop format surfaced assumptions that would have created re-work if left unresolved.
- A/B testing with high-value segments first de-risked the broader rollout. Running the experiment on cart abandoners and repeat purchasers produced faster, cleaner signal than a broad launch would have.
