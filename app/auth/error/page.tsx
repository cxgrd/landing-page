'use client';

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const errorMessages: Record<string, string> = {
  missing_params: "Missing required parameters. Please try again.",
  invalid_state: "Security check failed. Please try again.",
  auth_failed: "Authentication failed. Please try again.",
  not_configured: "Auth is not configured yet.",
  access_denied: "You denied access. Please try again if this was a mistake.",
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "auth_failed";
  const message = errorMessages[reason] || errorMessages.auth_failed;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="glass-surface rounded-2xl p-10 text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-500/20 p-4">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-white">Authentication failed</h1>
        <p className="mt-4 text-sm text-slate-400">{message}</p>

        <div className="mt-8 flex flex-col gap-3">
          <a
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25"
          >
            Try again
          </a>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-6 py-3 text-sm font-medium text-slate-200 transition-all hover:border-blue-300/60 hover:text-white"
          >
            Back to home
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
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
          <ErrorContent />
        </Suspense>
      </main>
    </div>
  );
}
