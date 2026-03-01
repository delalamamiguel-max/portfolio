import { HeadingBlock } from "@/components/v2/heading-block";
import { SectionWrapper } from "@/components/v2/section-wrapper";
import { v2Resume } from "@/pages/v2/v2-data";

export function V2ResumePage() {
  return (
    <SectionWrapper ariaLabel="Resume">
      <div className="v2-stack-24">
        <HeadingBlock level={1} title="Resume" subtext={v2Resume.profile} />
        <p>
          <a className="v2-btn" href={v2Resume.downloadUrl} download>
            Download PDF
          </a>
        </p>

        <div className="v2-stack-16">
          {v2Resume.experience.map((entry) => (
            <article key={`${entry.role}-${entry.company}`} className="v2-record v2-stack-16">
              <header className="v2-stack-8">
                <h2 className="v2-h3">{entry.role}</h2>
                <p className="v2-body">{entry.company}</p>
                <p className="v2-caption">{entry.timeline}</p>
              </header>
              <ul className="v2-list">
                {entry.highlights.slice(0, 5).map((item) => (
                  <li key={item} className="v2-body">{item}</li>
                ))}
              </ul>
              <div className="v2-inline-actions" aria-label="Metrics">
                {entry.metrics.map((metric) => (
                  <span key={`${entry.role}-${metric}`} className="v2-chip">{metric}</span>
                ))}
              </div>
              <div className="v2-tags">
                {entry.tags.map((tag) => (
                  <span key={`${entry.role}-${tag}`} className="v2-chip">{tag}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
