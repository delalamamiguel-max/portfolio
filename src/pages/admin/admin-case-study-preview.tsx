import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CaseStudyTemplate } from "@/components/case-study/case-study-template";
import { Section } from "@/components/layout/section";
import { fetchContentDoc } from "@/lib/content-loader";
import { validateCaseStudyDoc, type ValidatedCaseStudy } from "@/lib/content-schema";

type PreviewState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "ready"; study: ValidatedCaseStudy };

export function AdminCaseStudyPreviewPage() {
  const { slug } = useParams();
  const [state, setState] = useState<PreviewState>({ status: "loading" });

  useEffect(() => {
    if (!slug) {
      setState({ status: "missing" });
      return;
    }

    let mounted = true;
    setState({ status: "loading" });

    fetchContentDoc("case-studies", slug)
      .then((raw) => {
        if (!mounted) return;
        if (!raw) {
          setState({ status: "missing" });
          return;
        }
        try {
          setState({ status: "ready", study: validateCaseStudyDoc(raw) });
        } catch {
          setState({ status: "missing" });
        }
      })
      .catch(() => {
        if (mounted) setState({ status: "missing" });
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (state.status === "loading") {
    return (
      <Section density="dense">
        <p className="body-md text-muted-text" role="status">
          Loading preview...
        </p>
      </Section>
    );
  }

  if (state.status === "missing") {
    return (
      <Section density="dense">
        <div className="max-w-2xl space-y-4">
          <h1 className="h1">Admin preview unavailable</h1>
          <p className="body-md">The case study was not found on the content branch.</p>
          <p className="body-md text-muted-text">
            If you just created it, confirm the CMS save succeeded and reload this page.
          </p>
          <Link className="link-accent" to="/admin/case-studies">
            Back to case study editor
          </Link>
        </div>
      </Section>
    );
  }

  return (
    <div className="space-y-4">
      <Section density="dense">
        <div className="max-w-4xl rounded-md border border-border bg-card/90 p-4 shadow-sm">
          <p className="mono-label">ADMIN PREVIEW</p>
          <p className="mt-2 body-md">
            Preview supports drafts and unpublished content. Public route requires the case study to be published and the latest Vercel build to finish.
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <Link className="link-accent" to="/admin/case-studies">
              Back to editor
            </Link>
            <Link className="link-accent" to={`/case-studies/${state.study.slug}`}>
              Open public route
            </Link>
          </div>
        </div>
      </Section>
      <CaseStudyTemplate study={state.study} />
    </div>
  );
}
