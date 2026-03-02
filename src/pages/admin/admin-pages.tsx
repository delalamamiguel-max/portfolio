import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TagPill } from "@/components/ui/tag-pill";
import { cmsUploadFile, cmsUploadImage, cmsWriteFile } from "@/lib/cms-client";
import { getContactContent, getHomeContent, getHomepageStructure, getResumeContent } from "@/lib/content-loader";
import type { HomeContent } from "@/lib/content-schema";
import { validateContactContent, validateHomeContent, validateHomepageStructure, validateResumeContent } from "@/lib/content-schema";

const SECTION_ID_PATTERN = /^[a-z][a-z0-9-]*$/;

function CmsLabel({ text }: { text: string }) {
  return <p className="mono-label opacity-70">{`CMS LABEL: ${text}`}</p>;
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

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
  if (!ctx) throw new Error("Image processing is unavailable in this browser.");

  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, targetSide, targetSide);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.88));
  if (!blob) throw new Error("Failed to optimize profile image.");

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

async function encodeFileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }
  return btoa(binary);
}

export function AdminPagesPage() {
  const [home, setHome] = useState<HomeContent>(getHomeContent());
  const [structure, setStructure] = useState(getHomepageStructure());
  const [resume, setResume] = useState(getResumeContent());
  const [contact, setContact] = useState(getContactContent());
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingHomeImage, setUploadingHomeImage] = useState(false);
  const [uploadingResumePdf, setUploadingResumePdf] = useState(false);
  const [draggingStructureIndex, setDraggingStructureIndex] = useState<number | null>(null);
  const [draggingImpactIndex, setDraggingImpactIndex] = useState<number | null>(null);
  const [draggingPillarIndex, setDraggingPillarIndex] = useState<number | null>(null);
  const [draggingCustomSectionIndex, setDraggingCustomSectionIndex] = useState<number | null>(null);

  const duplicateIds = useMemo(() => {
    const ids = structure.map((entry) => entry.id.trim());
    return ids.filter((id, index) => id && ids.indexOf(id) !== index);
  }, [structure]);

  const invalidIds = useMemo(
    () => structure.some((entry) => !SECTION_ID_PATTERN.test(entry.id.trim())),
    [structure],
  );

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
      setStatus("Homepage profile image uploaded. Click “Save Homepage Structure” to persist.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Profile image upload failed";
      setStatus(message);
    } finally {
      setUploadingHomeImage(false);
    }
  };

  const uploadResumePdf = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setStatus("Resume upload failed: only PDF files are allowed.");
      return;
    }

    try {
      setStatus("");
      setUploadingResumePdf(true);
      const dataBase64 = await encodeFileToBase64(file);
      const upload = await cmsUploadFile({
        fileName: file.name,
        mimeType: "application/pdf",
        dataBase64,
        folder: "resume",
      });

      setResume((prev) => ({ ...prev, downloadablePdfUrl: upload.publicUrl }));
      setStatus("Resume PDF uploaded. Click “Save Homepage Structure” to persist.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Resume upload failed";
      setStatus(message);
    } finally {
      setUploadingResumePdf(false);
    }
  };

  const saveAll = async () => {
    try {
      setStatus("");
      setSaving(true);

      const validatedStructure = validateHomepageStructure(structure.map((entry) => ({
        ...entry,
        id: entry.id.trim(),
        navLabel: entry.navLabel.trim(),
      })));
      const validatedHome = validateHomeContent(home);
      const validatedResume = validateResumeContent(resume);
      const validatedContact = validateContactContent(contact);

      await cmsWriteFile("content/pages/home-structure.json", `${JSON.stringify(validatedStructure, null, 2)}\n`, "cms: update homepage section structure");
      await cmsWriteFile("content/pages/home.json", `${JSON.stringify(validatedHome, null, 2)}\n`, "cms: update home page content");
      await cmsWriteFile("content/pages/resume.json", `${JSON.stringify(validatedResume, null, 2)}\n`, "cms: update resume content");
      await cmsWriteFile("content/pages/contact.json", `${JSON.stringify(validatedContact, null, 2)}\n`, "cms: update contact content");

      setStatus("Saved homepage structure and content JSON files to GitHub.");
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
        <p className="body-md">Single-page website editor with modular, reorderable content blocks.</p>

        <Card variant="case-study" padding="md">
          <CmsLabel text="Homepage Structure" />
          <h2 className="h3 mt-2">Homepage Structure</h2>
          <p className="mt-2 body-md">Drag blocks to reorder. Section IDs must be unique and URL-safe (`lowercase-with-hyphens`).</p>

          <div className="mt-4 space-y-2">
            {structure.map((block, index) => (
              <div
                key={`${block.type}-${index}`}
                draggable
                onDragStart={() => setDraggingStructureIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggingStructureIndex === null) return;
                  setStructure((prev) => moveItem(prev, draggingStructureIndex, index));
                  setDraggingStructureIndex(null);
                }}
                className="grid gap-2 rounded-md border border-border bg-background/50 p-3 md:grid-cols-[140px_1fr_1fr_auto_auto]"
              >
                <p className="mono-label self-center">{block.type}</p>
                <Input
                  value={block.id}
                  onChange={(event) => setStructure((prev) => {
                    const next = [...prev];
                    next[index] = { ...next[index], id: event.target.value };
                    return next;
                  })}
                  placeholder="section-id"
                />
                <Input
                  value={block.navLabel}
                  onChange={(event) => setStructure((prev) => {
                    const next = [...prev];
                    next[index] = { ...next[index], navLabel: event.target.value };
                    return next;
                  })}
                  placeholder="Nav label"
                />
                <label className="flex items-center gap-2 text-sm text-primary-text">
                  <input
                    type="checkbox"
                    checked={block.enabled}
                    onChange={(event) => setStructure((prev) => {
                      const next = [...prev];
                      next[index] = { ...next[index], enabled: event.target.checked };
                      return next;
                    })}
                  />
                  Enabled
                </label>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => setStructure((prev) => moveItem(prev, index, index - 1))} disabled={index === 0}>↑</Button>
                  <Button variant="ghost" onClick={() => setStructure((prev) => moveItem(prev, index, index + 1))} disabled={index === structure.length - 1}>↓</Button>
                </div>
              </div>
            ))}
          </div>

          {duplicateIds.length > 0 ? (
            <p className="mt-3 text-sm status-danger-text">Duplicate section IDs detected: {Array.from(new Set(duplicateIds)).join(", ")}</p>
          ) : null}
          {invalidIds ? (
            <p className="mt-2 text-sm status-danger-text">Section IDs must match: lowercase letters, numbers, and hyphens only.</p>
          ) : null}

          <div className="mt-6 border-t border-border pt-6">
            <CmsLabel text="Homepage – Hero" />
            <h3 className="h4 mt-2">Hero</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <Input value={home.heroEyebrow} onChange={(e) => setHome((prev) => ({ ...prev, heroEyebrow: e.target.value }))} placeholder="Hero eyebrow" />
              <Input value={home.heroHeadline} onChange={(e) => setHome((prev) => ({ ...prev, heroHeadline: e.target.value }))} placeholder="Hero headline" />
              <Input value={home.heroSubheadline} onChange={(e) => setHome((prev) => ({ ...prev, heroSubheadline: e.target.value }))} placeholder="Hero subheadline" />
            </div>
          </div>

          <div className="mt-4 rounded-md border border-border bg-card/80 p-4 shadow-sm">
            <CmsLabel text="Homepage – Profile Image" />
            <p className="mt-2 text-sm text-muted-text">Homepage profile image (square, responsive, repo-backed)</p>
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

          <div className="mt-6 border-t border-border pt-6">
            <CmsLabel text="Selected Impact (Repeatable)" />
            <h3 className="h4 mt-2">Selected Impact (Repeatable)</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Input
                value={home.selectedImpactHeading}
                onChange={(e) => setHome((prev) => ({ ...prev, selectedImpactHeading: e.target.value }))}
                placeholder="Section heading"
              />
              <Input
                value={home.selectedImpactSubtext}
                onChange={(e) => setHome((prev) => ({ ...prev, selectedImpactSubtext: e.target.value }))}
                placeholder="Section subtext"
              />
            </div>
            <div className="mt-3 space-y-3">
              {home.proofMetrics.map((metric, index) => (
                <div
                  key={`${metric.metric}-${index}`}
                  draggable
                  onDragStart={() => setDraggingImpactIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggingImpactIndex === null) return;
                    setHome((prev) => ({ ...prev, proofMetrics: moveItem(prev.proofMetrics, draggingImpactIndex, index) }));
                    setDraggingImpactIndex(null);
                  }}
                  className="rounded-md border border-border bg-background/50 p-3"
                >
                  <CmsLabel text={`Selected Impact – Item ${index + 1}`} />
                  <div className="mt-2 grid gap-2 md:grid-cols-3">
                    <Input
                      value={metric.metric}
                      onChange={(e) => setHome((prev) => {
                        const next = [...prev.proofMetrics];
                        next[index] = { ...next[index], metric: e.target.value };
                        return { ...prev, proofMetrics: next };
                      })}
                      placeholder="Metric"
                    />
                    <Input
                      value={metric.descriptor}
                      onChange={(e) => setHome((prev) => {
                        const next = [...prev.proofMetrics];
                        next[index] = { ...next[index], descriptor: e.target.value };
                        return { ...prev, proofMetrics: next };
                      })}
                      placeholder="Short descriptor"
                    />
                    <Input
                      value={metric.description || ""}
                      onChange={(e) => setHome((prev) => {
                        const next = [...prev.proofMetrics];
                        next[index] = { ...next[index], description: e.target.value };
                        return { ...prev, proofMetrics: next };
                      })}
                      placeholder="Optional expanded description"
                    />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button variant="ghost" onClick={() => setHome((prev) => ({ ...prev, proofMetrics: moveItem(prev.proofMetrics, index, index - 1) }))} disabled={index === 0}>↑</Button>
                    <Button variant="ghost" onClick={() => setHome((prev) => ({ ...prev, proofMetrics: moveItem(prev.proofMetrics, index, index + 1) }))} disabled={index === home.proofMetrics.length - 1}>↓</Button>
                    <Button
                      variant="ghost"
                      onClick={() => setHome((prev) => ({ ...prev, proofMetrics: prev.proofMetrics.filter((_, i) => i !== index) }))}
                      disabled={home.proofMetrics.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => setHome((prev) => ({
                ...prev,
                proofMetrics: [...prev.proofMetrics, { metric: "", descriptor: "", description: "" }],
              }))}
            >
              Add Impact
            </Button>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <CmsLabel text="Strategic Pillars (Repeatable)" />
            <h3 className="h4 mt-2">Strategic Pillars (Repeatable)</h3>
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
            <div className="mt-3 space-y-3">
              {home.strategicPillars.map((pillar, pillarIndex) => (
                <div
                  key={`${pillar.headline}-${pillarIndex}`}
                  draggable
                  onDragStart={() => setDraggingPillarIndex(pillarIndex)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggingPillarIndex === null) return;
                    setHome((prev) => ({ ...prev, strategicPillars: moveItem(prev.strategicPillars, draggingPillarIndex, pillarIndex) }));
                    setDraggingPillarIndex(null);
                  }}
                  className="rounded-md border border-border bg-background/50 p-3"
                >
                  <CmsLabel text={`Strategic Pillars – Item ${pillarIndex + 1}`} />
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <Input
                      value={pillar.headline}
                      onChange={(e) => setHome((prev) => {
                        const next = [...prev.strategicPillars];
                        next[pillarIndex] = { ...next[pillarIndex], headline: e.target.value };
                        return { ...prev, strategicPillars: next };
                      })}
                      placeholder="Headline (required)"
                    />
                    <Input
                      value={pillar.subheadline}
                      onChange={(e) => setHome((prev) => {
                        const next = [...prev.strategicPillars];
                        next[pillarIndex] = { ...next[pillarIndex], subheadline: e.target.value };
                        return { ...prev, strategicPillars: next };
                      })}
                      placeholder="Sub-headline (required)"
                    />
                  </div>
                  <div className="mt-2 space-y-2">
                    {pillar.bullets.map((bullet, bulletIndex) => (
                      <div key={`${pillar.headline}-${bulletIndex}`} className="flex gap-2">
                        <Input
                          value={bullet}
                          onChange={(e) => setHome((prev) => {
                            const next = [...prev.strategicPillars];
                            const bullets = [...next[pillarIndex].bullets];
                            bullets[bulletIndex] = e.target.value;
                            next[pillarIndex] = { ...next[pillarIndex], bullets };
                            return { ...prev, strategicPillars: next };
                          })}
                          placeholder={`Bullet ${bulletIndex + 1}`}
                        />
                        <Button
                          variant="ghost"
                          onClick={() => setHome((prev) => {
                            const next = [...prev.strategicPillars];
                            const bullets = next[pillarIndex].bullets.filter((_, i) => i !== bulletIndex);
                            next[pillarIndex] = { ...next[pillarIndex], bullets: bullets.length ? bullets : [""] };
                            return { ...prev, strategicPillars: next };
                          })}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      onClick={() => setHome((prev) => {
                        const next = [...prev.strategicPillars];
                        next[pillarIndex] = { ...next[pillarIndex], bullets: [...next[pillarIndex].bullets, ""] };
                        return { ...prev, strategicPillars: next };
                      })}
                    >
                      Add Bullet
                    </Button>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button variant="ghost" onClick={() => setHome((prev) => ({ ...prev, strategicPillars: moveItem(prev.strategicPillars, pillarIndex, pillarIndex - 1) }))} disabled={pillarIndex === 0}>↑</Button>
                    <Button variant="ghost" onClick={() => setHome((prev) => ({ ...prev, strategicPillars: moveItem(prev.strategicPillars, pillarIndex, pillarIndex + 1) }))} disabled={pillarIndex === home.strategicPillars.length - 1}>↓</Button>
                    <Button
                      variant="ghost"
                      onClick={() => setHome((prev) => ({ ...prev, strategicPillars: prev.strategicPillars.filter((_, i) => i !== pillarIndex) }))}
                      disabled={home.strategicPillars.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => setHome((prev) => ({
                ...prev,
                strategicPillars: [...prev.strategicPillars, { headline: "", subheadline: "", bullets: [""] }],
              }))}
            >
              Add Pillar
            </Button>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <CmsLabel text="Custom Content Sections (Flexible Blocks)" />
            <h3 className="h4 mt-2">Custom Content Sections (Flexible Blocks)</h3>
            <div className="mt-3 space-y-3">
              {home.customSections.map((customSection, sectionIndex) => (
                <div
                  key={`${customSection.cmsLabel}-${sectionIndex}`}
                  draggable
                  onDragStart={() => setDraggingCustomSectionIndex(sectionIndex)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggingCustomSectionIndex === null) return;
                    setHome((prev) => ({ ...prev, customSections: moveItem(prev.customSections, draggingCustomSectionIndex, sectionIndex) }));
                    setDraggingCustomSectionIndex(null);
                  }}
                  className="rounded-md border border-border bg-background/50 p-3"
                >
                  <CmsLabel text={`Custom Content Sections – Item ${sectionIndex + 1}`} />
                  <div className="mt-2 grid gap-2 md:grid-cols-3">
                    <Input
                      value={customSection.cmsLabel}
                      onChange={(e) => setHome((prev) => {
                        const next = [...prev.customSections];
                        next[sectionIndex] = { ...next[sectionIndex], cmsLabel: e.target.value };
                        return { ...prev, customSections: next };
                      })}
                      placeholder="Section Label (CMS only)"
                    />
                    <Input
                      value={customSection.publicTitle}
                      onChange={(e) => setHome((prev) => {
                        const next = [...prev.customSections];
                        next[sectionIndex] = { ...next[sectionIndex], publicTitle: e.target.value };
                        return { ...prev, customSections: next };
                      })}
                      placeholder="Public Title"
                    />
                    <select
                      value={customSection.layoutType}
                      onChange={(e) => setHome((prev) => {
                        const next = [...prev.customSections];
                        const layoutType = e.target.value === "credential-stack" ? "credential-stack" : "narrative";
                        next[sectionIndex] = {
                          ...next[sectionIndex],
                          layoutType,
                          body: layoutType === "narrative" ? next[sectionIndex].body || "" : "",
                          credentials: layoutType === "credential-stack"
                            ? (next[sectionIndex].credentials.length ? next[sectionIndex].credentials : [{ programTitle: "", institution: "", appliedContext: "" }])
                            : [],
                        };
                        return { ...prev, customSections: next };
                      })}
                      className="h-10 rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground"
                    >
                      <option value="narrative">Narrative</option>
                      <option value="credential-stack">Credential Stack</option>
                    </select>
                  </div>

                  {customSection.layoutType === "narrative" ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={customSection.body || ""}
                        onChange={(e) => setHome((prev) => {
                          const next = [...prev.customSections];
                          next[sectionIndex] = { ...next[sectionIndex], body: e.target.value };
                          return { ...prev, customSections: next };
                        })}
                        className="min-h-24 w-full rounded-md border border-input bg-card px-3 py-2 text-base text-foreground"
                        placeholder="Body content"
                      />
                      {customSection.bullets.map((bullet, bulletIndex) => (
                        <div key={`${customSection.cmsLabel}-${bulletIndex}`} className="flex gap-2">
                          <Input
                            value={bullet}
                            onChange={(e) => setHome((prev) => {
                              const next = [...prev.customSections];
                              const bullets = [...next[sectionIndex].bullets];
                              bullets[bulletIndex] = e.target.value;
                              next[sectionIndex] = { ...next[sectionIndex], bullets };
                              return { ...prev, customSections: next };
                            })}
                            placeholder={`Bullet ${bulletIndex + 1}`}
                          />
                          <Button
                            variant="ghost"
                            onClick={() => setHome((prev) => {
                              const next = [...prev.customSections];
                              next[sectionIndex] = {
                                ...next[sectionIndex],
                                bullets: next[sectionIndex].bullets.filter((_, i) => i !== bulletIndex),
                              };
                              return { ...prev, customSections: next };
                            })}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="secondary"
                        onClick={() => setHome((prev) => {
                          const next = [...prev.customSections];
                          next[sectionIndex] = { ...next[sectionIndex], bullets: [...next[sectionIndex].bullets, ""] };
                          return { ...prev, customSections: next };
                        })}
                      >
                        Add Bullet
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {customSection.credentials.map((credential, credentialIndex) => (
                        <div key={`${customSection.cmsLabel}-credential-${credentialIndex}`} className="rounded-md border border-border p-2">
                          <Input
                            value={credential.programTitle}
                            onChange={(e) => setHome((prev) => {
                              const next = [...prev.customSections];
                              const credentials = [...next[sectionIndex].credentials];
                              credentials[credentialIndex] = { ...credentials[credentialIndex], programTitle: e.target.value };
                              next[sectionIndex] = { ...next[sectionIndex], credentials };
                              return { ...prev, customSections: next };
                            })}
                            placeholder="Program Title"
                          />
                          <Input
                            className="mt-2"
                            value={credential.institution}
                            onChange={(e) => setHome((prev) => {
                              const next = [...prev.customSections];
                              const credentials = [...next[sectionIndex].credentials];
                              credentials[credentialIndex] = { ...credentials[credentialIndex], institution: e.target.value };
                              next[sectionIndex] = { ...next[sectionIndex], credentials };
                              return { ...prev, customSections: next };
                            })}
                            placeholder="Institution"
                          />
                          <Input
                            className="mt-2"
                            value={credential.appliedContext}
                            onChange={(e) => setHome((prev) => {
                              const next = [...prev.customSections];
                              const credentials = [...next[sectionIndex].credentials];
                              credentials[credentialIndex] = { ...credentials[credentialIndex], appliedContext: e.target.value };
                              next[sectionIndex] = { ...next[sectionIndex], credentials };
                              return { ...prev, customSections: next };
                            })}
                            placeholder="Applied context"
                          />
                          <Button
                            variant="ghost"
                            className="mt-2"
                            onClick={() => setHome((prev) => {
                              const next = [...prev.customSections];
                              const credentials = next[sectionIndex].credentials.filter((_, i) => i !== credentialIndex);
                              next[sectionIndex] = {
                                ...next[sectionIndex],
                                credentials: credentials.length ? credentials : [{ programTitle: "", institution: "", appliedContext: "" }],
                              };
                              return { ...prev, customSections: next };
                            })}
                          >
                            Remove Entry
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="secondary"
                        onClick={() => setHome((prev) => {
                          const next = [...prev.customSections];
                          next[sectionIndex] = {
                            ...next[sectionIndex],
                            credentials: [...next[sectionIndex].credentials, { programTitle: "", institution: "", appliedContext: "" }],
                          };
                          return { ...prev, customSections: next };
                        })}
                      >
                        Add Credential Entry
                      </Button>
                    </div>
                  )}

                  <Input
                    className="mt-2"
                    value={customSection.closingStatement || ""}
                    onChange={(e) => setHome((prev) => {
                      const next = [...prev.customSections];
                      next[sectionIndex] = { ...next[sectionIndex], closingStatement: e.target.value };
                      return { ...prev, customSections: next };
                    })}
                    placeholder="Optional closing statement"
                  />

                  <div className="mt-2 flex gap-2">
                    <Button variant="ghost" onClick={() => setHome((prev) => ({ ...prev, customSections: moveItem(prev.customSections, sectionIndex, sectionIndex - 1) }))} disabled={sectionIndex === 0}>↑</Button>
                    <Button variant="ghost" onClick={() => setHome((prev) => ({ ...prev, customSections: moveItem(prev.customSections, sectionIndex, sectionIndex + 1) }))} disabled={sectionIndex === home.customSections.length - 1}>↓</Button>
                    <Button
                      variant="ghost"
                      onClick={() => setHome((prev) => ({ ...prev, customSections: prev.customSections.filter((_, i) => i !== sectionIndex) }))}
                      disabled={home.customSections.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => setHome((prev) => ({
                ...prev,
                customSections: [
                  ...prev.customSections,
                  {
                    cmsLabel: "",
                    publicTitle: "",
                    layoutType: "narrative",
                    body: "",
                    bullets: [],
                    closingStatement: "",
                    credentials: [],
                  },
                ],
              }))}
            >
              Add Custom Section
            </Button>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <CmsLabel text="Resume (Read-only summary + source fields)" />
            <h3 className="h4 mt-2">Resume</h3>
            <div className="mt-3 space-y-3 rounded-md border border-border bg-background/50 p-3">
              <Input
                value={resume.downloadablePdfUrl}
                onChange={(e) => setResume((prev) => ({ ...prev, downloadablePdfUrl: e.target.value }))}
                placeholder="/files/cms/resume/...pdf"
              />
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={uploadResumePdf}
                  disabled={saving || uploadingResumePdf}
                  className="block text-xs text-muted-text file:mr-3 file:rounded-md file:border-0 file:bg-strategic-blue file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                />
                <p className="text-xs text-muted-text">Upload Resume (PDF). Stored in repo and linked automatically.</p>
              </div>
            </div>
            <div className="mt-3 space-y-4">
              {resume.sections.map((entry, i) => (
                <div key={`${entry.role}-${i}`} className="rounded-md border border-border bg-background/50 p-3">
                  <CmsLabel text={`Resume – Section ${i + 1}`} />
                  <Input
                    className="mt-2"
                    value={entry.role}
                    onChange={(e) => {
                      const next = [...resume.sections];
                      next[i] = { ...next[i], role: e.target.value };
                      setResume((prev) => ({ ...prev, sections: next }));
                    }}
                    placeholder="Role"
                  />
                  <Input
                    className="mt-2"
                    value={entry.company}
                    onChange={(e) => {
                      const next = [...resume.sections];
                      next[i] = { ...next[i], company: e.target.value };
                      setResume((prev) => ({ ...prev, sections: next }));
                    }}
                    placeholder="Company"
                  />
                  <Input
                    className="mt-2"
                    value={entry.timeline}
                    onChange={(e) => {
                      const next = [...resume.sections];
                      next[i] = { ...next[i], timeline: e.target.value };
                      setResume((prev) => ({ ...prev, sections: next }));
                    }}
                    placeholder="Timeline"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {entry.tags.map((tag) => <TagPill key={`${entry.role}-${tag}`}>{tag}</TagPill>)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <CmsLabel text="Contact" />
            <h3 className="h4 mt-2">Contact</h3>
            <Input className="mt-3" value={contact.headline} onChange={(e) => setContact((prev) => ({ ...prev, headline: e.target.value }))} placeholder="Headline" />
            <Input className="mt-2" value={contact.subtext} onChange={(e) => setContact((prev) => ({ ...prev, subtext: e.target.value }))} placeholder="Subtext" />
          </div>
        </Card>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={saveAll}
            disabled={saving || uploadingHomeImage || uploadingResumePdf || duplicateIds.length > 0 || invalidIds}
          >
            {saving ? "Saving..." : "Save Homepage Structure"}
          </Button>
          {status ? <p className="body-md text-muted-text">{status}</p> : null}
        </div>
      </div>
    </Section>
  );
}
