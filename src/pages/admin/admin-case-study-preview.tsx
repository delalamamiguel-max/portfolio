import { Link, useParams } from "react-router-dom";
import { CaseStudyTemplate } from "@/components/case-study/case-study-template";
import { Section } from "@/components/layout/section";
import { getCaseStudyBySlug } from "@/lib/content-loader";

export function AdminCaseStudyPreviewPage() {
  const { slug } = useParams();
  const study = slug ? getCaseStudyBySlug(slug, true) : undefined;

  if (!study) {
    return (
      <Section density="dense">
        <div className="max-w-2xl space-y-4">
          <h1 className="h1">Admin preview unavailable</h1>
          <p className="body-md">The case study was not found in the current build output yet.</p>
          <p className="body-md text-muted-text">
            If you just created it, confirm the CMS save succeeded and wait for the Vercel rebuild to complete.
          </p>
          <Link className="font-mono text-sm text-systems-teal hover:underline" to="/admin/case-studies">
            Back to case study editor
          </Link>
        </div>
      </Section>
    );
  }

  return (
    <div className="space-y-4">
      <Section density="dense">
        <div className="max-w-4xl rounded-md border border-slate-700 bg-slate-950/60 p-4">
          <p className="mono-label text-systems-teal">ADMIN PREVIEW</p>
          <p className="mt-2 body-md">
            Preview supports drafts and unpublished content. Public route requires the case study to be published and the latest Vercel build to finish.
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <Link className="font-mono text-systems-teal hover:underline" to="/admin/case-studies">
              Back to editor
            </Link>
            <Link className="font-mono text-systems-teal hover:underline" to={`/case-studies/${study.slug}`}>
              Open public route
            </Link>
          </div>
        </div>
      </Section>
      <CaseStudyTemplate study={study} />
    </div>
  );
}

