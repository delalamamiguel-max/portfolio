import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricBlock } from "@/components/ui/metric-block";
import { TagPill } from "@/components/ui/tag-pill";
import {
  getCaseStudies,
  getContactContent,
  getHomeContent,
  getHomepageStructure,
  getResumeContent,
} from "@/lib/content-loader";
import type { HomeContent, HomepageStructureBlock } from "@/lib/content-schema";

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
          <p className="mono-label">{content.heroEyebrow}</p>
          <h1 className="h1 max-w-4xl text-balance">{content.heroHeadline}</h1>
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

        <div className="mx-auto w-full max-w-[360px] lg:mx-0 lg:max-w-[420px]">
          <div className="relative h-full min-h-[420px] overflow-hidden rounded-lg lg:min-h-[520px]">
            {content.profileImage?.src ? (
              <img
                src={content.profileImage.src}
                alt={content.profileImage.alt || "Homepage profile image"}
                className="h-full w-full object-cover grayscale contrast-125"
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="relative flex h-full w-full items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.12),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.14),transparent_50%)]" />
                <div className="relative text-center">
                  <p className="mono-label">PROFILE IMAGE</p>
                  <p className="mt-2 text-sm text-muted-text">Upload from /admin/pages</p>
                </div>
              </div>
            )}
          </div>
        </div>
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
      <div data-reveal className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
      <div data-reveal className="space-y-8">
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
                  <div key={`${credential.programTitle}-${credential.institution}`} className="rounded-lg border border-border/70 bg-card/60 p-4">
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
              <p className="mt-5 border-l-2 border-border pl-4 text-base font-semibold italic text-foreground">{entry.closingStatement}</p>
            ) : null}
          </article>
        ))}
      </div>
    </Section>
  );
}

function CaseStudiesSection({ id }: { id: string }) {
  const studies = getCaseStudies(false);
  return (
    <Section id={id} ariaLabel="Case studies">
      <div data-reveal className="max-w-5xl space-y-6">
        <header className="space-y-2">
          <h2 className="h2">Case Studies</h2>
          <p className="body-lg">Selected strategic product systems work.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          {studies.map((study) => (
            <Card key={study.slug} variant="case-study">
              <h3 className="h4">{study.title}</h3>
              <p className="mt-2 min-w-0 break-words text-muted-text [overflow-wrap:anywhere]">{study.summary}</p>
              <div className="mt-4 flex max-w-full flex-wrap items-start gap-2">
                {study.tags.map((tag) => (
                  <TagPill key={`${study.slug}-${tag}`}>{tag}</TagPill>
                ))}
              </div>
              <Link to={`/case-studies/${study.slug}`} className="mt-5 inline-flex items-center gap-1 link-accent">
                Open case study
                <span aria-hidden>→</span>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </Section>
  );
}

function ResumeSection({ id }: { id: string }) {
  const resume = getResumeContent();
  return (
    <Section id={id} ariaLabel="Resume" density="dense">
      <div data-reveal className="mx-auto max-w-3xl space-y-4 text-center">
        <h2 className="h3">Resume</h2>
        <a href={resume.downloadablePdfUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="primary" size="lg">Download PDF</Button>
        </a>
      </div>
    </Section>
  );
}

function ContactSection({ id }: { id: string }) {
  const contact = getContactContent();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus("idle");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message }),
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
      setMessage("");
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section id={id} ariaLabel="Contact">
      <div data-reveal className="max-w-5xl space-y-6">
        <header className="space-y-3">
          <h2 className="h2">Contact</h2>
          <p className="body-lg">{contact.headline}</p>
          <p className="body-md">{contact.subtext}</p>
        </header>

        <Card variant="case-study" padding="md" className="max-w-4xl">
          <div className="mb-4 space-y-2">
            {contact.contactMethods.map((method) => (
              <a key={method.value} className="mono-label block hover:underline" href={method.value}>{method.label}</a>
            ))}
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm text-primary-text" htmlFor="contact-email">
                Work Email
              </label>
              <input
                id="contact-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-base text-foreground placeholder:text-muted-text"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-primary-text" htmlFor="contact-message">
                Message
              </label>
              <textarea
                id="contact-message"
                className="min-h-32 w-full rounded-md border border-input bg-card px-3 py-2 text-base text-foreground placeholder:text-muted-text"
                required
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </div>

            <Button variant="primary" size="lg" type="submit" disabled={submitting} className="min-w-[112px]">
              {submitting ? "Sending..." : "Send"}
            </Button>
          </form>

          <div className="mt-4 min-h-6">
            {status === "success" ? <p className="body-md text-accent">Message sent. Thanks for reaching out.</p> : null}
            {status === "error" ? <p className="body-md text-impact-green">Unable to send right now. Please try again.</p> : null}
          </div>
        </Card>
      </div>
    </Section>
  );
}

function FooterSection() {
  return (
    <footer className="container border-t border-border/60 py-8">
      <div className="flex flex-col gap-2 text-sm text-muted-text sm:flex-row sm:items-center sm:justify-between">
        <a
          href="https://www.linkedin.com/in/migueldelalama/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground hover:underline"
        >
          LinkedIn
        </a>
        <a href="mailto:delalama.miguel@gmail.com" className="hover:text-foreground hover:underline">
          delalama.miguel@gmail.com
        </a>
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
      {structure.map((block) => sectionRenderers[block.type](block.id, content))}
      <FooterSection />
    </div>
  );
}
