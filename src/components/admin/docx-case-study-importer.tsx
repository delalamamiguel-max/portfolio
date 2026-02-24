import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cmsUploadImage } from "@/lib/cms-client";
import { markdownToHtml } from "@/lib/markdown";

type ImportDraftPayload = {
  title: string;
  slug: string;
  summary: string;
  body: string;
  warnings: string[];
};

type DocxCaseStudyImporterProps = {
  disabled?: boolean;
  onApplyDraft: (payload: ImportDraftPayload) => void;
};

type InlineRun = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  link?: string;
};

type ImageAsset = {
  id: string;
  contentType: string;
  base64: string;
};

type ImageUploadResult = {
  id: string;
  alt: string;
  publicUrl?: string;
  warning?: string;
};

type ImportBlock =
  | { type: "heading"; level: 1 | 2 | 3 | 4; runs: InlineRun[] }
  | { type: "paragraph"; runs: InlineRun[] }
  | { type: "list"; ordered: boolean; items: InlineRun[][] }
  | { type: "quote"; paragraphs: InlineRun[][] }
  | { type: "code"; code: string; language?: string }
  | { type: "image"; imageId: string; alt: string; align: "center" }
  | { type: "unsupported"; tag: string; note: string; text?: string };

type ImportDraftState = {
  fileName: string;
  title: string;
  slug: string;
  summary: string;
  blocks: ImportBlock[];
  images: ImageAsset[];
  messages: string[];
  warnings: string[];
  generatedMarkdown: string;
};

const REQUIRED_CASE_STUDY_SECTIONS = [
  "Strategic Context",
  "Architecture",
  "Trade-offs",
  "Execution",
  "Impact",
  "What's Next",
];

