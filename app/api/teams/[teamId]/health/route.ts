import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-token';
import {
  ensureAuthSchema,
  getTeamMember,
  insertHealthSnapshot,
  getLatestHealthSnapshot,
  listHealthSnapshots,
} from '@/lib/auth-db';

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return req.headers.get('x-cxgrd-token');
}

// POST /api/teams/[teamId]/health — CLI posts after a successful --team scan
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
      repoId?: string;
      commitSha?: string;
      fileCount?: number;
      depCount?: number;
      avgBlastRadius?: number;
      maxBlastRadius?: number;
      couplingScore?: number;
      hubCount?: number;
      hotspots?: string[];
    };

    if (!body.repoId) return NextResponse.json({ error: 'repoId is required' }, { status: 400 });
    if (!body.commitSha) return NextResponse.json({ error: 'commitSha is required' }, { status: 400 });

    const snapshot = await insertHealthSnapshot({
      teamId,
      repoId: body.repoId,
      commitSha: body.commitSha,
      scannedBy: claims.email,
      fileCount: body.fileCount ?? 0,
      depCount: body.depCount ?? 0,
      avgBlastRadius: body.avgBlastRadius ?? 0,
      maxBlastRadius: body.maxBlastRadius ?? 0,
      couplingScore: body.couplingScore ?? 0,
      hubCount: body.hubCount ?? 0,
      hotspots: body.hotspots ?? [],
    });

    return NextResponse.json({ snapshot }, { status: 201 });
  } catch (err) {
    console.error('POST /api/teams/[teamId]/health error:', err);
    return NextResponse.json({ error: 'Failed to store health snapshot' }, { status: 500 });
  }
}

// GET /api/teams/[teamId]/health?repoId=...&mode=latest|trend&limit=30
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
    const repoId = searchParams.get('repoId');
    const mode = searchParams.get('mode') ?? 'latest';
    const limit = parseInt(searchParams.get('limit') ?? '30', 10);

    if (!repoId) return NextResponse.json({ error: 'repoId is required' }, { status: 400 });

    if (mode === 'trend') {
      const snapshots = await listHealthSnapshots(teamId, repoId, limit);
      return NextResponse.json({ snapshots });
    }

    const snapshot = await getLatestHealthSnapshot(teamId, repoId);
    if (!snapshot) return NextResponse.json({ error: 'No health data yet for this repo' }, { status: 404 });

    return NextResponse.json({ snapshot });
  } catch (err) {
    console.error('GET /api/teams/[teamId]/health error:', err);
    return NextResponse.json({ error: 'Failed to fetch health data' }, { status: 500 });
  }
}
