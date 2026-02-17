import { Link } from "react-router-dom";
import { Section } from "@/components/layout/section";

export function NotFoundPage() {
  return (
    <Section>
      <div className="max-w-2xl space-y-4">
        <h1 className="h1">This page doesn't exist yet.</h1>
        <p className="body-lg">The route may still be in progress.</p>
        <Link to="/" className="text-strategic-blue hover:underline">
          Return to homepage
        </Link>
      </div>
    </Section>
  );
}
