import { NextRequest, NextResponse } from "next/server";
import { getCliAuthSession } from '@/lib/auth-db';
import { verifyAuthToken } from '@/lib/auth-token';
import { isDatabaseConfigured } from '@/lib/db';

// GET /api/auth/cli/session/[sessionId]
// CLI polls this every 2 seconds waiting for the user to complete GitHub login in browser
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Auth API not available yet. Use CXGRD_DEV_PLAN=pro in .env for local dev." },
      { status: 501 }
    );
  }

  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const session = await getCliAuthSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.expiresAt < new Date()) {
      return NextResponse.json({ error: "Session expired. Run cxgrd auth login again." }, { status: 410 });
    }

    if (session.status === 'pending') {
      return NextResponse.json({ status: 'pending' }, { status: 202 });
    }

    if (session.status === 'error') {
      return NextResponse.json(
        { error: session.error || "Auth failed. Try again." },
        { status: 400 }
      );
    }

    // Decode JWT to extract team_id and team_role — these aren't stored
    // in cli_auth_sessions, only in the token itself
    const claims = session.token ? verifyAuthToken(session.token) : null;

    return NextResponse.json({
      token:    session.token,
      plan:     session.plan,
      email:    session.email,
      // Include team context so CLI writes correct role to auth.json
      org_id:   claims?.team_id   ?? null,
      role:     claims?.team_role ?? null,
    });

  } catch (error) {
    console.error('CLI session poll error:', error);
    return NextResponse.json({ error: "Session lookup failed" }, { status: 500 });
  }
}
