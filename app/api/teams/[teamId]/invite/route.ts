import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-token';
import {
  ensureAuthSchema,
  getTeamMember,
  getInviteTokenInfo,
  getTeamInviteLink,
  createTeamInviteToken,
  acceptTeamInvite,
} from '@/lib/auth-db';

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

// GET /api/teams/[teamId]/invite?token=xxx — validate invite token (public)
// GET /api/teams/[teamId]/invite — get shareable invite link (owner/admin)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const { teamId } = await params;
    await ensureAuthSchema();

    const { searchParams } = new URL(request.url);
    const inviteToken = searchParams.get('token');

    if (inviteToken) {
      const info = await getInviteTokenInfo(inviteToken, teamId);
      if (!info) {
        return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 404 });
      }
      return NextResponse.json({
        valid: true,
        team: { id: info.teamId, name: info.teamName, seatCount: info.seatCount },
        memberCount: info.memberCount,
        seatsAvailable: info.seatsAvailable,
        expiresAt: info.expiresAt.toISOString(),
        inviteUrl: `${process.env.SITE_URL ?? 'https://cxgrd.com'}/team/invite?team=${teamId}&token=${inviteToken}`,
      });
    }

    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const claims = verifyAuthToken(token);
    if (!claims) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const member = await getTeamMember(teamId, claims.sub);
    if (!member || member.status !== 'active' || member.role === 'dev') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    let link = await getTeamInviteLink(teamId);
    if (!link) {
      link = await createTeamInviteToken(teamId, claims.email);
    }

    return NextResponse.json({ inviteUrl: link.inviteUrl, token: link.token });
  } catch (err) {
    console.error('GET /api/teams/[teamId]/invite error:', err);
    return NextResponse.json({ error: 'Failed to fetch invite' }, { status: 500 });
  }
}

// POST /api/teams/[teamId]/invite — accept invite (authenticated)
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

    const body = await request.json() as { token?: string };
    if (!body.token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 });
    }

    const member = await acceptTeamInvite({
      token: body.token,
      teamId,
      accountId: claims.sub,
      email: claims.email,
    });

    return NextResponse.json({ joined: true, member }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to accept invite';
    if (msg.includes('Invalid') || msg.includes('expired') || msg.includes('seats') || msg.includes('already')) {
      return NextResponse.json({ error: msg }, { status: 422 });
    }
    console.error('POST /api/teams/[teamId]/invite error:', err);
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 });
  }
}
