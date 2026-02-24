import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertCmsAuthorized } from "./auth.js";
import { assertCsrf } from "./csrf.js";
import { getFileSha, loadGithubConfig, writeFileToGithub } from "./github.js";
import { isRateLimited } from "./rate-limit.js";

const ALLOWED_PATHS = [
  "content/pages/home.json",
  "content/pages/resume.json",
  "content/pages/contact.json",
  "content/case-studies/",
  "content/philosophy/",
  "content/deep-dive/",
];

function isAllowedPath(path: string): boolean {
  return ALLOWED_PATHS.some((allowed) => path === allowed || path.startsWith(allowed));
}

function commitMessage(path: string, provided: string | undefined): string {
  if (provided && provided.trim()) {
    return provided.trim();
  }

  if (path.startsWith("content/case-studies/")) {
    const slug = path.split("/").pop()?.replace(/\.md$/, "") || "unknown";
    return `cms: update case study ${slug}`;
  }

  return `cms: update ${path}`;
}

function parseSimpleFrontmatter(content: string): { frontmatter: Record<string, string>; body: string } {
  const normalized = content.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return { frontmatter: {}, body: normalized.trim() };
  }

  const end = normalized.indexOf("\n---\n", 4);
  if (end < 0) {
    return { frontmatter: {}, body: normalized.trim() };
  }

  const rawFrontmatter = normalized.slice(4, end);
  const frontmatter: Record<string, string> = {};
  for (const line of rawFrontmatter.split("\n")) {
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    frontmatter[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }

  return { frontmatter, body: normalized.slice(end + 5).trim() };
}

function validateMarkdownCreatePayload(path: string, content: string): string | null {
  const isMarkdownDomain =
    path.startsWith("content/case-studies/") ||
    path.startsWith("content/philosophy/") ||
    path.startsWith("content/deep-dive/");

  if (!isMarkdownDomain || !path.endsWith(".md")) {
    return null;
  }

  const { frontmatter, body } = parseSimpleFrontmatter(content);
  const requiredFields = ["slug", "title", "summary", "tags", "published"];
  const missing = requiredFields.filter((field) => !frontmatter[field] || !frontmatter[field].trim());
  if (missing.length) {
    return `Missing required metadata: ${missing.join(", ")}.`;
  }

  const slug = frontmatter.slug.replace(/^["']|["']$/g, "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return "Invalid slug format. Use lowercase letters, numbers, and hyphens only.";
  }

  if (!body.trim()) {
    return "Content body is required.";
  }

  return null;
}

function deriveUrls(path: string): { liveUrl?: string; previewUrl?: string } {
  const match = path.match(/^content\/case-studies\/([a-z0-9-]+)\.md$/);
  if (!match) return {};
  const slug = match[1];
  return {
    liveUrl: `/case-studies/${slug}`,
    previewUrl: `/admin/case-studies/preview/${slug}`,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.info("[cms/write-file] request:start", { method: req.method });

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (isRateLimited(req)) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }

  const auth = await assertCmsAuthorized(req);
  if (auth.ok === false) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const csrf = assertCsrf(req);
  if (csrf.ok === false) {
    res.status(csrf.status).json({ error: csrf.error });
    return;
  }

  const path = typeof req.body?.path === "string" ? req.body.path.trim() : "";
  const content = typeof req.body?.content === "string" ? req.body.content : "";

  if (!path || !content || !isAllowedPath(path)) {
    console.warn("[cms/write-file] request:invalid-payload", { pathPresent: Boolean(path), contentPresent: Boolean(content) });
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  const validationError = validateMarkdownCreatePayload(path, content);
  if (validationError) {
    console.warn("[cms/write-file] request:validation-failed", { path, validationError });
    res.status(400).json({ error: validationError });
    return;
  }

  try {
    const config = loadGithubConfig();
    console.info("[cms/write-file] github:config-loaded", { path, branch: config.branch });
    const existingSha = await getFileSha(config, path);
    const created = !existingSha;
    console.info("[cms/write-file] github:target-resolved", { path, created });
    const message = commitMessage(path, req.body?.message);
    await writeFileToGithub(config, path, content, message);
    const urls = deriveUrls(path);
    console.info("[cms/write-file] github:write-success", { path, created, message });
    res.status(200).json({
      ok: true,
      path,
      message,
      created,
      ...urls,
      deployment: "Vercel will rebuild from the GitHub commit before public pages update.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown write error";
    console.error("[cms/write-file] github:write-failed", { path, message });
    res.status(500).json({ error: message });
  }
}
