'use client';

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source"); // "cli" or null
  const plan = (searchParams.get("plan") || "free") as "free" | "pro" | "team" | "enterprise";

  const isPro = plan === "pro" || plan === "team" || plan === "enterprise";

  const planLabel = {
    free: "Free",
    pro: "Pro",
    team: "Team",
    enterprise: "Enterprise",
  }[plan] || "Free";

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="glass-surface rounded-2xl p-10 text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-emerald-500/20 p-4">
            <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-white">
          You're signed in!
        </h1>

        <p className="mt-4 text-sm text-slate-400">
          {source === "cli"
            ? "Your CLI is now authenticated. Return to your terminal — it will pick up automatically."
            : `Your ${planLabel} plan is active.`}
        </p>

        {source === "cli" && (
          <div className="mt-8 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-left">
            <p className="text-xs font-semibold text-blue-200">Back in your terminal:</p>
            <code className="mt-2 block text-xs text-slate-300">
              ✓ Authenticated successfully<br />
              ✓ Plan: {planLabel}<br />
              {isPro
                ? '→ Run cxgrd prompt "your change" to get started'
                : '→ Run cxgrd scan to get started'}
            </code>
          </div>
        )}

        {/* Show upgrade nudge for free plan users */}
        {source === "cli" && !isPro && (
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-left">
            <p className="text-xs font-semibold text-amber-200">Want prompt enrichment?</p>
            <p className="mt-1 text-xs text-slate-300">
              You're on the Free plan. Upgrade to Pro to unlock{" "}
              <code className="text-blue-300">cxgrd prompt</code> and repo memory.
            </p>
            <a
              href="/pricing"
              className="mt-3 inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-blue-500 to-violet-500 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Upgrade to Pro →
            </a>
          </div>
        )}

        <a
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-lg border border-white/15 px-6 py-3 text-sm font-medium text-slate-200 transition-all duration-300 hover:border-blue-300/60 hover:text-white"
        >
          Back to home
        </a>
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#05070f] text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora-orb aurora-orb--one"></div>
        <div className="aurora-orb aurora-orb--two"></div>
        <div className="grid-overlay"></div>
      </div>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#05070f]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center px-6 py-4">
          <a href="/" className="inline-flex items-center gap-3">
            <Image src="/cxgrdlogo.png" alt="cxgrd" width={36} height={36} className="rounded-lg" />
            <span className="text-base font-semibold text-white">cxgrd</span>
          </a>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl items-center justify-center px-6 py-24">
        <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
          <SuccessContent />
        </Suspense>
      </main>
    </div>
  );
}
