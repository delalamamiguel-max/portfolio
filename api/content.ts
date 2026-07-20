import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertAdminOrViewerAuthorized, assertCmsAuthorized } from "./cms/auth.js";
import { PUBLIC_CASE_STUDY_SLUGS } from "../lib/case-study-access.js";

const ALLOWED_DOMAINS = new Set(["case-studies", "deep-dive", "philosophy"]);
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function contentDir(domain: string): string {
  return path.join(process.cwd(), "content", domain);
}

/** Cheap frontmatter peek: only what's needed to decide whether a public-slug
 * case study is actually published (a draft-in-progress edit must never be
 * servable without a session, even for slugs that are public once published). */
function isPublished(raw: string): boolean {
  const match = raw.match(/^published:\s*(true|false)\s*$/m);
  return match ? match[1] === "true" : false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
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
      let raw: string;

      try {
        raw = await readFile(filePath, "utf8");
      } catch {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const isPubliclyReadable = domain === "case-studies" && PUBLIC_CASE_STUDY_SLUGS.has(slug) && isPublished(raw);

      if (!isPubliclyReadable) {
        // Deep dives and philosophy stay admin-only (no public renderer for
        // them today); gated case studies accept admin OR viewer.
        const auth = domain === "case-studies" ? await assertAdminOrViewerAuthorized(req) : await assertCmsAuthorized(req);
        if (auth.ok === false) {
          res.status(auth.status).json({ error: auth.error });
          return;
        }
      }

      res.status(200).json({ raw });
      return;
    }

    // Bulk listing (no slug): only ever used by the admin editors, so it
    // always requires the admin scope regardless of domain or public slugs.
    const auth = await assertCmsAuthorized(req);
    if (auth.ok === false) {
      res.status(auth.status).json({ error: auth.error });
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
