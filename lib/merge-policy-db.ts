import { dbQuery } from './db';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MergePolicyRow {
  id: string;
  team_id: string;
  repo_full_name: string;
  max_blast_radius: number;
  block_on_risk: string[];
  enabled: boolean;
  created_by: string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface MergePolicy {
  id: string;
  teamId: string;
  repoFullName: string;
  maxBlastRadius: number;
  blockOnRisk: string[];
  enabled: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

function mapPolicy(row: MergePolicyRow): MergePolicy {
  return {
    id: row.id,
    teamId: row.team_id,
    repoFullName: row.repo_full_name,
    maxBlastRadius: row.max_blast_radius,
    blockOnRisk: row.block_on_risk,
    enabled: row.enabled,
    createdBy: row.created_by,
    createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
  };
}

export async function ensureMergePolicyTable(): Promise<void> {
  await dbQuery(`
    create table if not exists merge_policies (
      id uuid primary key default gen_random_uuid(),
      team_id uuid not null references teams(id) on delete cascade,
      repo_full_name text not null,
      max_blast_radius int not null default 50,
      block_on_risk text[] not null default '{critical,high}',
      enabled boolean not null default true,
      created_by text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (team_id, repo_full_name)
    );
  `);
  await dbQuery(
    `create index if not exists merge_policies_team_idx on merge_policies (team_id);`,
  );
}


// ─── Queries ──────────────────────────────────────────────────────────────────

export async function upsertMergePolicy(input: {
  teamId: string;
  repoFullName: string;
  maxBlastRadius: number;
  blockOnRisk: string[];
  enabled: boolean;
  createdBy: string;
}): Promise<MergePolicy> {
  const result = await dbQuery<MergePolicyRow>(
    `insert into merge_policies
       (team_id, repo_full_name, max_blast_radius, block_on_risk, enabled, created_by)
     values ($1, $2, $3, $4::text[], $5, $6)
     on conflict (team_id, repo_full_name) do update
     set max_blast_radius = excluded.max_blast_radius,
         block_on_risk    = excluded.block_on_risk,
         enabled          = excluded.enabled,
         updated_at       = now()
     returning *`,
    [
      input.teamId,
      input.repoFullName,
      input.maxBlastRadius,
      `{${input.blockOnRisk.join(',')}}`,
      input.enabled,
      input.createdBy,
    ],
  );
  if (!result.rows[0]) throw new Error('Failed to upsert merge policy');
  return mapPolicy(result.rows[0]);
}

export async function getMergePolicy(
  teamId: string,
  repoFullName: string,
): Promise<MergePolicy | null> {
  const result = await dbQuery<MergePolicyRow>(
    `select * from merge_policies
     where team_id = $1 and repo_full_name = $2 and enabled = true
     limit 1`,
    [teamId, repoFullName],
  );
  return result.rows[0] ? mapPolicy(result.rows[0]) : null;
}

// Used by the webhook — looks up policy by repo name alone
// since the webhook doesn't carry a team_id directly
export async function getMergePolicyByRepo(
  repoFullName: string,
): Promise<MergePolicy | null> {
  const result = await dbQuery<MergePolicyRow>(
    `select * from merge_policies
     where repo_full_name = $1 and enabled = true
     limit 1`,
    [repoFullName],
  );
  return result.rows[0] ? mapPolicy(result.rows[0]) : null;
}

export async function listMergePolicies(teamId: string): Promise<MergePolicy[]> {
  const result = await dbQuery<MergePolicyRow>(
    `select * from merge_policies where team_id = $1 order by created_at desc`,
    [teamId],
  );
  return result.rows.map(mapPolicy);
}
