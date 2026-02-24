import { Section } from "@/components/layout/section";
import { StickySideNav } from "@/components/layout/sticky-side-nav";
import { TagPill } from "@/components/ui/tag-pill";
import type { ValidatedCaseStudy } from "@/lib/content-schema";
import { markdownToHtml } from "@/lib/markdown";

type CaseStudyTemplateProps = {
  study: ValidatedCaseStudy;
};

function toId(heading: string): string {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function CaseStudyTemplate({ study }: CaseStudyTemplateProps) {
  const navItems = study.sections.map((section) => ({ id: toId(section.heading), label: section.heading }));
  const hasSections = study.sections.length > 0;

  return (
    <Section density="dense">
      <div className={`grid gap-8 ${hasSections ? "lg:grid-cols-[240px_1fr]" : "lg:grid-cols-1"}`}>
        {hasSections ? <StickySideNav title="Section anchors" items={navItems} /> : null}

        <div className="space-y-8">
          <header className="space-y-4">
            <h1 className="h1">{study.title}</h1>
            <p className="body-lg max-w-3xl">{study.summary}</p>
            <div className="flex flex-wrap items-center gap-2">
              {study.tags.map((tag) => (
                <TagPill key={tag}>{tag}</TagPill>
              ))}
            </div>
          </header>

          {hasSections ? (
            study.sections.map((section) => (
              <article key={section.heading} id={toId(section.heading)} className="card-case-study">
                <h2 className="h3">{section.heading}</h2>
                <div
                  className="mt-4 body-md space-y-3"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(section.content) }}
                />
              </article>
            ))
          ) : (
            <article className="card-case-study">
              <div
                className="body-md space-y-3"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(study.body) }}
              />
            </article>
          )}
        </div>
      </div>
    </Section>
  );
}
