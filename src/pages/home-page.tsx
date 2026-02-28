import { useNavigate } from "react-router-dom";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricBlock } from "@/components/ui/metric-block";
import { verifySession } from "@/lib/auth";
import { getHomeContent } from "@/lib/content-loader";

export function HomePage() {
  const navigate = useNavigate();
  const content = getHomeContent();

  const openCaseStudies = async () => {
    const authenticated = await verifySession();
    const target = content.primaryCTA.href || "/case-studies";
    navigate(authenticated ? target : `/login?next=${encodeURIComponent(target)}`);
  };

  return (
    <div>
      <Section>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="max-w-3xl space-y-6">
            <p className="mono-label">Strategy x Systems x Scaled Execution</p>
            <h1 className="h1 text-balance">{content.heroHeadline}</h1>
            <p className="body-lg max-w-2xl">{content.heroSubheadline}</p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button variant="primary" size="lg" onClick={openCaseStudies}>
                {content.primaryCTA.label}
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate(content.secondaryCTA.href)}>
                {content.secondaryCTA.label}
              </Button>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[320px] lg:mx-0">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-card/90 shadow-sm transition-colors duration-300">
              {content.profileImage?.src ? (
                <img
                  src={content.profileImage.src}
                  alt={content.profileImage.alt || "Homepage profile image"}
                  className="h-full w-full object-cover"
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

      <Section ariaLabel="Impact metrics">
        <div className="grid gap-4 md:grid-cols-3">
          {content.proofMetrics.map((metric) => (
            <MetricBlock key={metric.label} value={metric.value} label={metric.label} context={metric.context} />
          ))}
        </div>
      </Section>

      <Section ariaLabel="Strategic pillars">
        <div className="mb-8 max-w-2xl space-y-3">
          <h2 className="h2">{content.strategicPillarsHeading}</h2>
          <p className="body-md">{content.strategicPillarsSubtext}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {content.strategicPillars.map((pillar) => (
            <Card key={pillar.title} variant="case-study" padding="md">
              <CardHeader className="space-y-3">
                <CardTitle>{pillar.title}</CardTitle>
                <ul className="space-y-2">
                  {pillar.bullets.map((bullet) => (
                    <li key={bullet} className="body-md flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
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
