import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmailLink } from "@/components/ui/email-link";
import { Input } from "@/components/ui/input";
import { useDocumentTitle } from "@/lib/use-document-title";

export function LoginPage() {
  useDocumentTitle("Sign in");
  const location = useLocation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const next = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const value = params.get("next") || "/admin";
    return value.startsWith("/") ? value : "/admin";
  }, [location.search]);

  const context = useMemo(() => {
    if (next.startsWith("/case-studies") || next.startsWith("/deep-dive")) {
      return { headline: "Access case studies", detail: "Case studies are shared privately with recruiters and hiring managers." };
    }
    if (next.startsWith("/resume") || next.startsWith("/files/cms/resume")) {
      return { headline: "Access resume", detail: "The resume is shared privately with recruiters and hiring managers." };
    }
    if (next.startsWith("/admin") || next === "/style-guide") {
      return { headline: "Owner sign-in", detail: "This area is for site administration." };
    }
    return { headline: "Private content", detail: "This page is shared privately." };
  }, [next]);

  const isOwnerArea = next.startsWith("/admin") || next === "/style-guide";

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError("Incorrect password. Try again.");
        return;
      }

      navigate(next);
    } catch {
      setError("Incorrect password. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section>
      <div className="mx-auto max-w-xl">
        <Card variant="case-study" padding="lg">
          <h1 className="h2">{context.headline}</h1>
          <p className="mt-3 body-md">{context.detail}</p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <label className="block text-sm text-primary-text" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {error ? (
              <p role="alert" className="text-sm status-danger-text">
                {error}
              </p>
            ) : null}
            <Button variant="primary" size="lg" type="submit" disabled={submitting}>
              {submitting ? "Checking..." : "Continue"}
            </Button>
          </form>

          {!isOwnerArea ? (
            <p className="mt-6 text-sm text-muted-text">
              Don't have the password? Request access by emailing{" "}
              <EmailLink subject="Portfolio access request" />. Access is reviewed personally and is not granted
              automatically.
            </p>
          ) : null}

          <p className="mt-3 text-sm text-muted-text">
            Back to <Link to="/" className="link-accent">homepage</Link>
          </p>
        </Card>
      </div>
    </Section>
  );
}
