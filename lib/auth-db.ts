import { randomBytes } from 'crypto';
import { dbQuery } from './db';
import { normalizePlan, type SubscriptionPlan } from './plans';
import type { OrgRole } from './auth-token';

interface AccountRow {
  id: string;
  github_id: string;
  dodo_customer_id: string;
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
  dodo_customer_id: string;
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

interface AuditLogRow {
  id: string;
  team_id: string;
  account_id: string;
  actor_email: string;
  actor_role: string;
  event_type: string;
  repo_id: string | null;
  git_ref: string | null;
  risk_level: string | null;
  blast_radius: number | null;
  passed: boolean | null;
  summary: string | null;
  metadata: unknown;
  created_at: Date | string;
}

interface HealthSnapshotRow {
  id: string;
  team_id: string;
  repo_id: string;
  commit_sha: string;
  scanned_by: string;
  file_count: number;
  dep_count: number;
  avg_blast_radius: number;
  max_blast_radius: number;
  coupling_score: number;
  hub_count: number;
  hotspots: unknown;
  created_at: Date | string;
}

export interface IndividualAccount {
  id: string;
  githubId: string;
  dodoCustomerId : string;
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
  dodoCustomerId : string;
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

export interface AuditLogEntry {
  id: string;
  teamId: string;
  accountId: string;
  actorEmail: string;
  actorRole: OrgRole;
  eventType: string;
  repoId: string | null;
  gitRef: string | null;
  riskLevel: string | null;
  blastRadius: number | null;
  passed: boolean | null;
  summary: string | null;
  metadata: unknown;
  createdAt: Date;
}

export interface HealthSnapshot {
  id: string;
  teamId: string;
  repoId: string;
  commitSha: string;
  scannedBy: string;
  fileCount: number;
  depCount: number;
  avgBlastRadius: number;
  maxBlastRadius: number;
  couplingScore: number;
  hubCount: number;
  hotspots: string[];
  createdAt: Date;
}

const PENDING_SESSION_TTL = `interval '15 minutes'`;
const AUTHORIZED_SESSION_TTL = `interval '30 days'`;
const GRAPH_SNAPSHOT_RETENTION = 10;
// Keep 90 days of audit log per team — old rows pruned on insert
const AUDIT_LOG_RETENTION_DAYS = 90;
// Keep 60 health snapshots per (team, repo) — enough for ~2 months of daily scans
const HEALTH_SNAPSHOT_RETENTION = 60;

let schemaEnsured = false;

export async function ensureAuthSchema(): Promise<void> {
  if (schemaEnsured) return;

  await dbQuery(`
    create table if not exists individual_accounts (
      id uuid primary key default gen_random_uuid(),
      github_id text unique not null,
      github_login text not null,
      dodo_customer_id text not null,
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
      dodo_customer_id text not null,
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

  await dbQuery(`
    create table if not exists team_graph_snapshots (
      id uuid primary key default gen_random_uuid(),
      team_id uuid not null references teams(id) on delete cascade,
      repo_id text not null,
      commit_sha text not null,
      uploaded_by text not null,
      graph_bundle jsonb not null,
      created_at timestamptz not null default now(),
      unique (team_id, repo_id, commit_sha)
    );
  `);
  await dbQuery(
    `create index if not exists team_graph_snapshots_latest_idx on team_graph_snapshots (team_id, repo_id, created_at desc);`,
  );

  // ── Audit log ────────────────────────────────────────────────────────────────
  // One row per CLI command a team member runs (scan, check, input, prompt, sync)
  await dbQuery(`
    create table if not exists team_audit_log (
      id uuid primary key default gen_random_uuid(),
      team_id uuid not null references teams(id) on delete cascade,
      account_id uuid not null references individual_accounts(id) on delete cascade,
      actor_email text not null,
      actor_role text not null check (actor_role in ('owner', 'admin', 'dev')),
      event_type text not null,
      repo_id text,
      git_ref text,
      risk_level text,
      blast_radius int,
      passed boolean,
      summary text,
      metadata jsonb,
      created_at timestamptz not null default now()
    );
  `);
  // Dashboard feed: latest events for a team
  await dbQuery(
    `create index if not exists team_audit_log_team_time_idx on team_audit_log (team_id, created_at desc);`,
  );
  // Per-member activity view
  await dbQuery(
    `create index if not exists team_audit_log_actor_idx on team_audit_log (team_id, account_id, created_at desc);`,
  );

  // ── Health snapshots ──────────────────────────────────────────────────────────
  // One row per successful team scan — powers trend charts on dashboard
  await dbQuery(`
    create table if not exists team_health_snapshots (
      id uuid primary key default gen_random_uuid(),
      team_id uuid not null references teams(id) on delete cascade,
      repo_id text not null,
      commit_sha text not null,
      scanned_by text not null,
      file_count int not null default 0,
      dep_count int not null default 0,
      avg_blast_radius numeric(6,2) not null default 0,
      max_blast_radius int not null default 0,
      coupling_score numeric(4,2) not null default 0,
      hub_count int not null default 0,
      hotspots jsonb not null default '[]',
      created_at timestamptz not null default now()
    );
  `);
  // Latest snapshot per (team, repo) — used for current health card
  await dbQuery(
    `create index if not exists team_health_snapshots_latest_idx on team_health_snapshots (team_id, repo_id, created_at desc);`,
  );
  // Time-series for trend chart
  await dbQuery(
    `create index if not exists team_health_snapshots_trend_idx on team_health_snapshots (team_id, repo_id, created_at asc);`,
  );

  await dbQuery(`
    create table if not exists team_purchase_intents (
      id uuid primary key,
      team_name text not null,
      seat_count int not null,
      email text not null,
      used boolean not null default false,
      created_at timestamptz not null default now(),
      expires_at timestamptz not null default (now() + interval '2 hours')
    );
  `);

  await dbQuery(`
    create table if not exists team_invite_tokens (
      token text primary key,
      team_id uuid not null references teams(id) on delete cascade,
      created_by text not null,
      created_at timestamptz not null default now(),
      expires_at timestamptz not null default (now() + interval '30 days')
    );
  `);
  await dbQuery(
    `create index if not exists team_invite_tokens_team_idx on team_invite_tokens (team_id, expires_at desc);`,
  );

  await dbQuery(`
    create table if not exists ci_tokens (
      id uuid primary key default gen_random_uuid(),
      team_id uuid not null references teams(id) on delete cascade,
      account_id uuid not null references individual_accounts(id) on delete cascade,
      token_hash text not null unique,
      label text not null default 'CI Token',
      created_at timestamptz not null default now()
    );
  `);

  schemaEnsured = true;
}

// ─── Mappers ────────────────────────────────────────────────────────────────

function mapAccount(row: AccountRow): IndividualAccount {
  return {
    id: row.id,
    githubId: row.github_id,
    githubLogin: row.github_login,
    dodoCustomerId : row.dodo_customer_id,
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
    dodoCustomerId: row.dodo_customer_id,
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

function mapAuditLog(row: AuditLogRow): AuditLogEntry {
  return {
    id: row.id,
    teamId: row.team_id,
    accountId: row.account_id,
    actorEmail: row.actor_email,
    actorRole: normalizeRole(row.actor_role),
    eventType: row.event_type,
    repoId: row.repo_id,
    gitRef: row.git_ref,
    riskLevel: row.risk_level,
    blastRadius: row.blast_radius,
    passed: row.passed,
    summary: row.summary,
    metadata: row.metadata,
    createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
  };
}

function mapHealthSnapshot(row: HealthSnapshotRow): HealthSnapshot {
  return {
    id: row.id,
    teamId: row.team_id,
    repoId: row.repo_id,
    commitSha: row.commit_sha,
    scannedBy: row.scanned_by,
    fileCount: row.file_count,
    depCount: row.dep_count,
    avgBlastRadius: Number(row.avg_blast_radius),
    maxBlastRadius: row.max_blast_radius,
    couplingScore: Number(row.coupling_score),
    hubCount: row.hub_count,
    hotspots: Array.isArray(row.hotspots) ? (row.hotspots as string[]) : [],
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
    `select session_id, status, token, email, plan, error, expires_at
     from cli_auth_sessions where session_id = $1 limit 1`,
    [sessionId],
  );
  if (!result.rows[0]) return null;
  return mapSession(result.rows[0]);
}

export async function ensurePendingCliAuthSession(sessionId: string): Promise<CliAuthSession> {
  await dbQuery(
    `insert into cli_auth_sessions (session_id, status, expires_at, updated_at)
     values ($1, 'pending', now() + ${PENDING_SESSION_TTL}, now())
     on conflict (session_id) do nothing`,
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
    `insert into cli_auth_sessions (session_id, status, account_id, token, email, plan, error, expires_at, updated_at)
     values ($1, 'authorized', $2, $3, $4, $5, null, now() + ${AUTHORIZED_SESSION_TTL}, now())
     on conflict (session_id) do update
     set status = 'authorized', account_id = excluded.account_id, token = excluded.token,
         email = excluded.email, plan = excluded.plan, error = null,
         expires_at = now() + ${AUTHORIZED_SESSION_TTL}, updated_at = now()`,
    [input.sessionId, input.accountId, input.token, input.email, input.plan],
  );
}

export async function markCliAuthSessionError(sessionId: string, errorMessage: string): Promise<void> {
  await dbQuery(
    `insert into cli_auth_sessions (session_id, status, error, expires_at, updated_at)
     values ($1, 'error', $2, now() + ${PENDING_SESSION_TTL}, now())
     on conflict (session_id) do update
     set status = 'error', error = excluded.error, token = null, updated_at = now()`,
    [sessionId, errorMessage.slice(0, 500)],
  );
}

// ─── Teams ───────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
}

export async function createTeam(input: { name: string; ownerId: string; seatCount: number }): Promise<Team> {
  const slug = `${slugify(input.name)}-${Math.random().toString(36).slice(2, 6)}`;
  const result = await dbQuery<TeamRow>(
    `insert into teams (name, slug, owner_id, seat_count) values ($1, $2, $3, $4)
     returning id, name, slug, owner_id, seat_count, created_at`,
    [input.name.trim(), slug, input.ownerId, input.seatCount],
  );
  if (!result.rows[0]) throw new Error('Failed to create team');
  const team = mapTeam(result.rows[0]);
  await dbQuery(
    `insert into team_members (team_id, account_id, role, status, joined_at)
     values ($1, $2, 'owner', 'active', now()) on conflict (team_id, account_id) do nothing`,
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
    `select team_id, account_id, role, invited_email, status, joined_at
     from team_members where team_id = $1 and account_id = $2 limit 1`,
    [teamId, accountId],
  );
  return result.rows[0] ? mapMember(result.rows[0]) : null;
}

export async function listTeamMembers(teamId: string): Promise<TeamMember[]> {
  const result = await dbQuery<TeamMemberRow>(
    `select team_id, account_id, role, invited_email, status, joined_at
     from team_members where team_id = $1 order by joined_at asc nulls last`,
    [teamId],
  );
  return result.rows.map(mapMember);
}

export async function inviteTeamMember(input: { teamId: string; invitedEmail: string; role: OrgRole }): Promise<void> {
  const team = await getTeamById(input.teamId);
  if (!team) throw new Error('Team not found');
  const count = await dbQuery<{ count: string }>(`select count(*) as count from team_members where team_id = $1`, [input.teamId]);
  if (parseInt(count.rows[0]?.count ?? '0', 10) >= team.seatCount) {
    throw new Error(`Seat limit reached (${team.seatCount} seats). Add more seats to invite.`);
  }
  await dbQuery(
    `insert into team_members (team_id, account_id, role, invited_email, status)
     values ($1, null, $2, $3, 'pending')
     on conflict (team_id, invited_email) where status = 'pending' do nothing`,
    [input.teamId, input.role, input.invitedEmail.toLowerCase()],
  );
}

export async function activateTeamMember(input: { accountId: string; email: string }): Promise<TeamMember | null> {
  const result = await dbQuery<TeamMemberRow>(
    `update team_members set account_id = $1, status = 'active', joined_at = now()
     where invited_email = $2 and status = 'pending' and account_id is null
     returning team_id, account_id, role, invited_email, status, joined_at`,
    [input.accountId, input.email.toLowerCase()],
  );
  return result.rows[0] ? mapMember(result.rows[0]) : null;
}

export async function getAccountTeam(accountId: string): Promise<{ team: Team; role: OrgRole } | null> {
  const result = await dbQuery<TeamRow & { role: string }>(
    `select t.id, t.name, t.slug, t.owner_id, t.seat_count, t.created_at, tm.role
     from teams t join team_members tm on tm.team_id = t.id
     where tm.account_id = $1 and tm.status = 'active' limit 1`,
    [accountId],
  );
  if (!result.rows[0]) return null;
  return { team: mapTeam(result.rows[0]), role: normalizeRole(result.rows[0].role) };
}

// ─── Invite tokens ────────────────────────────────────────────────────────────

export interface InviteTokenInfo {
  token: string;
  teamId: string;
  teamName: string;
  seatCount: number;
  memberCount: number;
  seatsAvailable: number;
  expiresAt: Date;
}

function buildInviteUrl(teamId: string, token: string): string {
  const siteUrl = process.env.SITE_URL ?? 'https://cxgrd.com';
  return `${siteUrl}/team/invite?team=${teamId}&token=${token}`;
}

export async function getInviteTokenInfo(token: string, teamId: string): Promise<InviteTokenInfo | null> {
  const result = await dbQuery<{ team_id: string; expires_at: Date | string; name: string; seat_count: number }>(
    `select tit.team_id, tit.expires_at, t.name, t.seat_count
     from team_invite_tokens tit
     join teams t on t.id = tit.team_id
     where tit.token = $1 and tit.team_id = $2 and tit.expires_at > now()
     limit 1`,
    [token, teamId],
  );
  if (!result.rows[0]) return null;

  const count = await dbQuery<{ count: string }>(
    `select count(*) as count from team_members where team_id = $1 and status = 'active'`,
    [teamId],
  );
  const memberCount = parseInt(count.rows[0]?.count ?? '0', 10);
  const seatCount = result.rows[0].seat_count;
  const expiresAt = result.rows[0].expires_at instanceof Date
    ? result.rows[0].expires_at
    : new Date(result.rows[0].expires_at);

  return {
    token,
    teamId,
    teamName: result.rows[0].name,
    seatCount,
    memberCount,
    seatsAvailable: Math.max(0, seatCount - memberCount),
    expiresAt,
  };
}

export async function getTeamInviteLink(teamId: string): Promise<{ inviteUrl: string; token: string } | null> {
  const existing = await dbQuery<{ token: string }>(
    `select token from team_invite_tokens
     where team_id = $1 and expires_at > now()
     order by created_at desc limit 1`,
    [teamId],
  );
  if (existing.rows[0]) {
    const token = existing.rows[0].token;
    return { token, inviteUrl: buildInviteUrl(teamId, token) };
  }
  return null;
}

export async function createTeamInviteToken(teamId: string, createdBy: string): Promise<{ inviteUrl: string; token: string }> {
  const token = randomBytes(24).toString('hex');
  await dbQuery(
    `insert into team_invite_tokens (token, team_id, created_by) values ($1, $2, $3)`,
    [token, teamId, createdBy],
  );
  return { token, inviteUrl: buildInviteUrl(teamId, token) };
}

export async function acceptTeamInvite(input: {
  token: string;
  teamId: string;
  accountId: string;
  email: string;
}): Promise<TeamMember> {
  const invite = await getInviteTokenInfo(input.token, input.teamId);
  if (!invite) throw new Error('Invite link is invalid or expired');

  const existingMember = await getTeamMember(input.teamId, input.accountId);
  if (existingMember?.status === 'active') {
    return existingMember;
  }

  const otherTeam = await getAccountTeam(input.accountId);
  if (otherTeam && otherTeam.team.id !== input.teamId) {
    throw new Error('You are already a member of another team');
  }

  if (invite.seatsAvailable <= 0) {
    throw new Error('This team has no available seats');
  }

  await dbQuery(
    `insert into team_members (team_id, account_id, role, invited_email, status, joined_at)
     values ($1, $2, 'dev', $3, 'active', now())
     on conflict (team_id, account_id) do update
     set status = 'active', joined_at = coalesce(team_members.joined_at, now())`,
    [input.teamId, input.accountId, input.email.toLowerCase()],
  );

  const member = await getTeamMember(input.teamId, input.accountId);
  if (!member) throw new Error('Failed to join team');
  return member;
}

// ─── Graph snapshots ──────────────────────────────────────────────────────────

export async function upsertTeamGraphSnapshot(input: {
  teamId: string; repoId: string; commitSha: string; uploadedBy: string; graphBundle: unknown;
}): Promise<TeamGraphSnapshot> {
  const result = await dbQuery<TeamGraphSnapshotRow>(
    `insert into team_graph_snapshots (team_id, repo_id, commit_sha, uploaded_by, graph_bundle)
     values ($1, $2, $3, $4, $5::jsonb)
     on conflict (team_id, repo_id, commit_sha) do update
     set uploaded_by = excluded.uploaded_by, graph_bundle = excluded.graph_bundle, created_at = now()
     returning id, team_id, repo_id, commit_sha, uploaded_by, graph_bundle, created_at`,
    [input.teamId, input.repoId, input.commitSha, input.uploadedBy, JSON.stringify(input.graphBundle)],
  );
  if (!result.rows[0]) throw new Error('Failed to store graph snapshot');
  const snapshot = mapSnapshot(result.rows[0]);
  await dbQuery(
    `delete from team_graph_snapshots where team_id = $1 and repo_id = $2
     and id not in (select id from team_graph_snapshots where team_id = $1 and repo_id = $2 order by created_at desc limit $3)`,
    [input.teamId, input.repoId, GRAPH_SNAPSHOT_RETENTION],
  );
  return snapshot;
}

export async function getLatestTeamGraphSnapshot(teamId: string, repoId: string): Promise<TeamGraphSnapshot | null> {
  const result = await dbQuery<TeamGraphSnapshotRow>(
    `select id, team_id, repo_id, commit_sha, uploaded_by, graph_bundle, created_at
     from team_graph_snapshots where team_id = $1 and repo_id = $2 order by created_at desc limit 1`,
    [teamId, repoId],
  );
  return result.rows[0] ? mapSnapshot(result.rows[0]) : null;
}

export async function getTeamGraphSnapshotBySha(teamId: string, repoId: string, commitSha: string): Promise<TeamGraphSnapshot | null> {
  const result = await dbQuery<TeamGraphSnapshotRow>(
    `select id, team_id, repo_id, commit_sha, uploaded_by, graph_bundle, created_at
     from team_graph_snapshots where team_id = $1 and repo_id = $2 and commit_sha = $3 limit 1`,
    [teamId, repoId, commitSha],
  );
  return result.rows[0] ? mapSnapshot(result.rows[0]) : null;
}

// ─── Audit log ───────────────────────────────────────────────────────────────

export async function insertAuditEvent(input: {
  teamId: string;
  accountId: string;
  actorEmail: string;
  actorRole: OrgRole;
  eventType: string;
  repoId?: string;
  gitRef?: string;
  riskLevel?: string;
  blastRadius?: number;
  passed?: boolean;
  summary?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await dbQuery(
    `insert into team_audit_log
       (team_id, account_id, actor_email, actor_role, event_type, repo_id, git_ref,
        risk_level, blast_radius, passed, summary, metadata)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)`,
    [
      input.teamId, input.accountId, input.actorEmail, input.actorRole,
      input.eventType, input.repoId ?? null, input.gitRef ?? null,
      input.riskLevel ?? null, input.blastRadius ?? null, input.passed ?? null,
      input.summary ?? null, JSON.stringify(input.metadata ?? {}),
    ],
  );

  // Prune entries older than retention window — fire-and-forget
  dbQuery(
    `delete from team_audit_log where team_id = $1 and created_at < now() - interval '${AUDIT_LOG_RETENTION_DAYS} days'`,
    [input.teamId],
  ).catch(() => {});
}

export async function listAuditLog(
  teamId: string,
  opts: { limit?: number; offset?: number; accountId?: string } = {},
): Promise<AuditLogEntry[]> {
  const limit = Math.min(opts.limit ?? 50, 200);
  const offset = opts.offset ?? 0;

  if (opts.accountId) {
    const result = await dbQuery<AuditLogRow>(
      `select id, team_id, account_id, actor_email, actor_role, event_type, repo_id,
              git_ref, risk_level, blast_radius, passed, summary, metadata, created_at
       from team_audit_log
       where team_id = $1 and account_id = $2
       order by created_at desc limit $3 offset $4`,
      [teamId, opts.accountId, limit, offset],
    );
    return result.rows.map(mapAuditLog);
  }

  const result = await dbQuery<AuditLogRow>(
    `select id, team_id, account_id, actor_email, actor_role, event_type, repo_id,
            git_ref, risk_level, blast_radius, passed, summary, metadata, created_at
     from team_audit_log
     where team_id = $1
     order by created_at desc limit $2 offset $3`,
    [teamId, limit, offset],
  );
  return result.rows.map(mapAuditLog);
}

// ─── Health snapshots ─────────────────────────────────────────────────────────

export async function insertHealthSnapshot(input: {
  teamId: string;
  repoId: string;
  commitSha: string;
  scannedBy: string;
  fileCount: number;
  depCount: number;
  avgBlastRadius: number;
  maxBlastRadius: number;
  couplingScore: number;
  hubCount: number;
  hotspots: string[];
}): Promise<HealthSnapshot> {
  const result = await dbQuery<HealthSnapshotRow>(
    `insert into team_health_snapshots
       (team_id, repo_id, commit_sha, scanned_by, file_count, dep_count,
        avg_blast_radius, max_blast_radius, coupling_score, hub_count, hotspots)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
     returning *`,
    [
      input.teamId, input.repoId, input.commitSha, input.scannedBy,
      input.fileCount, input.depCount, input.avgBlastRadius, input.maxBlastRadius,
      input.couplingScore, input.hubCount, JSON.stringify(input.hotspots),
    ],
  );

  if (!result.rows[0]) throw new Error('Failed to store health snapshot');
  const snapshot = mapHealthSnapshot(result.rows[0]);

  // Prune old snapshots — keep last N per (team, repo)
  dbQuery(
    `delete from team_health_snapshots where team_id = $1 and repo_id = $2
     and id not in (
       select id from team_health_snapshots
       where team_id = $1 and repo_id = $2
       order by created_at desc limit $3
     )`,
    [input.teamId, input.repoId, HEALTH_SNAPSHOT_RETENTION],
  ).catch(() => {});

  return snapshot;
}

export async function getLatestHealthSnapshot(teamId: string, repoId: string): Promise<HealthSnapshot | null> {
  const result = await dbQuery<HealthSnapshotRow>(
    `select * from team_health_snapshots
     where team_id = $1 and repo_id = $2 order by created_at desc limit 1`,
    [teamId, repoId],
  );
  return result.rows[0] ? mapHealthSnapshot(result.rows[0]) : null;
}

export async function listHealthSnapshots(
  teamId: string,
  repoId: string,
  limit = 30,
): Promise<HealthSnapshot[]> {
  const result = await dbQuery<HealthSnapshotRow>(
    `select * from team_health_snapshots
     where team_id = $1 and repo_id = $2
     order by created_at asc limit $3`,
    [teamId, repoId, Math.min(limit, 60)],
  );
  return result.rows.map(mapHealthSnapshot);
}

export async function storeCiToken(input: {
  teamId: string;
  accountId: string;
  tokenHash: string;
  label: string;
}): Promise<void> {
  await dbQuery(
    `insert into ci_tokens (team_id, account_id, token_hash, label)
     values ($1, $2, $3, $4)`,
    [input.teamId, input.accountId, input.tokenHash, input.label],
  );
}

export async function listCiTokens(teamId: string): Promise<{ id: string; label: string; createdAt: Date }[]> {
  const result = await dbQuery<{ id: string; label: string; created_at: Date }>(
    `select id, label, created_at from ci_tokens where team_id = $1 order by created_at desc`,
    [teamId],
  );
  return result.rows.map(r => ({ id: r.id, label: r.label, createdAt: new Date(r.created_at) }));
}

export async function revokeCiToken(id: string, teamId: string): Promise<void> {
  await dbQuery(`delete from ci_tokens where id = $1 and team_id = $2`, [id, teamId]);
}

export async function isCiTokenValid(tokenHash: string): Promise<boolean> {
  const result = await dbQuery(
    `select id from ci_tokens where token_hash = $1 limit 1`,
    [tokenHash],
  );
  return result.rows.length > 0;
}