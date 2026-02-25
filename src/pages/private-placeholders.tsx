import { Link, useParams } from "react-router-dom";
import { CaseStudyTemplate } from "@/components/case-study/case-study-template";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { HistoryBackButton } from "@/components/ui/history-back-button";
import { TagPill } from "@/components/ui/tag-pill";
import { getCaseStudies, getCaseStudyBySlug, getDeepDiveBySlug, getDeepDives } from "@/lib/content-loader";

export function CaseStudiesIndexPage() {
  const studies = getCaseStudies(false);

  return (
    <Section density="dense">
      <div className="max-w-4xl space-y-6">
        <h1 className="h1">Case Studies</h1>
        <p className="body-lg">Index of published private case studies.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {studies.map((study) => (
            <Card key={study.slug} variant="case-study">
              <h2 className="h4">{study.title}</h2>
              <p className="mt-2 min-w-0 break-words text-muted-text [overflow-wrap:anywhere]">{study.summary}</p>
              <div className="mt-4 flex max-w-full flex-wrap items-start gap-2">
                {study.tags.map((tag) => (
                  <TagPill key={`${study.slug}-${tag}`}>{tag}</TagPill>
                ))}
              </div>
              <Link className="mt-4 inline-block font-mono text-sm text-systems-teal hover:underline" to={`/case-studies/${study.slug}`}>
                Open case study
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
  const study = slug ? getCaseStudyBySlug(slug, false) : undefined;

  if (!study) {
    return (
      <Section density="dense">
        <div className="max-w-2xl space-y-4">
          <h1 className="h1">Case study not available.</h1>
          <p className="body-md">This case study is not published.</p>
          <HistoryBackButton fallbackTo="/case-studies" label="Back" />
        </div>
      </Section>
    );
  }

  return <CaseStudyTemplate study={study} />;
}

export function DeepDiveDetailPage() {
  const { slug } = useParams();
  const study = slug ? getDeepDiveBySlug(slug, false) : undefined;
  const deepDives = getDeepDives(false);

  if (!study) {
    return (
      <Section density="dense">
        <div className="max-w-3xl space-y-5">
          <h1 className="h1">Deep Dive not available.</h1>
          <p className="body-lg">This deep dive is not published.</p>
          <HistoryBackButton fallbackTo="/deep-dive" label="Back" />
          <div className="space-y-2">
            {deepDives.map((doc) => (
              <Link key={doc.slug} to={`/deep-dive/${doc.slug}`} className="block font-mono text-sm text-systems-teal hover:underline">
                {doc.title}
              </Link>
            ))}
          </div>
        </div>
      </Section>
    );
  }

  return <CaseStudyTemplate study={study} />;
}
