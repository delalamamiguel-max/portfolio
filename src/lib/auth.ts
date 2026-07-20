export type SessionScope = "admin" | "viewer" | null;

export type SessionState = {
  authenticated: boolean;
  scope: SessionScope;
  /** Per-content access: admin implies both; viewer sessions may hold either. */
  caseStudies: boolean;
  resume: boolean;
};

const SIGNED_OUT: SessionState = { authenticated: false, scope: null, caseStudies: false, resume: false };

export async function verifySession(): Promise<SessionState> {
  try {
    const response = await fetch("/api/verify-session", {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return SIGNED_OUT;
    }

    const data = (await response.json()) as Partial<SessionState>;
    return {
      authenticated: Boolean(data.authenticated),
      scope: data.scope ?? null,
      caseStudies: Boolean(data.caseStudies),
      resume: Boolean(data.resume),
    };
  } catch {
    return SIGNED_OUT;
  }
}

export async function logout(): Promise<void> {
  await fetch("/api/logout", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
}
