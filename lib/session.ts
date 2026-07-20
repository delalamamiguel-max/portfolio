const SESSION_DURATION_SECONDS = 60 * 60 * 12;
const SESSION_COOKIE_NAME = "miguel_session";
// Separate cookie for viewer access to company-product case studies. Distinct
// from the admin cookie so a site owner logged into /admin keeps that session,
// and a viewer session never grants CMS write access.
const VIEWER_SESSION_COOKIE_NAME = "miguel_viewer_session";
// Resume access is its own scope with its own cookie AND its own signing
// secret (derive with resumeScopeSecret below). Distinct secrets matter:
// with a shared secret, a case-study token value could be replayed under the
// resume cookie name to forge cross-scope access.
const RESUME_SESSION_COOKIE_NAME = "miguel_resume_session";

export function resumeScopeSecret(caseStudyPassword: string): string {
  return `resume-scope::${caseStudyPassword}`;
}

type SessionPayload = {
  exp: number;
  iat: number;
};

const encoder = new TextEncoder();

function toBase64Url(input: string): string {
  if (typeof btoa === "function") {
    return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(input: string): string {
  const padded = `${input}${"=".repeat((4 - (input.length % 4)) % 4)}`.replace(/-/g, "+").replace(/_/g, "/");

  if (typeof atob === "function") {
    return atob(padded);
  }

  return Buffer.from(padded, "base64").toString("utf8");
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("Web Crypto API is unavailable in this runtime.");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toHex(signature);
}

export async function createSessionToken(secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    iat: now,
    exp: now + SESSION_DURATION_SECONDS,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = await hmacHex(secret, encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = await hmacHex(secret, encodedPayload);

  if (expectedSignature !== signature) {
    return false;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload;
    return payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((acc, entry) => {
    const [rawName, ...rawValue] = entry.trim().split("=");
    if (!rawName) return acc;

    acc[rawName] = decodeURIComponent(rawValue.join("="));
    return acc;
  }, {});
}

export function buildSessionCookie(token: string, cookieName: string = SESSION_COOKIE_NAME): string {
  return [
    `${cookieName}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${SESSION_DURATION_SECONDS}`,
  ].join("; ");
}

export function clearSessionCookie(cookieName: string = SESSION_COOKIE_NAME): string {
  return [
    `${cookieName}=`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=0",
  ].join("; ");
}

export { SESSION_COOKIE_NAME, VIEWER_SESSION_COOKIE_NAME, RESUME_SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS };
export { hmacHex, toBase64Url, fromBase64Url };
