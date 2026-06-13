import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForGitHubIdentity } from '@/lib/github-oauth';
import { verifyOAuthState, createAuthToken } from '@/lib/auth-token';
import {
  ensureAuthSchema,
  upsertIndividualAccount,
  markCliAuthSessionAuthorized,
  markCliAuthSessionError,
  getAccountTeam,
  activateTeamMember,
} from '@/lib/auth-db';
import { isDatabaseConfigured } from '@/lib/db';

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.redirect(new URL('/auth/error?reason=not_configured', process.env.SITE_URL));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateToken = searchParams.get('state');
  const errorParam = searchParams.get('error');

  if (errorParam) {
    return NextResponse.redirect(new URL(`/auth/error?reason=${errorParam}`, process.env.SITE_URL));
  }

  if (!code || !stateToken) {
    return NextResponse.redirect(new URL('/auth/error?reason=missing_params', process.env.SITE_URL));
  }

  try {
    await ensureAuthSchema();

    const state = verifyOAuthState(stateToken);
    if (!state) {
      return NextResponse.redirect(new URL('/auth/error?reason=invalid_state', process.env.SITE_URL));
    }

    const identity = await exchangeCodeForGitHubIdentity(code);

    // NEVER upgrade plan here — plan only changes after Dodo payment webhook confirms payment
    const redirectToCheckout = state.intent === 'upgrade' && state.targetPlan === 'pro';

    const account = await upsertIndividualAccount({
      githubId: identity.githubId,
      githubLogin: identity.login,
      email: identity.email,
      upgradeToPro: false,
    });

    // If this email has a pending team invite, activate it now
    // This is how invited devs get linked to their team on first login
    await activateTeamMember({
      accountId: account.id,
      email: account.email,
    }).catch(() => {
      // Non-fatal — account may not have any pending invite
    });

    // Look up team membership so we can embed it in the JWT
    const teamMembership = await getAccountTeam(account.id);

    const token = createAuthToken({
      sub: account.id,
      email: account.email,
      plan: account.plan,
      github_login: account.githubLogin,
      // Embed team context if the user belongs to a team — CLI reads these off the JWT
      ...(teamMembership && {
        team_id: teamMembership.team.id,
        team_role: teamMembership.role,
      }),
    });

    if (state.intent === 'cli' && state.sessionId) {
      await markCliAuthSessionAuthorized({
        sessionId: state.sessionId,
        accountId: account.id,
        token,
        email: account.email,
        plan: account.plan,
      });
      return NextResponse.redirect(
        new URL(`/auth/success?source=cli&plan=${account.plan}`, process.env.SITE_URL)
      );
    }

    // Upgrade flow — redirect to Dodo checkout
    if (redirectToCheckout) {
      const checkoutUrl =
        `https://checkout.dodopayments.com/buy/pdt_0Ng6EAXoE8ybCQmeyWYtB` +
        `?email=${encodeURIComponent(account.email)}` +
        `&metadata[account_id]=${account.id}`;
      return NextResponse.redirect(checkoutUrl);
    }

    return NextResponse.redirect(
      new URL(`/auth/success?plan=${account.plan}`, process.env.SITE_URL)
    );

  } catch (error) {
    console.error('GitHub callback error:', error);

    const state = stateToken ? verifyOAuthState(stateToken) : null;
    if (state?.intent === 'cli' && state.sessionId) {
      const message = error instanceof Error ? error.message : 'Auth failed';
      await markCliAuthSessionError(state.sessionId, message).catch(() => {});
    }

    return NextResponse.redirect(new URL('/auth/error?reason=auth_failed', process.env.SITE_URL));
  }
}
