import { Buffer } from "node:buffer";

type GithubConfig = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
};

export function loadGithubConfig(): GithubConfig {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH;

  if (!token || !owner || !repo || !branch) {
    throw new Error("Missing GitHub environment variables.");
  }

  return { token, owner, repo, branch };
}

function contentUrl(config: GithubConfig, path: string): string {
  const encoded = encodeURIComponent(path).replace(/%2F/g, "/");
  return `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${encoded}`;
}

async function fetchJson(url: string, token: string, init?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "architected-by-miguel-cms",
      ...(init?.headers || {}),
    },
  });
}

export async function getFileSha(config: GithubConfig, path: string): Promise<string | null> {
  const response = await fetchJson(`${contentUrl(config, path)}?ref=${encodeURIComponent(config.branch)}`, config.token);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub lookup failed: ${text}`);
  }

  const payload = (await response.json()) as { sha?: string };
  return payload.sha ?? null;
}

export async function writeFileToGithub(config: GithubConfig, path: string, content: string, message: string): Promise<void> {
  const sha = await getFileSha(config, path);

  const response = await fetchJson(contentUrl(config, path), config.token, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      branch: config.branch,
      sha: sha ?? undefined,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub write failed: ${text}`);
  }
}

export async function writeBase64FileToGithub(
  config: GithubConfig,
  path: string,
  contentBase64: string,
  message: string,
): Promise<void> {
  const sha = await getFileSha(config, path);

  const response = await fetchJson(contentUrl(config, path), config.token, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      content: contentBase64,
      branch: config.branch,
      sha: sha ?? undefined,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub write failed: ${text}`);
  }
}

export async function deleteFileFromGithub(config: GithubConfig, path: string, message: string): Promise<void> {
  const sha = await getFileSha(config, path);

  if (!sha) {
    throw new Error("File does not exist on branch.");
  }

  const response = await fetchJson(contentUrl(config, path), config.token, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      branch: config.branch,
      sha,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub delete failed: ${text}`);
  }
}
