import { CaseStudyCard } from "@/components/v2/case-study-card";
import { HeadingBlock } from "@/components/v2/heading-block";
import { SectionWrapper } from "@/components/v2/section-wrapper";
import { v2CaseStudies } from "@/pages/v2/v2-data";

export function V2CaseStudiesIndexPage() {
  return (
    <SectionWrapper ariaLabel="Case studies index">
      <div className="v2-stack-24">
        <HeadingBlock level={1} title="Case Studies" subtext="Index of strategic product and architecture case studies." />

        <div className="v2-filter-row" aria-label="Filters">
          <button type="button" className="v2-filter">All tags</button>
          <button type="button" className="v2-filter">Published</button>
        </div>

        <div className="v2-grid-2">
          {v2CaseStudies.map((study) => (
            <CaseStudyCard key={study.slug} slug={study.slug} title={study.title} summary={study.summary} tags={study.tags} />
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
