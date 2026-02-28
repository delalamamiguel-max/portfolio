import type { ChangeEvent } from "react";
import { useState } from "react";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TagPill } from "@/components/ui/tag-pill";
import { cmsUploadImage, cmsWriteFile } from "@/lib/cms-client";
import { getContactContent, getHomeContent, getResumeContent } from "@/lib/content-loader";
import { validateContactContent, validateHomeContent, validateResumeContent } from "@/lib/content-schema";

async function squareCropAndOptimizeImage(file: File): Promise<{ mimeType: string; fileName: string; dataBase64: string }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Profile image must be an image file.");
  }

  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = Math.floor((bitmap.width - side) / 2);
  const sy = Math.floor((bitmap.height - side) / 2);

  const targetSide = Math.min(1200, side);
  const canvas = document.createElement("canvas");
  canvas.width = targetSide;
  canvas.height = targetSide;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Image processing is unavailable in this browser.");
  }

  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, targetSide, targetSide);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.88));
  if (!blob) {
    throw new Error("Failed to optimize profile image.");
  }

  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }

  return {
    mimeType: "image/webp",
    fileName: `${file.name.replace(/\.[a-z0-9]+$/i, "")}.webp`,
    dataBase64: btoa(binary),
  };
}

export function AdminPagesPage() {
  const [home, setHome] = useState(getHomeContent());
  const [resume, setResume] = useState(getResumeContent());
  const [contact, setContact] = useState(getContactContent());
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingHomeImage, setUploadingHomeImage] = useState(false);

  const uploadHomeProfileImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setStatus("");
      setUploadingHomeImage(true);
      const processed = await squareCropAndOptimizeImage(file);
      const upload = await cmsUploadImage({
        fileName: processed.fileName,
        mimeType: processed.mimeType,
        dataBase64: processed.dataBase64,
        folder: "home/profile",
      });

      setHome((prev) => ({
        ...prev,
        profileImage: {
          src: upload.publicUrl,
          alt: prev.profileImage?.alt || "Homepage profile image",
        },
      }));
      setStatus("Homepage profile image uploaded. Click “Save JSON pages” to persist home.json.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Profile image upload failed";
      setStatus(message);
    } finally {
      setUploadingHomeImage(false);
    }
  };

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
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Input
              value={home.strategicPillarsHeading}
              onChange={(e) => setHome((prev) => ({ ...prev, strategicPillarsHeading: e.target.value }))}
              placeholder="Strategic pillars heading"
            />
            <Input
              value={home.strategicPillarsSubtext}
              onChange={(e) => setHome((prev) => ({ ...prev, strategicPillarsSubtext: e.target.value }))}
              placeholder="Strategic pillars subtext"
            />
          </div>
          <div className="mt-4 rounded-md border border-border bg-card/80 p-4 shadow-sm">
            <p className="text-sm text-muted-text">Homepage profile image (square, responsive, repo-backed)</p>
            <div className="mt-3 grid gap-4 md:grid-cols-[200px_1fr]">
              <div className="aspect-square overflow-hidden rounded-lg border border-border bg-background/50">
                {home.profileImage?.src ? (
                  <img src={home.profileImage.src} alt={home.profileImage.alt || "Homepage profile preview"} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-text">No image</div>
                )}
              </div>
              <div className="space-y-3">
                <Input
                  value={home.profileImage?.alt || ""}
                  onChange={(e) => setHome((prev) => ({ ...prev, profileImage: { ...(prev.profileImage ?? { src: "" }), alt: e.target.value } }))}
                  placeholder="Profile image alt text (required)"
                />
                <Input
                  value={home.profileImage?.src || ""}
                  onChange={(e) => setHome((prev) => ({ ...prev, profileImage: { ...(prev.profileImage ?? { alt: "" }), src: e.target.value } }))}
                  placeholder="/images/cms/home/profile/..."
                />
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={uploadHomeProfileImage}
                    disabled={saving || uploadingHomeImage}
                    className="block text-xs text-muted-text file:mr-3 file:rounded-md file:border-0 file:bg-strategic-blue file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                  />
                  <p className="text-xs text-muted-text">Auto-crops to square and optimizes to WebP before upload.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {home.proofMetrics.map((metric, i) => (
              <div key={`${metric.label}-${i}`} className="rounded-md border border-border bg-background/50 p-3">
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
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-text">Strategic pillars</p>
            <div className="grid gap-3 md:grid-cols-2">
              {home.strategicPillars.map((pillar, i) => (
                <div key={`${pillar.title}-${i}`} className="rounded-md border border-border bg-background/50 p-3">
                  <p className="mono-label">Pillar helper</p>
                  <Input
                    className="mt-2"
                    value={pillar.title}
                    onChange={(e) =>
                      setHome((prev) => {
                        const next = [...prev.strategicPillars];
                        next[i] = { ...next[i], title: e.target.value };
                        return { ...prev, strategicPillars: next };
                      })
                    }
                    placeholder="Pillar title"
                  />
                  <div className="mt-2 space-y-2">
                    {pillar.bullets.map((bullet, bulletIndex) => (
                      <Input
                        key={`${pillar.title}-${bulletIndex}`}
                        value={bullet}
                        onChange={(e) =>
                          setHome((prev) => {
                            const next = [...prev.strategicPillars];
                            const nextBullets = [...next[i].bullets];
                            nextBullets[bulletIndex] = e.target.value;
                            next[i] = { ...next[i], bullets: nextBullets };
                            return { ...prev, strategicPillars: next };
                          })
                        }
                        placeholder={`Bullet ${bulletIndex + 1}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
              <div key={`${section.role}-${i}`} className="rounded-md border border-border bg-background/50 p-3">
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
          <Button variant="primary" onClick={saveAll} disabled={saving || uploadingHomeImage}>{saving ? "Saving..." : "Save JSON pages"}</Button>
          {status ? <p className="body-md text-muted-text">{status}</p> : null}
        </div>
      </div>
    </Section>
  );
}
