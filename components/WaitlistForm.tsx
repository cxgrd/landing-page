'use client';

import { FormEvent, useState } from 'react';

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      setMessage('Please enter your email address.');
      setStatus('error');
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setMessage('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('You are on the CXGRD waitlist. We will notify you when private alpha opens.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong');
      }
    } catch {
      setStatus('error');
      setMessage('Failed to subscribe. Please try again.');
    }

    setTimeout(() => {
      setStatus('idle');
      setMessage('');
    }, 6000);
  };

  const messageClass =
    status === 'success'
      ? 'text-emerald-300'
      : status === 'error'
        ? 'text-rose-300'
        : 'text-slate-300';

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl">
      <div className="gradient-border rounded-2xl p-[1px]">
        <div className="waitlist-form-shell glass-surface rounded-[15px] p-4 sm:p-5">
          <div className="mb-4 text-left">
            <p className="text-sm font-semibold text-white sm:text-base">Join the CXGRD waitlist</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-300 sm:text-sm">
              Private alpha invites, launch updates, and early feedback access for AI-native teams.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="waitlist-email" className="sr-only">
              Email address
            </label>
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                @
              </span>
              <input
                id="waitlist-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={status === 'loading'}
                className="h-12 w-full rounded-xl border border-white/15 bg-slate-950/60 pl-8 pr-4 text-sm text-white placeholder:text-slate-500 transition-colors duration-200 focus:border-blue-300/70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 px-5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-400 hover:via-indigo-400 hover:to-violet-400 hover:shadow-lg hover:shadow-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'loading' ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent"></span>
                  Joining...
                </>
              ) : (
                <>
                  Join waitlist
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  >
                    <path
                      d="M7 5l5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400 sm:text-xs">
            <span>No spam</span>
            <span>Priority access for early adopters</span>
            <span>Unsubscribe anytime</span>
          </div>
        </div>
      </div>

      {message && (
        <div className={`mt-3 text-left text-sm font-medium ${messageClass}`} aria-live="polite">
          {message}
        </div>
      )}
    </form>
  );
}
