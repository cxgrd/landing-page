'use client';

import Image from "next/image";
import { Suspense } from "react";
import { AuthClientContent } from "./auth-client";

export default function CLIAuthPage() {
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
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl items-center justify-center px-6 py-24">
        <div className="mx-auto w-full max-w-md">
          <div className="glass-surface rounded-2xl p-10">
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-400"></div>
                  <p className="mt-4 text-center text-sm text-slate-300">Loading...</p>
                </div>
              }
            >
              <AuthClientContent />
            </Suspense>
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
