import { NextRequest, NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';
import { ensureAuthSchema } from '@/lib/auth-db';
import { randomUUID } from 'crypto';

// Stores team purchase intent before redirecting to Dodo checkout.
// The intent_id goes into Dodo metadata so the webhook can retrieve it.
// Intents expire after 2 hours — just a temp record.

export async function POST(request: NextRequest) {
  try {
    await ensureAuthSchema();

    // Ensure the intent table exists
    await dbQuery(`
      create table if not exists team_purchase_intents (
        id uuid primary key,
        team_name text not null,
        seat_count int not null,
        email text not null,
        used boolean not null default false,
        created_at timestamptz not null default now(),
        expires_at timestamptz not null default (now() + interval '2 hours')
      );
    `);

    const body = await request.json() as {
      teamName?: string;
      seatCount?: number;
      email?: string;
    };

    if (!body.teamName?.trim()) {
      return NextResponse.json({ error: 'teamName is required' }, { status: 400 });
    }
    if (!body.email?.trim()) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }
    const seatCount = body.seatCount ?? 5;
    if (seatCount < 5) {
      return NextResponse.json({ error: 'minimum 5 seats' }, { status: 400 });
    }

    const intentId = randomUUID();
    await dbQuery(
      `insert into team_purchase_intents (id, team_name, seat_count, email) values ($1, $2, $3, $4)`,
      [intentId, body.teamName.trim(), seatCount, body.email.trim().toLowerCase()],
    );

    return NextResponse.json({ intentId }, { status: 201 });
  } catch (err) {
    console.error('POST /api/teams/intent error:', err);
    return NextResponse.json({ error: 'Failed to create intent' }, { status: 500 });
  }
}
