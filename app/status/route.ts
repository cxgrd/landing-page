// app/api/health/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // Ensure consistency with main app runtime
export const dynamic = "force-dynamic"; // Prevent caching of health status

export async function GET() {
  try {
    // Example: Verify database connectivity (e.g., Supabase, Prisma, etc.)
    // Replace with your actual dependency check
    const dbCheck = await checkDatabaseHealth(); 

    if (!dbCheck) {
      throw new Error("Database connection failed");
    }

    return NextResponse.json(
      { status: "ok", timestamp: Date.now() },
      { 
        status: 200,
        headers: { "Cache-Control": "no-store" } // Prevent CDN caching
      }
    );
  } catch (error) {
    return NextResponse.json(
      { status: "unhealthy", error: (error as Error).message },
      { status: 503 }
    );
  }
}

async function checkDatabaseHealth() {
  // Implement your specific DB health check logic here
  return true; 
}   