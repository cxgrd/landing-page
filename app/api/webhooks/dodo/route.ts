import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from '@/lib/db';

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('webhook-signature') ?? 
                    request.headers.get('x-dodo-signature') ?? '';

  // Verify signature before trusting the payload
  const { createHmac } = await import('crypto');
  const expected = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  if (signature !== `sha256=${expected}`) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.type === 'payment.succeeded') {
    const accountId = event.data.metadata?.account_id;
    if (accountId) {
      await dbQuery(
        `update individual_accounts set plan = 'pro', updated_at = now() where id = $1`,
        [accountId]
      );
    }
  }

  return NextResponse.json({ received: true });
}