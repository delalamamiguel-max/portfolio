let csrfTokenCache: string | null = null;

type CmsWriteResponse = {
  ok: true;
  path: string;
  message?: string;
  created?: boolean;
  liveUrl?: string;
  previewUrl?: string;
  deployment?: string;
};
type CmsRouteCheckResult = { ok: boolean; status: number; url: string };
type CmsDeleteResponse = { ok: true; path: string };
type CmsUploadImageResponse = { ok: true; path: string; publicUrl: string; message?: string };

export async function getCsrfToken(): Promise<string> {
  if (csrfTokenCache) {
    return csrfTokenCache;
  }

  const response = await fetch("/api/cms/csrf", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to initialize CMS security token.");
  }

  const payload = (await response.json()) as { csrfToken?: string };

  if (!payload.csrfToken) {
    throw new Error("Failed to initialize CMS security token.");
  }

  csrfTokenCache = payload.csrfToken;
  return csrfTokenCache;
}

export async function cmsWriteFile(path: string, content: string, message?: string): Promise<CmsWriteResponse> {
  const csrfToken = await getCsrfToken();

  const response = await fetch("/api/cms/write-file", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-cms-csrf": csrfToken,
    },
    body: JSON.stringify({ path, content, message }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({ error: "Write failed" }))) as { error?: string };
    throw new Error(payload.error || "Write failed");
  }

  const payload = (await response.json().catch(() => ({ ok: true, path }))) as Partial<CmsWriteResponse>;
  return {
    ok: true,
    path: payload.path || path,
    message: payload.message,
    created: payload.created,
    liveUrl: payload.liveUrl,
    previewUrl: payload.previewUrl,
    deployment: payload.deployment,
  };
}

export async function cmsDeleteFile(path: string): Promise<CmsDeleteResponse> {
  const csrfToken = await getCsrfToken();

  const response = await fetch("/api/cms/delete-file", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-cms-csrf": csrfToken,
    },
    body: JSON.stringify({ path }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({ error: "Delete failed" }))) as { error?: string };
    throw new Error(payload.error || "Delete failed");
  }

  const payload = (await response.json().catch(() => ({ ok: true, path }))) as Partial<CmsDeleteResponse>;
  return { ok: true, path: payload.path || path };
}

export async function cmsUploadImage(input: {
  fileName: string;
  mimeType: string;
  dataBase64: string;
  folder: string;
}): Promise<CmsUploadImageResponse> {
  const csrfToken = await getCsrfToken();

  const response = await fetch("/api/cms/upload-image", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-cms-csrf": csrfToken,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({ error: "Image upload failed" }))) as { error?: string };
    throw new Error(payload.error || "Image upload failed");
  }

  const payload = (await response.json()) as Partial<CmsUploadImageResponse>;
  if (!payload.publicUrl || !payload.path) {
    throw new Error("Image upload failed");
  }

  return { ok: true, path: payload.path, publicUrl: payload.publicUrl, message: payload.message };
}

export async function cmsCheckRoute(url: string): Promise<CmsRouteCheckResult> {
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
  });
  return { ok: response.ok, status: response.status, url };
}