function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function escapeMdText(text: string): string {
  return text.replace(/([*_`[\]])/g, "\\$1");
}

function runsToPlainText(runs: InlineRun[]): string {
  return runs.map((run) => run.text).join("");
}

function runsToMarkdown(runs: InlineRun[]): string {
  return runs
    .map((run) => {
      let text = escapeMdText(run.text);
      if (!text) return "";
      if (run.underline) {
        text = `<u>${text}</u>`;
      }
      if (run.bold) {
        text = `**${text}**`;
      }
      if (run.italic) {
        text = `*${text}*`;
      }
      if (run.link) {
        text = `[${text}](${run.link})`;
      }
      return text;
    })
    .join("");
}

function normalizeRuns(runs: InlineRun[]): InlineRun[] {
  const out: InlineRun[] = [];
  for (const run of runs) {
    if (!run.text) continue;
    const prev = out[out.length - 1];
    if (
      prev &&
      prev.bold === run.bold &&
      prev.italic === run.italic &&
      prev.underline === run.underline &&
      prev.link === run.link
    ) {
      prev.text += run.text;
    } else {
      out.push({ ...run });
    }
  }
  return out;
}

function extractRuns(node: Node, marks?: Pick<InlineRun, "bold" | "italic" | "underline" | "link">): InlineRun[] {
  const activeMarks = { ...marks };

  if (node.nodeType === Node.TEXT_NODE) {
    return [{ text: node.textContent || "", ...activeMarks }];
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return [];
  }

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const nextMarks = { ...activeMarks };

  if (tag === "strong" || tag === "b") nextMarks.bold = true;
  if (tag === "em" || tag === "i") nextMarks.italic = true;
  if (tag === "u") nextMarks.underline = true;
  if (tag === "a") nextMarks.link = el.getAttribute("href") || undefined;
  if (tag === "br") return [{ text: "\n", ...nextMarks }];

  const runs = Array.from(el.childNodes).flatMap((child) => extractRuns(child, nextMarks));
  return normalizeRuns(runs);
}

function firstNonEmptyLine(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) || "";
}

function summarizeFromBlocks(blocks: ImportBlock[]): string {
  const paragraph = blocks.find((block): block is Extract<ImportBlock, { type: "paragraph" }> => block.type === "paragraph");
  if (!paragraph) return "";
  const plain = runsToPlainText(paragraph.runs).replace(/\s+/g, " ").trim();
  return plain.slice(0, 180).trim();
}

function convertHtmlToBlocks(html: string): { blocks: ImportBlock[]; warnings: string[] } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const warnings: string[] = [];
  const blocks: ImportBlock[] = [];

  const pushUnsupported = (el: Element, note: string) => {
    const text = (el.textContent || "").trim();
    warnings.push(`${note} (${el.tagName.toLowerCase()})`);
    blocks.push({ type: "unsupported", tag: el.tagName.toLowerCase(), note, text: text || undefined });
  };

  for (const node of Array.from(doc.body.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      if (text.trim()) {
        blocks.push({ type: "paragraph", runs: normalizeRuns([{ text }]) });
      }
      continue;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (["h1", "h2", "h3", "h4"].includes(tag)) {
      blocks.push({
        type: "heading",
        level: Number(tag.slice(1)) as 1 | 2 | 3 | 4,
        runs: normalizeRuns(extractRuns(el)),
      });
      continue;
    }

    if (tag === "p") {
      const img = el.querySelector("img[data-docx-image-id]");
      const textOnly = (el.textContent || "").trim();
      if (img && !textOnly) {
        blocks.push({
          type: "image",
          imageId: img.getAttribute("data-docx-image-id") || "",
          alt: img.getAttribute("alt") || "Imported image",
          align: "center",
        });
      } else {
        blocks.push({ type: "paragraph", runs: normalizeRuns(extractRuns(el)) });
      }
      continue;
    }

    if (tag === "ul" || tag === "ol") {
      const items: InlineRun[][] = [];
      for (const li of Array.from(el.children)) {
        if (li.tagName.toLowerCase() !== "li") continue;
        const nestedList = li.querySelector("ul, ol");
        if (nestedList) {
          warnings.push("Nested lists were flattened during DOCX import.");
        }
        items.push(normalizeRuns(extractRuns(li)));
      }
      blocks.push({ type: "list", ordered: tag === "ol", items });
      continue;
    }

    if (tag === "blockquote") {
      const paragraphs = Array.from(el.querySelectorAll("p")).map((p) => normalizeRuns(extractRuns(p)));
      blocks.push({ type: "quote", paragraphs: paragraphs.length ? paragraphs : [normalizeRuns(extractRuns(el))] });
      continue;
    }

    if (tag === "pre") {
      const codeEl = el.querySelector("code");
      blocks.push({
        type: "code",
        code: codeEl?.textContent || el.textContent || "",
        language: codeEl?.getAttribute("data-language") || undefined,
      });
      continue;
    }

    if (tag === "table" || tag === "tfoot" || tag === "thead" || tag === "tr" || tag === "td" || tag === "th") {
      pushUnsupported(el, "Tables are not supported in DOCX import v1");
      continue;
    }

    if (tag === "img") {
      blocks.push({
        type: "image",
        imageId: el.getAttribute("data-docx-image-id") || "",
        alt: el.getAttribute("alt") || "Imported image",
        align: "center",
      });
      continue;
    }

    if (["hr", "figure", "figcaption"].includes(tag)) {
      pushUnsupported(el, "Unsupported formatting block");
      continue;
    }

    blocks.push({ type: "paragraph", runs: normalizeRuns(extractRuns(el)) });
  }

  return { blocks, warnings };
}

function blocksToMarkdown(blocks: ImportBlock[], imageUploads: Record<string, ImageUploadResult>): { markdown: string; warnings: string[] } {
  const warnings: string[] = [];
  const chunks: string[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "heading":
        chunks.push(`${"#".repeat(block.level)} ${runsToMarkdown(block.runs).trim()}`.trim());
        break;
      case "paragraph":
        chunks.push(runsToMarkdown(block.runs).trimEnd());
        break;
      case "list":
        chunks.push(
          block.items
            .map((item, index) => `${block.ordered ? `${index + 1}.` : "-"} ${runsToMarkdown(item).trim()}`.trim())
            .join("\n"),
        );
        break;
      case "quote":
        chunks.push(block.paragraphs.map((p) => `> ${runsToMarkdown(p).trim()}`.trimEnd()).join("\n"));
        break;
      case "code":
        chunks.push(`\`\`\`${block.language || ""}\n${block.code}\n\`\`\``);
        break;
      case "image": {
        const uploaded = imageUploads[block.imageId];
        if (uploaded?.publicUrl) {
          chunks.push(`![${uploaded.alt}](${uploaded.publicUrl}){align=${block.align}}`);
        } else {
          warnings.push(uploaded?.warning || `Image ${block.imageId || "unknown"} not uploaded. Placeholder inserted.`);
          chunks.push(`> [Image placeholder] ${uploaded?.alt || block.alt}`);
        }
        break;
      }
      case "unsupported":
        warnings.push(`${block.note}${block.text ? `: ${block.text.slice(0, 120)}` : ""}`);
        chunks.push(`> [Unsupported DOCX content omitted in v1: ${block.note}]`);
        break;
      default:
        break;
    }
  }

  return { markdown: chunks.filter(Boolean).join("\n\n").trim() + "\n", warnings };
}

