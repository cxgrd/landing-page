import { dbQuery } from './db';
import { normalizePlan, type SubscriptionPlan } from './plans';
import type { OrgRole } from './auth-token';

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

interface TeamRow {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  seat_count: number;
  created_at: Date | string;
}

interface TeamMemberRow {
  team_id: string;
  account_id: string;
  role: string;
  invited_email: string | null;
  status: 'pending' | 'active';
  joined_at: Date | string | null;
}

interface TeamGraphSnapshotRow {
  id: string;
  team_id: string;
  repo_id: string;
  commit_sha: string;
  uploaded_by: string;
  graph_bundle: unknown;
  created_at: Date | string;
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

export interface Team {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  seatCount: number;
  createdAt: Date;
}

export interface TeamMember {
  teamId: string;
  accountId: string;
  role: OrgRole;
  invitedEmail: string | null;
  status: 'pending' | 'active';
  joinedAt: Date | null;
}

export interface TeamGraphSnapshot {
  id: string;
  teamId: string;
  repoId: string;
  commitSha: string;
  uploadedBy: string;
  graphBundle: unknown;
  createdAt: Date;
}

const PENDING_SESSION_TTL = `interval '15 minutes'`;
const AUTHORIZED_SESSION_TTL = `interval '30 days'`;

// Keep only the last N snapshots per (team, repo) to bound storage
const GRAPH_SNAPSHOT_RETENTION = 10;

let schemaEnsured = false;

export async function ensureAuthSchema(): Promise<void> {
  if (schemaEnsured) return;

  await dbQuery(`
    create table if not exists individual_accounts (
      id uuid primary key default gen_random_uuid(),
      github_id text unique not null,
      github_login text not null,
      email text unique not null,
      plan text not null default 'free' check (plan in ('free', 'pro', 'team')),
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
      plan text check (plan in ('free', 'pro', 'team')),
      error text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      expires_at timestamptz not null default (now() + ${PENDING_SESSION_TTL})
    );
  `);

  await dbQuery(
    `create index if not exists cli_auth_sessions_expiry_idx on cli_auth_sessions (expires_at);`,
  );

  await dbQuery(`
    create table if not exists teams (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      slug text unique not null,
      owner_id uuid not null references individual_accounts(id) on delete restrict,
      seat_count int not null default 5 check (seat_count >= 5),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);

  await dbQuery(`
    create table if not exists team_members (
      team_id uuid not null references teams(id) on delete cascade,
      account_id uuid references individual_accounts(id) on delete cascade,
      role text not null default 'dev' check (role in ('owner', 'admin', 'dev')),
      invited_email text,
      status text not null default 'pending' check (status in ('pending', 'active')),
      joined_at timestamptz,
      created_at timestamptz not null default now(),
      unique (team_id, account_id)
    );
  `);

  await dbQuery(
    `create index if not exists team_members_account_idx on team_members (account_id) where account_id is not null;`,
  );

  await dbQuery(
    `create unique index if not exists team_members_invite_idx on team_members (team_id, invited_email) where status = 'pending';`,
  );

  await dbQuery(
    `create index if not exists team_members_pending_email_idx on team_members (invited_email) where status = 'pending';`,
  );

  // Graph snapshots — one full bundle per commit SHA, pruned to last N per (team, repo)
  await dbQuery(`
    create table if not exists team_graph_snapshots (
      id uuid primary key default gen_random_uuid(),
      team_id uuid not null references teams(id) on delete cascade,
      repo_id text not null,
      commit_sha text not null,
      uploaded_by text not null,
      graph_bundle jsonb not null,
      created_at timestamptz not null default now(),
      -- one snapshot per (team, repo, commit) — re-push of same SHA overwrites
      unique (team_id, repo_id, commit_sha)
    );
  `);

  // Fast lookup for latest snapshot per (team, repo)
  await dbQuery(
    `create index if not exists team_graph_snapshots_latest_idx on team_graph_snapshots (team_id, repo_id, created_at desc);`,
  );

  schemaEnsured = true;
}

// ─── Mappers ────────────────────────────────────────────────────────────────

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

function normalizeRole(role: string | undefined | null): OrgRole {
  if (role === 'owner' || role === 'admin') return role;
  return 'dev';
}

function mapTeam(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    ownerId: row.owner_id,
    seatCount: row.seat_count,
    createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
  };
}

function mapMember(row: TeamMemberRow): TeamMember {
  return {
    teamId: row.team_id,
    accountId: row.account_id,
    role: normalizeRole(row.role),
    invitedEmail: row.invited_email,
    status: row.status,
    joinedAt: row.joined_at
      ? row.joined_at instanceof Date ? row.joined_at : new Date(row.joined_at)
      : null,
  };
}

function mapSnapshot(row: TeamGraphSnapshotRow): TeamGraphSnapshot {
  return {
    id: row.id,
    teamId: row.team_id,
    repoId: row.repo_id,
    commitSha: row.commit_sha,
    uploadedBy: row.uploaded_by,
    graphBundle: row.graph_bundle,
    createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
  };
}

// ─── Individual accounts ─────────────────────────────────────────────────────

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

  if (!result.rows[0]) throw new Error('Failed to store account');
  return mapAccount(result.rows[0]);
}

// ─── CLI auth sessions ────────────────────────────────────────────────────────

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
      values ($1, 'pending', now() + ${PENDING_SESSION_TTL}, now())
      on conflict (session_id) do nothing
    `,
    [sessionId],
  );
  const session = await getCliAuthSession(sessionId);
  if (!session) throw new Error('Failed to create auth session');
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
      values ($1, 'authorized', $2, $3, $4, $5, null, now() + ${AUTHORIZED_SESSION_TTL}, now())
      on conflict (session_id) do update
      set status = 'authorized',
          account_id = excluded.account_id,
          token = excluded.token,
          email = excluded.email,
          plan = excluded.plan,
          error = null,
          expires_at = now() + ${AUTHORIZED_SESSION_TTL},
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
      values ($1, 'error', $2, now() + ${PENDING_SESSION_TTL}, now())
      on conflict (session_id) do update
      set status = 'error',
          error = excluded.error,
          token = null,
          updated_at = now()
    `,
    [sessionId, errorMessage.slice(0, 500)],
  );
}

// ─── Teams ───────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export async function createTeam(input: {
  name: string;
  ownerId: string;
  seatCount: number;
}): Promise<Team> {
  const baseSlug = slugify(input.name);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const result = await dbQuery<TeamRow>(
    `
      insert into teams (name, slug, owner_id, seat_count)
      values ($1, $2, $3, $4)
      returning id, name, slug, owner_id, seat_count, created_at
    `,
    [input.name.trim(), slug, input.ownerId, input.seatCount],
  );

  if (!result.rows[0]) throw new Error('Failed to create team');
  const team = mapTeam(result.rows[0]);

  await dbQuery(
    `
      insert into team_members (team_id, account_id, role, status, joined_at)
      values ($1, $2, 'owner', 'active', now())
      on conflict (team_id, account_id) do nothing
    `,
    [team.id, input.ownerId],
  );

  return team;
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  const result = await dbQuery<TeamRow>(
    `select id, name, slug, owner_id, seat_count, created_at from teams where id = $1`,
    [teamId],
  );
  return result.rows[0] ? mapTeam(result.rows[0]) : null;
}

export async function getTeamMember(teamId: string, accountId: string): Promise<TeamMember | null> {
  const result = await dbQuery<TeamMemberRow>(
    `
      select team_id, account_id, role, invited_email, status, joined_at
      from team_members
      where team_id = $1 and account_id = $2
      limit 1
    `,
    [teamId, accountId],
  );
  return result.rows[0] ? mapMember(result.rows[0]) : null;
}

export async function listTeamMembers(teamId: string): Promise<TeamMember[]> {
  const result = await dbQuery<TeamMemberRow>(
    `
      select team_id, account_id, role, invited_email, status, joined_at
      from team_members
      where team_id = $1
      order by joined_at asc nulls last
    `,
    [teamId],
  );
  return result.rows.map(mapMember);
}

export async function inviteTeamMember(input: {
  teamId: string;
  invitedEmail: string;
  role: OrgRole;
}): Promise<void> {
  const team = await getTeamById(input.teamId);
  if (!team) throw new Error('Team not found');

  const membersResult = await dbQuery<{ count: string }>(
    `select count(*) as count from team_members where team_id = $1`,
    [input.teamId],
  );
  const currentCount = parseInt(membersResult.rows[0]?.count ?? '0', 10);
  if (currentCount >= team.seatCount) {
    throw new Error(`Seat limit reached (${team.seatCount} seats). Add more seats to invite.`);
  }

  await dbQuery(
    `
      insert into team_members (team_id, account_id, role, invited_email, status)
      values ($1, null, $2, $3, 'pending')
      on conflict (team_id, invited_email) where status = 'pending' do nothing
    `,
    [input.teamId, input.role, input.invitedEmail.toLowerCase()],
  );
}

export async function activateTeamMember(input: {
  accountId: string;
  email: string;
}): Promise<TeamMember | null> {
  const result = await dbQuery<TeamMemberRow>(
    `
      update team_members
      set account_id = $1, status = 'active', joined_at = now()
      where invited_email = $2
        and status = 'pending'
        and account_id is null
      returning team_id, account_id, role, invited_email, status, joined_at
    `,
    [input.accountId, input.email.toLowerCase()],
  );
  return result.rows[0] ? mapMember(result.rows[0]) : null;
}

export async function getAccountTeam(
  accountId: string,
): Promise<{ team: Team; role: OrgRole } | null> {
  const result = await dbQuery<TeamRow & { role: string }>(
    `
      select t.id, t.name, t.slug, t.owner_id, t.seat_count, t.created_at, tm.role
      from teams t
      join team_members tm on tm.team_id = t.id
      where tm.account_id = $1 and tm.status = 'active'
      limit 1
    `,
    [accountId],
  );
  if (!result.rows[0]) return null;
  return {
    team: mapTeam(result.rows[0]),
    role: normalizeRole(result.rows[0].role),
  };
}

// ─── Graph snapshots ──────────────────────────────────────────────────────────

export async function upsertTeamGraphSnapshot(input: {
  teamId: string;
  repoId: string;
  commitSha: string;
  uploadedBy: string;
  graphBundle: unknown;
}): Promise<TeamGraphSnapshot> {
  const result = await dbQuery<TeamGraphSnapshotRow>(
    `
      insert into team_graph_snapshots (team_id, repo_id, commit_sha, uploaded_by, graph_bundle)
      values ($1, $2, $3, $4, $5::jsonb)
      on conflict (team_id, repo_id, commit_sha) do update
      set uploaded_by = excluded.uploaded_by,
          graph_bundle = excluded.graph_bundle,
          created_at = now()
      returning id, team_id, repo_id, commit_sha, uploaded_by, graph_bundle, created_at
    `,
    [input.teamId, input.repoId, input.commitSha, input.uploadedBy, JSON.stringify(input.graphBundle)],
  );

  if (!result.rows[0]) throw new Error('Failed to store graph snapshot');
  const snapshot = mapSnapshot(result.rows[0]);

  // Prune old snapshots — keep only the last N per (team, repo)
  await dbQuery(
    `
      delete from team_graph_snapshots
      where team_id = $1
        and repo_id = $2
        and id not in (
          select id from team_graph_snapshots
          where team_id = $1 and repo_id = $2
          order by created_at desc
          limit $3
        )
    `,
    [input.teamId, input.repoId, GRAPH_SNAPSHOT_RETENTION],
  );

  return snapshot;
}

export async function getLatestTeamGraphSnapshot(
  teamId: string,
  repoId: string,
): Promise<TeamGraphSnapshot | null> {
  const result = await dbQuery<TeamGraphSnapshotRow>(
    `
      select id, team_id, repo_id, commit_sha, uploaded_by, graph_bundle, created_at
      from team_graph_snapshots
      where team_id = $1 and repo_id = $2
      order by created_at desc
      limit 1
    `,
    [teamId, repoId],
  );
  return result.rows[0] ? mapSnapshot(result.rows[0]) : null;
}

export async function getTeamGraphSnapshotBySha(
  teamId: string,
  repoId: string,
  commitSha: string,
): Promise<TeamGraphSnapshot | null> {
  const result = await dbQuery<TeamGraphSnapshotRow>(
    `
      select id, team_id, repo_id, commit_sha, uploaded_by, graph_bundle, created_at
      from team_graph_snapshots
      where team_id = $1 and repo_id = $2 and commit_sha = $3
      limit 1
    `,
    [teamId, repoId, commitSha],
  );
  return result.rows[0] ? mapSnapshot(result.rows[0]) : null;
}
