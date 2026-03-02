import { extractSections, parseFrontmatter } from "@/lib/markdown";

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SECTION_ID_REGEX = /^[a-z][a-z0-9-]*$/;
export const CASE_STUDY_CATEGORIES = [
  "company-products",
  "personal-entrepreneurship",
  "both",
] as const;
export type CaseStudyCategory = (typeof CASE_STUDY_CATEGORIES)[number];
export const CASE_STUDY_CATEGORY_LABELS: Record<CaseStudyCategory, string> = {
  "company-products": "Company Products",
  "personal-entrepreneurship": "Personal / Entrepreneurship",
  both: "Both",
};

export const HOMEPAGE_BLOCK_TYPES = [
  "hero",
  "proof-metrics",
  "case-studies",
  "strategic-pillars",
  "custom-sections",
  "philosophy",
  "resume",
  "contact",
] as const;

export type HomepageBlockType = (typeof HOMEPAGE_BLOCK_TYPES)[number];

export type HomepageStructureBlock = {
  id: string;
  type: HomepageBlockType;
  navLabel: string;
  enabled: boolean;
};

export type HomeContent = {
  selectedImpactHeading: string;
  selectedImpactSubtext: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroSubheadline: string;
  strategicPillarsHeading: string;
  strategicPillarsSubtext: string;
  profileImage: { src: string; alt: string };
  proofMetrics: Array<{ metric: string; descriptor: string; description?: string }>;
  strategicPillars: Array<{ headline: string; subheadline: string; bullets: string[] }>;
  customSections: Array<{
    cmsLabel: string;
    publicTitle: string;
    layoutType: "narrative" | "credential-stack";
    body?: string;
    bullets: string[];
    closingStatement?: string;
    credentials: Array<{
      programTitle: string;
      institution: string;
      appliedContext: string;
    }>;
  }>;
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
  category: CaseStudyCategory;
  body: string;
};

export type ValidatedCaseStudy = MarkdownDoc & {
  sections: Array<{ heading: string; content: string }>;
};

