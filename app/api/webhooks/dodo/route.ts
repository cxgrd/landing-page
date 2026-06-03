import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from '@/lib/db';

export async function POST(request: NextRequest) {
  const event = await request.json();
  
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