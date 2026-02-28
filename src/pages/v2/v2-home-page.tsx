import { CTABlock } from "@/components/v2/cta-block";
import { HeadingBlock } from "@/components/v2/heading-block";
import { QuoteBlock } from "@/components/v2/quote-block";
import { SectionWrapper } from "@/components/v2/section-wrapper";

export function V2HomePage() {
  return (
    <>
      <SectionWrapper ariaLabel="Hero">
        <div className="v2-stack-24 v2-text-column">
          <HeadingBlock
            level={1}
            eyebrow="Positioning"
            title="Senior Product Leader — Strategy, Data Platforms, and ML Systems"
            subtext="I architect operating systems for product teams that need strategic clarity and measurable outcomes."
          />
          <div className="v2-inline-actions">
            <a className="v2-btn" href="/v2/case-studies">
              Explore Case Studies
            </a>
            <a className="v2-btn" href="/v2/contact">
              Contact
            </a>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper ariaLabel="Proof strip">
        <div className="v2-grid-3">
          <article className="v2-card v2-stack-8">
            <p className="v2-h3">+8%</p>
            <p className="v2-h4">CTR lift</p>
            <p className="v2-body">Delivered through model-serving modernization.</p>
          </article>
          <article className="v2-card v2-stack-8">
            <p className="v2-h3">+12%</p>
            <p className="v2-h4">Engagement</p>
            <p className="v2-body">Gained by scaling experimentation systems.</p>
          </article>
          <article className="v2-card v2-stack-8">
            <p className="v2-h3">$8M+</p>
            <p className="v2-h4">OPEX reduction</p>
            <p className="v2-body">Achieved with platform simplification.</p>
          </article>
        </div>
      </SectionWrapper>

      <SectionWrapper ariaLabel="Selected highlights">
        <div className="v2-stack-24">
          <HeadingBlock level={2} title="Selected Highlights" subtext="Work samples focused on strategy-to-execution continuity." />
          <div className="v2-grid-2">
            <article className="v2-card v2-stack-8">
              <h3 className="v2-h3">Experimentation Platform</h3>
              <p className="v2-body">Standardized experimentation operations for faster decision quality.</p>
            </article>
            <article className="v2-card v2-stack-8">
              <h3 className="v2-h3">ML Modernization</h3>
              <p className="v2-body">Reframed architecture trade-offs around reliability and operating cost.</p>
            </article>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper ariaLabel="Strategic pillars">
        <div className="v2-stack-24">
          <HeadingBlock level={2} title="Strategic Pillars" subtext="Compact operating principles for decision quality." />
          <div className="v2-grid-4">
            <article className="v2-card v2-stack-8"><h3 className="v2-h3">Strategy</h3><p className="v2-body">Portfolio framing tied to measurable outcomes.</p></article>
            <article className="v2-card v2-stack-8"><h3 className="v2-h3">Architecture</h3><p className="v2-body">Platform choices aligned to governance constraints.</p></article>
            <article className="v2-card v2-stack-8"><h3 className="v2-h3">Execution</h3><p className="v2-body">Delivery cadence with explicit trade-offs.</p></article>
            <article className="v2-card v2-stack-8"><h3 className="v2-h3">Leadership</h3><p className="v2-body">Cross-functional alignment around system outcomes.</p></article>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper ariaLabel="Final call to action">
        <div className="v2-stack-24 v2-text-column">
          <QuoteBlock quote="If it does not improve clarity or authority, remove it." />
          <CTABlock
            title="Ready to discuss your next strategic build?"
            text="I work with teams that need product strategy and architecture decisions to move in lockstep."
            primary={{ label: "Contact", to: "/v2/contact" }}
            secondary={{ label: "View Case Studies", to: "/v2/case-studies" }}
          />
        </div>
      </SectionWrapper>
    </>
  );
}
