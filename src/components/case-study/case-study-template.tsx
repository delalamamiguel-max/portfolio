import { lazy, Suspense } from "react";
import { Section } from "@/components/layout/section";
import { StickySideNav } from "@/components/layout/sticky-side-nav";
import { TagPill } from "@/components/ui/tag-pill";
import type { CaseStudy } from "@/lib/case-studies";

const ArchitectureDiagram = lazy(() =>
  import("@/components/case-study/architecture-diagram").then((module) => ({ default: module.ArchitectureDiagram })),
);

type CaseStudyTemplateProps = {
  study: CaseStudy;
};

export function CaseStudyTemplate({ study }: CaseStudyTemplateProps) {
  const navItems = study.sections.map((section) => ({ id: section.id, label: section.label }));

  return (
    <Section density="dense">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <StickySideNav title="Section anchors" items={navItems} />

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

          {study.sections.map((section) => (
            <article key={section.id} id={section.id} className="card-case-study">
              <h2 className="h3">{section.label}</h2>

              {section.id === "architecture" && study.architectureDiagram ? (
                <Suspense fallback={<p className="mt-4 body-md">Loading architecture diagram...</p>}>
                  <ArchitectureDiagram diagram={study.architectureDiagram} />
                </Suspense>
              ) : null}

              <p className="mt-4 body-md">{section.content}</p>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
