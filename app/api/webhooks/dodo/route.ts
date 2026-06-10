import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from '@/lib/db';
import { createHmac } from 'crypto';

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

    // Strip whsec_ prefix if present before base64 decoding
    const cleanSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret;
    const secretBytes = Buffer.from(cleanSecret, 'base64');

    const expected = createHmac('sha256', secretBytes)
      .update(signedContent)
      .digest('base64');

    // Dodo may send multiple signatures: "v1,<sig1> v1,<sig2>"
    const signatures = webhookSignature.split(' ');
    for (const sig of signatures) {
      const sigValue = sig.startsWith('v1,') ? sig.slice(3) : sig;
      if (sigValue === expected) return true;
    }

    // Debug log — remove after fixing
    // console.log('Signature mismatch');
    // console.log('Expected:', expected);
    // console.log('Received:', webhookSignature);
    // console.log('Signed content prefix:', signedContent.slice(0, 80));
    return false;
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractAccountId(data: any): string | null {
  return (
    data?.customer?.metadata?.account_id ??
    data?.metadata?.account_id ??
    null
  );
}

// ─── Event handlers ───────────────────────────────────────────────────────────

async function handlePaymentSucceeded(data: any): Promise<void> {
  const accountId = extractAccountId(data);

  if (!accountId) {
    console.warn('payment.succeeded — no account_id in metadata. customer:', JSON.stringify(data?.customer));
    return;
  }

  const existing = await dbQuery<{ plan: string }>(
    `select plan from individual_accounts where id = $1`,
    [accountId]
  );

  if (existing.rows[0]?.plan === 'pro') {
    console.log(`payment.succeeded — account ${accountId} already pro, skipping`);
    return;
  }

  await dbQuery(
    `update individual_accounts set plan = 'pro', updated_at = now() where id = $1`,
    [accountId]
  );

  console.log(`✅ Pro activated for account_id=${accountId}`);
}

async function handleRefundSucceeded(data: any): Promise<void> {
  const accountId = extractAccountId(data);
  if (!accountId) { console.warn('refund.succeeded — no account_id'); return; }

  await dbQuery(
    `update individual_accounts set plan = 'free', updated_at = now() where id = $1`,
    [accountId]
  );
  console.log(`Downgraded account_id=${accountId} to free after refund`);
}

async function handleSubscriptionCancelled(data: any): Promise<void> {
  const accountId = extractAccountId(data);
  if (!accountId) { console.warn('subscription.cancelled — no account_id'); return; }

  await dbQuery(
    `update individual_accounts set plan = 'free', updated_at = now() where id = $1`,
    [accountId]
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

  const webhookId = request.headers.get('webhook-id') ?? '';
  const webhookTimestamp = request.headers.get('webhook-timestamp') ?? '';
  const webhookSignature = request.headers.get('webhook-signature') ?? '';

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    console.error('Missing webhook headers', { webhookId: !!webhookId, webhookTimestamp: !!webhookTimestamp, webhookSignature: !!webhookSignature });
    return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 });
  }

  const isValid = verifyDodoSignature(rawBody, webhookId, webhookTimestamp, webhookSignature, webhookSecret);
  if (!isValid) {
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
      case 'payment.succeeded':
        await handlePaymentSucceeded(event.data);
        break;
      case 'refund.succeeded':
        await handleRefundSucceeded(event.data);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.data);
        break;
      case 'payment.failed':
        await handlePaymentFailed(event.data);
        break;
      case 'abandoned_checkout.detected':
        await handleAbandonedCheckout(event.data);
        break;
      default:
        console.log(`Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error in handler for ${event.type}:`, err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
