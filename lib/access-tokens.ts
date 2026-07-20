import { fromBase64Url, hmacHex, toBase64Url } from "./session.js";

// Compact signed tokens for the access-request workflow: review-action links
// mailed to the owner, and grant links mailed to approved visitors. Format
// mirrors the session token (base64url payload + HMAC hex), so verification
// works in both the Node functions and the Edge middleware runtime.

export type AccessTokenPayload = {
  /** Request id the token acts on. */
  rid: string;
  /** Action the token authorizes: review actions or a visitor grant. */
  act: "approve" | "decline" | "revoke" | "grant";
  /** Unix seconds expiry of the token itself. */
  exp: number;
};

export function accessTokenSecret(sitePassword: string): string {
  // Derived, not stored: rotating SITE_PASSWORD invalidates every outstanding
  // review and grant link, which is the intended kill switch.
  return `access-tokens::${sitePassword}`;
}

export async function createAccessToken(payload: AccessTokenPayload, secret: string): Promise<string> {
  const encoded = toBase64Url(JSON.stringify(payload));
  const signature = await hmacHex(secret, encoded);
  return `${encoded}.${signature}`;
}

export async function verifyAccessToken(token: string, secret: string): Promise<AccessTokenPayload | null> {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = await hmacHex(secret, encoded);
  if (expected !== signature) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encoded)) as AccessTokenPayload;
    if (typeof payload.rid !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
