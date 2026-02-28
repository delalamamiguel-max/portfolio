import { Link, useParams } from "react-router-dom";
import { CTABlock } from "@/components/v2/cta-block";
import { HeadingBlock } from "@/components/v2/heading-block";
import { QuoteBlock } from "@/components/v2/quote-block";
import { SectionWrapper } from "@/components/v2/section-wrapper";
import { v2CaseStudies } from "@/pages/v2/v2-data";

function toAnchorId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function V2CaseStudyDetailPage() {
  const { slug } = useParams();
  const study = v2CaseStudies.find((item) => item.slug === slug);

  if (!study) {
    return (
      <SectionWrapper>
        <div className="v2-stack-16">
          <h1 className="v2-h1">Case study not found</h1>
          <p className="v2-body"><Link to="/v2/case-studies">Back to case studies</Link></p>
        </div>
      </SectionWrapper>
    );
  }

  const showAnchorNav = study.sections.length >= 3;

  return (
    <SectionWrapper ariaLabel="Case study detail">
      <article className="v2-stack-32">
        <div className="v2-stack-16">
          <p><Link to="/v2/case-studies">Back to case studies</Link></p>
          <HeadingBlock level={1} title={study.title} subtext={study.summary} />
          <div className="v2-tags">
            {study.tags.map((tag) => (
              <span key={`${study.slug}-${tag}`} className="v2-chip">{tag}</span>
            ))}
          </div>
        </div>

        {showAnchorNav ? (
          <nav className="v2-anchor-nav" aria-label="Section anchors">
            <ul className="v2-list">
              {study.sections.map((section) => (
                <li key={section.heading}>
                  <a href={`#${toAnchorId(section.heading)}`}>{section.heading}</a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="v2-stack-24 v2-text-column">
          {study.sections.map((section, index) => (
            <section key={section.heading} id={toAnchorId(section.heading)} className="v2-block v2-stack-16">
              <h2 className="v2-h2">{section.heading}</h2>
              <p className="v2-body">{section.body}</p>
              {index === 1 ? (
                <QuoteBlock quote="Architecture decisions should reduce complexity in delivery, not add ceremony." />
              ) : null}
              {index === 2 ? (
                <table>
                  <caption className="v2-caption">Execution signal snapshot</caption>
                  <thead>
                    <tr><th>Signal</th><th>Direction</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Cycle time</td><td>Down</td></tr>
                    <tr><td>Decision confidence</td><td>Up</td></tr>
                  </tbody>
                </table>
              ) : null}
            </section>
          ))}
        </div>

        <CTABlock
          title="Need this level of strategic clarity in your roadmap?"
          text="Let’s discuss the operating model and architecture decisions that unblock execution."
          primary={{ label: "Contact", to: "/v2/contact" }}
        />
      </article>
    </SectionWrapper>
  );
}
