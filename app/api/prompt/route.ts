import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from '@/lib/auth-token';
import { isProPlan } from '@/lib/plans';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const claims = verifyAuthToken(token);
    if (!claims) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
    if (!isProPlan(claims.plan)) {
      return NextResponse.json(
        { error: "Prompt enrichment requires Pro. Upgrade at https://cxgrd.com/upgrade" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { context, userPrompt } = body;
    if (!context) {
      return NextResponse.json({ error: "Missing context" }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: "LLM not configured on server" }, { status: 501 });
    }

    const systemPrompt = `You are an expert software architect helping a developer write a precise prompt for their AI coding assistant (Cursor, Copilot, Claude, etc.).

Given dependency graph context, blast radius, symbols, and repo memory from the cxgrd tool, produce ONE markdown prompt the developer can paste into their AI assistant.

Requirements:
- Preserve the developer's original intent
- List concrete files/modules to touch and why
- Mention architectural layers and dependency constraints
- Include verification steps (tests, cxgrd check)
- Be actionable and concise (under 800 words)
- Do not invent files not mentioned in the context`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 2048,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate the enriched AI coding prompt from this cxgrd context:\n\n${context}\n\nUser request: ${userPrompt || 'See context above'}` }
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      console.error('Groq error:', err);
      return NextResponse.json({ error: "LLM request failed" }, { status: 502 });
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const enrichedPrompt = data.choices?.[0]?.message?.content?.trim();
    if (!enrichedPrompt) {
      return NextResponse.json({ error: "LLM returned empty response" }, { status: 502 });
    }

    return NextResponse.json({
      prompt: enrichedPrompt,
      model: 'llama-3.3-70b-versatile',
      provider: 'groq',
      usage: {
        input_tokens: data.usage?.prompt_tokens ?? 0,
        output_tokens: data.usage?.completion_tokens ?? 0,
      },
    });

  } catch (error) {
    console.error("Prompt generation error:", error);
    return NextResponse.json({ error: "Failed to generate prompt" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "POST request required" }, { status: 405 });
}
