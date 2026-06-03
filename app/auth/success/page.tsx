'use client';

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source"); // "cli" or null
  const plan = searchParams.get("plan");

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
          {source === "cli" ? "You're signed in!" : `You're on ${plan || "Pro"}!`}
        </h1>

        <p className="mt-4 text-sm text-slate-400">
          {source === "cli"
            ? "Your CLI is now authenticated. Return to your terminal — it will pick up automatically."
            : "Your plan has been activated. Run cxgrd auth login to unlock Pro features in your CLI."}
        </p>

        {source === "cli" && (
          <div className="mt-8 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-left">
            <p className="text-xs font-semibold text-blue-200">Back in your terminal:</p>
            <code className="mt-2 block text-xs text-slate-300">
              ✓ Authenticated successfully<br />
              ✓ Plan: Pro<br />
              → Run cxgrd prompt "your change" to get started
            </code>
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