function validateCaseStudyImportDraft(title: string, slug: string, body: string, imageWarnings: string[], parserWarnings: string[]) {
  const warnings: string[] = [...parserWarnings, ...imageWarnings];

  if (!title.trim()) warnings.push("Missing title.");
  if (!slug.trim()) warnings.push("Missing slug.");

  const sectionHeadings = [...body.matchAll(/^##\s+(.+)$/gm)].map((m) => (m[1] || "").trim());
  const missingSections = REQUIRED_CASE_STUDY_SECTIONS.filter((section) => !sectionHeadings.includes(section));
  if (missingSections.length) {
    warnings.push(`Missing required case study sections: ${missingSections.join(", ")}`);
  }

  const orderedSubset = sectionHeadings.filter((h) => REQUIRED_CASE_STUDY_SECTIONS.includes(h));
  const expectedSubset = REQUIRED_CASE_STUDY_SECTIONS.filter((section) => sectionHeadings.includes(section));
  if (orderedSubset.join("|") !== expectedSubset.join("|")) {
    warnings.push("Required case study sections are not in the expected order.");
  }

  return warnings;
}

async function parseDocxFile(file: File): Promise<ImportDraftState> {
  const mammothModule = (await import("mammoth")) as unknown as {
    default?: any;
    convertToHtml?: any;
    images?: any;
  };
  const mammoth = mammothModule.default ?? mammothModule;

  const images: ImageAsset[] = [];
  let imageCounter = 0;

  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      convertImage: mammoth.images.imgElement(async (image: { contentType: string; readAsBase64String: () => Promise<string> }) => {
        imageCounter += 1;
        const id = `docx-image-${imageCounter}`;
        const base64 = await image.readAsBase64String();
        images.push({ id, contentType: image.contentType, base64 });
        return { src: `data:${image.contentType};base64,${base64}`, "data-docx-image-id": id } as unknown as { src: string };
      }),
    },
  );

  const { blocks, warnings } = convertHtmlToBlocks(result.value);
  const titleBlock = blocks.find((block): block is Extract<ImportBlock, { type: "heading" }> => block.type === "heading" && block.level === 1);
  const title = (titleBlock ? runsToPlainText(titleBlock.runs) : firstNonEmptyLine(file.name.replace(/\.docx$/i, ""))).trim();
  const slug = slugify(title || file.name.replace(/\.docx$/i, ""));
  const summary = summarizeFromBlocks(blocks);

  const imagePlaceholders = Object.fromEntries(
    images.map((img) => [img.id, { id: img.id, alt: "Imported image" } satisfies ImageUploadResult]),
  ) as Record<string, ImageUploadResult>;
  const generated = blocksToMarkdown(blocks, imagePlaceholders);

  return {
    fileName: file.name,
    title,
    slug,
    summary,
    blocks,
    images,
    messages: (result.messages || []).map((m: { type: string; message: string }) => `${m.type}: ${m.message}`),
    warnings: [...warnings, ...generated.warnings],
    generatedMarkdown: generated.markdown,
  };
}

