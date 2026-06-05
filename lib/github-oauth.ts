export interface GitHubIdentity {
  githubId: string;
  login: string;
  email: string;
}

interface GitHubTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUserResponse {
  id: number;
  login: string;
  email: string | null;
}

interface GitHubEmailResponse {
  email: string;
  primary: boolean;
  verified: boolean;
}

function getGitHubClientId(): string {
  const value = process.env.GITHUB_CLIENT_ID;
  if (!value) {
    throw new Error('GITHUB_CLIENT_ID is not configured');
  }
  return value;
}

function getGitHubClientSecret(): string {
  const value = process.env.GITHUB_CLIENT_SECRET;
  if (!value) {
    throw new Error('GITHUB_CLIENT_SECRET is not configured');
  }
  return value;
}

function getCallbackUrl(): string {
  return `${process.env.SITE_URL}/api/auth/github/callback`;
}

export function buildGitHubAuthorizeUrl(state: string): string {
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', getGitHubClientId());
  url.searchParams.set('redirect_uri', getCallbackUrl());
  url.searchParams.set('scope', 'read:user user:email');
  url.searchParams.set('state', state);
  return url.toString();
}

async function exchangeCodeForAccessToken(code: string): Promise<string> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: getGitHubClientId(),
      client_secret: getGitHubClientSecret(),
      code,
      redirect_uri: getCallbackUrl(),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`GitHub token exchange failed: ${body || response.statusText}`);
  }

  const tokenJson = (await response.json()) as GitHubTokenResponse;
  if (!tokenJson.access_token) {
    throw new Error(tokenJson.error_description || tokenJson.error || 'No GitHub access token returned');
  }

  return tokenJson.access_token;
}

async function fetchGitHubUser(accessToken: string): Promise<GitHubUserResponse> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`GitHub user fetch failed: ${body || response.statusText}`);
  }

  return (await response.json()) as GitHubUserResponse;
}

async function fetchGitHubEmail(accessToken: string): Promise<string> {
  const response = await fetch('https://api.github.com/user/emails', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`GitHub email fetch failed: ${body || response.statusText}`);
  }

  const emails = (await response.json()) as GitHubEmailResponse[];
  const best =
    emails.find((entry) => entry.primary && entry.verified) ||
    emails.find((entry) => entry.verified) ||
    emails[0];

  if (!best?.email) {
    throw new Error('No GitHub email available');
  }

  return best.email;
}

export async function exchangeCodeForGitHubIdentity(
  code: string,
): Promise<GitHubIdentity> {
  const accessToken = await exchangeCodeForAccessToken(code);
  const user = await fetchGitHubUser(accessToken);
  const email = user.email || (await fetchGitHubEmail(accessToken));

  return {
    githubId: String(user.id),
    login: user.login,
    email: email.toLowerCase(),
  };
}
