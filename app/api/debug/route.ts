// website/app/api/debug/route.ts  ← delete this file after fixing
import { verifyAuthToken } from "@/lib/auth-token";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
//   const token = searchParams.get("token") || "";
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.slice(7) || "";
  
  const claims = verifyAuthToken(token);

  return NextResponse.json({
    secret_prefix: (process.env.CXGRD_AUTH_TOKEN_SECRET || 'MISSING').slice(0, 8),
    secret_length: (process.env.CXGRD_AUTH_TOKEN_SECRET || '').length,
    groq_exists: !!process.env.GROQ_API_KEY,
    db_exists: !!process.env.DATABASE_URL,
    claims_result: claims ? 'VALID' : 'NULL',
    claims,
    header_received: authHeader?.slice(0, 30),
    token_length: token.length,
  });
}