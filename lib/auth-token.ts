import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { normalizePlan, type SubscriptionPlan } from './plans';

const HEADER = { alg: 'HS256', typ: 'JWT' } as const;

export interface CxgrdAuthTokenPayload {
  sub: string;
  email: string;
  plan: SubscriptionPlan;
  github_login?: string;
  iat: number;
  exp: number;
}

export interface OAuthStatePayload {
  intent: 'cli' | 'upgrade';
  sessionId?: string;
  targetPlan?: SubscriptionPlan;
  nonce: string;
  iat: number;
  exp: number;
}

function getTokenSecret(): string {
  return (
    process.env.CXGRD_AUTH_TOKEN_SECRET ||
    process.env.AUTH_TOKEN_SECRET ||
    'cxgrd-dev-auth-secret-change-me'
  );
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
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    return null;
  }

  const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`);
  const expected = Buffer.from(expectedSignature, 'utf8');
  const actual = Buffer.from(encodedSignature, 'utf8');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error("Signature mismatch: token may have been tampered with or the secret is incorrect");
  }

  try {
    return JSON.parse(base64UrlDecode(encodedPayload).toString('utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isExpired(exp: unknown): boolean {
  if (typeof exp !== 'number') return true;
  return Math.floor(Date.now() / 1000) >= exp;
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
  const decoded = decodeAndVerify(token);
  if (!decoded || isExpired(decoded.exp)) {
    return null;
  }

  if (typeof decoded.sub !== 'string' || typeof decoded.email !== 'string') {
    return null;
  }

  return {
    sub: decoded.sub,
    email: decoded.email,
    plan: normalizePlan(typeof decoded.plan === 'string' ? decoded.plan : 'free'),
    github_login: typeof decoded.github_login === 'string' ? decoded.github_login : undefined,
    iat: typeof decoded.iat === 'number' ? decoded.iat : 0,
    exp: typeof decoded.exp === 'number' ? decoded.exp : 0,
  };
}

export function createOAuthState(
  intent: 'cli' | 'upgrade',
  sessionId?: string,
  targetPlan?: SubscriptionPlan,
): string {
  const now = Math.floor(Date.now() / 1000);
  const normalizedTargetPlan =
    intent === 'upgrade' ? normalizePlan(targetPlan || 'pro') : undefined;
  const payload: OAuthStatePayload = {
    intent,
    sessionId,
    targetPlan: normalizedTargetPlan,
    nonce: randomBytes(8).toString('hex'),
    iat: now,
    exp: now + 600,
  };
  return encodeToken(payload as unknown as Record<string, unknown>);
}

export function verifyOAuthState(stateToken: string): OAuthStatePayload | null {
  const decoded = decodeAndVerify(stateToken);
  if (!decoded || isExpired(decoded.exp)) {
    return null;
  }

  const intent = decoded.intent === 'cli' || decoded.intent === 'upgrade' ? decoded.intent : null;
  if (!intent) {
    return null;
  }

  return {
    intent,
    sessionId: typeof decoded.sessionId === 'string' ? decoded.sessionId : undefined,
    targetPlan:
      typeof decoded.targetPlan === 'string'
        ? normalizePlan(decoded.targetPlan)
        : undefined,
    nonce: typeof decoded.nonce === 'string' ? decoded.nonce : '',
    iat: typeof decoded.iat === 'number' ? decoded.iat : 0,
    exp: typeof decoded.exp === 'number' ? decoded.exp : 0,
  };
}
