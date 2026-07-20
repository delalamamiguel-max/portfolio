import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDocumentTitle } from "@/lib/use-document-title";

type RequestedContent = "case-studies" | "resume" | "both";

const CONTENT_OPTIONS: Array<{ value: RequestedContent; label: string }> = [
  { value: "case-studies", label: "Case studies" },
  { value: "resume", label: "Resume" },
  { value: "both", label: "Both" },
];

export function RequestAccessPage() {
  useDocumentTitle("Request access");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [reason, setReason] = useState("");
  const [requestedContent, setRequestedContent] = useState<RequestedContent>("both");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus("idle");
    setErrorDetail("");

    try {
      const response = await fetch("/api/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, reason, requestedContent, website }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setErrorDetail(payload.error ?? "");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section>
      <div className="mx-auto max-w-xl">
        <Card variant="case-study" padding="lg">
          <h1 className="h2">Request access</h1>
          <p className="mt-3 body-md">
            The company case studies and my resume are shared privately. Tell me who you are and I will review your request
            personally.
          </p>

          {status === "success" ? (
            <div className="mt-8 space-y-4" role="status" aria-live="polite">
              <p className="body-md text-accent">
                Request received. Access is reviewed personally and is not granted automatically. If approved, you'll receive an
                email with access instructions.
              </p>
              <p className="text-sm text-muted-text">
                Back to <Link to="/" className="link-accent">homepage</Link>
              </p>
            </div>
          ) : (
            <form className="mt-8 space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="block text-sm text-primary-text" htmlFor="ar-name">
                  Name
                </label>
                <Input id="ar-name" autoComplete="name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-primary-text" htmlFor="ar-email">
                  Work email
                </label>
                <Input
                  id="ar-email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={200}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-primary-text" htmlFor="ar-company">
                  Company
                </label>
                <Input
                  id="ar-company"
                  autoComplete="organization"
                  required
                  maxLength={160}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm text-primary-text">Requested content</legend>
                <div className="flex flex-wrap gap-4">
                  {CONTENT_OPTIONS.map((option) => (
                    <label key={option.value} className="inline-flex items-center gap-2 text-sm text-primary-text">
                      <input
                        type="radio"
                        name="requested-content"
                        value={option.value}
                        checked={requestedContent === option.value}
                        onChange={() => setRequestedContent(option.value)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-2">
                <label className="block text-sm text-primary-text" htmlFor="ar-reason">
                  Reason for requesting access <span className="text-muted-text">(optional)</span>
                </label>
                <textarea
                  id="ar-reason"
                  maxLength={1000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-24 w-full rounded-md border border-input bg-card px-3 py-2 text-base text-foreground placeholder:text-muted-text"
                />
              </div>

              {/* Honeypot: hidden from real users and assistive tech. */}
              <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
                <label htmlFor="ar-website">Website</label>
                <input id="ar-website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>

              <Button variant="primary" size="lg" type="submit" disabled={submitting}>
                {submitting ? "Sending..." : "Request access"}
              </Button>

              <div className="min-h-6" role="status" aria-live="polite">
                {status === "error" ? (
                  <p className="body-md status-danger-text">
                    {errorDetail || "Your request couldn't be sent."} You can also email me directly at{" "}
                    <a className="underline" href="mailto:delalama.miguel@gmail.com">
                      delalama.miguel@gmail.com
                    </a>
                    .
                  </p>
                ) : null}
              </div>
            </form>
          )}

          <p className="mt-6 text-sm text-muted-text">
            Already have a password? <Link to="/login" className="link-accent">Sign in</Link>
          </p>
        </Card>
      </div>
    </Section>
  );
}
