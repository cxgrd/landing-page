import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-token';
import { isProPlan } from '@/lib/plans';
import { ensureAuthSchema, getTeamMember, getTeamById } from '@/lib/auth-db';

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

// Default blast radius thresholds per role (team owner can override via policies — phase 2)
const DEFAULT_THRESHOLDS = {
  owner: Infinity,   // owners are never blocked
  admin: Infinity,   // admins are never blocked by default
  dev: 50,           // devs get blocked above 50 affected files
} as const;

// POST /api/check
// Body: { blast_radius: number, risk_level: string, file: string, team_id?: string }
// Returns: { allowed: boolean, reason?: string, threshold: number, role: string }
export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const claims = verifyAuthToken(token);
    if (!claims) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    if (!isProPlan(claims.plan)) {
      return NextResponse.json(
        { error: 'Check requires Pro or Team plan. Upgrade at https://cxgrd.com/pricing' },
        { status: 403 },
      );
    }

    const body = await request.json() as {
      blast_radius?: number;
      risk_level?: string;
      file?: string;
      team_id?: string;
    };

    const blastRadius = typeof body.blast_radius === 'number' ? body.blast_radius : 0;
    const riskLevel = typeof body.risk_level === 'string' ? body.risk_level : 'low';

    // ── Non-team path: just return allowed, no policy enforcement ──
    const teamId = body.team_id ?? claims.team_id;
    if (!teamId) {
      return NextResponse.json({
        allowed: true,
        blast_radius: blastRadius,
        risk_level: riskLevel,
        role: 'individual',
        threshold: null,
      });
    }

    // ── Team path: enforce role-based threshold ──
    await ensureAuthSchema();

    const [team, member] = await Promise.all([
      getTeamById(teamId),
      getTeamMember(teamId, claims.sub),
    ]);

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (!member || member.status !== 'active') {
      return NextResponse.json({ error: 'Not an active member of this team' }, { status: 403 });
    }

    const role = member.role;
    const threshold = DEFAULT_THRESHOLDS[role];
    const allowed = blastRadius <= threshold;

    return NextResponse.json({
      allowed,
      blast_radius: blastRadius,
      risk_level: riskLevel,
      role,
      threshold: threshold === Infinity ? null : threshold,
      ...(!allowed && {
        reason: `Blast radius ${blastRadius} exceeds the ${threshold}-file threshold for role '${role}'. Ask an admin to review or override.`,
      }),
    });
  } catch (err) {
    console.error('POST /api/check error:', err);
    return NextResponse.json({ error: 'Check failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'POST request required' }, { status: 405 });
}
