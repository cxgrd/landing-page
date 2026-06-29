// /api/teams/[teamId]/github-installation/route.ts
import {verifyAuthToken} from '@/lib/auth-token';
import {dbQuery} from '@/lib/db';
import {NextRequest, NextResponse} from 'next/server';

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const claims = verifyAuthToken(token);
  if (!claims) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { teamId } = await params;
  const result = await dbQuery(
    `select installation_id from github_installations where team_id = $1 limit 1`,
    [teamId]
  );
  return NextResponse.json({ installed: result.rows.length > 0 });
}