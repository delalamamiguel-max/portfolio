import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertCmsAuthorized } from "./auth.js";
import { assertCsrf } from "./csrf.js";
import { loadGithubConfig, writeBase64FileToGithub } from "./github.js";
import { isRateLimited } from "./rate-limit.js";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);
const MAX_BASE64_CHARS = 12_000_000; // ~9MB binary

function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function fileExtensionForMime(mimeType: string): string | null {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/svg+xml":
      return "svg";
    default:
      return null;
  }
}

function safeFolderSegment(value: unknown): string {
  if (typeof value !== "string") return "misc";
  const sanitized = slugify(value);
  return sanitized || "misc";
}

function safeName(value: unknown): string {
  if (typeof value !== "string") return "image";
  const sanitized = slugify(value.replace(/\.[a-z0-9]+$/i, ""));
  return sanitized || "image";
}

function isValidBase64(value: string): boolean {
  return /^[a-zA-Z0-9+/=]+$/.test(value);
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

  const mimeType = typeof req.body?.mimeType === "string" ? req.body.mimeType.trim() : "";
  const dataBase64 = typeof req.body?.dataBase64 === "string" ? req.body.dataBase64.trim() : "";
  const folder = safeFolderSegment(req.body?.folder);
  const fileNameBase = safeName(req.body?.fileName);

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    res.status(400).json({ error: "Unsupported image format." });
    return;
  }

  if (!dataBase64 || dataBase64.length > MAX_BASE64_CHARS || !isValidBase64(dataBase64)) {
    res.status(400).json({ error: "Invalid image payload." });
    return;
  }

  const extension = fileExtensionForMime(mimeType);
  if (!extension) {
    res.status(400).json({ error: "Unsupported image format." });
    return;
  }

  const date = new Date();
  const yyyy = String(date.getUTCFullYear());
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const timestamp = Date.now().toString().slice(-6);

  const publicPath = `public/images/cms/${folder}/${yyyy}/${mm}/${fileNameBase}-${timestamp}.${extension}`;

  try {
    const config = loadGithubConfig();
    const message = `cms: upload image ${folder}/${fileNameBase}`;
    await writeBase64FileToGithub(config, publicPath, dataBase64, message);
    res.status(200).json({
      ok: true,
      path: publicPath,
      publicUrl: `/${publicPath.replace(/^public\//, "")}`,
      message,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown upload error";
    res.status(500).json({ error: message });
  }
}
