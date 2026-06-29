import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, postCommitStatus } from '@/lib/github-app';
import { ensureAuthSchema } from '@/lib/auth-db';
import { ensureMergePolicyTable, getMergePolicyByRepo, upsertInstallation, ensureInstallationsTable } from '@/lib/merge-policy-db';
import { dbQuery } from '@/lib/db';

interface InstallationPayload {
  action: string;
  installation: { id: number; account: { login: string; type: string } };
  repositories?: { full_name: string }[];
  repositories_added?: { full_name: string }[];
}

// GitHub sends the raw body for HMAC verification — we must read it as text first
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-hub-signature-256');
  const eventType = request.headers.get('x-github-event');
  const deliveryId = request.headers.get('x-github-delivery') ?? 'unknown';

  // 1. Verify webhook signature — reject anything that doesn't match
  if (!verifyWebhookSignature(body, signature)) {
    console.warn(`[webhook] Invalid signature for delivery ${deliveryId}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 2. We only care about pull_request events
  if (eventType === 'installation' || eventType === 'installation_repositories') {
    const payload = JSON.parse(body) as InstallationPayload;
    const { action, installation, repositories, repositories_added } = payload;

    if (action === 'deleted') {
      await dbQuery(`delete from github_installations where installation_id = $1`, [installation.id]);
      return NextResponse.json({ ok: true, result: 'uninstalled' });
    }

    const repos = (repositories ?? repositories_added ?? []).map((r: { full_name: string }) => r.full_name);
    await ensureInstallationsTable();
    await upsertInstallation({
      installationId: installation.id,
      accountLogin:   installation.account.login,
      accountType:    installation.account.type,
      repoFullNames:  repos,
    });
    const team = await dbQuery(
      `select id from teams where github_login = $1 limit 1`,
      [installation.account.login]
    );
    if (team.rows[0]) {
      await dbQuery(
        `update github_installations set team_id = $1 where installation_id = $2`,
        [team.rows[0].id, installation.id]
      );
    }

    return NextResponse.json({ ok: true, result: 'installation_saved' });
  }

  if (eventType !== 'pull_request') {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let payload: PullRequestPayload;
  try {
    payload = JSON.parse(body) as PullRequestPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 3. Only act on opened / synchronize (new commit pushed) / reopened
  const actionsThatMatter = ['opened', 'synchronize', 'reopened'];
  if (!actionsThatMatter.includes(payload.action)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const { pull_request: pr, repository, installation } = payload;
  const repoFullName = repository.full_name;       // e.g. "manan/cxgrd-cli"
  const sha          = pr.head.sha;
  const installationId = installation?.id;

  if (!installationId) {
    console.warn(`[webhook] No installation ID for ${repoFullName} — is the app installed?`);
    return NextResponse.json({ error: 'No installation ID' }, { status: 400 });
  }

  // 4. Post "pending" status immediately so the PR shows a check right away
  await postCommitStatus({
    owner: repository.owner.login,
    repo: repository.name,
    sha,
    installationId,
    state: 'pending',
    description: 'cxgrd is checking merge policy…',
  }).catch(err => console.error('[webhook] Failed to post pending status:', err));

  try {
    await ensureAuthSchema();
    await ensureMergePolicyTable();

    // 5. Look up policy for this repo
    const policy = await getMergePolicyByRepo(repoFullName);

    if (!policy) {
      // No policy configured — pass the PR
      await postCommitStatus({
        owner: repository.owner.login,
        repo: repository.name,
        sha,
        installationId,
        state: 'success',
        description: 'No merge policy configured — check passed',
      });
      return NextResponse.json({ ok: true, result: 'no_policy' });
    }

    // 6. Evaluate: for now we use the PR's changed files count as a proxy
    //    for blast radius until cxgrd check --ci posts the real score via API.
    //    When --ci is wired, it will POST to /api/teams/:id/merge-check/:sha
    //    and we'll update the status there. This is the fallback.
    const changedFiles = pr.changed_files ?? 0;
    const riskLevel    = classifyRisk(changedFiles);
    const blastExceeded = changedFiles > policy.maxBlastRadius;
    const riskBlocked   = policy.blockOnRisk.includes(riskLevel);
    const blocked       = blastExceeded || riskBlocked;

    if (blocked) {
      const reason = blastExceeded
        ? `Blast radius ${changedFiles} exceeds limit of ${policy.maxBlastRadius} files`
        : `Risk level '${riskLevel}' is blocked by team policy`;

      await postCommitStatus({
        owner: repository.owner.login,
        repo: repository.name,
        sha,
        installationId,
        state: 'failure',
        description: reason,
        targetUrl: 'https://cxgrd.com/dashboard',
      });
      return NextResponse.json({ ok: true, result: 'blocked', reason });
    }

    await postCommitStatus({
      owner: repository.owner.login,
      repo: repository.name,
      sha,
      installationId,
      state: 'success',
      description: `cxgrd: ${changedFiles} files changed — within policy limits`,
      targetUrl: 'https://cxgrd.com/dashboard',
    });

    return NextResponse.json({ ok: true, result: 'passed' });

  } catch (err) {
    console.error('[webhook] Error evaluating merge policy:', err);

    // Post error status so the PR isn't silently stuck on pending
    await postCommitStatus({
      owner: repository.owner.login,
      repo: repository.name,
      sha,
      installationId,
      state: 'error',
      description: 'cxgrd: internal error — contact support',
    }).catch(() => {});

    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ─── Risk classification ──────────────────────────────────────────────────────

function classifyRisk(changedFiles: number): string {
  if (changedFiles >= 50) return 'critical';
  if (changedFiles >= 25) return 'high';
  if (changedFiles >= 10) return 'medium';
  return 'low';
}

// ─── GitHub webhook payload types ────────────────────────────────────────────

interface PullRequestPayload {
  action: string;
  pull_request: {
    number: number;
    head: { sha: string };
    changed_files?: number;
  };
  repository: {
    name: string;
    full_name: string;
    owner: { login: string };
  };
  installation?: { id: number };
}
