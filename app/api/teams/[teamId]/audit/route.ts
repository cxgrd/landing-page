import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-token';
import { ensureAuthSchema, getTeamMember, insertAuditEvent, listAuditLog } from '@/lib/auth-db';
import type { OrgRole } from '@/lib/auth-token';

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

// POST /api/teams/[teamId]/audit — CLI posts an event after each command
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

    const member = await getTeamMember(teamId, claims.sub);
    if (!member || member.status !== 'active') {
      return NextResponse.json({ error: 'Not an active team member' }, { status: 403 });
    }

    const body = await request.json() as {
      eventType?: string;
      repoId?: string;
      gitRef?: string;
      riskLevel?: string;
      blastRadius?: number;
      passed?: boolean;
      summary?: string;
      metadata?: Record<string, unknown>;
    };

    if (!body.eventType || typeof body.eventType !== 'string') {
      return NextResponse.json({ error: 'eventType is required' }, { status: 400 });
    }

    await insertAuditEvent({
      teamId,
      accountId: claims.sub,
      actorEmail: claims.email,
      actorRole: member.role,
      eventType: body.eventType,
      repoId: body.repoId,
      gitRef: body.gitRef,
      riskLevel: body.riskLevel,
      blastRadius: body.blastRadius,
      passed: body.passed,
      summary: body.summary,
      metadata: body.metadata,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('POST /api/teams/[teamId]/audit error:', err);
    return NextResponse.json({ error: 'Failed to log audit event' }, { status: 500 });
  }
}

// GET /api/teams/[teamId]/audit?limit=50&offset=0&memberId=...
// memberId filters to a specific member — only owner/admin can filter by others
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

    const member = await getTeamMember(teamId, claims.sub);
    if (!member || member.status !== 'active') {
      return NextResponse.json({ error: 'Not an active team member' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    const memberId = searchParams.get('memberId') ?? undefined;

    // Devs can only see their own events
    const canSeeAll = member.role === 'owner' || member.role === 'admin';
    const filterAccountId = canSeeAll ? memberId : claims.sub;

    const entries = await listAuditLog(teamId, { limit, offset, accountId: filterAccountId });

    return NextResponse.json({ entries, limit, offset });
  } catch (err) {
    console.error('GET /api/teams/[teamId]/audit error:', err);
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 });
  }
}
