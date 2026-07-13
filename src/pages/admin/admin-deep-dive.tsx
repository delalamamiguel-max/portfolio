import { Section } from "@/components/layout/section";
import { AdminRawMapLoader } from "@/components/admin/admin-raw-map";
import { MarkdownDomainEditor } from "@/components/admin/markdown-domain-editor";
import { validateCaseStudyDoc } from "@/lib/content-schema";

export function AdminDeepDivePage() {
  return (
    <Section density="dense">
      <div className="space-y-6">
        <h1 className="h1">Admin / Deep Dive</h1>
        <AdminRawMapLoader domain="deep-dive">
          {(rawMap) => (
            <MarkdownDomainEditor
              title="Deep dive markdown"
              rawMap={rawMap}
              directory="content/deep-dive"
              parseAndValidate={validateCaseStudyDoc}
              helper="Deep dives follow the same required structure as case studies."
            />
          )}
        </AdminRawMapLoader>
      </div>
    </Section>
  );
}
