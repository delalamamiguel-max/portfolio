import { FormEvent, useState } from "react";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TagPill } from "@/components/ui/tag-pill";
import { getContactContent, getPhilosophyDocs, getResumeContent } from "@/lib/content-loader";
import { markdownToHtml } from "@/lib/markdown";

export function PhilosophyPage() {
  const essays = getPhilosophyDocs(false);

  return (
    <Section>
      <div className="max-w-4xl space-y-8">
        <header className="space-y-4">
          <h1 className="h1">Philosophy</h1>
          <p className="body-lg max-w-3xl">Short strategy essays on product systems, governance, and intelligent platform scale.</p>
        </header>

        <div className="space-y-4">
          {essays.map((essay) => (
            <article key={essay.slug} className="card-case-study">
              <h2 className="h3">{essay.title}</h2>
              <p className="mt-3 body-md">{essay.summary}</p>
              <div className="markdown-content mt-4 body-md" dangerouslySetInnerHTML={{ __html: markdownToHtml(essay.body) }} />
              <div className="mt-4 flex flex-wrap gap-2">
                {essay.tags.map((tag) => (
                  <TagPill key={`${essay.slug}-${tag}`}>{tag}</TagPill>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function ResumePage() {
  const resume = getResumeContent();

  return (
    <Section>
      <div className="max-w-5xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <h1 className="h1">Resume</h1>
            <p className="body-lg max-w-3xl">Metrics-forward timeline optimized for fast recruiter and executive skim.</p>
          </div>
          <a href={resume.downloadablePdfUrl} download>
            <Button variant="secondary" size="lg">Download PDF</Button>
          </a>
        </header>

        <div className="space-y-4">
          {resume.sections.map((entry) => (
            <Card key={`${entry.role}-${entry.company}`} variant="case-study" padding="md">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="h3">{entry.role}</h2>
                  <p className="body-md mt-1">{entry.company}</p>
                </div>
                <p className="mono-label">{entry.timeline}</p>
              </div>

              <ul className="mt-4 space-y-2">
                {entry.highlights.map((highlight) => (
                  <li key={highlight} className="body-md flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {entry.metrics.map((metric) => (
                  <p key={`${entry.role}-${metric}`} className="rounded-md border border-border bg-secondary px-3 py-1 text-sm text-foreground">
                    <strong>{metric}</strong>
                  </p>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {entry.tags.map((tag) => (
                  <TagPill key={`${entry.role}-${tag}`}>{tag}</TagPill>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function ContactPage() {
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
    <Section>
      <div className="max-w-3xl space-y-8">
        <header className="space-y-4">
          <h1 className="h1">Contact</h1>
          <p className="body-lg">{contact.headline}</p>
          <p className="body-md">{contact.subtext}</p>
        </header>

        <Card variant="case-study" padding="md">
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
              <Input
                id="contact-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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

            <Button variant="primary" size="lg" type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send"}
            </Button>
          </form>

          {status === "success" ? <p className="mt-4 body-md text-accent">Message sent. Thanks for reaching out.</p> : null}
          {status === "error" ? <p className="mt-4 body-md text-impact-green">Unable to send right now. Please try again.</p> : null}
        </Card>
      </div>
    </Section>
  );
}
