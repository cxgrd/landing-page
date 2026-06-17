import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-token';
import { ensureAuthSchema, getTeamMember, getTeamById } from '@/lib/auth-db';
import { ensureMergePolicyTable, getMergePolicy } from '@/lib/merge-policy-db';
import { postCommitStatus } from '@/lib/github-app';
import { insertAuditEvent } from '@/lib/auth-db';

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return req.headers.get('x-cxgrd-token');
}

// POST /api/teams/[teamId]/ci-check
// Called by `cxgrd check --ci` after running checks locally.
// Looks up the merge policy, decides pass/fail, then posts GitHub commit status.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const claims = verifyAuthToken(token);
    if (!claims) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { teamId } = await params;
    await ensureAuthSchema();
    await ensureMergePolicyTable();

    const member = await getTeamMember(teamId, claims.sub);
    if (!member || member.status !== 'active') {
      return NextResponse.json({ error: 'Not an active team member' }, { status: 403 });
    }

    const body = await request.json() as {
      repoId?: string;
      gitRef?: string;
      passed?: boolean;
      issueCount?: number;
      errorCount?: number;
      summary?: string;
      // Optional — if provided we use it to post a GitHub commit status
      installationId?: number;
      repoFullName?: string;   // e.g. "manan/cxgrd-cli"
      repoOwner?: string;
      repoName?: string;
    };

    if (!body.gitRef) return NextResponse.json({ error: 'gitRef is required' }, { status: 400 });
    if (!body.repoId) return NextResponse.json({ error: 'repoId is required' }, { status: 400 });

    // Log to audit trail
    await insertAuditEvent({
      teamId,
      accountId: claims.sub,
      actorEmail: claims.email,
      actorRole: member.role,
      eventType: 'check',
      repoId: body.repoId,
      gitRef: body.gitRef,
      passed: body.passed ?? false,
      summary: body.summary ?? '',
      metadata: { issueCount: body.issueCount, errorCount: body.errorCount, ci: true },
    });

    // Post GitHub commit status if we have enough info
    if (body.installationId && body.repoOwner && body.repoName) {
      // Also check merge policy for policy-level block
      let policyBlocked = false;
      let policyReason  = '';

      if (body.repoFullName) {
        const policy = await getMergePolicy(teamId, body.repoFullName);
        if (policy && body.issueCount !== undefined) {
          policyBlocked = (body.errorCount ?? 0) > 0 && !body.passed;
          policyReason  = policyBlocked ? `${body.errorCount} error(s) detected by cxgrd` : '';
        }
      }

      const blocked = !body.passed || policyBlocked;
      const description = blocked
        ? policyReason || (body.summary ?? 'cxgrd check failed')
        : body.summary ?? 'cxgrd check passed';

      await postCommitStatus({
        owner:          body.repoOwner,
        repo:           body.repoName,
        sha:            body.gitRef,
        installationId: body.installationId,
        state:          blocked ? 'failure' : 'success',
        description:    description.slice(0, 140),
        targetUrl:      'https://cxgrd.com/dashboard',
      });

      return NextResponse.json({
        ok: true,
        result: blocked ? 'blocked' : 'passed',
        githubStatusPosted: true,
      });
    }

    // No GitHub info — just log and return
    return NextResponse.json({ ok: true, result: body.passed ? 'passed' : 'failed', githubStatusPosted: false });
  } catch (err) {
    console.error('POST /api/teams/[teamId]/ci-check error:', err);
    return NextResponse.json({ error: 'CI check failed' }, { status: 500 });
  }
}
