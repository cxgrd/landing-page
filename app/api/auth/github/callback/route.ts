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

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.redirect(new URL('/auth/error?reason=not_configured', request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateToken = searchParams.get('state');
  const errorParam = searchParams.get('error');

  if (errorParam) {
    return NextResponse.redirect(new URL(`/auth/error?reason=${errorParam}`, request.url));
  }

  if (!code || !stateToken) {
    return NextResponse.redirect(new URL('/auth/error?reason=missing_params', request.url));
  }

  try {
    await ensureAuthSchema();

    const state = verifyOAuthState(stateToken);
    if (!state) {
      return NextResponse.redirect(new URL('/auth/error?reason=invalid_state', request.url));
    }

    const identity = await exchangeCodeForGitHubIdentity(code);

    // NEVER upgrade plan here — plan only changes after Dodo payment webhook confirms payment
    // upgradeToPro is only used to decide whether to redirect to Dodo checkout
    const redirectToCheckout = state.intent === 'upgrade' && state.targetPlan === 'pro';

    const account = await upsertIndividualAccount({
      githubId: identity.githubId,
      githubLogin: identity.login,
      email: identity.email,
      upgradeToPro: false,
    });

    const token = createAuthToken({
      sub: account.id,
      email: account.email,
      plan: account.plan,
      github_login: account.githubLogin,
    });

    if (state.intent === 'cli' && state.sessionId) {
      await markCliAuthSessionAuthorized({
        sessionId: state.sessionId,
        accountId: account.id,
        token,
        email: account.email,
        plan: account.plan,
      });
      // Pass real plan from DB so success page shows accurate info
      return NextResponse.redirect(
        new URL(`/auth/success?source=cli&plan=${account.plan}`, request.url)
      );
    }

    // Upgrade flow — redirect to Dodo checkout
    // Plan stays 'free' until Dodo webhook fires after successful payment
    if (redirectToCheckout) {
      const checkoutUrl =
        `https://checkout.dodopayments.com/buy/pdt_0Ng6EAXoE8ybCQmeyWYtB` +
        `?email=${encodeURIComponent(account.email)}` +
        `&metadata[account_id]=${account.id}`;
      return NextResponse.redirect(checkoutUrl);
    }

    return NextResponse.redirect(
      new URL(`/auth/success?plan=${account.plan}`, request.url)
    );

  } catch (error) {
    console.error('GitHub callback error:', error);

    const state = stateToken ? verifyOAuthState(stateToken) : null;
    if (state?.intent === 'cli' && state.sessionId) {
      const message = error instanceof Error ? error.message : 'Auth failed';
      await markCliAuthSessionError(state.sessionId, message).catch(() => {});
    }

    return NextResponse.redirect(new URL('/auth/error?reason=auth_failed', request.url));
  }
}