function normalizeCaseStudyCategory(value: unknown): CaseStudyCategory {
  if (typeof value !== "string") return "both";
  const normalized = value.trim().toLowerCase();
  if (CASE_STUDY_CATEGORIES.includes(normalized as CaseStudyCategory)) {
    return normalized as CaseStudyCategory;
  }
  return "both";
}

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

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function validateHomeContent(input: unknown): HomeContent {
  const data = input as Partial<HomeContent>;

  if (!data || typeof data !== "object") {
    throw new Error("Invalid home content");
  }

  if (!Array.isArray(data.proofMetrics) || !Array.isArray(data.strategicPillars) || !Array.isArray(data.customSections)) {
    throw new Error("Invalid home arrays");
  }

  const profileImage = {
    src: typeof data.profileImage?.src === "string" ? data.profileImage.src.trim() : "",
    alt: typeof data.profileImage?.alt === "string" ? data.profileImage.alt.trim() : "",
  };

  if (profileImage.src && !profileImage.alt) {
    throw new Error("profileImage.alt is required when profileImage.src is set");
  }

  const validatedProofMetrics = data.proofMetrics.map((entry, index) => {
    const legacy = entry as { value?: unknown; label?: unknown; context?: unknown };
    return {
      metric: asString(entry?.metric ?? legacy.value, `proofMetrics[${index}].metric`),
      descriptor: asString(entry?.descriptor ?? legacy.label, `proofMetrics[${index}].descriptor`),
      description: asOptionalString(entry?.description ?? legacy.context),
    };
  });

  const validatedStrategicPillars = data.strategicPillars.map((entry, index) => {
    const legacy = entry as { title?: unknown };
    return {
      headline: asString(entry?.headline ?? legacy.title, `strategicPillars[${index}].headline`),
      subheadline: asString(entry?.subheadline, `strategicPillars[${index}].subheadline`),
      bullets: asStringArray(entry?.bullets, `strategicPillars[${index}].bullets`),
    };
  });
  const validatedCustomSections = data.customSections.map((entry, index) => {
    const rawLayoutType = asString(entry?.layoutType, `customSections[${index}].layoutType`);
    if (rawLayoutType !== "narrative" && rawLayoutType !== "credential-stack") {
      throw new Error(`Invalid customSections[${index}].layoutType`);
    }
    const layoutType: "narrative" | "credential-stack" = rawLayoutType;

    const bullets = Array.isArray(entry?.bullets)
      ? asStringArray(entry?.bullets, `customSections[${index}].bullets`)
      : [];

    const credentials = Array.isArray(entry?.credentials)
      ? entry.credentials.map((credential, credentialIndex) => ({
        programTitle: asString(
          credential?.programTitle,
          `customSections[${index}].credentials[${credentialIndex}].programTitle`,
        ),
        institution: asString(
          credential?.institution,
          `customSections[${index}].credentials[${credentialIndex}].institution`,
        ),
        appliedContext: asString(
          credential?.appliedContext,
          `customSections[${index}].credentials[${credentialIndex}].appliedContext`,
        ),
      }))
      : [];

    const body = asOptionalString(entry?.body);
    if (layoutType === "narrative" && !body) {
      throw new Error(`customSections[${index}].body is required for narrative layout`);
    }
    if (layoutType === "credential-stack" && credentials.length === 0) {
      throw new Error(`customSections[${index}].credentials requires at least one entry`);
    }

    return {
      cmsLabel: asString(entry?.cmsLabel, `customSections[${index}].cmsLabel`),
      publicTitle: asString(entry?.publicTitle, `customSections[${index}].publicTitle`),
      layoutType,
      body,
      bullets,
      closingStatement: asOptionalString(entry?.closingStatement),
      credentials,
    };
  });

  return {
    selectedImpactHeading: asString(data.selectedImpactHeading, "selectedImpactHeading"),
    selectedImpactSubtext: asString(data.selectedImpactSubtext, "selectedImpactSubtext"),
    heroEyebrow: asString(data.heroEyebrow, "heroEyebrow"),
    heroHeadline: asString(data.heroHeadline, "heroHeadline"),
    heroSubheadline: asString(data.heroSubheadline, "heroSubheadline"),
    strategicPillarsHeading: asString(data.strategicPillarsHeading, "strategicPillarsHeading"),
    strategicPillarsSubtext: asString(data.strategicPillarsSubtext, "strategicPillarsSubtext"),
    profileImage,
    proofMetrics: validatedProofMetrics,
    strategicPillars: validatedStrategicPillars,
    customSections: validatedCustomSections,
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

export function validateHomepageStructure(input: unknown): HomepageStructureBlock[] {
  if (!Array.isArray(input)) {
    throw new Error("Invalid homepage structure");
  }

  const normalized = input.map((entry, index) => {
    const id = asString((entry as { id?: unknown })?.id, `homepageStructure[${index}].id`);
    if (!SECTION_ID_REGEX.test(id)) {
      throw new Error(`Invalid homepageStructure[${index}].id`);
    }

    const type = asString((entry as { type?: unknown })?.type, `homepageStructure[${index}].type`) as HomepageBlockType;
    if (!HOMEPAGE_BLOCK_TYPES.includes(type)) {
      throw new Error(`Invalid homepageStructure[${index}].type`);
    }

    return {
      id,
      type,
      navLabel: asString((entry as { navLabel?: unknown })?.navLabel, `homepageStructure[${index}].navLabel`),
      enabled: asBoolean((entry as { enabled?: unknown })?.enabled, `homepageStructure[${index}].enabled`),
    };
  });

  const ids = normalized.map((entry) => entry.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    throw new Error(`Duplicate section id: ${duplicateIds[0]}`);
  }

  return normalized;
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
    category: normalizeCaseStudyCategory(parsed.frontmatter.category),
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
