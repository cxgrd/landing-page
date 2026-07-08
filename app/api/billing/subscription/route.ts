import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-token';
import { dbQuery } from '@/lib/db';

export async function GET(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '') 
    ?? request.headers.get('cookie')?.match(/cxgrd_token=([^;]+)/)?.[1];

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const claims = verifyAuthToken(token);
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { rows } = await dbQuery<{ dodo_customer_id: string | null }>(
    `select dodo_customer_id from individual_accounts where id = $1`,
    [claims.sub]
  );

  const customerId = rows[0]?.dodo_customer_id;
  if (!customerId) return NextResponse.json({ error: 'No subscription found' }, { status: 404 });

  const res = await fetch(`https://live.dodopayments.com/subscriptions?customer_id=${customerId}`, {
    headers: { Authorization: `Bearer ${process.env.DODO_API_KEY}` },
  });

  const text = await res.text();
  if (!res.ok || !text) {
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }

  const { items } = JSON.parse(text);
  const sub = items?.[0];

  if (!sub) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
  }

  // map product_id to plan
  const TEAM_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_CXGRD_TEAM_KEY ?? '';
  const PRO_PRODUCT_ID = process.env.DODO_CXGRD_PRO_KEY ?? '';

  const plan = sub.product_id === TEAM_PRODUCT_ID ? 'team'
            : sub.product_id === PRO_PRODUCT_ID  ? 'pro'
            : 'free';

  return NextResponse.json({
    plan,
    status: sub.status,
    renewsAt: sub.next_billing_date,
    startedAt: sub.created_at,
    amount: sub.recurring_pre_tax_amount,  // already in cents
    cycle: sub.payment_frequency_interval.toLowerCase(), // "month" or "year"
    seats: undefined,
    portalUrl: null,
  });
}