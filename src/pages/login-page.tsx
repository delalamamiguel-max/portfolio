import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const next = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const value = params.get("next") || "/case-studies";
    return value.startsWith("/") ? value : "/case-studies";
  }, [location.search]);

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
          <h1 className="h2">Access case studies</h1>
          <p className="mt-3 body-md">Shared privately.</p>

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
              <p role="alert" className="text-sm text-impact-green">
                {error}
              </p>
            ) : null}
            <Button variant="primary" size="lg" type="submit" disabled={submitting}>
              {submitting ? "Checking..." : "Continue"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-text">
            Back to <Link to="/" className="text-strategic-blue hover:underline">homepage</Link>
          </p>
        </Card>
      </div>
    </Section>
  );
}
