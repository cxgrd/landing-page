import { dbQuery } from './db';
import { normalizePlan, type SubscriptionPlan } from './plans';

interface AccountRow {
  id: string;
  github_id: string;
  github_login: string;
  email: string;
  plan: string;
}

interface SessionRow {
  session_id: string;
  status: 'pending' | 'authorized' | 'error';
  token: string | null;
  email: string | null;
  plan: string | null;
  error: string | null;
  expires_at: Date | string;
}

export interface IndividualAccount {
  id: string;
  githubId: string;
  githubLogin: string;
  email: string;
  plan: SubscriptionPlan;
}

export interface CliAuthSession {
  sessionId: string;
  status: 'pending' | 'authorized' | 'error';
  token?: string;
  email?: string;
  plan: SubscriptionPlan;
  error?: string;
  expiresAt: Date;
}

let schemaEnsured = false;

export async function ensureAuthSchema(): Promise<void> {
  if (schemaEnsured) return;

  await dbQuery(`
    create table if not exists individual_accounts (
      id uuid primary key default gen_random_uuid(),
      github_id text unique not null,
      github_login text not null,
      email text unique not null,
      plan text not null default 'free' check (plan in ('free', 'pro')),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);

  await dbQuery(`
    create table if not exists cli_auth_sessions (
      session_id uuid primary key,
      status text not null default 'pending' check (status in ('pending', 'authorized', 'error')),
      account_id uuid references individual_accounts(id) on delete cascade,
      token text,
      email text,
      plan text check (plan in ('free', 'pro')),
      error text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      expires_at timestamptz not null default (now() + interval '10 minutes')
    );
  `);

  await dbQuery(
    `create index if not exists cli_auth_sessions_expiry_idx on cli_auth_sessions (expires_at);`,
  );

  schemaEnsured = true;
}

function mapAccount(row: AccountRow): IndividualAccount {
  return {
    id: row.id,
    githubId: row.github_id,
    githubLogin: row.github_login,
    email: row.email,
    plan: normalizePlan(row.plan),
  };
}

function mapSession(row: SessionRow): CliAuthSession {
  const expiresAt = row.expires_at instanceof Date ? row.expires_at : new Date(row.expires_at);
  return {
    sessionId: row.session_id,
    status: row.status,
    token: row.token || undefined,
    email: row.email || undefined,
    plan: normalizePlan(row.plan),
    error: row.error || undefined,
    expiresAt,
  };
}

export async function upsertIndividualAccount(input: {
  githubId: string;
  githubLogin: string;
  email: string;
  upgradeToPro: boolean;
}): Promise<IndividualAccount> {
  const requestedPlan: SubscriptionPlan = input.upgradeToPro ? 'pro' : 'free';

  const result = await dbQuery<AccountRow>(
    `
      insert into individual_accounts (github_id, github_login, email, plan)
      values ($1, $2, $3, $4)
      on conflict (email) do update
      set github_id = excluded.github_id,
          github_login = excluded.github_login,
          plan = case
            when $4::text = 'pro' then 'pro'
            else individual_accounts.plan
          end,
          updated_at = now()
      returning id, github_id, github_login, email, plan
    `,
    [input.githubId, input.githubLogin, input.email.toLowerCase(), requestedPlan],
  );

  if (!result.rows[0]) {
    throw new Error('Failed to store account');
  }

  return mapAccount(result.rows[0]);
}

export async function getCliAuthSession(sessionId: string): Promise<CliAuthSession | null> {
  const result = await dbQuery<SessionRow>(
    `
      select session_id, status, token, email, plan, error, expires_at
      from cli_auth_sessions
      where session_id = $1
      limit 1
    `,
    [sessionId],
  );

  if (!result.rows[0]) return null;
  return mapSession(result.rows[0]);
}

export async function ensurePendingCliAuthSession(sessionId: string): Promise<CliAuthSession> {
  await dbQuery(
    `
      insert into cli_auth_sessions (session_id, status, expires_at, updated_at)
      values ($1, 'pending', now() + interval '10 minutes', now())
      on conflict (session_id) do nothing
    `,
    [sessionId],
  );

  const session = await getCliAuthSession(sessionId);
  if (!session) {
    throw new Error('Failed to create auth session');
  }
  return session;
}

export async function markCliAuthSessionAuthorized(input: {
  sessionId: string;
  accountId: string;
  token: string;
  email: string;
  plan: SubscriptionPlan;
}): Promise<void> {
  await dbQuery(
    `
      insert into cli_auth_sessions (session_id, status, account_id, token, email, plan, error, expires_at, updated_at)
      values ($1, 'authorized', $2, $3, $4, $5, null, now() + interval '10 minutes', now())
      on conflict (session_id) do update
      set status = 'authorized',
          account_id = excluded.account_id,
          token = excluded.token,
          email = excluded.email,
          plan = excluded.plan,
          error = null,
          expires_at = now() + interval '10 minutes',
          updated_at = now()
    `,
    [input.sessionId, input.accountId, input.token, input.email, input.plan],
  );
}

export async function markCliAuthSessionError(
  sessionId: string,
  errorMessage: string,
): Promise<void> {
  await dbQuery(
    `
      insert into cli_auth_sessions (session_id, status, error, expires_at, updated_at)
      values ($1, 'error', $2, now() + interval '10 minutes', now())
      on conflict (session_id) do update
      set status = 'error',
          error = excluded.error,
          token = null,
          updated_at = now()
    `,
    [sessionId, errorMessage.slice(0, 500)],
  );
}
