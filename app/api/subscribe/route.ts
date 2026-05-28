import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Retrieve from environment - these must be set in .env.local
    const ownerEmail = process.env.OWNER_EMAIL || 'owner@example.com';
    const githubLink = process.env.GITHUB_ORG_LINK || 'https://github.com';

    // Send confirmation email to user
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Welcome to CXGRD - Your Architectural Guardrail',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to CXGRD!</h1>
          </div>
          <div style="padding: 40px; background: #f9fafb;">
            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
              Thanks for joining our waitlist. You're now in line to access <strong>CXGRD</strong>, the AI-native architectural guardrail for your codebase.
            </p>
            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
              CXGRD will help you:
            </p>
            <ul style="margin: 0 0 20px 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
              <li>Map dependencies across your codebase</li>
              <li>Calculate the blast radius before AI makes sweeping changes</li>
              <li>Catch logic gaps and missing imports before committing</li>
            </ul>
            <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
              We'll notify you as soon as early access becomes available.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${githubLink}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Follow on GitHub
              </a>
            </div>
          </div>
          <div style="padding: 20px; background: #f3f4f6; text-align: center; color: #6b7280; font-size: 12px; border-radius: 0 0 12px 12px;">
            <p style="margin: 0;">CXGRD — Architectural Guardrails for AI-Native Development</p>
          </div>
        </div>
      `,
    });

    // Send notification email to owner
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ownerEmail,
      subject: `🎉 New Waitlist Signup: ${email}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p style="font-size: 16px; margin: 0 0 10px 0;"><strong>New CXGRD waitlist signup!</strong></p>
          <p style="font-size: 14px; margin: 0; color: #3b82f6; font-weight: 600;">${email}</p>
        </div>
      `,
    });

    return NextResponse.json(
      { message: 'Successfully subscribed to waitlist' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe to waitlist' },
      { status: 500 }
    );
  }
}
