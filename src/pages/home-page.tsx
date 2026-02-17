import { useNavigate } from "react-router-dom";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricBlock } from "@/components/ui/metric-block";
import { verifySession } from "@/lib/auth";

const metrics = [
  { value: "+8%", label: "CTR lift", context: "Delivered through ML modernization and model-serving improvements." },
  { value: "+12%", label: "Engagement", context: "Gained by scaling experimentation systems across product surfaces." },
  { value: "$8M+", label: "OPEX reduced", context: "Achieved with platform strategy and architecture simplification." },
];

const pillars = [
  {
    title: "Strategy",
    bullets: [
      "Vision framing tied to measurable outcomes",
      "TAM and sequencing for portfolio choices",
      "Roadmap clarity under governance constraints",
    ],
  },
  {
    title: "Architecture",
    bullets: [
      "Platform-first operating model design",
      "Governance-aware data and ML lifecycle decisions",
      "System trade-offs made explicit early",
    ],
  },
  {
    title: "Execution",
    bullets: [
      "Cross-functional delivery cadence at scale",
      "Experimentation loops connected to business metrics",
      "Operational discipline from concept to launch",
    ],
  },
  {
    title: "Leadership",
    bullets: [
      "Alignment across product, engineering, data, and compliance",
      "Executive communication without technical dilution",
      "Teams organized around durable system outcomes",
    ],
  },
];

export function HomePage() {
  const navigate = useNavigate();

  const openCaseStudies = async () => {
    const authenticated = await verifySession();
    navigate(authenticated ? "/case-studies" : "/login?next=%2Fcase-studies");
  };

  return (
    <div>
      <Section>
        <div className="max-w-3xl space-y-6">
          <p className="mono-label">Strategy x Systems x Scaled Execution</p>
          <h1 className="h1 text-balance">
            Senior Product Leader - Strategy, Data Platforms &amp; ML Systems
          </h1>
          <p className="body-lg max-w-2xl">
            I concept, architect, and scale intelligent systems that drive measurable business outcomes.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="primary" size="lg" onClick={openCaseStudies}>
              Explore Case Studies
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate("/resume")}>
              Download Resume
            </Button>
          </div>
        </div>
      </Section>

      <Section ariaLabel="Impact metrics">
        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <MetricBlock key={metric.label} value={metric.value} label={metric.label} context={metric.context} />
          ))}
        </div>
      </Section>

      <Section ariaLabel="Strategic pillars">
        <div className="mb-8 max-w-2xl space-y-3">
          <h2 className="h2">Strategic Pillars</h2>
          <p className="body-md">Executive calm on the surface, systems depth in the operating model.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {pillars.map((pillar) => (
            <Card key={pillar.title} variant="case-study" padding="md">
              <CardHeader className="space-y-3">
                <CardTitle>{pillar.title}</CardTitle>
                <ul className="space-y-2">
                  {pillar.bullets.map((bullet) => (
                    <li key={bullet} className="body-md flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-systems-teal" aria-hidden="true" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </CardHeader>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
