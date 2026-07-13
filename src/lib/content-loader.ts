import caseStudyIndexJson from "@/generated/case-study-index.json";
import {
  type CaseStudyCategory,
  CASE_STUDY_CATEGORIES,
  type ContactContent,
  type HomeContent,
  type HomepageStructureBlock,
  type ResumeContent,
  validateContactContent,
  validateHomeContent,
  validateHomepageStructure,
  validateResumeContent,
} from "@/lib/content-schema";

// Public page content (safe to ship in the client bundle).
const homeJson = import.meta.glob("/content/pages/home.json", { eager: true, import: "default" }) as Record<string, unknown>;
const homepageStructureJson = import.meta.glob("/content/pages/home-structure.json", { eager: true, import: "default" }) as Record<string, unknown>;
const resumeJson = import.meta.glob("/content/pages/resume.json", { eager: true, import: "default" }) as Record<string, unknown>;
const contactJson = import.meta.glob("/content/pages/contact.json", { eager: true, import: "default" }) as Record<string, unknown>;

// Private markdown (case studies, deep dives, philosophy) is intentionally NOT
// imported here: bundling it would expose gated content to every visitor.
// Bodies are served by the session-authenticated /api/content endpoint; the
// public homepage uses only the build-time metadata index below.

function firstValue<T>(record: Record<string, T>): T {
  const value = Object.values(record)[0];
  if (value === undefined) {
    throw new Error("Missing content file");
  }

  return value;
}

export function getHomeContent(): HomeContent {
  return validateHomeContent(firstValue(homeJson));
}

export function getResumeContent(): ResumeContent {
  return validateResumeContent(firstValue(resumeJson));
}

export function getHomepageStructure(): HomepageStructureBlock[] {
  return validateHomepageStructure(firstValue(homepageStructureJson));
}

export function getContactContent(): ContactContent {
  return validateContactContent(firstValue(contactJson));
}

export type CaseStudyIndexEntry = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  category: CaseStudyCategory;
};

export function getCaseStudyIndex(): CaseStudyIndexEntry[] {
  return (caseStudyIndexJson as CaseStudyIndexEntry[]).map((entry) => ({
    ...entry,
    category: CASE_STUDY_CATEGORIES.includes(entry.category) ? entry.category : "both",
  }));
}

export type ContentDomain = "case-studies" | "deep-dive" | "philosophy";

export async function fetchContentDoc(domain: ContentDomain, slug: string): Promise<string | null> {
  const response = await fetch(`/api/content?domain=${domain}&slug=${encodeURIComponent(slug)}`, {
    credentials: "include",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to load content");
  }

  const payload = (await response.json()) as { raw?: string };
  return typeof payload.raw === "string" ? payload.raw : null;
}

export async function fetchContentRawMap(domain: ContentDomain): Promise<Record<string, string>> {
  const response = await fetch(`/api/content?domain=${domain}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Unable to load content");
  }

  const payload = (await response.json()) as { files?: Record<string, string> };
  return payload.files ?? {};
}
