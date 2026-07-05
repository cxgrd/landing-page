'use client';

// This WAS just a placeholder page

import Image from "next/image";

export default function CheckoutPage() {
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
            <Image
              src="/cxgrdlogo.png"
              alt="cxgrd logo"
              width={36}
              height={36}
              className="rounded-lg"
              priority
            />
            <div className="flex flex-col leading-none">
              <span className="text-base font-semibold tracking-tight text-white">cxgrd</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-blue-200/80">
                AI Context Guardrail
              </span>
            </div>
          </a>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="/#how-it-works" className="transition-colors hover:text-white">
              How it works
            </a>
            <a href="/pricing" className="transition-colors hover:text-white">
              Pricing
            </a>
            <a 
              href="https://cxgrd.com/docs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
            >
              Docs
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl items-center justify-center px-6 py-24">
        <div className="mx-auto w-full max-w-2xl text-center">
          <div className="glass-surface rounded-2xl p-12">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs font-medium text-blue-100">
              <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></span>
              Checkout Coming Soon
            </div>

            <h1 className="text-4xl font-semibold text-white">
              Dodo Payment Integration
            </h1>

            <p className="mt-6 text-lg text-slate-300">
              The secure checkout experience powered by{" "}
              <span className="font-semibold">Dodo Payments</span> is being set up.
            </p>

            <div className="mt-10 space-y-4 text-left">
              <div className="feature-card glass-surface rounded-xl p-5">
                <p className="text-sm font-semibold text-blue-200">🔐 Secure</p>
                <p className="mt-2 text-sm text-slate-300">
                  PCI-DSS compliant payment processing
                </p>
              </div>

              <div className="feature-card glass-surface rounded-xl p-5">
                <p className="text-sm font-semibold text-blue-200">🌍 Global</p>
                <p className="mt-2 text-sm text-slate-300">
                  Multiple payment methods and currencies
                </p>
              </div>

              <div className="feature-card glass-surface rounded-xl p-5">
                <p className="text-sm font-semibold text-blue-200">⚡ Fast</p>
                <p className="mt-2 text-sm text-slate-300">
                  Instant subscription activation
                </p>
              </div>
            </div>

            <p className="mt-10 text-sm text-slate-400">
              Join the waitlist to be notified when Pro subscriptions launch.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-400 hover:via-indigo-400 hover:to-violet-400 hover:shadow-lg hover:shadow-blue-500/25"
              >
                Back to Home
              </a>
              <a
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-6 py-3 text-sm font-medium text-slate-200 transition-all duration-300 hover:border-blue-300/60 hover:text-white hover:shadow-lg hover:shadow-blue-500/20"
              >
                View Pricing
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-16 border-t border-white/10 bg-[#05070f]/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-6 py-8 text-center text-xs text-slate-400 sm:flex-row sm:text-left">
          <p className="text-sm">cxgrd — AI context guardrails for AI-native development.</p>
          <p>© 2026 · Early access in progress.</p>
        </div>
      </footer>
    </div>
  );
}
