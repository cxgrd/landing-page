'use client';

import { useState } from 'react';
import Image from 'next/image';

const SEAT_PRICE = 16;
const MIN_SEATS = 5;
const TEAM_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_CXGRD_TEAM_KEY;

export default function TeamPage() {
  const [teamName, setTeamName]   = useState('');
  const [seatCount, setSeatCount] = useState(MIN_SEATS);
  const [email, setEmail]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const total = seatCount * SEAT_PRICE;

  async function handleCheckout() {
    if (!teamName.trim()) { setError('Team name is required'); return; }
    if (!email.trim())    { setError('Email is required'); return; }
    if (seatCount < MIN_SEATS) { setError(`Minimum ${MIN_SEATS} seats`); return; }

    setLoading(true);
    setError('');

    try {
      // Store team intent in session so webhook can pick it up

      const accountId = await fetch('/api/auth/me', { method: 'GET' })
        .then(r => r.json())
        .then(data => data?.accountId);

      if (!accountId) {
        window.location.href = `/api/auth/github/start?intent=upgrade&targetPlan=team`;
        return;
      }

      const res = await fetch('/api/teams/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: teamName.trim(), seatCount, email: email.trim(), accountId }),
      });

      if (!res.ok) throw new Error('Failed to prepare checkout');
      const { intentId } = await res.json() as { intentId: string };

      // Build Dodo checkout URL
      const params = new URLSearchParams({
        quantity:              String(seatCount),
        email:                 email.trim(),
        'metadata[intent_id]': intentId,
        'metadata[seat_count]':String(seatCount),
        'metadata[team_name]': teamName.trim(),
      });
      params.append('metadata[account_id]', accountId);

      const checkoutUrl = `https://checkout.dodopayments.com/buy/${TEAM_PRODUCT_ID}?${params}`;
      window.location.href = checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setLoading(false);
    }
  }

  const inputCls = `
    w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3
    text-sm text-white placeholder:text-slate-500
    focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/30
    transition-colors
  `;

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#05070f] text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora-orb aurora-orb--one" />
        <div className="aurora-orb aurora-orb--two" />
        <div className="aurora-orb aurora-orb--three" />
        <div className="grid-overlay" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#05070f]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <a href="/" className="inline-flex items-center gap-3">
            <Image src="/cxgrdlogo.png" alt="cxgrd" width={32} height={32} className="rounded-lg" />
            <span className="text-base font-semibold tracking-tight text-white">cxgrd</span>
          </a>
          <a href="/pricing" className="text-sm text-slate-400 hover:text-white transition-colors">
            ← Pricing
          </a>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 py-20">

        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-200">
            Team plan · $16 / seat / month
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Set up your team
          </h1>
          <p className="mt-3 text-slate-400 max-w-md mx-auto text-sm">
            Shared dependency graph, audit policies, merge enforcement, and architecture health for your entire eng team.
          </p>
        </div>

        <div className="grid w-full max-w-3xl gap-6 md:grid-cols-[1fr_320px]">

          {/* Form */}
          <div className="glass-surface rounded-2xl p-8 space-y-5">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Team details</h2>

            <div>
              <label className="mb-1.5 block text-xs text-slate-400">Team name</label>
              <input
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="Acme Engineering"
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-slate-400">Work email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-slate-400">
                Number of seats
                <span className="ml-2 text-slate-500">(min {MIN_SEATS})</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSeatCount(s => Math.max(MIN_SEATS, s - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white hover:bg-white/10 transition-colors text-lg font-medium"
                >
                  −
                </button>
                <input
                  type="number"
                  min={MIN_SEATS}
                  value={seatCount}
                  onChange={e => setSeatCount(Math.max(MIN_SEATS, parseInt(e.target.value) || MIN_SEATS))}
                  className="w-20 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-center text-sm text-white focus:border-blue-400/60 focus:outline-none"
                />
                <button
                  onClick={() => setSeatCount(s => s + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white hover:bg-white/10 transition-colors text-lg font-medium"
                >
                  +
                </button>
                <span className="text-sm text-slate-400">seats</span>
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs text-red-300">
                {error}
              </p>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? 'Redirecting to checkout…' : `Continue to checkout → $${total}/mo`}
            </button>

            <p className="text-center text-xs text-slate-500">
              Secured by Dodo Payments · Cancel anytime
            </p>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <div className="glass-surface rounded-2xl p-6">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Order summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Plan</span>
                  <span className="text-white font-medium">Team</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Seats</span>
                  <span className="text-white">{seatCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Price per seat</span>
                  <span className="text-white">${SEAT_PRICE}/mo</span>
                </div>
                <div className="my-3 border-t border-white/10" />
                <div className="flex justify-between text-base font-semibold">
                  <span className="text-white">Total</span>
                  <span className="text-blue-300">${total}/mo</span>
                </div>
              </div>
            </div>

            <div className="glass-surface rounded-2xl p-6 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">What's included</h3>
              {[
                'Everything in Pro',
                'Shared dependency graph',
                'Role-based audit policies',
                'Team dashboard & analytics',
                'Architecture health metrics',
                'Merge policy enforcement',
              ].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="text-blue-400">✓</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
