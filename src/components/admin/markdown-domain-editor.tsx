import { useMemo, useState } from "react";
import { MarkdownSplitEditor } from "@/components/admin/markdown-split-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cmsDeleteFile, cmsWriteFile } from "@/lib/cms-client";
import { type MarkdownDoc, SLUG_REGEX } from "@/lib/content-schema";
import { buildMarkdown, parseFrontmatter } from "@/lib/markdown";

type MarkdownDomainEditorProps = {
  title: string;
  rawMap: Record<string, string>;
  directory: "content/philosophy" | "content/case-studies" | "content/deep-dive";
  parseAndValidate: (raw: string) => MarkdownDoc;
  helper: string;
};

type EditorState = {
  slug: string;
  title: string;
  summary: string;
  tags: string;
  published: boolean;
  body: string;
};

const emptyState: EditorState = {
  slug: "",
  title: "",
  summary: "",
  tags: "",
  published: false,
  body: "",
};

function fromRaw(raw: string): EditorState {
  const parsed = parseFrontmatter(raw);
  return {
    slug: String(parsed.frontmatter.slug || ""),
    title: String(parsed.frontmatter.title || ""),
    summary: String(parsed.frontmatter.summary || ""),
    tags: Array.isArray(parsed.frontmatter.tags) ? (parsed.frontmatter.tags as string[]).join(", ") : "",
    published: Boolean(parsed.frontmatter.published),
    body: parsed.body,
  };
}

export function MarkdownDomainEditor({ title, rawMap, directory, parseAndValidate, helper }: MarkdownDomainEditorProps) {
  const records = useMemo(() => {
    return Object.entries(rawMap)
      .map(([path, raw]) => ({ path: path.replace(/^\//, ""), raw, state: fromRaw(raw) }))
      .sort((a, b) => a.state.title.localeCompare(b.state.title));
  }, [rawMap]);

  const [selectedPath, setSelectedPath] = useState<string>(records[0]?.path ?? "");
  const [state, setState] = useState<EditorState>(records[0]?.state ?? emptyState);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");

  const existingSlugs = records.map((entry) => entry.state.slug).filter(Boolean);

  const selectPath = (path: string) => {
    const record = records.find((entry) => entry.path === path);
    if (!record) return;
    setSelectedPath(path);
    setState(record.state);
    setStatus("");
  };

  const resetForNew = () => {
    setSelectedPath("");
    setState(emptyState);
    setStatus("");
  };

  const onSave = async () => {
    setStatus("");

    if (!SLUG_REGEX.test(state.slug)) {
      setStatus("Slug must match ^[a-z0-9]+(?:-[a-z0-9]+)*$.");
      return;
    }

    const conflict = existingSlugs.find((slug) => slug === state.slug && (!selectedPath || !selectedPath.endsWith(`${state.slug}.md`)));
    if (conflict) {
      setStatus("Slug must be unique.");
      return;
    }

    const markdown = buildMarkdown(
      {
        slug: state.slug,
        title: state.title,
        summary: state.summary,
        tags: state.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        published: state.published,
      },
      state.body,
    );

    try {
      parseAndValidate(markdown);
      setSaving(true);
      const path = `${directory}/${state.slug}.md`;
      const messagePrefix = directory.endsWith("case-studies") ? `cms: update case study ${state.slug}` : `cms: update ${state.slug}`;
      await cmsWriteFile(path, markdown, messagePrefix);
      setSelectedPath(path);
      setStatus("Saved to GitHub. Vercel will auto-deploy.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save.";
      setStatus(message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!selectedPath) {
      setStatus("Select an existing file to delete.");
      return;
    }

    try {
      setSaving(true);
      await cmsDeleteFile(selectedPath);
      setStatus("Deleted from GitHub. Refresh after deploy.");
      resetForNew();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete failed.";
      setStatus(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={resetForNew}>New</Button>
        {records.map((record) => (
          <Button
            key={record.path}
            variant={record.path === selectedPath ? "primary" : "subtle"}
            onClick={() => selectPath(record.path)}
          >
            {record.state.slug || record.path}
          </Button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Input placeholder="slug" value={state.slug} onChange={(event) => setState((prev) => ({ ...prev, slug: event.target.value }))} />
        <Input placeholder="title" value={state.title} onChange={(event) => setState((prev) => ({ ...prev, title: event.target.value }))} />
        <Input placeholder="summary" value={state.summary} onChange={(event) => setState((prev) => ({ ...prev, summary: event.target.value }))} />
        <Input placeholder="tags (comma separated)" value={state.tags} onChange={(event) => setState((prev) => ({ ...prev, tags: event.target.value }))} />
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-primary-text">
        <input type="checkbox" checked={state.published} onChange={(event) => setState((prev) => ({ ...prev, published: event.target.checked }))} />
        Published
      </label>

      <MarkdownSplitEditor title={title} markdown={state.body} onChange={(next) => setState((prev) => ({ ...prev, body: next }))} helper={helper} />

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        <Button variant="secondary" onClick={onDelete} disabled={saving}>Delete</Button>
      </div>

      {status ? <p className="body-md text-muted-text">{status}</p> : null}
    </div>
  );
}
