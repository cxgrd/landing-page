import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, createCiToken } from '@/lib/auth-token';
import { ensureAuthSchema, getTeamMember, storeCiToken, listCiTokens, revokeCiToken } from '@/lib/auth-db';

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// POST — generate a new CI token
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const claims = verifyAuthToken(token);
  if (!claims) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { teamId } = await params;
  await ensureAuthSchema();

  const member = await getTeamMember(teamId, claims.sub);
  if (!member || member.status !== 'active' || member.role === 'dev') {
    return NextResponse.json({ error: 'Only owners and admins can generate CI tokens' }, { status: 403 });
  }

  const { label } = await request.json() as { label?: string };

  const ciToken = createCiToken({
    sub: claims.sub,
    email: claims.email,
    plan: 'team',
    team_id: teamId,
    team_role: member.role,
  });

  await storeCiToken({
    teamId,
    accountId: claims.sub,
    tokenHash: hashToken(ciToken),
    label: label ?? 'CI Token',
  });

  // return the raw token — shown once, never stored
  return NextResponse.json({ token: ciToken });
}

// GET — list CI tokens (without the actual token value)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const claims = verifyAuthToken(token);
  if (!claims) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { teamId } = await params;
  await ensureAuthSchema();

  const member = await getTeamMember(teamId, claims.sub);
  if (!member || member.status !== 'active') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const tokens = await listCiTokens(teamId);
  return NextResponse.json({ tokens });
}

// DELETE — revoke a CI token by id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const claims = verifyAuthToken(token);
  if (!claims) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { teamId } = await params;
  const { id } = await request.json() as { id: string };

  const member = await getTeamMember(teamId, claims.sub);
  if (!member || member.status !== 'active' || member.role === 'dev') {
    return NextResponse.json({ error: 'Only owners and admins can revoke CI tokens' }, { status: 403 });
  }

  await revokeCiToken(id, teamId);
  return NextResponse.json({ ok: true });
}