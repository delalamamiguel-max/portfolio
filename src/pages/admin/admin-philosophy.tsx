import { Section } from "@/components/layout/section";
import { MarkdownDomainEditor } from "@/components/admin/markdown-domain-editor";
import { getPhilosophyRawMap } from "@/lib/content-loader";
import { validatePhilosophyDoc } from "@/lib/content-schema";

export function AdminPhilosophyPage() {
  return (
    <Section density="dense">
      <div className="space-y-6">
        <h1 className="h1">Admin / Philosophy</h1>
        <MarkdownDomainEditor
          title="Philosophy markdown"
          rawMap={getPhilosophyRawMap()}
          directory="content/philosophy"
          parseAndValidate={validatePhilosophyDoc}
          helper="Frontmatter + body markdown. Drafts stay hidden when published=false."
        />
      </div>
    </Section>
  );
}
