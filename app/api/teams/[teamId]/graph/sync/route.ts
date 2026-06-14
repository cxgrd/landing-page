import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-token';
import {
  ensureAuthSchema,
  getTeamById,
  getTeamMember,
  upsertTeamGraphSnapshot,
  getLatestTeamGraphSnapshot,
  getTeamGraphSnapshotBySha,
} from '@/lib/auth-db';

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return request.headers.get('x-cxgrd-token');
}

// POST /api/teams/[teamId]/graph/sync
// Body: GraphBundle — { version, repoId, gitRef (used as commitSha), uploadedBy, graph, symbols, arch, meta, patterns }
// Returns: { snapshot: { id, commitSha, createdAt }, status: 'created' | 'updated' }
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

    const [team, member] = await Promise.all([
      getTeamById(teamId),
      getTeamMember(teamId, claims.sub),
    ]);

    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    if (!member || member.status !== 'active') {
      return NextResponse.json({ error: 'Not an active member of this team' }, { status: 403 });
    }

    const body = await request.json() as {
      version?: number;
      repoId?: string;
      gitRef?: string;
      graph?: unknown;
      symbols?: unknown;
      arch?: unknown;
      meta?: unknown;
      patterns?: unknown;
    };

    if (!body.repoId || typeof body.repoId !== 'string') {
      return NextResponse.json({ error: 'repoId is required' }, { status: 400 });
    }
    if (!body.gitRef || typeof body.gitRef !== 'string') {
      return NextResponse.json({ error: 'gitRef (commit SHA) is required' }, { status: 400 });
    }
    if (!body.graph) {
      return NextResponse.json({ error: 'graph is required' }, { status: 400 });
    }

    // Check if this SHA already exists — used to return the right status code
    const existing = await getTeamGraphSnapshotBySha(teamId, body.repoId, body.gitRef);

    const snapshot = await upsertTeamGraphSnapshot({
      teamId,
      repoId: body.repoId,
      commitSha: body.gitRef,
      uploadedBy: claims.email,
      graphBundle: {
        version: body.version ?? 1,
        repoId: body.repoId,
        gitRef: body.gitRef,
        uploadedAt: Date.now(),
        uploadedBy: claims.email,
        graph: body.graph,
        symbols: body.symbols ?? {},
        arch: body.arch ?? null,
        meta: body.meta ?? null,
        patterns: body.patterns ?? null,
      },
    });

    return NextResponse.json(
      {
        snapshot: {
          id: snapshot.id,
          commitSha: snapshot.commitSha,
          repoId: snapshot.repoId,
          uploadedBy: snapshot.uploadedBy,
          createdAt: snapshot.createdAt,
        },
        status: existing ? 'updated' : 'created',
      },
      { status: existing ? 200 : 201 },
    );
  } catch (err) {
    console.error('POST /api/teams/[teamId]/graph/sync error:', err);
    return NextResponse.json({ error: 'Graph sync failed' }, { status: 500 });
  }
}

// GET /api/teams/[teamId]/graph/sync?repoId=...&sha=...
// sha is optional — omit to get the latest snapshot for the repo
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
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get('repoId');
    const sha = searchParams.get('sha');

    if (!repoId) return NextResponse.json({ error: 'repoId is required' }, { status: 400 });

    await ensureAuthSchema();

    const member = await getTeamMember(teamId, claims.sub);
    if (!member || member.status !== 'active') {
      return NextResponse.json({ error: 'Not an active member of this team' }, { status: 403 });
    }

    const snapshot = sha
      ? await getTeamGraphSnapshotBySha(teamId, repoId, sha)
      : await getLatestTeamGraphSnapshot(teamId, repoId);

    if (!snapshot) {
      return NextResponse.json({ error: 'No graph snapshot found' }, { status: 404 });
    }

    // Return the full bundle so the CLI can apply it locally
    return NextResponse.json({ snapshot: snapshot.graphBundle });
  } catch (err) {
    console.error('GET /api/teams/[teamId]/graph/sync error:', err);
    return NextResponse.json({ error: 'Graph fetch failed' }, { status: 500 });
  }
}
