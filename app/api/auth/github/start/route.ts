import { NextRequest, NextResponse } from "next/server";
import { buildGitHubAuthorizeUrl } from '@/lib/github-oauth';
import { createOAuthState } from '@/lib/auth-token';
import { ensureAuthSchema, ensurePendingCliAuthSession } from '@/lib/auth-db';
import { isDatabaseConfigured } from '@/lib/db';

// GET /api/auth/github/start?intent=cli&sessionId=xxx
// or  /api/auth/github/start?intent=upgrade&plan=pro
// or  /api/auth/github/start?intent=invite&token=xxx&teamId=xxx
// Redirects user to GitHub OAuth
export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 501 });
  }

  try {
    await ensureAuthSchema();

    const { searchParams } = new URL(request.url);
    const intent = searchParams.get('intent') as 'cli' | 'upgrade' | 'invite' | null;
    const sessionId = searchParams.get('sessionId') ?? undefined;
    const plan = searchParams.get('plan') ?? undefined;
    const inviteToken = searchParams.get('token') ?? undefined;
    const teamId = searchParams.get('teamId') ?? undefined;

    if (!intent || (intent !== 'cli' && intent !== 'upgrade' && intent !== 'invite')) {
      return NextResponse.json({ error: "Missing or invalid intent" }, { status: 400 });
    }

    if (intent === 'cli') {
      if (!sessionId) {
        return NextResponse.json({ error: "Missing sessionId for CLI login" }, { status: 400 });
      }
      await ensurePendingCliAuthSession(sessionId);
    }

    if (intent === 'invite') {
      if (!inviteToken || !teamId) {
        return NextResponse.json({ error: "Missing token or teamId for invite" }, { status: 400 });
      }
    }

    const state = createOAuthState(intent, {
      sessionId,
      targetPlan: plan as 'pro' | undefined,
      inviteToken,
      teamId,
    });
    const githubUrl = buildGitHubAuthorizeUrl(state);

    return NextResponse.redirect(githubUrl);
  } catch (error) {
    console.error('GitHub auth start error:', error);
    return NextResponse.json({ error: "Failed to start auth" }, { status: 500 });
  }
}
