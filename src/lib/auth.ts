export type SessionScope = "admin" | "viewer" | null;

export async function verifySession(): Promise<{ authenticated: boolean; scope: SessionScope }> {
  try {
    const response = await fetch("/api/verify-session", {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return { authenticated: false, scope: null };
    }

    const data = (await response.json()) as { authenticated?: boolean; scope?: SessionScope };
    return { authenticated: Boolean(data.authenticated), scope: data.scope ?? null };
  } catch {
    return { authenticated: false, scope: null };
  }
}

export async function logout(): Promise<void> {
  await fetch("/api/logout", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
}
