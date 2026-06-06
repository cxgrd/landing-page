// website/app/api/debug/route.ts  ← delete this file after fixing
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    secret_prefix: (process.env.CXGRD_AUTH_TOKEN_SECRET || 'MISSING').slice(0, 8),
    secret_length: (process.env.CXGRD_AUTH_TOKEN_SECRET || '').length,
    groq_exists: !!process.env.GROQ_API_KEY,
    db_exists: !!process.env.DATABASE_URL,
  });
}