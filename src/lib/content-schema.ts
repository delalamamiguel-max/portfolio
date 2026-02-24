import { extractSections, parseFrontmatter } from "@/lib/markdown";

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type HomeContent = {
  heroHeadline: string;
  heroSubheadline: string;
  profileImage: { src: string; alt: string };
  proofMetrics: Array<{ value: string; label: string; context: string }>;
  strategicPillars: Array<{ title: string; bullets: string[] }>;
  primaryCTA: { label: string; href: string };
  secondaryCTA: { label: string; href: string };
};

export type ResumeContent = {
  sections: Array<{
    role: string;
    company: string;
    timeline: string;
    highlights: string[];
    metrics: string[];
    tags: string[];
  }>;
  downloadablePdfUrl: string;
};

export type ContactContent = {
  headline: string;
  subtext: string;
  contactMethods: Array<{ type: string; label: string; value: string }>;
};

export type MarkdownDoc = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  published: boolean;
  body: string;
};

export type ValidatedCaseStudy = MarkdownDoc & {
  sections: Array<{ heading: string; content: string }>;
};

function asString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Invalid ${field}`);
  }

  return value.trim();
}

function asStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(`Invalid ${field}`);
  }

  return value as string[];
}

function asBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`Invalid ${field}`);
  }

  return value;
}

export function validateHomeContent(input: unknown): HomeContent {
  const data = input as Partial<HomeContent>;

  if (!data || typeof data !== "object") {
    throw new Error("Invalid home content");
  }

  if (!Array.isArray(data.proofMetrics) || !Array.isArray(data.strategicPillars)) {
    throw new Error("Invalid home arrays");
  }

  const profileImage = {
    src: typeof data.profileImage?.src === "string" ? data.profileImage.src.trim() : "",
    alt: typeof data.profileImage?.alt === "string" ? data.profileImage.alt.trim() : "",
  };

  if (profileImage.src && !profileImage.alt) {
    throw new Error("profileImage.alt is required when profileImage.src is set");
  }

  return {
    heroHeadline: asString(data.heroHeadline, "heroHeadline"),
    heroSubheadline: asString(data.heroSubheadline, "heroSubheadline"),
    profileImage,
    proofMetrics: data.proofMetrics.map((entry) => ({
      value: asString(entry.value, "proofMetrics.value"),
      label: asString(entry.label, "proofMetrics.label"),
      context: asString(entry.context, "proofMetrics.context"),
    })),
    strategicPillars: data.strategicPillars.map((entry) => ({
      title: asString(entry.title, "strategicPillars.title"),
      bullets: asStringArray(entry.bullets, "strategicPillars.bullets"),
    })),
    primaryCTA: {
      label: asString(data.primaryCTA?.label, "primaryCTA.label"),
      href: asString(data.primaryCTA?.href, "primaryCTA.href"),
    },
    secondaryCTA: {
      label: asString(data.secondaryCTA?.label, "secondaryCTA.label"),
      href: asString(data.secondaryCTA?.href, "secondaryCTA.href"),
    },
  };
}

export function validateResumeContent(input: unknown): ResumeContent {
  const data = input as Partial<ResumeContent>;
  if (!data || typeof data !== "object" || !Array.isArray(data.sections)) {
    throw new Error("Invalid resume content");
  }

  return {
    sections: data.sections.map((entry) => ({
      role: asString(entry.role, "resume.role"),
      company: asString(entry.company, "resume.company"),
      timeline: asString(entry.timeline, "resume.timeline"),
      highlights: asStringArray(entry.highlights, "resume.highlights"),
      metrics: asStringArray(entry.metrics, "resume.metrics"),
      tags: asStringArray(entry.tags, "resume.tags"),
    })),
    downloadablePdfUrl: asString(data.downloadablePdfUrl, "downloadablePdfUrl"),
  };
}

export function validateContactContent(input: unknown): ContactContent {
  const data = input as Partial<ContactContent>;
  if (!data || typeof data !== "object" || !Array.isArray(data.contactMethods)) {
    throw new Error("Invalid contact content");
  }

  return {
    headline: asString(data.headline, "headline"),
    subtext: asString(data.subtext, "subtext"),
    contactMethods: data.contactMethods.map((entry) => ({
      type: asString(entry.type, "contactMethods.type"),
      label: asString(entry.label, "contactMethods.label"),
      value: asString(entry.value, "contactMethods.value"),
    })),
  };
}

export function parseMarkdownDoc(raw: string): MarkdownDoc {
  const parsed = parseFrontmatter(raw);
  const slug = asString(parsed.frontmatter.slug, "slug");

  if (!SLUG_REGEX.test(slug)) {
    throw new Error("Invalid slug format");
  }

  return {
    slug,
    title: asString(parsed.frontmatter.title, "title"),
    summary: typeof parsed.frontmatter.summary === "string" ? parsed.frontmatter.summary.trim() : "",
    tags: Array.isArray(parsed.frontmatter.tags)
      ? asStringArray(parsed.frontmatter.tags, "tags")
      : [],
    published: typeof parsed.frontmatter.published === "boolean" ? asBoolean(parsed.frontmatter.published, "published") : false,
    body: parsed.body,
  };
}

export function validateCaseStudyDoc(raw: string): ValidatedCaseStudy {
  const doc = parseMarkdownDoc(raw);
  const sections = extractSections(doc.body);

  return {
    ...doc,
    sections,
  };
}

export function validatePhilosophyDoc(raw: string): MarkdownDoc {
  return parseMarkdownDoc(raw);
}
