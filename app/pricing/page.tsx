'use client';

import Image from "next/image";
import { Footer } from "@/components/Footer";
import { useState } from "react";

// Replace with your actual Dodo Payments product/checkout URL
const DODO_PRO_CHECKOUT_URL = "https://checkout.dodopayments.com/buy/pdt_0Ng6EAXoE8ybCQmeyWYtB";

const pricingTiers = [
  {
    name: "Free",
    description: "Perfect for exploring CXGRD locally",
    price: "$0",
    period: "forever",
    features: [
      "50 audits per month",
      "Local dependency graph (AST)",
      "Blast radius analysis",
      "Compiler-backed checks",
      "No cloud storage",
    ],
    cta: "Get Started Free",
    ctaVariant: "secondary" as const,
    highlight: false,
    action: "free",
  },
  {
    name: "Pro",
    description: "For individual developers and small teams",
    price: "$19",
    period: "month",
    features: [
      "Unlimited audits",
      "Prompt enrichment & repo memory",
      "Advanced analysis features",
      "Cloud backup & sync",
      "Priority support",
    ],
    cta: "Get Pro",
    ctaVariant: "primary" as const,
    highlight: true,
    action: "pro",
  },
  {
    name: "Team",
    description: "For growing teams with shared governance",
    price: "$16/seat",
    period: "month",
    features: [
      "Everything in Pro, plus:",
      "Shared dependency graph",
      "Role-based audit policies",
      "Team dashboard & analytics",
      "Architecture health metrics",
      "Merge policy enforcement",
    ],
    cta: "Get Team",
    ctaVariant: "primary" as const,
    highlight: false,
    action: "team",
  },
  {
    name: "Enterprise",
    description: "For organizations with custom needs",
    price: "Custom",
    period: "pricing",
    features: [
      "Everything in Team, plus:",
      "SSO & advanced auth",
      "Jira / Linear integration",
      "Custom policy engine",
      "Dedicated support",
      "On-premise options",
    ],
    cta: "Coming Soon",
    ctaVariant: "secondary" as const,
    highlight: false,
    action: "coming_soon",
  },
];

export default function PricingPage() {
  const githubLink = process.env.NEXT_PUBLIC_GITHUB_ORG_LINK || "https://github.com/cxgrd";
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleCta = async (action: string, tierName: string) => {
    if (action === "coming_soon") return;

    if (action === "free") {
      window.location.href = "/#install";
      return;
    }

    if (action === "pro") {
      setLoadingTier(tierName);
      window.location.href = `/api/auth/github/start?intent=upgrade&plan=pro`;
      return;
    }

    if (action === "team") {
      setLoadingTier(tierName);
      window.location.href = `/api/auth/github/start?intent=upgrade&plan=team`;
      return;
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#05070f] text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora-orb aurora-orb--one"></div>
        <div className="aurora-orb aurora-orb--two"></div>
        <div className="aurora-orb aurora-orb--three"></div>
        <div className="grid-overlay"></div>
      </div>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#05070f]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="inline-flex items-center gap-3">
            <Image src="/cxgrdlogo.png" alt="cxgrd logo" width={36} height={36} className="rounded-lg" priority />
            <div className="flex flex-col leading-none">
              <span className="text-base font-semibold tracking-tight text-white">cxgrd</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-blue-200/80">
                AI Context Guardrail
              </span>
            </div>
          </a>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="/#how-it-works" className="transition-colors hover:text-white">How it works</a>
            <a href="/#architecture" className="transition-colors hover:text-white">Architecture</a>
            <a href="/#install" className="transition-colors hover:text-white">Install</a>
            <a href="/pricing" className="font-medium text-white transition-colors hover:text-white">Pricing</a>
            <a href="https://cxgrd.com/docs" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">Docs</a>
          </nav>

          <a
            href={githubLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-all duration-300 hover:border-blue-300/60 hover:text-white hover:shadow-lg hover:shadow-blue-500/20"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-24 pt-14 sm:pt-20">
        <section className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs font-medium text-blue-100">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
            Flexible plans for every stage
          </div>

          <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
            Simple, predictable{" "}
            <span className="animated-gradient-text bg-gradient-to-r from-blue-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
              pricing
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-pretty text-base leading-relaxed text-slate-300 sm:text-lg">
            Start free and scale as you grow. No credit card required for the free tier.
          </p>
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-2 xl:grid-cols-4">
          {pricingTiers.map((tier) => (
            <article
              key={tier.name}
              className={`feature-card glass-surface flex flex-col rounded-2xl p-8 ${
                tier.highlight ? "border-blue-400/40 shadow-lg shadow-blue-500/20 xl:scale-105" : ""
              }`}
            >
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white">{tier.name}</h3>
                <p className="mt-2 text-sm text-slate-400">{tier.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{tier.price}</span>
                {tier.period && <span className="ml-2 text-sm text-slate-400">/ {tier.period}</span>}
              </div>

              <button
                onClick={() => handleCta(tier.action, tier.name)}
                disabled={tier.action === "coming_soon" || loadingTier === tier.name}
                className={`mb-8 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                  tier.ctaVariant === "primary"
                    ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 text-white hover:-translate-y-0.5 hover:from-blue-400 hover:via-indigo-400 hover:to-violet-400 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-60"
                    : "border border-white/15 text-slate-200 hover:border-blue-300/60 hover:text-white hover:shadow-lg hover:shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                }`}
              >
                {loadingTier === tier.name ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></span>
                    Redirecting...
                  </span>
                ) : (
                  tier.cta
                )}
              </button>

              <div className="space-y-3">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-blue-300"></span>
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="mt-20 rounded-2xl border border-white/10 bg-slate-950/40 p-12 text-center">
          <h2 className="text-2xl font-semibold text-white">Need a custom plan?</h2>
          <p className="mt-2 text-slate-300">
            For enterprise deployments, SSO, and custom integrations, let's talk.
          </p>
          <a
            href="mailto:hello@cxgrd.com"
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/15 px-6 py-3 text-sm font-medium text-slate-200 transition-all duration-300 hover:border-blue-300/60 hover:text-white hover:shadow-lg hover:shadow-blue-500/20"
          >
            Coming soon
          </a>
        </section>

        <section className="mt-16 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-8">
          <h3 className="text-lg font-semibold text-white">All plans include</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "AST-powered dependency graph",
              "Blast radius calculation",
              "Compiler-backed validation",
              "Command-line interface",
              "JSON export formats",
              "Local .cg/ repo memory",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
}
