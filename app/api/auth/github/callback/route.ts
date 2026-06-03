import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForGitHubIdentity } from '@/lib/github-oauth';
import { verifyOAuthState, createAuthToken } from '@/lib/auth-token';
import {
  ensureAuthSchema,
  upsertIndividualAccount,
  markCliAuthSessionAuthorized,
  markCliAuthSessionError,
} from '@/lib/auth-db';
import { isDatabaseConfigured } from '@/lib/db';

// GET /api/auth/github/callback?code=xxx&state=xxx
// GitHub redirects here after user approves OAuth
export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.redirect(new URL('/auth/error?reason=not_configured', request.url));
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const stateToken = searchParams.get('state');
  const errorParam = searchParams.get('error');

  // User denied access on GitHub
  if (errorParam) {
    return NextResponse.redirect(new URL(`/auth/error?reason=${errorParam}`, request.url));
  }

  if (!code || !stateToken) {
    return NextResponse.redirect(new URL('/auth/error?reason=missing_params', request.url));
  }

  try {
    await ensureAuthSchema();

    // Verify state token (prevents CSRF)
    const state = verifyOAuthState(stateToken);
    if (!state) {
      return NextResponse.redirect(new URL('/auth/error?reason=invalid_state', request.url));
    }

    // Exchange GitHub code for identity
    const identity = await exchangeCodeForGitHubIdentity(origin, code);

    // Upsert account in DB
    const upgradeToPro = state.intent === 'upgrade' && state.targetPlan === 'pro';
    const account = await upsertIndividualAccount({
      githubId: identity.githubId,
      githubLogin: identity.login,
      email: identity.email,
      upgradeToPro : false,
    });

    // Create JWT for the CLI / session
    const token = createAuthToken({
      sub: account.id,
      email: account.email,
      plan: account.plan,
      github_login: account.githubLogin,
    });

    if (state.intent === 'cli' && state.sessionId) {
      // Mark CLI session as authorized — CLI is polling for this
      await markCliAuthSessionAuthorized({
        sessionId: state.sessionId,
        accountId: account.id,
        token,
        email: account.email,
        plan: account.plan,
      });
      // Show success page — user can close the browser tab
      return NextResponse.redirect(new URL('/auth/success?source=cli', request.url));
    }

    // Upgrade flow
    if (upgradeToPro) {
      const checkoutUrl = `https://checkout.dodopayments.com/buy/pdt_0Ng6EAXoE8ybCQmeyWYtB` +
        `?email=${encodeURIComponent(account.email)}` +
        `&metadata[account_id]=${account.id}`;
      return NextResponse.redirect(checkoutUrl);
    }
    return NextResponse.redirect(new URL('/auth/success', request.url));

  } catch (error) {
    console.error('GitHub callback error:', error);

    // If this was a CLI login, mark session as error so CLI stops polling
    const state = stateToken ? verifyOAuthState(stateToken) : null;
    if (state?.intent === 'cli' && state.sessionId) {
      const message = error instanceof Error ? error.message : 'Auth failed';
      await markCliAuthSessionError(state.sessionId, message).catch(() => {});
    }

    return NextResponse.redirect(new URL('/auth/error?reason=auth_failed', request.url));
  }
}
