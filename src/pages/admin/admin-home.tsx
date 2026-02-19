import { Link } from "react-router-dom";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";

const cards = [
  { to: "/admin/pages", title: "Pages", detail: "Edit home, resume, and contact JSON content." },
  { to: "/admin/philosophy", title: "Philosophy", detail: "Create and edit published/draft philosophy essays." },
  { to: "/admin/case-studies", title: "Case Studies", detail: "Manage private case studies with structure validation." },
  { to: "/admin/deep-dive", title: "Deep Dive", detail: "Manage deep-dive markdown content with same schema." },
];

export function AdminHomePage() {
  return (
    <Section density="dense">
      <div className="max-w-5xl space-y-6">
        <h1 className="h1">Admin CMS</h1>
        <p className="body-md">Owner-only content management. All writes commit directly to GitHub.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <Card key={card.to} variant="case-study" padding="md">
              <h2 className="h3">{card.title}</h2>
              <p className="mt-2 body-md">{card.detail}</p>
              <Link className="mt-4 inline-block font-mono text-sm text-systems-teal hover:underline" to={card.to}>
                Open
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </Section>
  );
}
