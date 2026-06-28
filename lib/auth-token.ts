import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { normalizePlan, type SubscriptionPlan } from './plans';

const HEADER = { alg: 'HS256', typ: 'JWT' } as const;

export type OrgRole = 'owner' | 'admin' | 'dev';

export interface CxgrdAuthTokenPayload {
  sub: string;
  email: string;
  plan: SubscriptionPlan;
  github_login?: string;
  // Team fields — only present for team plan members
  team_id?: string;
  team_role?: OrgRole;
  iat: number;
  exp: number;
}

export interface OAuthStatePayload {
  intent: 'cli' | 'upgrade' | 'invite';
  sessionId?: string;
  targetPlan?: SubscriptionPlan;
  inviteToken?: string;
  teamId?: string;
  nonce: string;
  iat: number;
  exp: number;
}

function getTokenSecret(): string {
  return process.env.CXGRD_AUTH_TOKEN_SECRET || '';
}

function base64UrlEncode(value: Buffer | string): string {
  const input = Buffer.isBuffer(value) ? value : Buffer.from(value, 'utf8');
  return input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(value: string): Buffer {
  const padded = value + '='.repeat((4 - (value.length % 4 || 4)) % 4);
  const normalized = padded.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64');
}

function sign(input: string): string {
  const digest = createHmac('sha256', getTokenSecret()).update(input).digest();
  return base64UrlEncode(digest);
}

function encodeToken(payload: Record<string, unknown>): string {
  const encodedHeader = base64UrlEncode(JSON.stringify(HEADER));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(`${encodedHeader}.${encodedPayload}`);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function decodeAndVerify(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    if (!encodedHeader || !encodedPayload || !encodedSignature) return null;

    const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`);
    const expected = Buffer.from(expectedSignature, 'utf8');
    const actual = Buffer.from(encodedSignature, 'utf8');

    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      return null;
    }

    return JSON.parse(base64UrlDecode(encodedPayload).toString('utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isExpired(exp: unknown): boolean {
  if (typeof exp !== 'number') return true;
  return Math.floor(Date.now() / 1000) >= exp;
}

function normalizeRole(role: unknown): OrgRole | undefined {
  if (role === 'owner' || role === 'admin' || role === 'dev') return role;
  return undefined;
}

export function createAuthToken(
  payload: Omit<CxgrdAuthTokenPayload, 'iat' | 'exp'>,
  ttlSeconds = 60 * 60 * 24 * 30,
): string {
  const now = Math.floor(Date.now() / 1000);
  return encodeToken({
    ...payload,
    iat: now,
    exp: now + ttlSeconds,
  });
}

export function verifyAuthToken(token: string): CxgrdAuthTokenPayload | null {
  try {
    const decoded = decodeAndVerify(token);
    if (!decoded || isExpired(decoded.exp)) {
      console.error('verifyAuthToken: invalid or expired', { decoded, exp: decoded?.exp });
      return null;
    }
    if (typeof decoded.sub !== 'string' || typeof decoded.email !== 'string') {
      console.error('verifyAuthToken: missing sub or email', decoded);
      return null;
    }
    return {
      sub: decoded.sub,
      email: decoded.email,
      plan: normalizePlan(typeof decoded.plan === 'string' ? decoded.plan : 'free'),
      github_login: typeof decoded.github_login === 'string' ? decoded.github_login : undefined,
      team_id: typeof decoded.team_id === 'string' ? decoded.team_id : undefined,
      team_role: normalizeRole(decoded.team_role),
      iat: typeof decoded.iat === 'number' ? decoded.iat : 0,
      exp: typeof decoded.exp === 'number' ? decoded.exp : 0,
    };
  } catch(err) {
    console.error('verifyAuthToken error:', err);
    return null;
  }
}

export function createOAuthState(
  intent: 'cli' | 'upgrade' | 'invite',
  opts?: {
    sessionId?: string;
    targetPlan?: SubscriptionPlan;
    inviteToken?: string;
    teamId?: string;
  },
): string {
  const now = Math.floor(Date.now() / 1000);
  const normalizedTargetPlan =
    intent === 'upgrade' ? normalizePlan(opts?.targetPlan || 'pro') : undefined;
  const payload: OAuthStatePayload = {
    intent,
    sessionId: opts?.sessionId,
    targetPlan: normalizedTargetPlan,
    inviteToken: opts?.inviteToken,
    teamId: opts?.teamId,
    nonce: randomBytes(8).toString('hex'),
    iat: now,
    exp: now + 600,
  };
  return encodeToken(payload as unknown as Record<string, unknown>);
}

export function verifyOAuthState(stateToken: string): OAuthStatePayload | null {
  try {
    const decoded = decodeAndVerify(stateToken);
    if (!decoded || isExpired(decoded.exp)) return null;

    const intent =
      decoded.intent === 'cli' || decoded.intent === 'upgrade' || decoded.intent === 'invite'
        ? decoded.intent
        : null;
    if (!intent) return null;

    return {
      intent,
      sessionId: typeof decoded.sessionId === 'string' ? decoded.sessionId : undefined,
      targetPlan:
        typeof decoded.targetPlan === 'string'
          ? normalizePlan(decoded.targetPlan)
          : undefined,
      inviteToken: typeof decoded.inviteToken === 'string' ? decoded.inviteToken : undefined,
      teamId: typeof decoded.teamId === 'string' ? decoded.teamId : undefined,
      nonce: typeof decoded.nonce === 'string' ? decoded.nonce : '',
      iat: typeof decoded.iat === 'number' ? decoded.iat : 0,
      exp: typeof decoded.exp === 'number' ? decoded.exp : 0,
    };
  } catch {
    return null;
  }
}
