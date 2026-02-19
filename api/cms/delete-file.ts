import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertCmsAuthorized } from "./auth.js";
import { assertCsrf } from "./csrf.js";
import { deleteFileFromGithub, loadGithubConfig } from "./github.js";
import { isRateLimited } from "./rate-limit.js";

const ALLOWED_PREFIXES = ["content/case-studies/", "content/philosophy/", "content/deep-dive/"];

function isAllowedPath(path: string): boolean {
  return ALLOWED_PREFIXES.some((allowed) => path.startsWith(allowed));
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

  if (!path || !isAllowedPath(path)) {
    res.status(400).json({ error: "Invalid path" });
    return;
  }

  try {
    const config = loadGithubConfig();
    await deleteFileFromGithub(config, path, `cms: delete ${path}`);
    res.status(200).json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown delete error";
    res.status(500).json({ error: message });
  }
}
