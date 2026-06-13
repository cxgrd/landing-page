import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-token';
import {
  ensureAuthSchema,
  getTeamById,
  getTeamMember,
  listTeamMembers,
  inviteTeamMember,
} from '@/lib/auth-db';
import type { OrgRole } from '@/lib/auth-token';

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return request.headers.get('x-cxgrd-token');
}

// GET /api/teams/[teamId]/members — list members (owner/admin only)
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
      return NextResponse.json({ error: 'Not a member of this team' }, { status: 403 });
    }

    if (member.role === 'dev') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const members = await listTeamMembers(teamId);
    return NextResponse.json({ members });
  } catch (err) {
    console.error('GET /api/teams/[teamId]/members error:', err);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

// POST /api/teams/[teamId]/members — invite a member
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

    // Only owner/admin can invite
    const requester = await getTeamMember(teamId, claims.sub);
    if (!requester || requester.status !== 'active' || requester.role === 'dev') {
      return NextResponse.json({ error: 'Admin access required to invite members' }, { status: 403 });
    }

    const team = await getTeamById(teamId);
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    const body = await request.json() as { email?: string; role?: string };
    if (!body.email || typeof body.email !== 'string') {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const role: OrgRole =
      body.role === 'owner' || body.role === 'admin' ? body.role : 'dev';

    // Only owner can promote to admin
    if (role === 'admin' && requester.role !== 'owner') {
      return NextResponse.json({ error: 'Only the team owner can assign admin role' }, { status: 403 });
    }

    await inviteTeamMember({ teamId, invitedEmail: body.email, role });

    return NextResponse.json({ invited: body.email, role }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to invite member';
    // Seat limit errors are user-facing
    if (msg.includes('Seat limit')) {
      return NextResponse.json({ error: msg }, { status: 422 });
    }
    console.error('POST /api/teams/[teamId]/members error:', err);
    return NextResponse.json({ error: 'Failed to invite member' }, { status: 500 });
  }
}
