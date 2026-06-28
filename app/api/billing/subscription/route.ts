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

  const res = await fetch(`https://live.dodopayments.com/customers/${customerId}/subscriptions`, {
    headers: { Authorization: `Bearer ${process.env.DODO_API_KEY}` },
  });

  const text = await res.text();
  console.log('Dodo status:', res.status, 'body:', text);

  if (!text) {
    return NextResponse.json({ error: 'Empty response from Dodo' }, { status: 500 });
  }

  const subscription = JSON.parse(text);
  return NextResponse.json(subscription);
}