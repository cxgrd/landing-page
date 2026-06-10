import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from '@/lib/db';
import { createHmac } from 'crypto';

function verifyDodoSignature(
  rawBody: string,
  webhookId: string,
  webhookTimestamp: string,
  webhookSignature: string,
  secret: string,
): boolean {
  try {
    // Dodo signs: webhookId + "." + webhookTimestamp + "." + rawBody
    const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;

    // Secret is base64 encoded — decode it first
    const secretBytes = Buffer.from(secret, 'base64');
    const expected = createHmac('sha256', secretBytes)
      .update(signedContent)
      .digest('base64');

    // Dodo sends multiple signatures separated by spaces: "v1,<sig1> v1,<sig2>"
    const signatures = webhookSignature.split(' ');
    for (const sig of signatures) {
      const sigValue = sig.startsWith('v1,') ? sig.slice(3) : sig;
      if (sigValue === expected) return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('DODO_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const rawBody = await request.text();

  // Dodo uses svix under the hood — these are the correct header names
  const webhookId = request.headers.get('webhook-id') ?? '';
  const webhookTimestamp = request.headers.get('webhook-timestamp') ?? '';
  const webhookSignature = request.headers.get('webhook-signature') ?? '';

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    console.error('Missing webhook headers', { webhookId, webhookTimestamp, webhookSignature });
    return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 });
  }

  const isValid = verifyDodoSignature(rawBody, webhookId, webhookTimestamp, webhookSignature, webhookSecret);
  if (!isValid) {
    console.error('Invalid webhook signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log('Dodo webhook received:', event.type);

  switch (event.type) {
    case 'payment.succeeded': {
      const accountId = event.data?.customer?.metadata?.account_id
        ?? event.data?.metadata?.account_id;

      if (accountId) {
        await dbQuery(
          `update individual_accounts set plan = 'pro', updated_at = now() where id = $1`,
          [accountId]
        );
        console.log(`Upgraded account ${accountId} to pro`);
      } else {
        console.warn('payment.succeeded — no account_id in metadata', event.data?.customer);
      }
      break;
    }

    case 'refund.succeeded':
    case 'subscription.cancelled': {
      const accountId = event.data?.customer?.metadata?.account_id
        ?? event.data?.metadata?.account_id;

      if (accountId) {
        await dbQuery(
          `update individual_accounts set plan = 'free', updated_at = now() where id = $1`,
          [accountId]
        );
        console.log(`Downgraded account ${accountId} to free`);
      }
      break;
    }

    case 'payment.failed': {
      console.warn('Payment failed:', event.data?.payment_id);
      break;
    }

    default:
      console.log('Unhandled webhook event:', event.type);
  }

  return NextResponse.json({ received: true });
}
