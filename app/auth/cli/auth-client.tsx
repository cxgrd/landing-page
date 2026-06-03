'use client';

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthClientContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      router.push("/");
    }
  }, [sessionId, router]);

  const handleGitHubAuth = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: register the session as pending on the server
      const res = await fetch('/api/auth/cli/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) {
        throw new Error('Failed to initiate session');
      }

      // Step 2: redirect to GitHub OAuth via the correct API route
      window.location.href = `/api/auth/github/start?intent=cli&sessionId=${encodeURIComponent(sessionId)}`;
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex justify-center">
        <div className="rounded-xl bg-blue-500/20 p-4">
          <svg className="h-8 w-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </div>
      </div>

      <h1 className="text-center text-2xl font-semibold text-white">Sign in to CXGRD</h1>

      <p className="mt-4 text-center text-sm text-slate-400">
        Authenticate with GitHub to unlock Pro features and access advanced analysis.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-xs text-red-300">
          {error}
        </div>
      )}

      <button
        onClick={handleGitHubAuth}
        disabled={isLoading || !sessionId}
        className="mt-6 w-full rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-all duration-300 hover:shadow-lg hover:shadow-white/20 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/20 border-t-slate-900"></div>
            Signing in...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Continue with GitHub
          </>
        )}
      </button>

      <p className="mt-6 text-center text-xs text-slate-500">
        You'll be asked to authorize CXGRD to access your GitHub account for authentication only.
      </p>

      <div className="mt-8 space-y-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
        <p className="text-xs font-semibold text-blue-200">What happens next:</p>
        <ol className="space-y-2 text-xs text-slate-300">
          <li>1. You'll authorize CXGRD via GitHub OAuth</li>
          <li>2. Your session will be securely stored</li>
          <li>3. Return to your CLI — it picks up automatically</li>
          <li>4. Pro features are now unlocked</li>
        </ol>
      </div>

      {sessionId && (
        <p className="mt-4 text-center text-xs text-slate-600">
          Session: {sessionId.slice(0, 8)}...
        </p>
      )}
    </>
  );
}
