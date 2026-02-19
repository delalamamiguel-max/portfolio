import { useState } from "react";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TagPill } from "@/components/ui/tag-pill";
import { cmsWriteFile } from "@/lib/cms-client";
import { getContactContent, getHomeContent, getResumeContent } from "@/lib/content-loader";
import { validateContactContent, validateHomeContent, validateResumeContent } from "@/lib/content-schema";

export function AdminPagesPage() {
  const [home, setHome] = useState(getHomeContent());
  const [resume, setResume] = useState(getResumeContent());
  const [contact, setContact] = useState(getContactContent());
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const saveAll = async () => {
    try {
      setStatus("");
      setSaving(true);

      const validatedHome = validateHomeContent(home);
      const validatedResume = validateResumeContent(resume);
      const validatedContact = validateContactContent(contact);

      await cmsWriteFile("content/pages/home.json", `${JSON.stringify(validatedHome, null, 2)}\n`, "cms: update home page content");
      await cmsWriteFile("content/pages/resume.json", `${JSON.stringify(validatedResume, null, 2)}\n`, "cms: update resume content");
      await cmsWriteFile("content/pages/contact.json", `${JSON.stringify(validatedContact, null, 2)}\n`, "cms: update contact content");

      setStatus("Saved all page JSON files to GitHub.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed";
      setStatus(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section density="dense">
      <div className="space-y-6">
        <h1 className="h1">Admin / Pages</h1>
        <p className="body-md">Structured JSON editor for homepage, resume, and contact.</p>

        <Card variant="case-study" padding="md">
          <h2 className="h3">Homepage</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input value={home.heroHeadline} onChange={(e) => setHome((prev) => ({ ...prev, heroHeadline: e.target.value }))} placeholder="Hero headline" />
            <Input value={home.heroSubheadline} onChange={(e) => setHome((prev) => ({ ...prev, heroSubheadline: e.target.value }))} placeholder="Hero subheadline" />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {home.proofMetrics.map((metric, i) => (
              <div key={`${metric.label}-${i}`} className="rounded-md border border-slate-700 p-3">
                <p className="mono-label">Metric block helper</p>
                <Input className="mt-2" value={metric.value} onChange={(e) => setHome((prev) => {
                  const next = [...prev.proofMetrics];
                  next[i] = { ...next[i], value: e.target.value };
                  return { ...prev, proofMetrics: next };
                })} placeholder="Value" />
                <Input className="mt-2" value={metric.label} onChange={(e) => setHome((prev) => {
                  const next = [...prev.proofMetrics];
                  next[i] = { ...next[i], label: e.target.value };
                  return { ...prev, proofMetrics: next };
                })} placeholder="Label" />
                <Input className="mt-2" value={metric.context} onChange={(e) => setHome((prev) => {
                  const next = [...prev.proofMetrics];
                  next[i] = { ...next[i], context: e.target.value };
                  return { ...prev, proofMetrics: next };
                })} placeholder="Context" />
              </div>
            ))}
          </div>
        </Card>

        <Card variant="case-study" padding="md">
          <h2 className="h3">Resume</h2>
          <Input
            className="mt-4"
            value={resume.downloadablePdfUrl}
            onChange={(e) => setResume((prev) => ({ ...prev, downloadablePdfUrl: e.target.value }))}
            placeholder="Download PDF URL"
          />
          <div className="mt-4 space-y-4">
            {resume.sections.map((section, i) => (
              <div key={`${section.role}-${i}`} className="rounded-md border border-slate-700 p-3">
                <Input value={section.role} onChange={(e) => setResume((prev) => {
                  const next = [...prev.sections];
                  next[i] = { ...next[i], role: e.target.value };
                  return { ...prev, sections: next };
                })} placeholder="Role" />
                <Input className="mt-2" value={section.company} onChange={(e) => setResume((prev) => {
                  const next = [...prev.sections];
                  next[i] = { ...next[i], company: e.target.value };
                  return { ...prev, sections: next };
                })} placeholder="Company" />
                <Input className="mt-2" value={section.timeline} onChange={(e) => setResume((prev) => {
                  const next = [...prev.sections];
                  next[i] = { ...next[i], timeline: e.target.value };
                  return { ...prev, sections: next };
                })} placeholder="Timeline" />
                <p className="mt-3 text-sm text-muted-text">Tag pill helper:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {section.tags.map((tag) => <TagPill key={`${section.role}-${tag}`}>{tag}</TagPill>)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="case-study" padding="md">
          <h2 className="h3">Contact</h2>
          <Input className="mt-4" value={contact.headline} onChange={(e) => setContact((prev) => ({ ...prev, headline: e.target.value }))} placeholder="Headline" />
          <Input className="mt-2" value={contact.subtext} onChange={(e) => setContact((prev) => ({ ...prev, subtext: e.target.value }))} placeholder="Subtext" />
          <p className="mt-3 text-sm text-muted-text">Architecture label helper:</p>
          <p className="mono-label">SYSTEM-CONTACT-METHODS</p>
        </Card>

        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={saveAll} disabled={saving}>{saving ? "Saving..." : "Save JSON pages"}</Button>
          {status ? <p className="body-md text-muted-text">{status}</p> : null}
        </div>
      </div>
    </Section>
  );
}
