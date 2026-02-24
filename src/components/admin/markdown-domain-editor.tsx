import { useEffect, useMemo, useState } from "react";
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

type StatusState = {
  tone: "idle" | "success" | "error" | "info";
  message: string;
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

function normalizePathMap(rawMap: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(rawMap).map(([path, raw]) => [path.replace(/^\//, ""), raw]));
}

function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function slugValidationMessage(slug: string): string | null {
  if (!slug.trim()) return "Slug is required.";
  if (!SLUG_REGEX.test(slug)) {
    return "Use lowercase letters, numbers, and single hyphens only (example: revenue-ops-redesign).";
  }
  return null;
}

function formatUiError(error: unknown): string {
  const raw = error instanceof Error ? error.message : "Request failed.";

  if (/Missing GitHub environment variables/i.test(raw)) {
    return "CMS server is missing GitHub environment variables in Vercel.";
  }

  if (/GitHub write failed:/i.test(raw) || /GitHub delete failed:/i.test(raw)) {
    const cleaned = raw.replace(/^GitHub (write|delete) failed:\s*/i, "").trim();
    return cleaned || "GitHub rejected the request.";
  }

  if (/Invalid slug format/i.test(raw)) {
    return "Slug format is invalid. Use lowercase letters, numbers, and hyphens only.";
  }

  if (/Case study must include all required sections/i.test(raw)) {
    return "Case study must include all required sections in the editor body.";
  }

  if (/Case study section order is invalid/i.test(raw)) {
    return "Case study sections are out of order. Follow the required section sequence.";
  }

  return raw;
}

export function MarkdownDomainEditor({ title, rawMap, directory, parseAndValidate, helper }: MarkdownDomainEditorProps) {
  const [docsByPath, setDocsByPath] = useState<Record<string, string>>(() => normalizePathMap(rawMap));
  const records = useMemo(() => {
    return Object.entries(docsByPath)
      .map(([path, raw]) => ({ path, raw, state: fromRaw(raw) }))
      .sort((a, b) => a.state.title.localeCompare(b.state.title));
  }, [docsByPath]);

  const [selectedPath, setSelectedPath] = useState<string>(records[0]?.path ?? "");
  const [state, setState] = useState<EditorState>(records[0]?.state ?? emptyState);
  const [slugTouched, setSlugTouched] = useState(Boolean(records[0]?.state?.slug));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<StatusState>({ tone: "idle", message: "" });

  useEffect(() => {
    setDocsByPath(normalizePathMap(rawMap));
  }, [rawMap]);

  useEffect(() => {
    if (!selectedPath) return;
    const record = records.find((entry) => entry.path === selectedPath);
    if (!record) {
      setSelectedPath("");
      setState(emptyState);
      setSlugTouched(false);
    }
  }, [records, selectedPath]);

  const existingSlugs = records.map((entry) => entry.state.slug).filter(Boolean);
  const slugError = slugValidationMessage(state.slug);
  const isSlugDuplicate = existingSlugs.some(
    (slug) => slug === state.slug && (!selectedPath || !selectedPath.endsWith(`${state.slug}.md`)),
  );

  const selectPath = (path: string) => {
    const record = records.find((entry) => entry.path === path);
    if (!record) return;
    setSelectedPath(path);
    setState({ ...record.state });
    setSlugTouched(true);
    setStatus({ tone: "idle", message: "" });
  };

  const resetForNew = () => {
    setSelectedPath("");
    setState(emptyState);
    setSlugTouched(false);
    setStatus({ tone: "idle", message: "" });
  };

  const onSave = async () => {
    setStatus({ tone: "idle", message: "" });

    if (!state.title.trim()) {
      setStatus({ tone: "error", message: "Title is required." });
      return;
    }

    if (!state.summary.trim()) {
      setStatus({ tone: "error", message: "Summary is required." });
      return;
    }

    if (!state.body.trim()) {
      setStatus({ tone: "error", message: "Content body is required." });
      return;
    }

    if (slugError) {
      setStatus({ tone: "error", message: slugError });
      return;
    }

    const conflict = existingSlugs.find((slug) => slug === state.slug && (!selectedPath || !selectedPath.endsWith(`${state.slug}.md`)));
    if (conflict) {
      setStatus({ tone: "error", message: "Slug is already in use. Choose a unique slug." });
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
      const previousPath = selectedPath;
      const messagePrefix = directory.endsWith("case-studies") ? `cms: update case study ${state.slug}` : `cms: update ${state.slug}`;
      await cmsWriteFile(path, markdown, messagePrefix);
      setDocsByPath((prev) => {
        const next = { ...prev, [path]: markdown };
        if (previousPath && previousPath !== path) {
          delete next[previousPath];
        }
        return next;
      });
      setSelectedPath(path);
      setSlugTouched(true);
      setStatus({ tone: "success", message: `Saved "${state.title}" to GitHub. Preview updated immediately. Public site updates after Vercel deploy.` });
    } catch (error) {
      setStatus({ tone: "error", message: formatUiError(error) });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!selectedPath) {
      setStatus({ tone: "error", message: "Select an existing file to delete." });
      return;
    }

    try {
      setSaving(true);
      await cmsDeleteFile(selectedPath);
      setDocsByPath((prev) => {
        const next = { ...prev };
        delete next[selectedPath];
        return next;
      });
      resetForNew();
      setStatus({ tone: "success", message: "Deleted from GitHub. Public site updates after Vercel deploy." });
    } catch (error) {
      setStatus({ tone: "error", message: formatUiError(error) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={resetForNew} disabled={saving}>New</Button>
        {records.map((record) => (
          <Button
            key={record.path}
            variant={record.path === selectedPath ? "primary" : "subtle"}
            onClick={() => selectPath(record.path)}
            disabled={saving}
          >
            {record.state.slug || record.path}
          </Button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Input
            placeholder="slug"
            value={state.slug}
            onChange={(event) => {
              setSlugTouched(true);
              setState((prev) => ({ ...prev, slug: slugify(event.target.value) }));
            }}
            aria-invalid={Boolean(slugError || isSlugDuplicate)}
          />
          <p className={`text-xs ${slugError || isSlugDuplicate ? "text-red-400" : "text-muted-text"}`}>
            {slugError
              ? slugError
              : isSlugDuplicate
                ? "Slug is already in use."
                : "URL slug: lowercase letters, numbers, and hyphens only."}
          </p>
        </div>
        <div className="space-y-1">
          <Input
            placeholder="title"
            value={state.title}
            onChange={(event) => {
              const nextTitle = event.target.value;
              setState((prev) => {
                const nextSlug = !slugTouched || prev.slug === slugify(prev.title) ? slugify(nextTitle) : prev.slug;
                return { ...prev, title: nextTitle, slug: nextSlug };
              });
            }}
          />
          <p className="text-xs text-muted-text">Slug auto-generates from title until you edit the slug field.</p>
        </div>
        <Input placeholder="summary" value={state.summary} onChange={(event) => setState((prev) => ({ ...prev, summary: event.target.value }))} />
        <Input placeholder="tags (comma separated)" value={state.tags} onChange={(event) => setState((prev) => ({ ...prev, tags: event.target.value }))} />
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-primary-text">
        <input type="checkbox" checked={state.published} onChange={(event) => setState((prev) => ({ ...prev, published: event.target.checked }))} />
        Published
      </label>

      <MarkdownSplitEditor
        title={title}
        markdown={state.body}
        onChange={(next) => setState((prev) => ({ ...prev, body: next }))}
        helper={helper}
        imageUploadFolder={`${directory.split("/").pop() || "content"}/${state.slug || "draft"}`}
        disabled={saving}
      />


      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        <Button variant="secondary" onClick={onDelete} disabled={saving}>Delete</Button>
      </div>

      {status.message ? (
        <p className={`body-md ${status.tone === "error" ? "text-red-400" : status.tone === "success" ? "text-emerald-400" : "text-muted-text"}`}>
          {status.message}
        </p>
      ) : null}
    </div>
  );
}
