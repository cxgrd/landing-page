'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

type InviteInfo = {
  team: { id: string; name: string; seatCount: number };
  memberCount: number;
  seatsAvailable: number;
  expiresAt: string;
};

function InviteContent() {
  const searchParams = useSearchParams();
  const teamId = searchParams.get('team') ?? '';
  const token = searchParams.get('token') ?? '';
  const errorParam = searchParams.get('error');

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(errorParam ?? '');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!teamId || !token) {
      setError('Invalid invite link — missing team or token');
      setLoading(false);
      return;
    }

    fetch(`/api/teams/${teamId}/invite?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j as { error?: string }).error ?? 'Invite link is invalid or expired');
        }
        return res.json() as Promise<InviteInfo & { valid: boolean }>;
      })
      .then((data) => {
        setInfo(data);
        if (data.seatsAvailable <= 0) {
          setError('This team has no available seats');
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load invite'))
      .finally(() => setLoading(false));
  }, [teamId, token]);

  function handleGitHubJoin() {
    if (!teamId || !token) return;
    setJoining(true);
    window.location.href =
      `/api/auth/github/start?intent=invite&teamId=${encodeURIComponent(teamId)}&token=${encodeURIComponent(token)}`;
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="glass-surface rounded-2xl p-10 text-center">
        {loading ? (
          <p className="text-sm text-slate-400">Loading invite…</p>
        ) : error && !info ? (
          <>
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-red-500/20 p-4">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-white">Invite unavailable</h1>
            <p className="mt-4 text-sm text-red-300">{error}</p>
          </>
        ) : info ? (
          <>
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-violet-500/20 p-4">
                <svg className="h-8 w-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-semibold text-white">Join {info.team.name}</h1>
            <p className="mt-3 text-sm text-slate-400">
              You&apos;ve been invited to collaborate on CXGRD&apos;s shared dependency graph and team dashboard.
            </p>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-left text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Team</span>
                <span className="text-white font-medium">{info.team.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Seats available</span>
                <span className="text-white">{info.seatsAvailable} of {info.team.seatCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Members</span>
                <span className="text-white">{info.memberCount}</span>
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs text-red-300">
                {error}
              </p>
            )}

            <button
              onClick={handleGitHubJoin}
              disabled={joining || info.seatsAvailable <= 0}
              className="mt-8 w-full rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-all duration-300 hover:shadow-lg hover:shadow-white/20 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {joining ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/20 border-t-slate-900" />
                  Redirecting to GitHub…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  Accept invite with GitHub
                </>
              )}
            </button>

            <p className="mt-4 text-xs text-slate-500">
              Sign in with GitHub to join the team. Your account will be linked automatically.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function TeamInvitePage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#05070f] text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora-orb aurora-orb--one" />
        <div className="aurora-orb aurora-orb--two" />
        <div className="grid-overlay" />
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
        <Suspense fallback={<div className="text-slate-400">Loading…</div>}>
          <InviteContent />
        </Suspense>
      </main>
    </div>
  );
}
