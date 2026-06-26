'use client';

import { useEffect, useState } from 'react';

// ─── types ────────────────────────────────────────────────────────────────────

type Plan = 'free' | 'pro' | 'team' | 'enterprise';
type BillingCycle = 'monthly' | 'annual' | 'custom';

interface Seat {
  used: number;
  total: number;
}

interface Subscription {
  plan: Plan;
  status: 'active' | 'canceled' | 'past_due';
  renewsAt: string;
  startedAt: string;
  amount: number;         // USD cents — 0 for free/enterprise
  cycle: BillingCycle;
  seats?: Seat;           // team & enterprise only
  portalUrl: string;      // Dodo portal — null for enterprise (contact sales)
  contactSales?: boolean; // enterprise: show contact instead of portal
}

// ─── constants ────────────────────────────────────────────────────────────────

const PLAN_META: Record<Plan, { label: string; color: string; bg: string; desc: string }> = {
  free:       { label: 'Free',       color: '#64748b', bg: 'rgba(100,116,139,0.08)', desc: 'Limited access' },
  pro:        { label: 'Pro',        color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  desc: 'Full access, single user' },
  team:       { label: 'Team',       color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', desc: 'Shared workspace, multiple seats' },
  enterprise: { label: 'Enterprise', color: '#34d399', bg: 'rgba(52,211,153,0.08)',  desc: 'Custom pricing & SLA' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  active:   { bg: 'rgba(16,185,129,0.08)',  text: '#34d399', dot: '#10b981' },
  canceled: { bg: 'rgba(148,163,184,0.08)', text: '#94a3b8', dot: '#64748b' },
  past_due: { bg: 'rgba(239,68,68,0.08)',   text: '#f87171', dot: '#ef4444' },
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function fmtAmount(cents: number, cycle: BillingCycle) {
  if (cents === 0) return null;
  const label = cycle === 'annual' ? '/ year' : cycle === 'monthly' ? '/ month' : null;
  return `$${(cents / 100).toFixed(2)}${label ? ' ' + label : ''}`;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '11px 0', borderBottom: '1px solid rgba(148,163,184,0.07)',
    }}>
      <span style={{ fontSize: '13px', color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: Subscription['status'] }) {
  const c = STATUS_COLORS[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: c.bg, color: c.text,
      fontSize: '11px', fontFamily: 'var(--font-geist-mono)',
      padding: '3px 9px', borderRadius: '99px',
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
      {status.replace('_', ' ')}
    </span>
  );
}

function SeatBar({ seats }: { seats: Seat }) {
  const pct = Math.round((seats.used / seats.total) * 100);
  const warn = pct >= 80;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', color: '#64748b' }}>Seats used</span>
        <span style={{ fontSize: '12px', color: warn ? '#fbbf24' : '#94a3b8', fontFamily: 'var(--font-geist-mono)' }}>
          {seats.used} / {seats.total}
        </span>
      </div>
      <div style={{ height: '3px', background: 'rgba(148,163,184,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: warn ? '#f59e0b' : '#60a5fa',
          borderRadius: '99px',
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px 0' }}>
      {[140, 90, 110, 80].map((w, i) => (
        <div key={i} style={{
          height: '13px', width: `${w}px`, borderRadius: '4px',
          background: 'rgba(148,163,184,0.08)',
          animation: 'pulse 1.5s ease-in-out infinite',
          animationDelay: `${i * 0.1}s`,
        }} />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const me = await fetch('/api/auth/me').then(r => r.json());
        const res = await fetch('/api/billing/subscription', {
          headers: { Authorization: `Bearer ${me.token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setSub(data);
      } catch (err) {
        setError('Failed to load subscription details.');
      } finally {
        setLoading(false);
      }
    };
    fetchSub();
  }, []);

  const openPortal = async () => {
    const me = await fetch('/api/auth/me').then(r => r.json());
    const res = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: { Authorization: `Bearer ${me.token}` },
    });
    const { url } = await res.json();
    if (url) window.open(url, '_blank');
  };

  const meta = sub ? PLAN_META[sub.plan] : null;
  const price = sub ? fmtAmount(sub.amount, sub.cycle) : null;
  const canManage = sub && !sub.contactSales && sub.plan !== 'free';
  const canCancel = canManage && sub?.status === 'active';

  return (
    <div style={{ minHeight: '100vh', background: '#05070f', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>

        {/* header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '18px', fontWeight: 700, color: '#f4f7ff',
            fontFamily: 'var(--font-geist-mono)', letterSpacing: '-0.02em',
            marginBottom: '0.25rem',
          }}>
            Billing
          </h1>
          <p style={{ fontSize: '13px', color: '#475569' }}>
            Manage your subscription and billing details.
          </p>
        </div>

        {/* card */}
        <div style={{
          border: '1px solid rgba(148,163,184,0.1)',
          borderRadius: '10px', overflow: 'hidden',
        }}>

          {/* card header */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid rgba(148,163,184,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{
              fontSize: '11px', fontWeight: 600, color: '#475569',
              fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Current plan
            </span>
            {sub && <StatusBadge status={sub.status} />}
          </div>

          {/* card body */}
          <div style={{ padding: '0 20px 8px' }}>
            {loading ? <Skeleton /> : error ? (
              <p style={{ fontSize: '13px', color: '#f87171', padding: '16px 0' }}>{error}</p>
            ) : sub && meta ? (
              <>
                {/* plan pill + name */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '16px 0 12px',
                  borderBottom: '1px solid rgba(148,163,184,0.07)',
                }}>
                  <span style={{
                    background: meta.bg, color: meta.color,
                    fontSize: '11px', fontFamily: 'var(--font-geist-mono)',
                    padding: '3px 9px', borderRadius: '99px', fontWeight: 600,
                  }}>
                    {meta.label}
                  </span>
                  <span style={{ fontSize: '13px', color: '#475569' }}>{meta.desc}</span>
                  {price && (
                    <span style={{
                      marginLeft: 'auto', fontSize: '13px',
                      color: '#94a3b8', fontFamily: 'var(--font-geist-mono)',
                    }}>
                      {price}
                    </span>
                  )}
                </div>

                <Row label="Started" value={fmt(sub.startedAt)} />

                {sub.status === 'active' && sub.plan !== 'free' && (
                  <Row label="Next renewal" value={fmt(sub.renewsAt)} />
                )}
                {sub.status === 'canceled' && (
                  <Row label="Access until" value={fmt(sub.renewsAt)} />
                )}
                {sub.status === 'past_due' && (
                  <Row label="Payment" value={
                    <span style={{ color: '#f87171' }}>Failed — update payment method</span>
                  } />
                )}

                {/* seat bar for team / enterprise */}
                {sub.seats && (
                  <div style={{ padding: '14px 0 6px' }}>
                    <SeatBar seats={sub.seats} />
                  </div>
                )}

                {/* enterprise: custom billing note */}
                {sub.contactSales && (
                  <div style={{
                    margin: '10px 0', padding: '10px 14px',
                    background: 'rgba(52,211,153,0.05)',
                    border: '1px solid rgba(52,211,153,0.12)',
                    borderRadius: '6px',
                  }}>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
                      Your plan is managed by your account team.{' '}
                      <a href="mailto:hello@cxgrd.com" style={{ color: '#34d399', textDecoration: 'none' }}>
                        Contact us
                      </a>{' '}
                      for billing changes or seat adjustments.
                    </p>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* card footer */}
          {!loading && sub && (
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid rgba(148,163,184,0.1)',
              display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center',
            }}>
              {canManage && (
                <button onClick={openPortal} style={{
                  padding: '7px 14px', fontSize: '13px',
                  background: 'rgba(96,165,250,0.1)', color: '#60a5fa',
                  border: '1px solid rgba(96,165,250,0.2)',
                  borderRadius: '6px', cursor: 'pointer',
                  fontFamily: 'var(--font-geist-mono)',
                }}>
                  Manage subscription ↗
                </button>
              )}
              {canCancel && (
                <button onClick={openPortal} style={{
                  padding: '7px 14px', fontSize: '13px',
                  background: 'transparent', color: '#64748b',
                  border: '1px solid rgba(148,163,184,0.15)',
                  borderRadius: '6px', cursor: 'pointer',
                  fontFamily: 'var(--font-geist-mono)',
                }}>
                  Cancel plan
                </button>
              )}
              {sub.plan === 'free' && (
                <a href="/pricing" style={{
                  padding: '7px 14px', fontSize: '13px',
                  background: 'rgba(96,165,250,0.1)', color: '#60a5fa',
                  border: '1px solid rgba(96,165,250,0.2)',
                  borderRadius: '6px', textDecoration: 'none',
                  fontFamily: 'var(--font-geist-mono)',
                }}>
                  Upgrade plan →
                </a>
              )}
              {sub.contactSales && (
                <a href="mailto:hello@cxgrd.com" style={{
                  padding: '7px 14px', fontSize: '13px',
                  background: 'rgba(52,211,153,0.08)', color: '#34d399',
                  border: '1px solid rgba(52,211,153,0.15)',
                  borderRadius: '6px', textDecoration: 'none',
                  fontFamily: 'var(--font-geist-mono)',
                }}>
                  Contact account team →
                </a>
              )}
            </div>
          )}
        </div>

        {/* footnote */}
        <p style={{ fontSize: '12px', color: '#334155', marginTop: '1rem', lineHeight: '1.6' }}>
          Subscription changes are handled through our billing portal. Cancellation takes effect at
          the end of your current billing period.{' '}
          <a href="/legal/refunds" style={{ color: '#475569', textDecoration: 'underline' }}>Refund policy</a>
        </p>

      </div>
    </div>
  );
}