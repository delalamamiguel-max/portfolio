#!/usr/bin/env node
/**
 * Validates all markdown content and generates the public case-study index.
 *
 * - Fails (exit 1) on invalid frontmatter so bad content breaks CI, not production.
 * - Emits src/generated/case-study-index.json containing ONLY public metadata
 *   (slug, title, summary, tags, category) for published case studies.
 *   Bodies never enter the client bundle; they are served by the
 *   authenticated /api/content endpoint.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CATEGORIES = new Set(["both", "company-products", "personal-entrepreneurship"]);
const MAX_TAGS = 6;
const MAX_TAG_LENGTH = 24;

function parseFrontmatter(input) {
  const normalized = input.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) return { frontmatter: {}, body: normalized.trim() };
  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) return { frontmatter: {}, body: normalized.trim() };

  const frontmatter = {};
  for (const line of normalized.slice(4, end).trim().split("\n")) {
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (value === "true") frontmatter[key] = true;
    else if (value === "false") frontmatter[key] = false;
    else if (value.startsWith("[") && value.endsWith("]")) {
      frontmatter[key] = value
        .slice(1, -1)
        .split(",")
        .map((part) => part.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else frontmatter[key] = value.replace(/^["']|["']$/g, "");
  }

  return { frontmatter, body: normalized.slice(end + 5).trim() };
}

function validateDoc(domain, file, raw, errors) {
  const { frontmatter, body } = parseFrontmatter(raw);
  const where = `${domain}/${file}`;

  if (typeof frontmatter.slug !== "string" || !SLUG_REGEX.test(frontmatter.slug)) {
    errors.push(`${where}: missing or invalid slug`);
  }
  if (typeof frontmatter.title !== "string" || !frontmatter.title.trim()) {
    errors.push(`${where}: missing title`);
  }
  if (!body.trim()) {
    errors.push(`${where}: empty body`);
  }
  if (typeof frontmatter.published !== "boolean") {
    errors.push(`${where}: published must be true or false`);
  }
  if (domain === "case-studies") {
    if (frontmatter.category !== undefined && !CATEGORIES.has(frontmatter.category)) {
      errors.push(`${where}: invalid category "${frontmatter.category}"`);
    }
    const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
    if (tags.length > MAX_TAGS) errors.push(`${where}: more than ${MAX_TAGS} tags`);
    for (const tag of tags) {
      if (tag.length > MAX_TAG_LENGTH) errors.push(`${where}: tag too long "${tag}"`);
    }
  }

  return { frontmatter, body };
}

const errors = [];
const index = [];

for (const domain of ["case-studies", "deep-dive", "philosophy"]) {
  const dir = join(root, "content", domain);
  let files = [];
  try {
    files = readdirSync(dir).filter((file) => file.endsWith(".md"));
  } catch {
    continue;
  }

  for (const file of files) {
    const raw = readFileSync(join(dir, file), "utf8");
    const { frontmatter } = validateDoc(domain, file, raw, errors);

    if (domain === "case-studies" && frontmatter.published === true) {
      index.push({
        slug: frontmatter.slug,
        title: frontmatter.title,
        summary: typeof frontmatter.summary === "string" ? frontmatter.summary : "",
        tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
        category: CATEGORIES.has(frontmatter.category) ? frontmatter.category : "both",
      });
    }
  }
}

if (errors.length) {
  console.error("Content validation failed:");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

index.sort((a, b) => a.title.localeCompare(b.title));

const outDir = join(root, "src", "generated");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "case-study-index.json"), `${JSON.stringify(index, null, 2)}\n`);
console.log(`Content OK. Public case-study index: ${index.length} published entries.`);
