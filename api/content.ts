import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertCmsAuthorized } from "./cms/auth.js";

const ALLOWED_DOMAINS = new Set(["case-studies", "deep-dive", "philosophy"]);
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function contentDir(domain: string): string {
  return path.join(process.cwd(), "content", domain);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const auth = await assertCmsAuthorized(req);
  if (auth.ok === false) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const domain = typeof req.query.domain === "string" ? req.query.domain : "";
  const slug = typeof req.query.slug === "string" ? req.query.slug : "";

  if (!ALLOWED_DOMAINS.has(domain)) {
    res.status(400).json({ error: "Invalid domain" });
    return;
  }

  res.setHeader("Cache-Control", "private, no-store");

  try {
    if (slug) {
      if (!SLUG_REGEX.test(slug)) {
        res.status(400).json({ error: "Invalid slug" });
        return;
      }

      const filePath = path.join(contentDir(domain), `${slug}.md`);

      try {
        const raw = await readFile(filePath, "utf8");
        res.status(200).json({ raw });
      } catch {
        res.status(404).json({ error: "Not found" });
      }
      return;
    }

    const dir = contentDir(domain);
    let entries: string[] = [];

    try {
      entries = (await readdir(dir)).filter((file) => file.endsWith(".md"));
    } catch {
      entries = [];
    }

    const files: Record<string, string> = {};
    for (const file of entries) {
      files[`content/${domain}/${file}`] = await readFile(path.join(dir, file), "utf8");
    }

    res.status(200).json({ files });
  } catch (error) {
    console.error("[content] read failed", { domain, slug, message: error instanceof Error ? error.message : "unknown" });
    res.status(500).json({ error: "Unable to load content" });
  }
}
