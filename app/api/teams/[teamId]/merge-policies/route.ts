import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-token';
import { ensureAuthSchema, getTeamMember } from '@/lib/auth-db';
import {
  ensureMergePolicyTable,
  upsertMergePolicy,
  listMergePolicies,
} from '@/lib/merge-policy-db';

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return req.headers.get('x-cxgrd-token');
}

// GET /api/teams/[teamId]/merge-policies
export async function GET(
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

    const policies = await listMergePolicies(teamId);
    return NextResponse.json({ policies });
  } catch (err) {
    console.error('GET /api/teams/[teamId]/merge-policies error:', err);
    return NextResponse.json({ error: 'Failed to fetch policies' }, { status: 500 });
  }
}

// POST /api/teams/[teamId]/merge-policies
// Body: { repoFullName, maxBlastRadius, blockOnRisk, enabled }
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

    // Only owner/admin can set merge policies
    const member = await getTeamMember(teamId, claims.sub);
    if (!member || member.status !== 'active' || member.role === 'dev') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json() as {
      repoFullName?: string;
      maxBlastRadius?: number;
      blockOnRisk?: string[];
      enabled?: boolean;
    };

    if (!body.repoFullName || !body.repoFullName.includes('/')) {
      return NextResponse.json(
        { error: 'repoFullName is required and must be in owner/repo format' },
        { status: 400 },
      );
    }

    const policy = await upsertMergePolicy({
      teamId,
      repoFullName: body.repoFullName,
      maxBlastRadius: body.maxBlastRadius ?? 50,
      blockOnRisk: body.blockOnRisk ?? ['critical', 'high'],
      enabled: body.enabled ?? true,
      createdBy: claims.email,
    });

    return NextResponse.json({ policy }, { status: 201 });
  } catch (err) {
    console.error('POST /api/teams/[teamId]/merge-policies error:', err);
    return NextResponse.json({ error: 'Failed to save policy' }, { status: 500 });
  }
}
