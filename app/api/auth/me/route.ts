import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-token';

// GET /api/auth/me
// Dashboard calls this on load to get session info from the httpOnly cookie.
// Returns token + team context so the dashboard doesn't need manual input.
export async function GET(request: NextRequest) {
  const token = request.cookies.get('cxgrd_token')?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const claims = verifyAuthToken(token);
  // console.log('Auth token claims:', claims);
  if (!claims) {
    // Cookie exists but token is expired or invalid — clear it
    const res = NextResponse.json({ authenticated: false }, { status: 401 });
    res.cookies.delete('cxgrd_token');
    return res;
  }

  return NextResponse.json({
    authenticated: true,
    token,
    accountId: claims.sub,
    email:   claims.email,
    plan:    claims.plan,
    teamId:  claims.team_id   ?? null,
    role:    claims.team_role ?? null,
    githubLogin: claims.github_login ?? null,
  });
}

// POST /api/auth/me — clears the cookie
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('cxgrd_token', '', {
    expires: new Date(0),
    path: '/',
  });
  return res;
}
