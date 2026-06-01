import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/auth/cli/session/{sessionId}
 * 
 * Poll endpoint for CLI to check auth status.
 * 
 * The CLI calls this repeatedly after opening the auth flow:
 * - Open: GET {AUTH_BASE_URL}/auth/cli?session={uuid}
 * - Poll: GET /api/auth/cli/session/{sessionId}
 * 
 * Response codes:
 * - 202 Accepted: {"status": "pending"} - Keep polling
 * - 200 OK: {"token": "jwt", "plan": "pro", "email": "...", "expires_at": 123456789}
 * - 404 Not Found: Auth not available (dev uses CXGRD_DEV_PLAN)
 * - 501 Not Implemented: Auth API not ready yet
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session ID" },
        { status: 400 }
      );
    }

    // In production, check Redis or database for JWT associated with sessionId
    // The GitHub OAuth callback handler (in /api/auth/github) stores the token
    // 
    // Pseudo-code:
    // const session = await redis.get(`auth_session:${sessionId}`)
    // if (!session) return 202 (still pending)
    // if (session.token) return 200 with token
    // if (session.error) return 400 with error

    // Mock implementation
    console.log(`[Auth] CLI polling session: ${sessionId}`);

    // For demonstration, return pending after a few seconds
    // In production, this would check the actual session state
    const mockToken = JSON.stringify({
      sub: "user_123",
      email: "developer@example.com",
      plan: "pro",
      org_id: "org_456",
      org_name: "Developer Team",
      role: "member",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    });

    return NextResponse.json(
      {
        token: mockToken,
        plan: "pro",
        email: "developer@example.com",
        expires_at: Math.floor(Date.now() / 1000) + 86400,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { error: "Failed to check session" },
      { status: 500 }
    );
  }
}
