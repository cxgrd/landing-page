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

const IS_PROD = process.env.NODE_ENV === 'production';
const COOKIE_NAME = 'cxgrd_token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,   // JS can't read it — XSS protection
    secure: IS_PROD,  // HTTPS only in production
    sameSite: 'lax',  // CSRF protection while allowing normal navigation
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.redirect(new URL('/auth/error?reason=not_configured', process.env.SITE_URL));
  }

  const { searchParams } = new URL(request.url);
  const code       = searchParams.get('code');
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

    const account = await upsertIndividualAccount({
      githubId:    identity.githubId,
      githubLogin: identity.login,
      email:       identity.email,
      upgradeToPro: false,
    });

    // Activate any pending team invite for this email
    await activateTeamMember({
      accountId: account.id,
      email:     account.email,
    }).catch(() => {});

    // Look up team membership — embed in JWT so CLI + dashboard don't need a DB hit
    const teamMembership = await getAccountTeam(account.id);

    const token = createAuthToken({
      sub:          account.id,
      email:        account.email,
      plan:         account.plan,
      github_login: account.githubLogin,
      ...(teamMembership && {
        team_id:   teamMembership.team.id,
        team_role: teamMembership.role,
      }),
    });

    // ── CLI login flow ────────────────────────────────────────────────────────
    if (state.intent === 'cli' && state.sessionId) {
      await markCliAuthSessionAuthorized({
        sessionId: state.sessionId,
        accountId: account.id,
        token,
        email:     account.email,
        plan:      account.plan,
      });
      // No cookie needed for CLI — token is delivered via session polling
      return NextResponse.redirect(
        new URL(`/auth/success?source=cli&plan=${account.plan}`, process.env.SITE_URL)
      );
    }

    // ── Web upgrade flow ──────────────────────────────────────────────────────
    if (state.intent === 'upgrade' && state.targetPlan === 'pro') {
      const checkoutUrl =
        `https://checkout.dodopayments.com/buy/pdt_0Ng6EAXoE8ybCQmeyWYtB` +
        `?email=${encodeURIComponent(account.email)}` +
        `&metadata[account_id]=${account.id}`;
      const res = NextResponse.redirect(checkoutUrl);
      setAuthCookie(res, token);
      return res;
    }

    if (state.intent === 'upgrade' && state.targetPlan === 'team') {
      const res = NextResponse.redirect(new URL('/team', process.env.SITE_URL));
      setAuthCookie(res, token);
      return res;
    }

    // ── Web login / dashboard flow ────────────────────────────────────────────
    const redirectUrl = teamMembership
      ? new URL(`/dashboard`, process.env.SITE_URL)
      : new URL(`/auth/success?plan=${account.plan}`, process.env.SITE_URL);

    const res = NextResponse.redirect(redirectUrl);
    setAuthCookie(res, token);
    return res;

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
