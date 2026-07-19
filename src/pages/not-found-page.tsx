import { Link } from "react-router-dom";
import { Section } from "@/components/layout/section";
import { useDocumentTitle } from "@/lib/use-document-title";

export function NotFoundPage() {
  useDocumentTitle("Page not found");

  return (
    <Section>
      <div className="max-w-2xl space-y-4">
        <h1 className="h1">This page doesn't exist.</h1>
        <p className="body-lg">The link may be outdated or mistyped.</p>
        <Link to="/" className="link-accent">
          Return to homepage
        </Link>
      </div>
    </Section>
  );
}
