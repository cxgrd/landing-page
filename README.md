# CXGRD Landing Page

A landing page for CXGRD - an AI architectural guardrail CLI tool.

## Features

- ✨ Dark theme with gradient effects
- 📧 Email waitlist integration with Resend
- 📱 Fully responsive design
- ⚡ Next.js 16 with TypeScript
- 🎨 Tailwind CSS for styling
- 🔐 Server-side email handling

## Project Structure

```
website/
├── app/
│   ├── page.tsx              # Main landing page
│   ├── layout.tsx            # Root layout with metadata
│   ├── globals.css           # Global styles
│   └── api/
│       └── subscribe/
│           └── route.ts      # Email subscription endpoint
├── components/
│   └── WaitlistForm.tsx      # Reusable waitlist form component
├── .env.local                # Environment configuration
└── package.json
```

Built for CXGRD - Architectural Guardrails for AI-Native Development
