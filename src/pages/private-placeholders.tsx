import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CaseStudyTemplate } from "@/components/case-study/case-study-template";
import { Section } from "@/components/layout/section";
import { HistoryBackButton } from "@/components/ui/history-back-button";
import { fetchContentDoc, type ContentDomain } from "@/lib/content-loader";
import { validateCaseStudyDoc, type ValidatedCaseStudy } from "@/lib/content-schema";
import { useDocumentTitle } from "@/lib/use-document-title";

type DocState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error" }
  | { status: "ready"; study: ValidatedCaseStudy };

function useFetchedStudy(domain: ContentDomain, slug: string | undefined, requirePublished: boolean): DocState {
  const [state, setState] = useState<DocState>({ status: "loading" });

  useEffect(() => {
    if (!slug) {
      setState({ status: "not-found" });
      return;
    }

    let mounted = true;
    setState({ status: "loading" });

    fetchContentDoc(domain, slug)
      .then((raw) => {
        if (!mounted) return;

        if (!raw) {
          setState({ status: "not-found" });
          return;
        }

        try {
          const study = validateCaseStudyDoc(raw);
          if (requirePublished && !study.published) {
            setState({ status: "not-found" });
            return;
          }
          setState({ status: "ready", study });
        } catch {
          setState({ status: "error" });
        }
      })
      .catch(() => {
        if (mounted) {
          setState({ status: "error" });
        }
      });

    return () => {
      mounted = false;
    };
  }, [domain, slug, requirePublished]);

  return state;
}

function DocStateFallback({ state, notFoundTitle, notFoundDetail }: { state: DocState; notFoundTitle: string; notFoundDetail: string }) {
  if (state.status === "loading") {
    return (
      <Section density="dense">
        <p className="body-md text-muted-text" role="status">
          Loading content...
        </p>
      </Section>
    );
  }

  const isError = state.status === "error";

  return (
    <Section density="dense">
      <div className="max-w-2xl space-y-4">
        <h1 className="h1">{isError ? "Unable to load this page." : notFoundTitle}</h1>
        <p className="body-md">{isError ? "Something went wrong while loading the content. Please try again." : notFoundDetail}</p>
        <HistoryBackButton fallbackTo="/" label="Back to Home" />
      </div>
    </Section>
  );
}

export function CaseStudyDetailPage() {
  const { slug } = useParams();
  const state = useFetchedStudy("case-studies", slug, true);
  useDocumentTitle(state.status === "ready" ? state.study.title : undefined);

  if (state.status !== "ready") {
    return <DocStateFallback state={state} notFoundTitle="Case study not available." notFoundDetail="This case study is not published." />;
  }

  return <CaseStudyTemplate study={state.study} showBackButton={false} />;
}

export function DeepDiveDetailPage() {
  const { slug } = useParams();
  const state = useFetchedStudy("deep-dive", slug, true);
  useDocumentTitle(state.status === "ready" ? state.study.title : undefined);

  if (state.status !== "ready") {
    return <DocStateFallback state={state} notFoundTitle="Deep Dive not available." notFoundDetail="This deep dive is not published." />;
  }

  return <CaseStudyTemplate study={state.study} showBackButton={false} />;
}
