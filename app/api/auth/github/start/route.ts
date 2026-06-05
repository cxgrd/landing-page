import { NextRequest, NextResponse } from "next/server";
import { buildGitHubAuthorizeUrl } from '@/lib/github-oauth';
import { createOAuthState } from '@/lib/auth-token';
import { ensureAuthSchema, ensurePendingCliAuthSession } from '@/lib/auth-db';
import { isDatabaseConfigured } from '@/lib/db';

// GET /api/auth/github/start?intent=cli&sessionId=xxx
// or  /api/auth/github/start?intent=upgrade&plan=pro
// Redirects user to GitHub OAuth
export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 501 });
  }

  try {
    await ensureAuthSchema();

    const { searchParams } = new URL(request.url);
    const intent = searchParams.get('intent') as 'cli' | 'upgrade' | null;
    const sessionId = searchParams.get('sessionId') ?? undefined;
    const plan = searchParams.get('plan') ?? undefined;

    if (!intent || (intent !== 'cli' && intent !== 'upgrade')) {
      return NextResponse.json({ error: "Missing or invalid intent" }, { status: 400 });
    }

    if (intent === 'cli') {
      if (!sessionId) {
        return NextResponse.json({ error: "Missing sessionId for CLI login" }, { status: 400 });
      }
      await ensurePendingCliAuthSession(sessionId);
    }

    const state = createOAuthState(intent, sessionId, plan as 'pro' | undefined);
    const githubUrl = buildGitHubAuthorizeUrl(state);

    return NextResponse.redirect(githubUrl);
  } catch (error) {
    console.error('GitHub auth start error:', error);
    return NextResponse.json({ error: "Failed to start auth" }, { status: 500 });
  }
}
