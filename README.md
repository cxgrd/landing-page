# CXGRD Landing Page

The landing page for CXGRD - an AI architectural guardrail CLI tool.

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
├    └──api/
├        └──auth/
├            └──cli/           #cli auth route
├            └──github/        # github auth route
├        └──billing/           # routes for billing information and manage subscription pages
├        └──check/             # verification for team tier
├        └──prompt/            # LLM prompt route 
├        └──subscribe/         # waitlist route (no more in use)
├        └──teams/             # routes for shared dependency graph for teams
├        └──webhooks/          # github and dodo payments webhooks
├    └──auth/
├        └──cli/               # cli auth client
├        └──error/             # custom error page
├        └──github/            # github auth client page
├        └──success/           # auth success page
├    └──billing/               # billing information page
├    └──changelog/             # changelog page
├    └──checkout/              # checkout page placeholder (no more in use)
├    └──dashboard/             # team dashboard page
├    └──docs/                  # documentation for cxgrd
├    └──legal/                 # PP, T&C and Refund policy pages
├    └──pricing/               # pricing information page 
├    └──status/                # health route for status page
├    └──team/                  # team setup and invite pages
├── components/
├    └── WaitlistForm.tsx      # Reusable waitlist form component (no more in use)
├    └──Footer.tsx             # Common Footer for all pages
├    └──useNav.tsx             # navbar 
├── lib/                       # scripts for DB and plans
├── .env.local                 # Environment configuration
└── package.json and other files            # config files
```

Built for CXGRD - Architectural Guardrails for AI-Native Development