export function DocxCaseStudyImporter({ disabled = false, onApplyDraft }: DocxCaseStudyImporterProps) {
  const [state, setState] = useState<ImportDraftState | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [importFolder, setImportFolder] = useState("case-studies/imports");

  const finalWarnings = useMemo(() => {
    if (!state) return [];
    return validateCaseStudyImportDraft(state.title, state.slug, state.generatedMarkdown, [], state.warnings);
  }, [state]);

  const handleDocxFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");
    setStatus("");

    if (!/\.docx$/i.test(file.name)) {
      setError("Please upload a .docx file.");
      return;
    }

    try {
      setLoading(true);
      const parsed = await parseDocxFile(file);
      setState(parsed);
      setStatus(`Parsed ${file.name}. Review the draft, warnings, and raw structured output before applying.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "DOCX import failed.");
    } finally {
      setLoading(false);
    }
  };

  const applyImportAsDraft = async () => {
    if (!state) return;
    setApplying(true);
    setError("");
    setStatus("");

    try {
      const imageUploadMap: Record<string, ImageUploadResult> = {};

      for (const image of state.images) {
        try {
          const ext = image.contentType.includes("png")
            ? "png"
            : image.contentType.includes("jpeg")
              ? "jpg"
              : image.contentType.includes("webp")
                ? "webp"
                : image.contentType.includes("gif")
                  ? "gif"
                  : image.contentType.includes("svg")
                    ? "svg"
                    : "bin";

          const upload = await cmsUploadImage({
            fileName: `${state.slug || "imported-case-study"}-${image.id}.${ext}`,
            mimeType: image.contentType,
            dataBase64: image.base64,
            folder: `${importFolder}/${state.slug || "draft"}`,
          });

          imageUploadMap[image.id] = {
            id: image.id,
            alt: `Imported image ${image.id.replace("docx-image-", "#")}`,
            publicUrl: upload.publicUrl,
          };
        } catch (imageErr) {
          imageUploadMap[image.id] = {
            id: image.id,
            alt: `Imported image ${image.id.replace("docx-image-", "#")}`,
            warning: imageErr instanceof Error ? imageErr.message : "Image upload failed.",
          };
        }
      }

      const generated = blocksToMarkdown(state.blocks, imageUploadMap);
      const allWarnings = validateCaseStudyImportDraft(state.title, state.slug, generated.markdown, generated.warnings, state.warnings);

      onApplyDraft({
        title: state.title,
        slug: state.slug,
        summary: state.summary,
        body: generated.markdown,
        warnings: allWarnings,
      });

      setStatus("DOCX import applied to editor as an unpublished draft. Review and Save Draft to commit.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply DOCX import.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <section className="space-y-4 rounded-md border border-slate-700 bg-slate-950 p-4">
      <div className="space-y-1">
        <h3 className="h3">DOCX Import (Safe Draft Workflow)</h3>
        <p className="text-sm text-muted-text">
          Upload a <code>.docx</code>, review a structured draft + warnings, then apply it to the editor as an unpublished draft only.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-text">DOCX file</label>
          <input
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleDocxFile}
            disabled={disabled || loading || applying}
            className="block w-full text-xs text-muted-text file:mr-3 file:rounded-md file:border-0 file:bg-strategic-blue file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-text">Image import folder</label>
          <Input
            value={importFolder}
            onChange={(e) => setImportFolder(e.target.value)}
            disabled={disabled || loading || applying}
            placeholder="case-studies/imports"
          />
        </div>

        <Button type="button" variant="secondary" disabled={disabled || loading || applying || !state} onClick={applyImportAsDraft}>
          {applying ? "Applying..." : "Upload Images + Apply Draft"}
        </Button>
      </div>

      <div className="rounded-md border border-slate-800 bg-slate-900/50 p-3 text-xs text-muted-text">
        Supported v1: headings, paragraphs, bold, italic, lists, links, images. Unsupported (flagged): tables, footnotes, comments,
        tracked changes, text boxes, complex layouts.
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {status ? <p className="text-sm text-emerald-400">{status}</p> : null}

      {state ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-slate-800 bg-slate-900/50 p-3">
              <p className="text-xs text-muted-text">Detected title</p>
              <p className="text-sm text-primary-text">{state.title || "(none)"}</p>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-900/50 p-3">
              <p className="text-xs text-muted-text">Generated slug</p>
              <p className="text-sm text-primary-text">{state.slug || "(none)"}</p>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-900/50 p-3">
              <p className="text-xs text-muted-text">Embedded images</p>
              <p className="text-sm text-primary-text">{state.images.length}</p>
            </div>
          </div>

          {(finalWarnings.length > 0 || state.messages.length > 0) ? (
            <div className="space-y-2 rounded-md border border-amber-700/40 bg-amber-900/10 p-3">
              <p className="text-sm text-amber-300">Import warnings / parser messages</p>
              <ul className="list-disc space-y-1 pl-5 text-xs text-amber-200">
                {finalWarnings.map((warning, index) => <li key={`warning-${index}`}>{warning}</li>)}
                {state.messages.map((message, index) => <li key={`message-${index}`}>{message}</li>)}
              </ul>
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm text-primary-text">Generated Markdown (diffable output)</p>
              <textarea
                readOnly
                value={state.generatedMarkdown}
                className="min-h-[280px] w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-xs text-primary-text"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-primary-text">Structured intermediate (JSON)</p>
              <textarea
                readOnly
                value={JSON.stringify({ title: state.title, slug: state.slug, summary: state.summary, blocks: state.blocks }, null, 2)}
                className="min-h-[280px] w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-xs text-primary-text"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-primary-text">Preview (pre-save)</p>
            <article className="min-h-[180px] rounded-md border border-slate-700 bg-slate-950 p-4">
              <div className="body-md space-y-3" dangerouslySetInnerHTML={{ __html: markdownToHtml(state.generatedMarkdown) }} />
            </article>
          </div>
        </div>
      ) : null}
    </section>
  );
}

