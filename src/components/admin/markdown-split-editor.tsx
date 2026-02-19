import { useMemo } from "react";
import { markdownToHtml } from "@/lib/markdown";

type MarkdownSplitEditorProps = {
  title: string;
  markdown: string;
  onChange: (next: string) => void;
  helper?: string;
};

export function MarkdownSplitEditor({ title, markdown, onChange, helper }: MarkdownSplitEditorProps) {
  const preview = useMemo(() => markdownToHtml(markdown), [markdown]);

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-2">
        <p className="text-sm text-primary-text">{title}</p>
        {helper ? <p className="text-sm text-muted-text">{helper}</p> : null}
        <textarea
          className="min-h-[420px] w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-sm text-primary-text"
          value={markdown}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-primary-text">Live preview</p>
        <article className="min-h-[420px] rounded-md border border-slate-700 bg-slate-950 p-4">
          <div className="body-md space-y-3" dangerouslySetInnerHTML={{ __html: preview }} />
        </article>
      </div>
    </section>
  );
}
