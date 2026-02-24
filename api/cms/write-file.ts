import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertCmsAuthorized } from "./auth.js";
import { assertCsrf } from "./csrf.js";
import { loadGithubConfig, writeFileToGithub } from "./github.js";
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  try {
    const config = loadGithubConfig();
    const message = commitMessage(path, req.body?.message);
    await writeFileToGithub(config, path, content, message);
    res.status(200).json({ ok: true, path, message });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown write error";
    res.status(500).json({ error: message });
  }
}
