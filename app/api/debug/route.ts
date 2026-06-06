import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth-token";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") || "";
  const claims = verifyAuthToken(token);

  return NextResponse.json({
    secret_prefix: (process.env.CXGRD_AUTH_TOKEN_SECRET || 'MISSING').slice(0, 8),
    secret_length: (process.env.CXGRD_AUTH_TOKEN_SECRET || '').length,
    groq_exists: !!process.env.GROQ_API_KEY,
    db_exists: !!process.env.DATABASE_URL,
    claims_result: claims ? 'VALID' : 'NULL',
    claims,
  });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.slice(7) || "";
  const claims = verifyAuthToken(token);

  return NextResponse.json({
    header_received: authHeader?.slice(0, 40) || 'MISSING',
    token_length: token.length,
    token_suffix: token.slice(-10),
    claims_result: claims ? 'VALID' : 'NULL',
    plan: claims?.plan || 'none',
  });
}
