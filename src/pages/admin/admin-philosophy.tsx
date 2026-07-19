import { Section } from "@/components/layout/section";
import { AdminRawMapLoader } from "@/components/admin/admin-raw-map";
import { MarkdownDomainEditor } from "@/components/admin/markdown-domain-editor";
import { validatePhilosophyDoc } from "@/lib/content-schema";

export function AdminPhilosophyPage() {
  return (
    <Section density="dense">
      <div className="space-y-6">
        <h1 className="h1">Admin / Philosophy</h1>
        <AdminRawMapLoader domain="philosophy">
          {(rawMap) => (
            <MarkdownDomainEditor
              title="Philosophy markdown"
              rawMap={rawMap}
              directory="content/philosophy"
              parseAndValidate={validatePhilosophyDoc}
              helper="Frontmatter + body markdown. Drafts stay hidden when published=false."
            />
          )}
        </AdminRawMapLoader>
      </div>
    </Section>
  );
}
