import { Section } from "@/components/layout/section";
import { MarkdownDomainEditor } from "@/components/admin/markdown-domain-editor";
import { getCaseStudyRawMap } from "@/lib/content-loader";
import { validateCaseStudyDoc } from "@/lib/content-schema";

export function AdminCaseStudiesPage() {
  return (
    <Section density="dense">
      <div className="space-y-6">
        <h1 className="h1">Admin / Case Studies</h1>
        <MarkdownDomainEditor
          title="Case study markdown"
          rawMap={getCaseStudyRawMap()}
          directory="content/case-studies"
          parseAndValidate={validateCaseStudyDoc}
          helper="Required order: Strategic Context, Architecture, Trade-offs, Execution, Impact, What's Next."
        />
      </div>
    </Section>
  );
}
