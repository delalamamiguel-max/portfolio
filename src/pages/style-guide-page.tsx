import { Section } from "@/components/layout/section";
import { StickySideNav } from "@/components/layout/sticky-side-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricBlock } from "@/components/ui/metric-block";
import { TagPill } from "@/components/ui/tag-pill";

const navItems = [
  { id: "typography", label: "Typography" },
  { id: "colors", label: "Color Tokens" },
  { id: "spacing", label: "Spacing" },
  { id: "components", label: "Components" },
];

export function StyleGuidePage() {
  return (
    <Section density="dense">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <StickySideNav title="Style Guide" items={navItems} />

        <div className="space-y-8">
          <h1 className="h1">Internal Style Guide</h1>

          <article id="typography" className="card-case-study">
            <h2 className="h2">Typography</h2>
            <div className="mt-6 space-y-4">
              <p className="h1">H1 Strategic Authority</p>
              <p className="h2">H2 Structural Sections</p>
              <p className="h3">H3 Analytical Subsections</p>
              <p className="h4">H4 Detail Labels</p>
              <p className="body-lg">Body text remains readable with line-height above 1.6.</p>
              <TagPill>mono-accent</TagPill>
            </div>
          </article>

          <article id="colors" className="card-case-study">
            <h2 className="h2">Color Tokens</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {["bg-exec-navy", "bg-strategic-blue", "bg-systems-teal", "bg-impact-green", "bg-primary-text", "bg-muted-text"].map((bg) => (
                <div key={bg} className="space-y-2">
                  <div className={`${bg} h-14 rounded-md border border-slate-700`} />
                  <p className="mono-label">{bg}</p>
                </div>
              ))}
            </div>
          </article>

          <article id="spacing" className="card-case-study">
            <h2 className="h2">Spacing System</h2>
            <p className="mt-4 body-md">8pt base grid, with section rhythm at 48 / 64 / 96 and card padding at 24 / 32.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Mobile</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="body-md">Section padding: 48px</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Tablet</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="body-md">Section padding: 64px</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Desktop</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="body-md">Section padding: 96px</p>
                </CardContent>
              </Card>
            </div>
          </article>

          <article id="components" className="card-case-study">
            <h2 className="h2">Core Components</h2>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="subtle">Subtle</Button>
              <TagPill>governance</TagPill>
              <TagPill>ml-systems</TagPill>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <MetricBlock value="+8%" label="CTR lift" context="Metric card variant for quantified impact." />
              <Card variant="case-study" padding="lg">
                <CardHeader>
                  <CardTitle>Case Study Card</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="body-md">Template card variant for structured narrative sections.</p>
                </CardContent>
              </Card>
            </div>
          </article>
        </div>
      </div>
    </Section>
  );
}
