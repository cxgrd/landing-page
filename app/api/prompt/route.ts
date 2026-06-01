import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/prompt
 * 
 * Generate an enriched, architecture-aware prompt for the CLI.
 * 
 * This endpoint:
 * 1. Accepts cxgrd subgraph context (dependency graph + repo memory)
 * 2. Sends to LLM (Groq, OpenAI, etc.) with instructions to enrich the prompt
 * 3. Returns architecture-aware prompt for safer code generation
 * 
 * Request:
 * {
 *   "context": "# Subgraph...\n## Files...",
 *   "userPrompt": "Add authentication to the API" (optional)
 * }
 * 
 * Response:
 * {
 *   "prompt": "# Enriched prompt with architectural context",
 *   "model": "groq/mixtral-8x7b",
 *   "provider": "groq",
 *   "usage": {
 *     "input_tokens": 1200,
 *     "output_tokens": 450
 *   }
 * }
 * 
 * Auth:
 * Requires valid JWT in Authorization header (from cxgrd auth login)
 * Pro+ users get access to this endpoint.
 * Free tier: 404 Not Found or 501 Not Implemented
 */
export async function POST(request: NextRequest) {
  try {
    // Check Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    // In production, verify JWT and check user plan
    // Return 404 for free tier users without this feature

    const body = await request.json();
    const { context, userPrompt } = body;

    if (!context) {
      return NextResponse.json(
        { error: "Missing context" },
        { status: 400 }
      );
    }

    // In production, call LLM API (Groq, OpenAI, etc.)
    // The server holds the API key, not the client
    const enrichedPrompt = await generateEnrichedPrompt(context, userPrompt);

    return NextResponse.json(
      {
        prompt: enrichedPrompt,
        model: "groq/mixtral-8x7b",
        provider: "groq",
        usage: {
          input_tokens: Math.floor(context.length / 4), // Rough estimate
          output_tokens: Math.floor(enrichedPrompt.length / 4),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Prompt generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate prompt" },
      { status: 500 }
    );
  }
}

/**
 * Generate an enriched prompt using LLM with architectural context
 * In production, this calls the actual LLM API (Groq, OpenAI, etc.)
 */
async function generateEnrichedPrompt(
  context: string,
  userPrompt?: string
): Promise<string> {
  // Mock implementation - in production, call actual LLM
  const systemPrompt = `You are an expert software architect analyzing a codebase structure and dependency graph.
Your task is to enrich the user's prompt with architectural context and suggestions for safe implementation.

Context about the codebase:
${context}

Guidelines:
1. Identify affected files and modules
2. Suggest architectural patterns that fit the existing codebase
3. Warn about potential breaking changes
4. Recommend compilation and test strategies
5. Keep the enriched prompt concise but comprehensive`;

  const userMessage = userPrompt || "Generate a comprehensive code modification plan";

  // In production:
  // const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     model: 'mixtral-8x7b-32768',
  //     messages: [
  //       { role: 'system', content: systemPrompt },
  //       { role: 'user', content: userMessage }
  //     ],
  //     temperature: 0.7,
  //     max_tokens: 2048,
  //   }),
  // });

  // For now, return a mock enriched prompt
  const enrichedPrompt = `# Architectural Context Prompt

## User Request
${userMessage}

## Codebase Context
The following files and modules are relevant:
${context.split("\n").slice(0, 10).join("\n")}

## Recommended Approach
1. Review the dependency graph to understand affected modules
2. Check for breaking changes using compiler verification
3. Update related test files and type definitions
4. Follow existing architectural patterns in the codebase
5. Use cxgrd check to verify the implementation

## Compiler-Backed Verification
Make sure to run \`cxgrd check\` after implementation to catch:
- Missing imports
- Type errors
- Structural dependency breaks
- Missing test coverage`;

  return enrichedPrompt;
}

/**
 * GET /api/prompt
 * Not implemented - prompt generation requires POST with context
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: "POST request required" },
    { status: 405 }
  );
}
