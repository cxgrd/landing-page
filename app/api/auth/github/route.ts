import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/github
 * 
 * Callback endpoint for GitHub OAuth authentication.
 * 
 * The CLI auth flow:
 * 1. User runs `cxgrd auth login`
 * 2. CLI opens GET {AUTH_BASE_URL}/auth/cli?session={uuid} in browser
 * 3. User completes GitHub OAuth (via Supabase) in the browser
 * 4. Server calls this endpoint to associate JWT with session
 * 5. CLI polls /api/auth/cli/session/{sessionId} until ready
 * 
 * Request body:
 * {
 *   "sessionId": "uuid",
 *   "code": "github_oauth_code" (from GitHub callback)
 * }
 * 
 * Response:
 * {
 *   "status": "success" | "error",
 *   "token": "jwt_token" (if success),
 *   "error": "error_message" (if error)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, code } = body;

    if (!sessionId) {
      return NextResponse.json(
        { status: "error", error: "Missing session ID" },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Exchange `code` for GitHub token via Supabase
    // 2. Fetch user info from GitHub
    // 3. Create or update user in Supabase
    // 4. Generate JWT token
    // 5. Store JWT in Redis/database associated with sessionId
    // 6. Set expiration (e.g., 10 minutes for CLI to poll)

    // For now, return a placeholder response
    const mockToken = Buffer.from(
      JSON.stringify({
        sub: "user_123",
        email: "developer@example.com",
        plan: "pro",
        iss: "cxgrd",
        exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
      })
    ).toString("base64");

    console.log(`[Auth] GitHub auth callback for session: ${sessionId}`);

    return NextResponse.json(
      {
        status: "success",
        token: mockToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { status: "error", error: "Authentication failed" },
      { status: 500 }
    );
  }
}


