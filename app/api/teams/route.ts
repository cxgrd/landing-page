import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-token';
import { isTeamPlan } from '@/lib/plans';
import { ensureAuthSchema, createTeam } from '@/lib/auth-db';

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

// POST /api/teams — create a new team (called after Dodo team webhook fires)
export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const claims = verifyAuthToken(token);
    if (!claims) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    if (!isTeamPlan(claims.plan)) {
      return NextResponse.json(
        { error: 'Team plan required. Upgrade at https://cxgrd.com/pricing' },
        { status: 403 },
      );
    }

    const body = await request.json() as { name?: string; seat_count?: number };
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'team name is required' }, { status: 400 });
    }
    const seatCount = typeof body.seat_count === 'number' ? body.seat_count : 5;
    if (seatCount < 5) {
      return NextResponse.json({ error: 'minimum seat count is 5' }, { status: 400 });
    }

    await ensureAuthSchema();
    const team = await createTeam({
      name: body.name.trim(),
      ownerId: claims.sub,
      seatCount,
    });

    return NextResponse.json({ team }, { status: 201 });
  } catch (err) {
    console.error('POST /api/teams error:', err);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}
