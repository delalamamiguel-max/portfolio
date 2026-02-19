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
  const escaped = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (trimmed.startsWith("## ")) {
        return `<h2>${trimmed.slice(3)}</h2>`;
      }
      if (trimmed.startsWith("# ")) {
        return `<h1>${trimmed.slice(2)}</h1>`;
      }
      return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");
}
