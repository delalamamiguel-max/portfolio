import { Section } from "@/components/layout/section";
import { MarkdownDomainEditor } from "@/components/admin/markdown-domain-editor";
import { getDeepDiveRawMap } from "@/lib/content-loader";
import { validateCaseStudyDoc } from "@/lib/content-schema";

export function AdminDeepDivePage() {
  return (
    <Section density="dense">
      <div className="space-y-6">
        <h1 className="h1">Admin / Deep Dive</h1>
        <MarkdownDomainEditor
          title="Deep dive markdown"
          rawMap={getDeepDiveRawMap()}
          directory="content/deep-dive"
          parseAndValidate={validateCaseStudyDoc}
          helper="Deep dives follow the same required structure as case studies."
        />
      </div>
    </Section>
  );
}
