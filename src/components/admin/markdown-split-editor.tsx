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

type ImageAlign = "left" | "center" | "right" | "full";
type ImageWidth = 40 | 60 | 80 | 100;
type TableBuilderState = {
  rows: number;
  cols: number;
  headerRow: boolean;
  cells: string[][];
};

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
  | "link"
  | "table"
  | "indent"
  | "outdent";

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

function findImageMarkdownAtCursor(markdown: string, cursor: number) {
  const lineStart = markdown.lastIndexOf("\n", Math.max(0, cursor - 1)) + 1;
  const lineEndIndex = markdown.indexOf("\n", cursor);
  const lineEnd = lineEndIndex === -1 ? markdown.length : lineEndIndex;
  const line = markdown.slice(lineStart, lineEnd);
  const match = line.match(/^!\[([^\]]*)\]\(([^)]+)\)(\{[^}]+\})?$/);
  if (!match) return null;
  return {
    lineStart,
    lineEnd,
    alt: match[1] ?? "",
    src: match[2] ?? "",
    meta: match[3] ?? "",
  };
}

function createTableBuilder(rows = 2, cols = 3): TableBuilderState {
  return {
    rows,
    cols,
    headerRow: true,
    cells: Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => (r === 0 ? `Header ${c + 1}` : `Value ${r},${c + 1}`)),
    ),
  };
}

function resizeTableBuilder(state: TableBuilderState, nextRows: number, nextCols: number): TableBuilderState {
  const rows = Math.max(1, Math.min(12, nextRows));
  const cols = Math.max(1, Math.min(8, nextCols));
  const cells = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => state.cells[r]?.[c] ?? (r === 0 ? `Header ${c + 1}` : "")),
  );
  return { ...state, rows, cols, cells };
}

function tableBuilderToMarkdown(table: TableBuilderState): string {
  const rows = table.cells.map((row) =>
    row.map((cell) => cell.replace(/\|/g, "\\|").trim()).map((cell) => (cell ? cell : " ")),
  );
  if (!rows.length || !rows[0]?.length) return "";

  const headerIndex = table.headerRow ? 0 : -1;
  const header = headerIndex === 0 ? rows[0] : rows[0].map((_c, i) => `Column ${i + 1}`);
  const bodyRows = table.headerRow ? rows.slice(1) : rows;
  const separator = header.map(() => "---");
  const toLine = (cells: string[]) => `| ${cells.join(" | ")} |`;

  const lines = [toLine(header), toLine(separator)];
  if (bodyRows.length === 0) {
    lines.push(toLine(header.map(() => " ")));
  } else {
    for (const row of bodyRows) {
      lines.push(toLine(row));
    }
  }
  return lines.join("\n");
}

function indentSelectedLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  direction: "indent" | "outdent",
) {
  const selected = value.slice(selectionStart, selectionEnd) || "List item";
  const lines = selected.split("\n");
  const next = lines
    .map((line) => {
      if (!line.trim()) return line;
      if (direction === "indent") return `  ${line}`;
      return line.replace(/^ {1,2}/, "");
    })
    .join("\n");
  return {
    nextValue: `${value.slice(0, selectionStart)}${next}${value.slice(selectionEnd)}`,
    nextStart: selectionStart,
    nextEnd: selectionStart + next.length,
  };
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
  const [imageWidth, setImageWidth] = useState<ImageWidth>(80);
  const [imageUploading, setImageUploading] = useState(false);
  const [pendingImagePreviewUrl, setPendingImagePreviewUrl] = useState<string>("");
  const [showTableBuilder, setShowTableBuilder] = useState(false);
  const [tableBuilder, setTableBuilder] = useState<TableBuilderState>(() => createTableBuilder());
  const [tableGridHover, setTableGridHover] = useState<{ rows: number; cols: number } | null>(null);
  const [editorMessage, setEditorMessage] = useState<string>("");
  const [editorError, setEditorError] = useState<string>("");
  const imageInsertBlocked = !imageAlt.trim();

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
      case "table":
        result = insertBlock(markdown, selectionStart, selectionEnd, "| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Value | Value | Value |\n| Value | Value | Value |");
        break;
      case "indent":
        result = indentSelectedLines(markdown, selectionStart, selectionEnd, "indent");
        break;
      case "outdent":
        result = indentSelectedLines(markdown, selectionStart, selectionEnd, "outdent");
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
      const widthPart = imageWidth === 100 ? "" : ` width=${imageWidth}`;
      const markdownImage = `![${imageAlt.trim()}](${upload.publicUrl}){align=${imageAlign}${widthPart}}`;

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
      if (pendingImagePreviewUrl) {
        URL.revokeObjectURL(pendingImagePreviewUrl);
        setPendingImagePreviewUrl("");
      }
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setImageUploading(false);
      event.target.value = "";
    }
  };

  const insertTableFromBuilder = () => {
    const textarea = textareaRef.current;
    const tableMarkdown = tableBuilderToMarkdown(tableBuilder);
    if (!tableMarkdown.trim()) {
      setEditorError("Table is empty. Add at least one row and one column.");
      return;
    }
    if (!textarea) {
      onChange(`${markdown}\n\n${tableMarkdown}\n\n`);
      return;
    }
    const { selectionStart, selectionEnd } = textarea;
    const result = insertBlock(markdown, selectionStart, selectionEnd, tableMarkdown);
    onChange(result.nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.nextStart, result.nextEnd);
    });
    setEditorError("");
    setEditorMessage("Table inserted as Markdown.");
    setShowTableBuilder(false);
  };

  const updateImageAltAtCursor = () => {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;

    setEditorError("");
    setEditorMessage("");

    if (!imageAlt.trim()) {
      setEditorError("Alt text is required before uploading an image.");
      return;
    }

    const found = findImageMarkdownAtCursor(markdown, textarea.selectionStart);
    if (!found) {
      setEditorError("Place the cursor on an inserted image markdown line to update its alt text.");
      return;
    }

    const nextLine = `![${imageAlt.trim()}](${found.src})${found.meta}`;
    const nextValue = `${markdown.slice(0, found.lineStart)}${nextLine}${markdown.slice(found.lineEnd)}`;
    onChange(nextValue);
    setEditorMessage("Image alt text updated.");

    requestAnimationFrame(() => {
      textarea.focus();
      const pos = found.lineStart + nextLine.length;
      textarea.setSelectionRange(pos, pos);
    });
  };

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-primary-text">{title}</p>
        {helper ? <p className="text-sm text-muted-text">{helper}</p> : null}
      </div>

      <div className="rounded-md border border-border bg-card p-3 shadow-sm">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-muted-text">Block style</label>
            <select
              className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground"
              defaultValue=""
              disabled={disabled}
              onChange={(event) => {
                const next = event.target.value as ToolbarAction | "";
                if (next) applyAction(next);
                event.target.value = "";
              }}
            >
              <option value="">Choose…</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="h4">Heading 4</option>
              <option value="quote">Quote</option>
              <option value="code">Code block</option>
              <option value="table">Table</option>
            </select>

            <label className="text-xs text-muted-text">Inline</label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => applyAction("bold")} disabled={disabled} title="Bold">
                <span aria-hidden="true" className="font-bold">B</span>
              </Button>
              <Button type="button" variant="secondary" onClick={() => applyAction("italic")} disabled={disabled} title="Italic">
                <span aria-hidden="true" className="italic">I</span>
              </Button>
              <Button type="button" variant="secondary" onClick={() => applyAction("underline")} disabled={disabled} title="Underline">
                <span aria-hidden="true" className="underline">U</span>
              </Button>
              <Button type="button" variant="secondary" onClick={() => applyAction("link")} disabled={disabled} title="Insert link">
                <span aria-hidden="true">🔗</span>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-muted-text">Lists</label>
            <Button type="button" variant="secondary" onClick={() => applyAction("bullet")} disabled={disabled} title="Bulleted list">• List</Button>
            <Button type="button" variant="secondary" onClick={() => applyAction("numbered")} disabled={disabled} title="Numbered list">1. List</Button>
            <Button type="button" variant="secondary" onClick={() => applyAction("indent")} disabled={disabled} title="Indent">⇥</Button>
            <Button type="button" variant="secondary" onClick={() => applyAction("outdent")} disabled={disabled} title="Outdent">⇤</Button>
            <Button
              type="button"
              variant={showTableBuilder ? "primary" : "secondary"}
              onClick={() => setShowTableBuilder((prev) => !prev)}
              disabled={disabled}
              title="Visual table builder"
            >
              ▦ Table
            </Button>
          </div>
        </div>

        {showTableBuilder ? (
          <div className="mt-3 space-y-3 rounded-md border border-border bg-background/50 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-text">Quick size</p>
                <div className="grid grid-cols-6 gap-1">
                  {Array.from({ length: 6 }, (_, r) =>
                    Array.from({ length: 6 }, (_, c) => {
                      const rows = r + 1;
                      const cols = c + 1;
                      const active =
                        (tableGridHover ? rows <= tableGridHover.rows && cols <= tableGridHover.cols : false) ||
                        (!tableGridHover && rows <= tableBuilder.rows && cols <= tableBuilder.cols);
                      return (
                        <button
                          key={`${rows}-${cols}`}
                          type="button"
                          className={`h-5 w-5 rounded-sm border ${active ? "border-strategic-blue bg-strategic-blue/30" : "border-border bg-card"}`}
                          onMouseEnter={() => setTableGridHover({ rows, cols })}
                          onMouseLeave={() => setTableGridHover(null)}
                          onClick={() => setTableBuilder((prev) => resizeTableBuilder(prev, rows, cols))}
                          title={`${rows} x ${cols}`}
                          disabled={disabled}
                        />
                      );
                    }),
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="secondary" onClick={() => setTableBuilder((prev) => resizeTableBuilder(prev, prev.rows + 1, prev.cols))} disabled={disabled}>
                  + Row
                </Button>
                <Button type="button" variant="secondary" onClick={() => setTableBuilder((prev) => resizeTableBuilder(prev, prev.rows - 1, prev.cols))} disabled={disabled || tableBuilder.rows <= 1}>
                  - Row
                </Button>
                <Button type="button" variant="secondary" onClick={() => setTableBuilder((prev) => resizeTableBuilder(prev, prev.rows, prev.cols + 1))} disabled={disabled}>
                  + Col
                </Button>
                <Button type="button" variant="secondary" onClick={() => setTableBuilder((prev) => resizeTableBuilder(prev, prev.rows, prev.cols - 1))} disabled={disabled || tableBuilder.cols <= 1}>
                  - Col
                </Button>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={tableBuilder.headerRow}
                  onChange={(event) => setTableBuilder((prev) => ({ ...prev, headerRow: event.target.checked }))}
                  disabled={disabled}
                />
                Header row
              </label>
            </div>

            <div className="overflow-x-auto rounded-md border border-border">
              <table className="min-w-full border-collapse">
                <tbody>
                  {tableBuilder.cells.map((row, rowIndex) => (
                    <tr key={`row-${rowIndex}`}>
                      {row.map((cell, colIndex) => (
                        <td key={`cell-${rowIndex}-${colIndex}`} className="border border-border p-1">
                          <input
                            value={cell}
                            onChange={(event) =>
                              setTableBuilder((prev) => {
                                const next = prev.cells.map((r) => [...r]);
                                next[rowIndex][colIndex] = event.target.value;
                                return { ...prev, cells: next };
                              })
                            }
                            disabled={disabled}
                            className={`w-full rounded border px-2 py-1 text-xs ${
                              tableBuilder.headerRow && rowIndex === 0
                                ? "border-border bg-secondary text-foreground font-semibold"
                                : "border-input bg-card text-foreground"
                            }`}
                            placeholder={tableBuilder.headerRow && rowIndex === 0 ? `Header ${colIndex + 1}` : "Value"}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="primary" onClick={insertTableFromBuilder} disabled={disabled}>
                Insert table
              </Button>
              <Button type="button" variant="secondary" onClick={() => setTableBuilder(createTableBuilder())} disabled={disabled}>
                Reset
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-3 grid gap-3 rounded-md border border-border bg-background/50 p-3 md:grid-cols-[1.1fr_160px_140px_180px_auto] md:items-end">
          <div className="space-y-1">
            <label className="text-xs text-muted-text">Alt text (required for accessibility)</label>
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
              className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground"
              value={imageAlign}
              onChange={(event) => setImageAlign(event.target.value as ImageAlign)}
              disabled={disabled || imageUploading}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              <option value="full">Full width</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-text">Width</label>
            <select
              className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground"
              value={String(imageWidth)}
              onChange={(event) => setImageWidth(Number(event.target.value) as ImageWidth)}
              disabled={disabled || imageUploading}
            >
              <option value="40">40%</option>
              <option value="60">60%</option>
              <option value="80">80%</option>
              <option value="100">100%</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-text">Insert image</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (pendingImagePreviewUrl) {
                  URL.revokeObjectURL(pendingImagePreviewUrl);
                  setPendingImagePreviewUrl("");
                }
                if (file && file.type.startsWith("image/")) {
                  setPendingImagePreviewUrl(URL.createObjectURL(file));
                }
                void handleImageFile(event);
              }}
              disabled={disabled || imageUploading || imageInsertBlocked}
              className="block w-full text-xs text-muted-text file:mr-3 file:rounded-md file:border-0 file:bg-strategic-blue file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
            />
          </div>

          <div className="pb-1 text-xs text-muted-text">
            Uploads to <code className="text-primary-text">/public/images/cms/...</code> and inserts MDX-friendly image syntax with alignment + width metadata.
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" onClick={updateImageAltAtCursor} disabled={disabled || imageInsertBlocked}>
            Update image alt at cursor
          </Button>
          <p className="text-xs text-muted-text">
            Place the cursor on an inserted image line to update its alt text after insert.
          </p>
        </div>

        {pendingImagePreviewUrl ? (
          <div className="mt-3 rounded-md border border-border bg-background/50 p-3">
            <p className="text-xs text-muted-text">Pending image preview</p>
            <div className="mt-2 max-w-md overflow-hidden rounded-md border border-border bg-card p-2">
              <img
                src={pendingImagePreviewUrl}
                alt="Pending upload preview"
                className="h-auto max-w-full rounded"
                style={{ width: imageWidth === 100 ? "100%" : `${imageWidth}%`, marginLeft: imageAlign === "right" ? "auto" : 0, marginRight: imageAlign === "center" ? "auto" : 0 }}
              />
            </div>
          </div>
        ) : null}

        {imageInsertBlocked ? <p className="mt-2 text-sm text-red-400">Alt text is required before uploading an image.</p> : null}
        {editorError ? <p className="mt-2 text-sm text-red-400">{editorError}</p> : null}
        {editorMessage ? <p className="mt-2 text-sm text-emerald-400">{editorMessage}</p> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm text-primary-text">Structured content (Markdown / MDX-friendly)</p>
          <textarea
            ref={textareaRef}
            className="min-h-[460px] w-full rounded-md border border-input bg-card p-3 text-sm text-foreground shadow-sm"
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
          <article className="min-h-[460px] rounded-md border border-border bg-card p-4 shadow-sm">
            <div className="body-md space-y-3" dangerouslySetInnerHTML={{ __html: preview }} />
          </article>
        </div>
      </div>
    </section>
  );
}
