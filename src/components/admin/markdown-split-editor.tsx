import type { ChangeEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cmsUploadImage } from "@/lib/cms-client";
import { markdownToHtml } from "@/lib/markdown";

type MarkdownSplitEditorProps = {
  title: string;
  markdown: string;
  onChange: (next: string) => void;
  helper?: string;
  imageUploadFolder?: string;
  disabled?: boolean;
};

type ImageAlign = "left" | "center" | "full";

type ToolbarAction =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "bold"
  | "italic"
  | "underline"
  | "bullet"
  | "numbered"
  | "quote"
  | "code"
  | "link";

function applyPrefixToLines(value: string, selectionStart: number, selectionEnd: number, prefix: string, numbered = false) {
  const selected = value.slice(selectionStart, selectionEnd) || "";
  const lines = (selected || "Text").split("\n");
  const next = lines
    .map((line, index) => (numbered ? `${index + 1}. ${line || "List item"}` : `${prefix}${line || "List item"}`))
    .join("\n");
  return {
    nextValue: `${value.slice(0, selectionStart)}${next}${value.slice(selectionEnd)}`,
    nextStart: selectionStart,
    nextEnd: selectionStart + next.length,
  };
}

function insertWrapped(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  before: string,
  after = before,
  fallback = "text",
) {
  const selected = value.slice(selectionStart, selectionEnd) || fallback;
  const insertion = `${before}${selected}${after}`;
  return {
    nextValue: `${value.slice(0, selectionStart)}${insertion}${value.slice(selectionEnd)}`,
    nextStart: selectionStart + before.length,
    nextEnd: selectionStart + before.length + selected.length,
  };
}

function insertBlock(value: string, selectionStart: number, selectionEnd: number, block: string) {
  const prefix = selectionStart > 0 && value[selectionStart - 1] !== "\n" ? "\n\n" : "";
  const suffix = selectionEnd < value.length && value[selectionEnd] !== "\n" ? "\n\n" : "\n";
  const insertion = `${prefix}${block}${suffix}`;
  const start = selectionStart + prefix.length;
  return {
    nextValue: `${value.slice(0, selectionStart)}${insertion}${value.slice(selectionEnd)}`,
    nextStart: start,
    nextEnd: start + block.length,
  };
}

async function optimizeImageForUpload(file: File): Promise<{ blob: Blob; fileName: string; mimeType: string }> {
  const isRaster = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
  if (!isRaster) {
    return { blob: file, fileName: file.name, mimeType: file.type || "application/octet-stream" };
  }

  const bitmap = await createImageBitmap(file);
  const maxDimension = 2200;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { blob: file, fileName: file.name, mimeType: file.type || "application/octet-stream" };
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", 0.86);
  });

  if (!blob) {
    return { blob: file, fileName: file.name, mimeType: file.type || "application/octet-stream" };
  }

  const fileName = file.name.replace(/\.[a-z0-9]+$/i, "") + ".webp";
  return { blob, fileName, mimeType: "image/webp" };
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunk));
  }
  return btoa(binary);
}

function insertAtCursor(value: string, selectionStart: number, selectionEnd: number, insert: string) {
  const nextValue = `${value.slice(0, selectionStart)}${insert}${value.slice(selectionEnd)}`;
  const pos = selectionStart + insert.length;
  return { nextValue, nextStart: pos, nextEnd: pos };
}

