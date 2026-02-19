let csrfTokenCache: string | null = null;

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

export async function cmsWriteFile(path: string, content: string, message?: string): Promise<void> {
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
}

export async function cmsDeleteFile(path: string): Promise<void> {
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
}
