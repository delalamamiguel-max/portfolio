import {
  type ContactContent,
  type HomeContent,
  type MarkdownDoc,
  type ResumeContent,
  type ValidatedCaseStudy,
  validateCaseStudyDoc,
  validateContactContent,
  validateHomeContent,
  validatePhilosophyDoc,
  validateResumeContent,
} from "@/lib/content-schema";

const homeJson = import.meta.glob("/content/pages/home.json", { eager: true, import: "default" }) as Record<string, unknown>;
const resumeJson = import.meta.glob("/content/pages/resume.json", { eager: true, import: "default" }) as Record<string, unknown>;
const contactJson = import.meta.glob("/content/pages/contact.json", { eager: true, import: "default" }) as Record<string, unknown>;

const caseStudyFiles = import.meta.glob("/content/case-studies/*.md", { eager: true, query: "?raw", import: "default" }) as Record<string, string>;
const philosophyFiles = import.meta.glob("/content/philosophy/*.md", { eager: true, query: "?raw", import: "default" }) as Record<string, string>;
const deepDiveFiles = import.meta.glob("/content/deep-dive/*.md", { eager: true, query: "?raw", import: "default" }) as Record<string, string>;

function firstValue<T>(record: Record<string, T>): T {
  const value = Object.values(record)[0];
  if (value === undefined) {
    throw new Error("Missing content file");
  }

  return value;
}

function mapMarkdownDocs(record: Record<string, string>, parser: (raw: string) => MarkdownDoc): MarkdownDoc[] {
  return Object.values(record)
    .map((raw) => parser(raw))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getHomeContent(): HomeContent {
  return validateHomeContent(firstValue(homeJson));
}

export function getResumeContent(): ResumeContent {
  return validateResumeContent(firstValue(resumeJson));
}

export function getContactContent(): ContactContent {
  return validateContactContent(firstValue(contactJson));
}

export function getPhilosophyDocs(includeDrafts = false): MarkdownDoc[] {
  const docs = mapMarkdownDocs(philosophyFiles, validatePhilosophyDoc);
  return includeDrafts ? docs : docs.filter((doc) => doc.published);
}

export function getCaseStudies(includeDrafts = false): ValidatedCaseStudy[] {
  const docs = Object.values(caseStudyFiles)
    .map((raw) => validateCaseStudyDoc(raw))
    .sort((a, b) => a.title.localeCompare(b.title));

  return includeDrafts ? docs : docs.filter((doc) => doc.published);
}

export function getCaseStudyBySlug(slug: string, includeDrafts = false): ValidatedCaseStudy | undefined {
  return getCaseStudies(includeDrafts).find((doc) => doc.slug === slug);
}

export function getDeepDives(includeDrafts = false): ValidatedCaseStudy[] {
  const docs = Object.values(deepDiveFiles)
    .map((raw) => validateCaseStudyDoc(raw))
    .sort((a, b) => a.title.localeCompare(b.title));

  return includeDrafts ? docs : docs.filter((doc) => doc.published);
}

export function getDeepDiveBySlug(slug: string, includeDrafts = false): ValidatedCaseStudy | undefined {
  return getDeepDives(includeDrafts).find((doc) => doc.slug === slug);
}

export function getCaseStudyRawMap(): Record<string, string> {
  return { ...caseStudyFiles };
}

export function getPhilosophyRawMap(): Record<string, string> {
  return { ...philosophyFiles };
}

export function getDeepDiveRawMap(): Record<string, string> {
  return { ...deepDiveFiles };
}