export function MarkdownSplitEditor({
  title,
  markdown,
  onChange,
  helper,
  imageUploadFolder = "misc",
  disabled = false,
}: MarkdownSplitEditorProps) {
  const preview = useMemo(() => markdownToHtml(markdown), [markdown]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [imageAlt, setImageAlt] = useState("");
  const [imageAlign, setImageAlign] = useState<ImageAlign>("center");
  const [imageUploading, setImageUploading] = useState(false);
  const [editorMessage, setEditorMessage] = useState<string>("");
  const [editorError, setEditorError] = useState<string>("");

  const applyAction = (action: ToolbarAction) => {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;

    const { selectionStart, selectionEnd } = textarea;
    let result: { nextValue: string; nextStart: number; nextEnd: number } | null = null;

    switch (action) {
      case "h1":
        result = applyPrefixToLines(markdown, selectionStart, selectionEnd, "# ");
        break;
      case "h2":
        result = applyPrefixToLines(markdown, selectionStart, selectionEnd, "## ");
        break;
      case "h3":
        result = applyPrefixToLines(markdown, selectionStart, selectionEnd, "### ");
        break;
      case "h4":
        result = applyPrefixToLines(markdown, selectionStart, selectionEnd, "#### ");
        break;
      case "bold":
        result = insertWrapped(markdown, selectionStart, selectionEnd, "**", "**", "bold text");
        break;
      case "italic":
        result = insertWrapped(markdown, selectionStart, selectionEnd, "*", "*", "italic text");
        break;
      case "underline":
        result = insertWrapped(markdown, selectionStart, selectionEnd, "<u>", "</u>", "underlined text");
        break;
      case "bullet":
        result = applyPrefixToLines(markdown, selectionStart, selectionEnd, "- ");
        break;
      case "numbered":
        result = applyPrefixToLines(markdown, selectionStart, selectionEnd, "", true);
        break;
      case "quote":
        result = applyPrefixToLines(markdown, selectionStart, selectionEnd, "> ");
        break;
      case "code":
        result = insertBlock(markdown, selectionStart, selectionEnd, "```ts\n// code\n```");
        break;
      case "link":
        result = insertWrapped(markdown, selectionStart, selectionEnd, "[", "](https://example.com)", "link text");
        break;
      default:
        result = null;
    }

    if (!result) return;
    onChange(result.nextValue);
    setEditorError("");
    setEditorMessage("");

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.nextStart, result.nextEnd);
    });
  };

  const handleImageFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setEditorMessage("");
    setEditorError("");

    if (!imageAlt.trim()) {
      setEditorError("Alt text is required before uploading an image.");
      event.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      setEditorError("Only image files are supported.");
      event.target.value = "";
      return;
    }

    try {
      setImageUploading(true);
      const optimized = await optimizeImageForUpload(file);
      const dataBase64 = await blobToBase64(optimized.blob);
      const upload = await cmsUploadImage({
        fileName: optimized.fileName,
        mimeType: optimized.mimeType,
        dataBase64,
        folder: imageUploadFolder,
      });

      const textarea = textareaRef.current;
      const markdownImage = `![${imageAlt.trim()}](${upload.publicUrl}){align=${imageAlign}}`;

      if (!textarea) {
        onChange(`${markdown}\n\n${markdownImage}\n`);
      } else {
        const { selectionStart, selectionEnd } = textarea;
        const withPadding = `${selectionStart > 0 ? "\n\n" : ""}${markdownImage}\n\n`;
        const result = insertAtCursor(markdown, selectionStart, selectionEnd, withPadding);
        onChange(result.nextValue);
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(result.nextStart, result.nextEnd);
        });
      }

      setEditorMessage(`Image uploaded and inserted: ${upload.publicUrl}`);
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setImageUploading(false);
      event.target.value = "";
    }
  };

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-primary-text">{title}</p>
        {helper ? <p className="text-sm text-muted-text">{helper}</p> : null}
      </div>

      <div className="rounded-md border border-slate-700 bg-slate-950 p-3">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="default" onClick={() => applyAction("h1")} disabled={disabled}>H1</Button>
          <Button type="button" variant="secondary" size="default" onClick={() => applyAction("h2")} disabled={disabled}>H2</Button>
          <Button type="button" variant="secondary" size="default" onClick={() => applyAction("h3")} disabled={disabled}>H3</Button>
          <Button type="button" variant="secondary" size="default" onClick={() => applyAction("h4")} disabled={disabled}>H4</Button>
          <Button type="button" variant="secondary" onClick={() => applyAction("bold")} disabled={disabled}>Bold</Button>
          <Button type="button" variant="secondary" onClick={() => applyAction("italic")} disabled={disabled}>Italic</Button>
          <Button type="button" variant="secondary" onClick={() => applyAction("underline")} disabled={disabled}>Underline</Button>
          <Button type="button" variant="secondary" onClick={() => applyAction("bullet")} disabled={disabled}>Bullets</Button>
          <Button type="button" variant="secondary" onClick={() => applyAction("numbered")} disabled={disabled}>Numbered</Button>
          <Button type="button" variant="secondary" onClick={() => applyAction("quote")} disabled={disabled}>Quote</Button>
          <Button type="button" variant="secondary" onClick={() => applyAction("code")} disabled={disabled}>Code</Button>
          <Button type="button" variant="secondary" onClick={() => applyAction("link")} disabled={disabled}>Link</Button>
        </div>

        <div className="mt-3 grid gap-3 rounded-md border border-slate-800 bg-slate-900/50 p-3 md:grid-cols-[1.1fr_180px_160px_auto] md:items-end">
          <div className="space-y-1">
            <label className="text-xs text-muted-text">Image alt text (required)</label>
            <Input
              value={imageAlt}
              onChange={(event) => setImageAlt(event.target.value)}
              placeholder="Describe the image for accessibility"
              disabled={disabled || imageUploading}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-text">Alignment</label>
            <select
              className="h-11 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-primary-text"
              value={imageAlign}
              onChange={(event) => setImageAlign(event.target.value as ImageAlign)}
              disabled={disabled || imageUploading}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="full">Full width</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-text">Insert image</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              onChange={handleImageFile}
              disabled={disabled || imageUploading}
              className="block w-full text-xs text-muted-text file:mr-3 file:rounded-md file:border-0 file:bg-strategic-blue file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
            />
          </div>

          <div className="pb-1 text-xs text-muted-text">
            Uploads to <code className="text-primary-text">/public/images/cms/...</code> and inserts MDX-friendly image syntax.
          </div>
        </div>

        {editorError ? <p className="mt-2 text-sm text-red-400">{editorError}</p> : null}
        {editorMessage ? <p className="mt-2 text-sm text-emerald-400">{editorMessage}</p> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm text-primary-text">Structured content (Markdown / MDX-friendly)</p>
          <textarea
            ref={textareaRef}
            className="min-h-[460px] w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-sm text-primary-text"
            value={markdown}
            onChange={(event) => {
              setEditorError("");
              setEditorMessage("");
              onChange(event.target.value);
            }}
            spellCheck={false}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-primary-text">Live preview</p>
          <article className="min-h-[460px] rounded-md border border-slate-700 bg-slate-950 p-4">
            <div className="body-md space-y-3" dangerouslySetInnerHTML={{ __html: preview }} />
          </article>
        </div>
      </div>
    </section>
  );
}
