export type FrontmatterMap = Record<string, unknown>;

function parseArray(value: string): string[] {
  const inner = value.trim().replace(/^\[/, "").replace(/\]$/, "");
  if (!inner) return [];
  return inner
    .split(",")
    .map((part) => part.trim().replace(/^"|"$/g, "").replace(/^'|'$/g, ""))
    .filter(Boolean);
}

function parseScalar(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) return parseArray(trimmed);
  return trimmed.replace(/^"|"$/g, "").replace(/^'|'$/g, "");
}

export function parseFrontmatter(input: string): { frontmatter: FrontmatterMap; body: string } {
  const normalized = input.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return { frontmatter: {}, body: normalized.trim() };
  }

  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) {
    return { frontmatter: {}, body: normalized.trim() };
  }

  const rawFm = normalized.slice(4, end).trim();
  const body = normalized.slice(end + 5).trim();
  const frontmatter: FrontmatterMap = {};

  for (const line of rawFm.split("\n")) {
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    frontmatter[key] = parseScalar(value);
  }

  return { frontmatter, body };
}

export function buildMarkdown(frontmatter: FrontmatterMap, body: string): string {
  const lines = Object.entries(frontmatter).map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}: [${value.map((entry) => String(entry)).join(", ")}]`;
    }
    if (typeof value === "boolean") {
      return `${key}: ${value ? "true" : "false"}`;
    }
    return `${key}: ${String(value)}`;
  });

  return `---\n${lines.join("\n")}\n---\n\n${body.trim()}\n`;
}

export function extractSections(body: string): Array<{ heading: string; content: string }> {
  const sections: Array<{ heading: string; content: string }> = [];
  const normalized = body.replace(/\r\n/g, "\n");
  const pattern = /^##\s+(.+)$/gm;
  const matches = [...normalized.matchAll(pattern)];

  if (!matches.length) {
    return sections;
  }

  for (let i = 0; i < matches.length; i += 1) {
    const current = matches[i];
    const next = matches[i + 1];
    const heading = (current[1] || "").trim();
    const start = (current.index || 0) + current[0].length;
    const end = next?.index ?? normalized.length;
    sections.push({
      heading,
      content: normalized.slice(start, end).trim(),
    });
  }

  return sections;
}

export function markdownToHtml(markdown: string): string {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();
  if (!normalized) return "";

  const escapeHtml = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const renderInline = (input: string): string => {
    let out = escapeHtml(input);

    out = out.replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/g, "<u>$1</u>");
    out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
    out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g, (_match, label: string, href: string) => {
      if (String(href).startsWith("/")) {
        return `<a href="${href}">${label}</a>`;
      }
      return `<a href="${href}" target="_blank" rel="noreferrer">${label}</a>`;
    });
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
    return out;
  };

  const renderImageLine = (line: string): string | null => {
    const match = line.trim().match(/^!\[([^\]]+)\]\((\/[^\s)]+|https?:\/\/[^\s)]+)\)(?:\{align=(left|center|full)\})?$/);
    if (!match) return null;
    const [, alt, src, align = "center"] = match;
    const classes =
      align === "full"
        ? "my-4 w-full overflow-hidden rounded-md"
        : align === "left"
          ? "my-4 max-w-[70%] rounded-md"
          : "my-4 mx-auto max-w-[85%] rounded-md";
    const imgClasses = align === "full" ? "w-full rounded-md" : "w-full rounded-md";
    return `<figure class="${classes}" data-align="${align}"><img src="${src}" alt="${escapeHtml(alt)}" class="${imgClasses}" loading="lazy" /></figure>`;
  };

  const lines = normalized.split("\n");
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const imageHtml = renderImageLine(line);
    if (imageHtml) {
      html.push(imageHtml);
      i += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const block: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        block.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      html.push(`<pre><code${lang ? ` data-lang="${escapeHtml(lang)}"` : ""}>${escapeHtml(block.join("\n"))}</code></pre>`);
      continue;
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      html.push(`<h${level}>${renderInline(headingMatch[2].trim())}</h${level}>`);
      i += 1;
      continue;
    }

    if (line.trimStart().startsWith(">")) {
      const parts: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith(">")) {
        parts.push(lines[i].replace(/^\s*>\s?/, ""));
        i += 1;
      }
      html.push(`<blockquote>${parts.map((part) => `<p>${renderInline(part)}</p>`).join("")}</blockquote>`);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i += 1;
      }
      html.push(`<ul>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i += 1;
      }
      html.push(`<ol>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ol>`);
      continue;
    }

    const paragraph: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().match(/^(!\[|```|#{1,4}\s+|>|\d+\.\s+|[-*]\s+)/)
    ) {
      paragraph.push(lines[i]);
      i += 1;
    }
    html.push(`<p>${paragraph.map((part) => renderInline(part)).join("<br />")}</p>`);
  }

  return html.join("\n");
}
