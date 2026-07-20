import { get, put } from "@vercel/blob";

// Access-request registry persisted as a single JSON blob in the PRIVATE
// portfolio-access store (created via `vercel blob create-store
// portfolio-access --access private`). One document, read-modify-write:
// request volume is a handful per week, so last-writer-wins is an acceptable
// concurrency model and keeps the storage layer to two operations.

export type AccessScope = "case-studies" | "resume";
export type AccessStatus = "pending" | "approved" | "declined" | "expired" | "revoked";

export type AccessRequest = {
  id: string;
  name: string;
  email: string;
  company: string;
  reason?: string;
  requestedScopes: AccessScope[];
  status: AccessStatus;
  /** Scopes actually granted on approval (may be a subset of requested). */
  approvedScopes?: AccessScope[];
  createdAt: string;
  reviewedAt?: string;
  /** Unix seconds when an approval stops working. */
  accessExpiresAt?: number;
};

const REGISTRY_PATH = "access/requests.json";

type Registry = { requests: AccessRequest[] };

export function storeConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function readRegistry(): Promise<Registry> {
  try {
    // useCache:false is load-bearing: the registry is read-modify-write, so a
    // CDN-cached read after a recent write would silently drop requests.
    const result = await get(REGISTRY_PATH, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return { requests: [] };
    const text = await new Response(result.stream).text();
    const data = JSON.parse(text) as Registry;
    return Array.isArray(data.requests) ? data : { requests: [] };
  } catch {
    // Missing blob (first run) or transient store failure: treat as empty.
    return { requests: [] };
  }
}

async function writeRegistry(registry: Registry): Promise<void> {
  await put(REGISTRY_PATH, JSON.stringify(registry, null, 1), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function addRequest(request: AccessRequest): Promise<void> {
  const registry = await readRegistry();
  registry.requests.push(request);
  await writeRegistry(registry);
}

export async function findRequest(id: string): Promise<AccessRequest | null> {
  const registry = await readRegistry();
  return registry.requests.find((request) => request.id === id) ?? null;
}

/** An open request blocks duplicates: same email with a pending request, or an
 * approved one that has not expired, for any overlapping scope. */
export async function findOpenRequestByEmail(email: string, scopes: AccessScope[]): Promise<AccessRequest | null> {
  const registry = await readRegistry();
  const now = Math.floor(Date.now() / 1000);
  const normalized = email.trim().toLowerCase();

  return (
    registry.requests.find((request) => {
      if (request.email.toLowerCase() !== normalized) return false;
      const overlaps = request.requestedScopes.some((scope) => scopes.includes(scope));
      if (!overlaps) return false;
      if (request.status === "pending") return true;
      if (request.status === "approved") return !request.accessExpiresAt || request.accessExpiresAt > now;
      return false;
    }) ?? null
  );
}

export async function updateRequest(id: string, patch: Partial<AccessRequest>): Promise<AccessRequest | null> {
  const registry = await readRegistry();
  const index = registry.requests.findIndex((request) => request.id === id);
  if (index === -1) return null;

  registry.requests[index] = { ...registry.requests[index], ...patch };
  await writeRegistry(registry);
  return registry.requests[index];
}
