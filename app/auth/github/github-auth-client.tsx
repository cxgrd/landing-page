'use client';

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function GitHubAuthClientContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const sessionId = searchParams.get("session");

  useEffect(() => {
    const authenticateWithGitHub = async () => {
      try {
        // In production, this would:
        // 1. Initiate GitHub OAuth flow via Supabase
        // 2. Get authorization code from callback
        // 3. Exchange code for JWT
        // 4. Store JWT in session via backend
        // 5. Return to CLI which polls /api/auth/cli/session/{sessionId}

        if (!sessionId) {
          setStatus("error");
          setMessage("Invalid session ID");
          return;
        }

        // Simulate a successful authentication
        // In production, this would complete the OAuth flow
        const response = await fetch("/api/auth/github", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        });

        if (response.ok) {
          setStatus("success");
          setMessage(
            "Authentication successful! You can close this window and return to your CLI."
          );
        } else {
          setStatus("error");
          setMessage("Authentication failed. Please try again.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred during authentication.");
        console.error(error);
      }
    };

    authenticateWithGitHub();
  }, [sessionId]);

  return (
    <>
      {status === "loading" && (
        <>
          <div className="mb-4 flex justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-400"></div>
          </div>
          <h1 className="text-2xl font-semibold text-white">Signing you in</h1>
          <p className="mt-2 text-slate-300">
            Authenticating with GitHub...
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-emerald-500/20 p-3">
              <svg
                className="h-6 w-6 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-white">
            {message}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Your CLI session is ready to continue.
          </p>
          <a
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-400 hover:via-indigo-400 hover:to-violet-400 hover:shadow-lg hover:shadow-blue-500/25"
          >
            Back to Home
          </a>
        </>
      )}

      {status === "error" && (
        <>
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-rose-500/20 p-3">
              <svg
                className="h-6 w-6 text-rose-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-white">
            {message}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Try running <code className="font-mono text-xs">cxgrd auth login</code> again.
          </p>
          <a
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/15 px-6 py-3 text-sm font-medium text-slate-200 transition-all duration-300 hover:border-blue-300/60 hover:text-white hover:shadow-lg hover:shadow-blue-500/20"
          >
            Back to Home
          </a>
        </>
      )}

      <p className="mt-6 text-xs text-slate-500">
        Session: {sessionId || "unknown"}
      </p>
    </>
  );
}
