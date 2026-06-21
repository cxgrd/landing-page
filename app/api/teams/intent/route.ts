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

    // Ensure the intent table exists (with account_id column)
    await dbQuery(`
      create table if not exists team_purchase_intents (
        id uuid primary key,
        team_name text not null,
        seat_count int not null,
        email text not null,
        account_id text,
        used boolean not null default false,
        created_at timestamptz not null default now(),
        expires_at timestamptz not null default (now() + interval '2 hours')
      );
    `);

    // Migrate existing table — add account_id column if it doesn't exist yet
    await dbQuery(`
      alter table team_purchase_intents
      add column if not exists account_id text;
    `).catch(() => {});

    const body = await request.json() as {
      teamName?: string;
      seatCount?: number;
      email?: string;
      accountId?: string;
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
      `insert into team_purchase_intents (id, team_name, seat_count, email, account_id)
       values ($1, $2, $3, $4, $5)`,
      [intentId, body.teamName.trim(), seatCount, body.email.trim().toLowerCase(), body.accountId ?? null],
    );

    return NextResponse.json({ intentId }, { status: 201 });
  } catch (err) {
    console.error('POST /api/teams/intent error:', err);
    return NextResponse.json({ error: 'Failed to create intent' }, { status: 500 });
  }
}
