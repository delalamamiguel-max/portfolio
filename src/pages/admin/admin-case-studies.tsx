import { Section } from "@/components/layout/section";
import { MarkdownDomainEditor } from "@/components/admin/markdown-domain-editor";
import { getCaseStudyRawMap } from "@/lib/content-loader";
import { validateCaseStudyDoc } from "@/lib/content-schema";
import { HistoryBackButton } from "@/components/ui/history-back-button";

export function AdminCaseStudiesPage() {
  return (
    <Section density="dense">
      <div className="space-y-6">
        <HistoryBackButton fallbackTo="/admin" label="Back" />
        <h1 className="h1">Admin / Case Studies</h1>
        <MarkdownDomainEditor
          title="Case study markdown"
          rawMap={getCaseStudyRawMap()}
          directory="content/case-studies"
          parseAndValidate={validateCaseStudyDoc}
          helper="Body structure is defined by Markdown/MDX headings. Known case study sections are suggested, not required."
          showBackButton={false}
        />
      </div>
    </Section>
  );
}
