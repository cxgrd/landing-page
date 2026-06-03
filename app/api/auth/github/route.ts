import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const redirect = new URL('/api/auth/github/start', url.origin);
  url.searchParams.forEach((value, key) => {
    redirect.searchParams.set(key, value);
  });
  return NextResponse.redirect(redirect, { status: 302 });
}

export async function POST() {
  return NextResponse.json(
    {
      error:
        'Direct POST auth callback is no longer supported. Start OAuth at /api/auth/github/start.',
    },
    { status: 405 },
  );
}