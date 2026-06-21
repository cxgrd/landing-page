import { NextRequest, NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';
import { createHmac, randomBytes } from 'crypto';
import { ensureAuthSchema, createTeam } from '@/lib/auth-db';
import { Resend } from 'resend';

const DODO_TEAM_PRODUCT_ID = process.env.DODO_CXGRD_TEAM_KEY ?? '';
const resend = new Resend(process.env.RESEND_API_KEY);
const SITE_URL = process.env.SITE_URL ?? 'https://cxgrd.com';

// ─── Signature verification ───────────────────────────────────────────────────

function verifyDodoSignature(
  rawBody: string,
  webhookId: string,
  webhookTimestamp: string,
  webhookSignature: string,
  secret: string,
): boolean {
  try {
    const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
    const cleanSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret;
    const secretBytes = Buffer.from(cleanSecret, 'base64');
    const expected = createHmac('sha256', secretBytes).update(signedContent).digest('base64');
    const signatures = webhookSignature.split(' ');
    for (const sig of signatures) {
      const sigValue = sig.startsWith('v1,') ? sig.slice(3) : sig;
      if (sigValue === expected) return true;
    }
    return false;
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractAccountId(data: any): string | null {
  return data?.customer?.metadata?.account_id ?? data?.metadata?.account_id ?? null;
}

function extractIntentId(data: any): string | null {
  return data?.customer?.metadata?.intent_id ?? data?.metadata?.intent_id ?? null;
}

function extractProductId(data: any): string | null {
  return data?.product_id ?? data?.items?.[0]?.product_id ?? null;
}

// ─── Email helper ─────────────────────────────────────────────────────────────

async function sendInviteEmail({
  toEmail,
  teamName,
  teamId,
  inviteToken,
}: {
  toEmail: string;
  teamName: string;
  teamId: string;
  inviteToken: string;
}): Promise<void> {
  const inviteLink = `${SITE_URL}/team/invite?team=${teamId}&token=${inviteToken}`;

  await resend.emails.send({
    from: 'cxgrd <hello@cxgrd.com>',
    to: toEmail,
    subject: `Your ${teamName} team is ready on cxgrd`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#0f172a">
        <h2 style="margin-bottom:8px">Your team is live 🎉</h2>
        <p style="color:#475569">
          <strong>${teamName}</strong> has been set up on cxgrd.
          Share the link below with your teammates so they can join:
        </p>
        <a href="${inviteLink}"
           style="display:inline-block;margin:16px 0;padding:12px 24px;
                  background:#6366f1;color:#fff;border-radius:8px;
                  text-decoration:none;font-weight:600">
          Join ${teamName} on cxgrd →
        </a>
        <p style="font-size:13px;color:#94a3b8">
          Link expires in 30 days. Contact team owner for a new invite if needed.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
        <p style="font-size:12px;color:#94a3b8">cxgrd · AI Context Guardrail</p>
      </div>
    `,
  });

  console.log(`✅ Invite email sent to ${toEmail} — link: ${inviteLink}`);
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handlePaymentSucceeded(data: any): Promise<void> {
  const productId  = extractProductId(data);
  const accountId  = extractAccountId(data);
  const intentId   = extractIntentId(data);
  const customerEmail = data?.customer?.email as string | undefined;

  // ── Team plan payment ────────────────────────────────────────────────────────
  if (productId === DODO_TEAM_PRODUCT_ID) {
    await handleTeamPayment({ intentId, accountId, customerEmail, data });
    return;
  }

  // ── Pro plan payment (existing logic) ────────────────────────────────────────
  if (!accountId) {
    console.warn('payment.succeeded — no account_id in metadata. customer:', JSON.stringify(data?.customer));
    return;
  }

  const existing = await dbQuery<{ plan: string }>(
    `select plan from individual_accounts where id = $1`,
    [accountId],
  );
  if (existing.rows[0]?.plan === 'pro' || existing.rows[0]?.plan === 'team') {
    console.log(`payment.succeeded — account ${accountId} already ${existing.rows[0].plan}, skipping`);
    return;
  }

  await dbQuery(
    `update individual_accounts set plan = 'pro', updated_at = now() where id = $1`,
    [accountId],
  );
  console.log(`✅ Pro activated for account_id=${accountId}`);
}

async function handleTeamPayment(input: {
  intentId: string | null;
  accountId: string | null;
  customerEmail: string | undefined;
  data: any;
}): Promise<void> {
  const { intentId, accountId, customerEmail, data } = input;

  await ensureAuthSchema();

  // Ensure intent table exists (with account_id column)
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

  // ── Resolve team name, seat count, and account_id from intent ────────────────
  let teamName  = (data?.metadata?.team_name as string | undefined) ?? 'My Team';
  let seatCount = parseInt(data?.metadata?.seat_count ?? data?.quantity ?? '5', 10);
  let resolvedAccountId = accountId; // prefer metadata[account_id] from checkout

  if (intentId) {
    const intent = await dbQuery<{
      team_name: string;
      seat_count: number;
      email: string;
      used: boolean;
      account_id: string | null;
    }>(
      `select team_name, seat_count, email, used, account_id
       from team_purchase_intents where id = $1`,
      [intentId],
    );
    if (intent.rows[0] && !intent.rows[0].used) {
      teamName  = intent.rows[0].team_name;
      seatCount = intent.rows[0].seat_count;
      // Use account_id from intent if not already in checkout metadata
      resolvedAccountId ??= intent.rows[0].account_id;
      await dbQuery(`update team_purchase_intents set used = true where id = $1`, [intentId]);
    }
  }

  seatCount = Math.max(5, seatCount || 5);

  // ── Find the owner account ────────────────────────────────────────────────────
  let ownerId: string | null = resolvedAccountId;

  if (!ownerId && customerEmail) {
    const account = await dbQuery<{ id: string }>(
      `select id from individual_accounts where email = $1 limit 1`,
      [customerEmail.toLowerCase()],
    );
    ownerId = account.rows[0]?.id ?? null;
  }

  if (!ownerId) {
    console.warn('handleTeamPayment — could not resolve owner account. email:', customerEmail);
    return;
  }

  // ── Upgrade account to team plan ─────────────────────────────────────────────
  await dbQuery(
    `update individual_accounts set plan = 'team', updated_at = now() where id = $1`,
    [ownerId],
  );

  // ── Create team (idempotent) ──────────────────────────────────────────────────
  const existingTeam = await dbQuery<{ id: string }>(
    `select id from teams where owner_id = $1 limit 1`,
    [ownerId],
  );

  let teamId: string;
  if (existingTeam.rows[0]) {
    teamId = existingTeam.rows[0].id;
    await dbQuery(
      `update teams set seat_count = $1, updated_at = now() where id = $2`,
      [seatCount, teamId],
    );
    console.log(`Team already exists for owner ${ownerId}, updated seat count to ${seatCount}`);
  } else {
    const team = await createTeam({ name: teamName, ownerId, seatCount });
    teamId = team.id;
    console.log(`✅ Team created: ${teamId} (${teamName}, ${seatCount} seats) for owner ${ownerId}`);
  }

  // ── Generate invite token ─────────────────────────────────────────────────────
  await dbQuery(`
    create table if not exists team_invite_tokens (
      token text primary key,
      team_id uuid not null references teams(id) on delete cascade,
      created_by text not null,
      created_at timestamptz not null default now(),
      expires_at timestamptz not null default (now() + interval '30 days')
    );
  `);

  const inviteToken = randomBytes(24).toString('hex');
  await dbQuery(
    `insert into team_invite_tokens (token, team_id, created_by)
     values ($1, $2, $3)
     on conflict (token) do nothing`,
    [inviteToken, teamId, customerEmail ?? ownerId],
  );

  // ── Send invite email to the owner ───────────────────────────────────────────
  if (customerEmail) {
    await sendInviteEmail({
      toEmail: customerEmail,
      teamName,
      teamId,
      inviteToken,
    }).catch(err => console.error('Failed to send invite email:', err));
  } else {
    console.warn('No customer email — skipping invite email for team:', teamId);
  }
}

async function handleRefundSucceeded(data: any): Promise<void> {
  const accountId = extractAccountId(data);
  if (!accountId) { console.warn('refund.succeeded — no account_id'); return; }
  await dbQuery(
    `update individual_accounts set plan = 'free', updated_at = now() where id = $1`,
    [accountId],
  );
  console.log(`Downgraded account_id=${accountId} to free after refund`);
}

async function handleSubscriptionCancelled(data: any): Promise<void> {
  const accountId = extractAccountId(data);
  if (!accountId) { console.warn('subscription.cancelled — no account_id'); return; }
  await dbQuery(
    `update individual_accounts set plan = 'free', updated_at = now() where id = $1`,
    [accountId],
  );
  console.log(`Downgraded account_id=${accountId} to free after cancellation`);
}

async function handlePaymentFailed(data: any): Promise<void> {
  console.warn('payment.failed — payment_id:', data?.payment_id, 'email:', data?.customer?.email);
}

async function handleAbandonedCheckout(data: any): Promise<void> {
  console.log('abandoned_checkout.detected — email:', data?.customer?.email);
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('DODO_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  const webhookId        = request.headers.get('webhook-id') ?? '';
  const webhookTimestamp = request.headers.get('webhook-timestamp') ?? '';
  const webhookSignature = request.headers.get('webhook-signature') ?? '';

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 });
  }

  if (!verifyDodoSignature(rawBody, webhookId, webhookTimestamp, webhookSignature, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: { type: string; data: any };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log(`Dodo webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case 'payment.succeeded':           await handlePaymentSucceeded(event.data);       break;
      case 'refund.succeeded':            await handleRefundSucceeded(event.data);        break;
      case 'subscription.cancelled':      await handleSubscriptionCancelled(event.data);  break;
      case 'payment.failed':              await handlePaymentFailed(event.data);          break;
      case 'abandoned_checkout.detected': await handleAbandonedCheckout(event.data);      break;
      default: console.log(`Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error in handler for ${event.type}:`, err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
