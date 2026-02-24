import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DocxCaseStudyImporter } from "@/components/admin/docx-case-study-importer";
import { MarkdownSplitEditor } from "@/components/admin/markdown-split-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cmsCheckRoute, cmsDeleteFile, cmsWriteFile } from "@/lib/cms-client";
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

type ImportedDraftState = {
  pendingFirstDraftSave: boolean;
  warnings: string[];
  bodyLength: number;
  bodyMinThresholdPassed: boolean;
  truncatedSuspected: boolean;
  importedImageCount: number;
  placeholderImageAltCount: number;
  imageAltReviewConfirmed: boolean;
};

type SaveResultState = {
  created: boolean;
  path: string;
  previewUrl?: string;
  liveUrl?: string;
  deploymentNote?: string;
  liveRouteCheck?: { ok: boolean; status: number };
  previewRouteCheck?: { ok: boolean; status: number };
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
  const [importedDraftState, setImportedDraftState] = useState<ImportedDraftState | null>(null);
  const [lastSaveResult, setLastSaveResult] = useState<SaveResultState | null>(null);

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
    setImportedDraftState(null);
    setLastSaveResult(null);
  };

  const resetForNew = () => {
    setSelectedPath("");
    setState(emptyState);
    setSlugTouched(false);
    setStatus({ tone: "idle", message: "" });
    setImportedDraftState(null);
    setLastSaveResult(null);
  };

  const onSave = async () => {
    setStatus({ tone: "idle", message: "" });
    setLastSaveResult(null);

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

    if (importedDraftState?.pendingFirstDraftSave && state.published) {
      setStatus({
        tone: "error",
        message: "Imported DOCX content must be saved as a draft first. Uncheck Published, save once, then review before publishing.",
      });
      return;
    }

    if (state.published && importedDraftState) {
      if (!importedDraftState.bodyMinThresholdPassed || importedDraftState.truncatedSuspected) {
        setStatus({
          tone: "error",
          message: "Cannot publish imported content until body transfer checks pass (length/truncation review). Save as draft, review, and correct the content first.",
        });
        return;
      }

      const missingSectionWarning = importedDraftState.warnings.find((w) => /Missing required case study sections/i.test(w));
      const orderWarning = importedDraftState.warnings.find((w) => /not in the expected order/i.test(w));
      if (missingSectionWarning || orderWarning) {
        setStatus({
          tone: "error",
          message: "Cannot publish while required case study sections are missing or out of order. Fix the structured content first.",
        });
        return;
      }

      if (importedDraftState.placeholderImageAltCount > 0 && !importedDraftState.imageAltReviewConfirmed) {
        setStatus({
          tone: "error",
          message: "Review imported image alt text placeholders before publishing and confirm the review checkbox.",
        });
        return;
      }
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
      const response = await cmsWriteFile(path, markdown, messagePrefix);
      const [previewRouteCheck, liveRouteCheck] = await Promise.all([
        response.previewUrl ? cmsCheckRoute(response.previewUrl).catch(() => ({ ok: false, status: 0, url: response.previewUrl! })) : Promise.resolve(undefined),
        response.liveUrl ? cmsCheckRoute(response.liveUrl).catch(() => ({ ok: false, status: 0, url: response.liveUrl! })) : Promise.resolve(undefined),
      ]);
      setDocsByPath((prev) => {
        const next = { ...prev, [path]: markdown };
        if (previousPath && previousPath !== path) {
          delete next[previousPath];
        }
        return next;
      });
      setSelectedPath(path);
      setSlugTouched(true);
      setImportedDraftState((prev) => (prev ? { ...prev, pendingFirstDraftSave: false } : null));
      setLastSaveResult({
        created: Boolean(response.created),
        path: response.path,
        previewUrl: response.previewUrl,
        liveUrl: response.liveUrl,
        deploymentNote: response.deployment,
        liveRouteCheck: liveRouteCheck ? { ok: liveRouteCheck.ok, status: liveRouteCheck.status } : undefined,
        previewRouteCheck: previewRouteCheck ? { ok: previewRouteCheck.ok, status: previewRouteCheck.status } : undefined,
      });
      setStatus({
        tone: "success",
        message: response.created
          ? "Case study successfully created and saved to GitHub."
          : `Saved "${state.title}" to GitHub.`,
      });
      console.info("[cms/editor] save-success", {
        directory,
        path: response.path,
        created: response.created,
        previewUrl: response.previewUrl,
        liveUrl: response.liveUrl,
        liveRouteCheck: liveRouteCheck?.status,
        previewRouteCheck: previewRouteCheck?.status,
      });
    } catch (error) {
      const message = formatUiError(error);
      console.error("[cms/editor] save-failed", { directory, selectedPath, slug: state.slug, message });
      setStatus({ tone: "error", message });
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
      setLastSaveResult(null);
      setStatus({ tone: "success", message: "Deleted from GitHub. Public site updates after Vercel deploy." });
    } catch (error) {
      setStatus({ tone: "error", message: formatUiError(error) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {directory === "content/case-studies" ? (
        <DocxCaseStudyImporter
          disabled={saving}
          onAutoPopulateParsedDraft={(draft) => {
            setState((prev) => ({
              ...prev,
              slug: draft.slug || prev.slug,
              title: draft.title || prev.title,
              summary: draft.summary || prev.summary,
              tags: draft.tags.join(", "),
              body: draft.body,
              published: false,
            }));
            setSelectedPath("");
            setSlugTouched(Boolean(draft.slug));
            setImportedDraftState({
              pendingFirstDraftSave: true,
              warnings: draft.warnings,
              bodyLength: draft.diagnostics.bodyLength,
              bodyMinThresholdPassed: draft.diagnostics.bodyMinThresholdPassed,
              truncatedSuspected: draft.diagnostics.truncatedSuspected,
              importedImageCount: draft.diagnostics.importedImageCount,
              placeholderImageAltCount: draft.diagnostics.placeholderImageAltCount,
              imageAltReviewConfirmed: false,
            });
            setLastSaveResult(null);
            setStatus({
              tone: draft.diagnostics.blockingErrors.length ? "error" : "info",
              message: draft.diagnostics.blockingErrors.length
                ? `DOCX parsed, but manual correction is required before apply/save: ${draft.diagnostics.blockingErrors.join(" ")}`
                : "DOCX parsed and editor fields auto-filled. Next step: click “Upload Images + Apply Draft” to finalize image URLs, then save draft.",
            });
          }}
          onApplyDraft={(draft) => {
            setState((prev) => ({
              ...prev,
              slug: draft.slug || prev.slug,
              title: draft.title || prev.title,
              summary: draft.summary || prev.summary,
              tags: draft.tags.join(", "),
              body: draft.body,
              published: false,
            }));
            setSelectedPath("");
            setSlugTouched(Boolean(draft.slug));
            setImportedDraftState({
              pendingFirstDraftSave: true,
              warnings: draft.warnings,
              bodyLength: draft.diagnostics.bodyLength,
              bodyMinThresholdPassed: draft.diagnostics.bodyMinThresholdPassed,
              truncatedSuspected: draft.diagnostics.truncatedSuspected,
              importedImageCount: draft.diagnostics.importedImageCount,
              placeholderImageAltCount: draft.diagnostics.placeholderImageAltCount,
              imageAltReviewConfirmed: draft.diagnostics.placeholderImageAltCount === 0,
            });
            setLastSaveResult(null);
            setStatus({
              tone: draft.warnings.length ? "info" : "success",
              message: draft.warnings.length
                ? `DOCX draft applied with ${draft.warnings.length} warning(s). Save as draft first, then review warnings.`
                : "DOCX draft applied. Save as draft first before publishing.",
            });
          }}
        />
      ) : null}

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
      {lastSaveResult ? (
        <div className="rounded-md border border-slate-700 bg-slate-950/60 p-3">
          <p className="text-sm text-primary-text">
            {lastSaveResult.created ? "Verification links (new case study)" : "Verification links"}
          </p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            {lastSaveResult.previewUrl ? (
              <Link className="font-mono text-systems-teal hover:underline" to={lastSaveResult.previewUrl}>
                Open admin preview
              </Link>
            ) : null}
            {lastSaveResult.liveUrl ? (
              <Link className="font-mono text-systems-teal hover:underline" to={lastSaveResult.liveUrl}>
                Open live route
              </Link>
            ) : null}
          </div>
          {lastSaveResult.deploymentNote ? (
            <p className="mt-2 text-xs text-muted-text">{lastSaveResult.deploymentNote}</p>
          ) : null}
          {(lastSaveResult.previewRouteCheck || lastSaveResult.liveRouteCheck) ? (
            <div className="mt-2 grid gap-1 text-xs text-muted-text">
              {lastSaveResult.previewRouteCheck ? (
                <p>
                  Admin preview route check:{" "}
                  <span className={lastSaveResult.previewRouteCheck.ok ? "text-emerald-400" : "text-amber-300"}>
                    {lastSaveResult.previewRouteCheck.ok ? `OK (${lastSaveResult.previewRouteCheck.status})` : `Failed (${lastSaveResult.previewRouteCheck.status || "network"})`}
                  </span>
                </p>
              ) : null}
              {lastSaveResult.liveRouteCheck ? (
                <p>
                  Live route check:{" "}
                  <span className={lastSaveResult.liveRouteCheck.ok ? "text-emerald-400" : "text-amber-300"}>
                    {lastSaveResult.liveRouteCheck.ok ? `OK (${lastSaveResult.liveRouteCheck.status})` : `Failed (${lastSaveResult.liveRouteCheck.status || "network"})`}
                  </span>
                </p>
              ) : null}
            </div>
          ) : null}
          {lastSaveResult.created ? (
            <p className="mt-1 text-xs text-muted-text">
              New files become visible on public listing/detail pages after the Vercel rebuild for this commit completes.
            </p>
          ) : null}
          {lastSaveResult.liveRouteCheck && !lastSaveResult.liveRouteCheck.ok ? (
            <p className="mt-1 text-xs text-amber-300">
              The live route did not resolve yet. Check deployment status, publish flag, and case study section validation.
            </p>
          ) : null}
        </div>
      ) : null}
      {importedDraftState?.warnings.length ? (
        <div className="rounded-md border border-amber-700/40 bg-amber-900/10 p-3">
          <p className="text-sm text-amber-300">DOCX import warnings (review before publish)</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-200">
            {importedDraftState.warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {importedDraftState ? (
        <div className="rounded-md border border-slate-700 bg-slate-950/60 p-3 space-y-2">
          <p className="text-sm text-primary-text">Imported content verification</p>
          <div className="grid gap-2 text-xs text-muted-text md:grid-cols-2">
            <p>Body length: <span className="text-primary-text">{importedDraftState.bodyLength}</span></p>
            <p>Body threshold: <span className="text-primary-text">{importedDraftState.bodyMinThresholdPassed ? "passed" : "failed"}</span></p>
            <p>Truncation suspected: <span className="text-primary-text">{importedDraftState.truncatedSuspected ? "yes" : "no"}</span></p>
            <p>Imported images: <span className="text-primary-text">{importedDraftState.importedImageCount}</span></p>
            <p>Placeholder image alts: <span className="text-primary-text">{importedDraftState.placeholderImageAltCount}</span></p>
            <p>Published status: <span className="text-primary-text">{state.published ? "on" : "draft"}</span></p>
          </div>
          {importedDraftState.placeholderImageAltCount > 0 ? (
            <label className="inline-flex items-center gap-2 text-xs text-primary-text">
              <input
                type="checkbox"
                checked={importedDraftState.imageAltReviewConfirmed}
                onChange={(event) =>
                  setImportedDraftState((prev) => (prev ? { ...prev, imageAltReviewConfirmed: event.target.checked } : prev))
                }
              />
              I reviewed imported image alt text placeholders and will replace them before publishing.
            </label>
          ) : null}
          {!state.published ? (
            <p className="text-xs text-muted-text">Drafts do not appear on the public case studies page until Published is enabled and saved.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
