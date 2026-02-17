import { Link, useParams } from "react-router-dom";
import { CaseStudyTemplate } from "@/components/case-study/case-study-template";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { TagPill } from "@/components/ui/tag-pill";
import { getCaseStudies, getCaseStudyBySlug } from "@/lib/case-studies";

export function CaseStudiesIndexPage() {
  const studies = getCaseStudies();

  return (
    <Section density="dense">
      <div className="max-w-4xl space-y-6">
        <h1 className="h1">Case Studies</h1>
        <p className="body-lg">
          Placeholder list. Final case studies will be published with structured executive templates.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {studies.map((study) => (
            <Card key={study.slug} variant="case-study">
              <h2 className="h4">{study.title}</h2>
              <p className="mt-2 text-muted-text">{study.summary}</p>
              <div className="mt-4 flex items-center gap-2">
                {study.tags.map((tag) => (
                  <TagPill key={`${study.slug}-${tag}`}>{tag}</TagPill>
                ))}
              </div>
              <Link className="mt-4 inline-block font-mono text-sm text-systems-teal hover:underline" to={`/case-studies/${study.slug}`}>
                Open template
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function CaseStudyDetailPage() {
  const { slug } = useParams();
  const study = slug ? getCaseStudyBySlug(slug) : undefined;

  if (!study) {
    return (
      <Section density="dense">
        <div className="max-w-2xl space-y-4">
          <h1 className="h1">Case study not available.</h1>
          <p className="body-md">This case study is still being architected.</p>
          <Link className="font-mono text-sm text-systems-teal hover:underline" to="/case-studies">
            Back to case studies
          </Link>
        </div>
      </Section>
    );
  }

  return <CaseStudyTemplate study={study} />;
}

export function DeepDiveDetailPage() {
  const { slug } = useParams();
  const study = slug ? getCaseStudyBySlug(slug) : undefined;

  return (
    <Section density="dense">
      <div className="max-w-4xl space-y-6">
        <h1 className="h1">Deep Dive: {slug}</h1>
        <p className="mono-label">Architecture extension placeholder</p>
        <p className="body-lg">
          Placeholder deep-dive section for diagrams, governance details, and implementation patterns.
        </p>

        <Card variant="case-study" padding="md">
          <h2 className="h3">System Layers</h2>
          <p className="mt-2 body-md">Reserved for architecture diagrams and engineering execution artifacts.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(study?.architectureDiagram?.layers ?? []).map((layer) => (
              <div key={layer.name} className="rounded-md border border-slate-800 bg-slate-900/50 p-4">
                <p className="mono-label">{layer.name}</p>
                <p className="mt-2 body-md">{layer.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Section>
  );
}
