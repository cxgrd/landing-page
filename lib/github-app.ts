import crypto from 'crypto';

// ─── GitHub App JWT ───────────────────────────────────────────────────────────
// GitHub Apps authenticate by signing a JWT with their private key,
// then exchange it for an installation access token to act on repos.

function getPrivateKey(): string {
  const key = process.env.GITHUB_APP_PRIVATE_KEY;
  if (!key) throw new Error('GITHUB_APP_PRIVATE_KEY is not set');
  // Support both \n-escaped (env var) and real newlines (file read)
  return key.replace(/\\n/g, '\n');
}

function getAppId(): string {
  const id = process.env.GITHUB_APP_ID;
  if (!id) throw new Error('GITHUB_APP_ID is not set');
  return id;
}

// Minimal RS256 JWT signer — no external library needed
function signAppJwt(): string {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iat: now - 60,   // 60s back to account for clock skew
    exp: now + 540,  // 9 minutes (max is 10)
    iss: getAppId(),
  })).toString('base64url');

  const data = `${header}.${payload}`;
  const sig = crypto.createSign('RSA-SHA256').update(data).sign(getPrivateKey(), 'base64url');
  return `${data}.${sig}`;
}

// Exchange App JWT for an installation access token
// installationId comes from the webhook payload (installation.id)
export async function getInstallationToken(installationId: number): Promise<string> {
  const jwt = signAppJwt();
  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Failed to get installation token (${res.status}): ${body}`);
  }

  const data = await res.json() as { token: string };
  return data.token;
}

// ─── Commit status ────────────────────────────────────────────────────────────

export type CommitStatusState = 'pending' | 'success' | 'failure' | 'error';

export interface CommitStatusPayload {
  owner: string;
  repo: string;
  sha: string;
  installationId: number;
  state: CommitStatusState;
  description: string;        // shown inline on the PR (max 140 chars)
  targetUrl?: string;         // "Details" link on the PR
}

export async function postCommitStatus(payload: CommitStatusPayload): Promise<void> {
  const token = await getInstallationToken(payload.installationId);

  const res = await fetch(
    `https://api.github.com/repos/${payload.owner}/${payload.repo}/statuses/${payload.sha}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        state: payload.state,
        description: payload.description.slice(0, 140),
        context: 'cxgrd / merge policy',
        target_url: payload.targetUrl ?? 'https://cxgrd.com/dashboard',
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Failed to post commit status (${res.status}): ${body}`);
  }
}

// ─── Webhook signature verification ──────────────────────────────────────────

export function verifyWebhookSignature(body: string, signatureHeader: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) throw new Error('GITHUB_WEBHOOK_SECRET is not set');
  if (!signatureHeader?.startsWith('sha256=')) return false;

  const expected = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}
