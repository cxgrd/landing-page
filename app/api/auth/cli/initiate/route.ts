import { NextRequest, NextResponse } from "next/server";
import { ensureAuthSchema, ensurePendingCliAuthSession } from '@/lib/auth-db';
import { isDatabaseConfigured } from '@/lib/db';

// POST /api/auth/cli/initiate
// CLI calls this first to get a sessionId, then opens the browser
export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 501 });
  }

  try {
    await ensureAuthSchema();

    const body = await request.json().catch(() => ({})) as { sessionId?: string };
    const sessionId = body.sessionId;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    await ensurePendingCliAuthSession(sessionId);

    return NextResponse.json({ sessionId, status: 'pending' });
  } catch (error) {
    console.error('CLI auth initiate error:', error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
