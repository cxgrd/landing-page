import { NextRequest, NextResponse } from "next/server";
import { getCliAuthSession } from '@/lib/auth-db';
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

    // Session expired
    if (session.expiresAt < new Date()) {
      return NextResponse.json({ error: "Session expired. Run cxgrd auth login again." }, { status: 410 });
    }

    // Still waiting for user to complete browser login
    if (session.status === 'pending') {
      return NextResponse.json({ status: 'pending' }, { status: 202 });
    }

    // GitHub OAuth failed
    if (session.status === 'error') {
      return NextResponse.json(
        { error: session.error || "Auth failed. Try again." },
        { status: 400 }
      );
    }

    // Authorized — return token to CLI
    return NextResponse.json({
      token: session.token,
      plan: session.plan,
      email: session.email,
    });

  } catch (error) {
    console.error('CLI session poll error:', error);
    return NextResponse.json({ error: "Session lookup failed" }, { status: 500 });
  }
}
