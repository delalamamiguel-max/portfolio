import { Link } from "react-router-dom";
import { HeadingBlock } from "@/components/v2/heading-block";
import { SectionWrapper } from "@/components/v2/section-wrapper";
import { v2Essays } from "@/pages/v2/v2-data";

export function V2PhilosophyPage() {
  return (
    <SectionWrapper ariaLabel="Philosophy">
      <div className="v2-stack-24">
        <HeadingBlock level={1} title="Philosophy" subtext="Short essays on product strategy, governance, and execution systems." />

        <div className="v2-stack-16">
          {v2Essays.map((essay) => (
            <article key={essay.slug} className="v2-card v2-stack-8">
              <h2 className="v2-h3">{essay.title}</h2>
              <p className="v2-body">{essay.summary}</p>
              <div className="v2-tags">
                {essay.tags.map((tag) => (
                  <span key={`${essay.slug}-${tag}`} className="v2-chip">{tag}</span>
                ))}
              </div>
              <p><Link to="/v2/philosophy">Read</Link></p>
            </article>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
