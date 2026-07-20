import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Section } from "@/components/layout/section";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmailLink } from "@/components/ui/email-link";
import { cn } from "@/lib/utils";
import { CONTACT_EMAIL, contactMailto } from "@/lib/site";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricBlock } from "@/components/ui/metric-block";
import { TagPill } from "@/components/ui/tag-pill";
import {
  getCaseStudyIndex,
  getContactContent,
  getHomeContent,
  getHomepageStructure,
  getResumeContent,
} from "@/lib/content-loader";
import {
  CASE_STUDY_CATEGORIES,
  CASE_STUDY_CATEGORY_LABELS,
  type CaseStudyCategory,
  type HomeContent,
  type HomepageStructureBlock,
} from "@/lib/content-schema";

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resolveSectionTarget(href: string, fallbackId: string): string {
  const hash = href.includes("#") ? href.slice(href.indexOf("#") + 1) : "";
  return hash || fallbackId;
}

function HeroSection({ id, content }: { id: string; content: HomeContent }) {
  return (
    <Section id={id} ariaLabel="Hero" className="pt-10 md:pt-12 lg:pt-14">
      <div data-reveal className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-stretch lg:gap-12">
        <div className="flex h-full max-w-3xl flex-col justify-center space-y-6 lg:min-h-[520px]">
          <p className="mono-label inline-flex w-fit rounded-full border border-systems-teal/25 bg-systems-teal/10 px-3 py-1 text-accent backdrop-blur-md">
            {content.heroEyebrow}
          </p>
          <div className="max-w-4xl">
            <h1 className="h1 text-balance">{content.heroHeadline}</h1>
          </div>
          <p className="body-lg max-w-2xl">{content.heroSubheadline}</p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              variant="primary"
              size="lg"
              onClick={() => scrollToSection(resolveSectionTarget(content.primaryCTA.href, "case-studies"))}
            >
              {content.primaryCTA.label}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => scrollToSection(resolveSectionTarget(content.secondaryCTA.href, "contact"))}
            >
              {content.secondaryCTA.label}
            </Button>
          </div>
        </div>

        <aside className="glass-panel mx-auto flex w-full max-w-[360px] flex-col gap-3 p-3 lg:mx-0 lg:max-w-[420px]" aria-label="Profile and operating model">
          <div className="relative min-h-[360px] overflow-hidden rounded-lg border border-[color:var(--glass-border-soft)] lg:min-h-[432px]">
            {content.profileImage?.src ? (
              <img
                src={content.profileImage.src}
                alt={content.profileImage.alt || "Homepage profile image"}
                className="absolute inset-0 h-full w-full object-cover grayscale contrast-125"
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="relative flex h-full min-h-[360px] w-full items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.12),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.14),transparent_50%)]" />
                <div className="relative text-center">
                  <p className="mono-label">PROFILE IMAGE</p>
                  <p className="mt-2 text-sm text-muted-text">Upload from /admin/pages</p>
                </div>
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent p-5">
              <p className="mono-label text-teal-100">The pattern</p>
              <p className="mt-1 text-lg font-semibold text-white">Problem → intelligence at the core → proof → scale</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="glass-inset p-4">
              <p className="font-semibold text-foreground">Enterprise scale</p>
              <p className="mt-1 text-sm leading-6 text-muted-text">AT&amp;T platforms and personalization serving 30M+ monthly users.</p>
            </div>
            <div className="glass-inset p-4">
              <p className="font-semibold text-foreground">Founder execution</p>
              <p className="mt-1 text-sm leading-6 text-muted-text">AI-native SaaS designed, built, and shipped end to end.</p>
            </div>
          </div>
        </aside>
      </div>
    </Section>
  );
}

function SelectedImpactSection({ id, content }: { id: string; content: HomeContent }) {
  return (
    <Section id={id} ariaLabel="Selected impact">
      <div data-reveal className="mb-7 max-w-2xl space-y-3">
        <h2 className="h2">{content.selectedImpactHeading}</h2>
        <p className="body-md">{content.selectedImpactSubtext}</p>
      </div>
      <div data-reveal className="grid auto-rows-fr gap-5 md:grid-cols-2 xl:grid-cols-3">
        {content.proofMetrics.map((metric) => (
          <MetricBlock
            key={`${metric.metric}-${metric.descriptor}`}
            value={metric.metric}
            label={metric.descriptor}
            context={metric.description || ""}
          />
        ))}
      </div>
    </Section>
  );
}

function StrategicPillarsSection({ id, content }: { id: string; content: HomeContent }) {
  return (
    <Section id={id} ariaLabel="Strategic pillars">
      <div data-reveal className="mb-6 max-w-2xl space-y-2.5">
        <h2 className="h2">{content.strategicPillarsHeading}</h2>
        <p className="body-md">{content.strategicPillarsSubtext}</p>
      </div>
      <div data-reveal className="grid items-stretch gap-5 md:grid-cols-2">
        {content.strategicPillars.map((pillar) => (
          <Card key={pillar.headline} variant="case-study" padding="md" className="h-full">
            <CardHeader className="space-y-3">
              <CardTitle>{pillar.headline}</CardTitle>
              <p className="body-md font-medium text-muted-text">{pillar.subheadline}</p>
              <ul className="list-disc space-y-3 pl-6">
                {pillar.bullets.map((bullet) => (
                  <li key={bullet} className="body-md leading-relaxed">
                    {bullet}
                  </li>
                ))}
              </ul>
            </CardHeader>
          </Card>
        ))}
      </div>
    </Section>
  );
}

function CustomSectionsSection({ id, content }: { id: string; content: HomeContent }) {
  return (
    <Section id={id} ariaLabel="Custom content sections">
      <div data-reveal className="space-y-12 md:space-y-14">
        {content.customSections.map((entry) => (
          <article key={`${entry.cmsLabel}-${entry.publicTitle}`} className="space-y-4">
            <h2 className="h2">{entry.publicTitle}</h2>
            {entry.layoutType === "narrative" ? (
              <>
                {entry.body ? <p className="body-md max-w-4xl">{entry.body}</p> : null}
                {entry.bullets.length > 0 ? (
                  <ul className="list-disc space-y-2.5 pl-6">
                    {entry.bullets.map((bullet) => (
                      <li key={bullet} className="body-md leading-relaxed">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <div className="space-y-4">
                {entry.credentials.map((credential) => (
                  <div key={`${credential.programTitle}-${credential.institution}`} className="glass-inset p-4">
                    <p className="mono-label opacity-70">Program</p>
                    <h3 className="h4 mt-1">{credential.programTitle}</h3>
                    <p className="mono-label mt-3 opacity-70">Institution</p>
                    <p className="body-md mt-1">{credential.institution}</p>
                    <p className="mono-label mt-3 opacity-70">Applied Context</p>
                    <p className="body-md mt-1">{credential.appliedContext}</p>
                  </div>
                ))}
              </div>
            )}
            {entry.closingStatement ? (
              <p className="section-closing-statement">{entry.closingStatement}</p>
            ) : null}
          </article>
        ))}
      </div>
    </Section>
  );
}

function CaseStudiesSection({ id }: { id: string }) {
  const location = useLocation();
  const studies = getCaseStudyIndex();
  const [selectedCategory, setSelectedCategory] = useState<CaseStudyCategory>("both");
  const filteredStudies = useMemo(
    () => (selectedCategory === "both" ? studies : studies.filter((study) => study.category === selectedCategory)),
    [selectedCategory, studies],
  );

  return (
    <Section id={id} ariaLabel="Case studies">
      <div data-reveal className="max-w-5xl space-y-6">
        <header className="space-y-2">
          <h2 className="h2" id="case-studies-heading" tabIndex={-1}>The work</h2>
          <p className="body-lg">One pattern across every product: intelligence at the core, proven by measurement.</p>
        </header>
        <div className="flex flex-wrap gap-2">
          {CASE_STUDY_CATEGORIES.map((category) => (
            <Button
              key={category}
              type="button"
              variant={selectedCategory === category ? "primary" : "subtle"}
              className="h-9 px-4 text-sm"
              onClick={() => setSelectedCategory(category)}
            >
              {CASE_STUDY_CATEGORY_LABELS[category]}
            </Button>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {filteredStudies.map((study) => (
            <Card key={study.slug} variant="case-study">
              {study.category === "company-products" ? (
                <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 font-mono text-[11px] tracking-normal text-warning">
                  <span aria-hidden>🔒</span> Password Protected
                </span>
              ) : null}
              <h3 className="h4">{study.title}</h3>
              <p className="mt-2 min-w-0 break-words text-muted-text [overflow-wrap:anywhere]">{study.summary}</p>
              <div className="mt-4 flex max-w-full flex-wrap items-start gap-2">
                {study.tags.map((tag) => (
                  <TagPill key={`${study.slug}-${tag}`}>{tag}</TagPill>
                ))}
              </div>
              <Link
                to={`/case-studies/${study.slug}`}
                state={{ backgroundLocation: location }}
                id={`case-card-${study.slug}`}
                className="mt-5 inline-flex items-center gap-1 link-accent"
              >
                Open case study
                <span aria-hidden>→</span>
              </Link>
            </Card>
          ))}
        </div>
        {filteredStudies.length === 0 ? (
          <p className="body-md text-muted-text">No case studies in this category yet.</p>
        ) : null}
      </div>
    </Section>
  );
}

function ResumeSection({ id }: { id: string }) {
  const resume = getResumeContent();
  const pdfUrl = resume.downloadablePdfUrl?.trim();
  return (
    <Section id={id} ariaLabel="Resume" density="dense">
      <div data-reveal className="mx-auto max-w-3xl space-y-8 text-center">
        <h2 className="h3">Resume</h2>
        {pdfUrl ? (
          <div className="space-y-3">
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "primary", size: "lg" }))}>
              Download PDF
              <span className="ml-2" aria-hidden>
                ↗
              </span>
            </a>
            <p className="text-sm text-muted-text">
              Opens in a new tab. The resume is password protected; request access at{" "}
              <EmailLink subject="Resume access request" />. Access is reviewed personally.
            </p>
          </div>
        ) : (
          <Button variant="secondary" size="lg" disabled>
            Resume unavailable
          </Button>
        )}
      </div>
    </Section>
  );
}

function ContactSection({ id }: { id: string }) {
  const contact = getContactContent();

  return (
    <Section id={id} ariaLabel="Contact">
      <div data-reveal className="max-w-5xl space-y-6">
        <header className="space-y-3">
          <h2 className="h2">Contact</h2>
          <p className="body-lg">{contact.headline}</p>
          <p className="body-md">{contact.subtext}</p>
        </header>

        <Card variant="case-study" padding="md" className="max-w-4xl">
          <p className="body-md max-w-2xl">
            The fastest way to reach me is email. Whether it is a role, a project, or a conversation about building products
            with AI at the foundation, write to me directly. Every message gets a personal reply.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <a href={contactMailto()} className={cn(buttonVariants({ variant: "primary", size: "lg" }))}>
              Email {CONTACT_EMAIL}
            </a>
          </div>
        </Card>
      </div>
    </Section>
  );
}

function FooterSection() {
  return (
    <footer className="container border-t border-border/60 py-8">
      <div className="flex flex-col gap-2 pr-16 text-sm text-muted-text sm:flex-row sm:items-center sm:justify-between">
        <p className="text-foreground">Miguel de la Lama · Senior Product Manager</p>
        <a
          href="https://www.linkedin.com/in/migueldelalama/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground hover:underline"
        >
          LinkedIn
        </a>
        <EmailLink className="text-muted-text no-underline hover:text-foreground hover:underline" />
      </div>
    </footer>
  );
}

const sectionRenderers: Record<HomepageStructureBlock["type"], (id: string, content: HomeContent) => JSX.Element> = {
  hero: (id, content) => <HeroSection id={id} content={content} />,
  "proof-metrics": (id, content) => <SelectedImpactSection id={id} content={content} />,
  "strategic-pillars": (id, content) => <StrategicPillarsSection id={id} content={content} />,
  "custom-sections": (id, content) => <CustomSectionsSection id={id} content={content} />,
  "case-studies": (id) => <CaseStudiesSection id={id} />,
  resume: (id) => <ResumeSection id={id} />,
  contact: (id) => <ContactSection id={id} />,
  philosophy: () => <></>,
};

export function HomePage() {
  const location = useLocation();
  const content = useMemo(() => getHomeContent(), []);
  const structure = useMemo(
    () => getHomepageStructure().filter((block) => block.enabled && block.type !== "philosophy"),
    [],
  );

  useEffect(() => {
    if (!location.hash.startsWith("#")) return;
    const id = location.hash.slice(1);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.hash]);

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    targets.forEach((target, index) => {
      target.style.setProperty("--reveal-delay", `${Math.min(index * 40, 220)}ms`);
      observer.observe(target);
    });

    return () => observer.disconnect();
  }, [structure]);

  return (
    <div>
      {structure.map((block) => (
        <Fragment key={block.id}>{sectionRenderers[block.type](block.id, content)}</Fragment>
      ))}
      <FooterSection />
    </div>
  );
}
