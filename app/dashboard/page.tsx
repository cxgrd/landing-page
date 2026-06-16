'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase-client';

// ─── Types ────────────────────────────────────────────────────────────────────

type OrgRole = 'owner' | 'admin' | 'dev';

type AuditEntry = {
  id: string;
  actorEmail: string;
  actorRole: OrgRole;
  eventType: string;
  repoId: string | null;
  gitRef: string | null;
  riskLevel: string | null;
  blastRadius: number | null;
  passed: boolean | null;
  summary: string | null;
  createdAt: string;
  isNew?: boolean;
};

type HealthSnapshot = {
  repoId: string;
  fileCount: number;
  depCount: number;
  avgBlastRadius: number;
  maxBlastRadius: number;
  couplingScore: number;
  hubCount: number;
  hotspots: string[];
  createdAt: string;
};

type TrendPoint = {
  createdAt: string;
  avgBlastRadius: number;
  maxBlastRadius: number;
  fileCount: number;
  couplingScore: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const RISK_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#22c55e',
};

const EVENT_ICONS: Record<string, string> = {
  scan:      '🔍',
  check:     '✓',
  input:     '💥',
  prompt:    '✨',
  sync:      '☁',
  precommit: '🔒',
};

const ROLE_STYLES: Record<OrgRole, { bg: string; color: string }> = {
  owner: { bg: 'rgba(139,92,246,0.15)', color: '#a78bfa' },
  admin: { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa' },
  dev:   { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function shortRef(ref: string | null): string {
  if (!ref) return '—';
  return ref.startsWith('local-') ? 'local' : ref.slice(0, 7);
}

function Sparkline({ points, color = '#60a5fa' }: { points: number[]; color?: string }) {
  if (points.length < 2) return <span style={{ color: '#475569', fontSize: '11px' }}>no data</span>;
  const max = Math.max(...points, 1);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 80; const h = 28;
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const ys = points.map(v => h - ((v - min) / range) * (h - 4) - 2);
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="2.5" fill={color} />
    </svg>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, trend }: { label: string; value: string | number; sub?: string; trend?: number[] }) {
  return (
    <div style={{ background: 'rgba(10,16,30,0.7)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: '10px', padding: '14px 16px' }}>
      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: 600, color: '#f4f7ff', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>{sub}</div>}
      {trend && trend.length >= 2 && <div style={{ marginTop: '8px' }}><Sparkline points={trend} /></div>}
    </div>
  );
}

function RoleBadge({ role }: { role: OrgRole }) {
  const s = ROLE_STYLES[role] ?? ROLE_STYLES.dev;
  return (
    <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 600, background: s.bg, color: s.color, textTransform: 'uppercase', letterSpacing: '.04em' }}>
      {role}
    </span>
  );
}

function StatusBadge({ passed }: { passed: boolean | null }) {
  if (passed === true)  return <span style={{ color: '#22c55e', fontWeight: 500 }}>✓ pass</span>;
  if (passed === false) return <span style={{ color: '#ef4444', fontWeight: 500 }}>✗ fail</span>;
  return <span style={{ color: '#475569' }}>—</span>;
}

function LiveDot({ active }: { active: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: active ? '#22c55e' : '#475569', boxShadow: active ? '0 0 6px #22c55e' : 'none', transition: 'all .3s' }} />
      <span style={{ fontSize: '11px', color: active ? '#22c55e' : '#475569' }}>{active ? 'live' : 'offline'}</span>
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [token, setToken]   = useState('');
  const [teamId, setTeamId] = useState('');
  const [repoId, setRepoId] = useState('');
  const [loaded, setLoaded] = useState(false);

  const [entries, setEntries]       = useState<AuditEntry[]>([]);
  const [health, setHealth]         = useState<HealthSnapshot | null>(null);
  const [trend, setTrend]           = useState<TrendPoint[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [realtimeOn, setRealtimeOn] = useState(false);

  const [roleFilter, setRoleFilter]   = useState('all');
  const [eventFilter, setEventFilter] = useState('all');

  // RealtimeChannel is imported directly — no null-chaining on the client type needed
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchAll = useCallback(async (t: string, tid: string, rid: string) => {
    setLoading(true);
    setError(null);
    try {
      const h = { 'x-cxgrd-token': t };
      const [auditRes, healthRes, trendRes] = await Promise.all([
        fetch(`/api/teams/${tid}/audit?limit=100`, { headers: h }),
        fetch(`/api/teams/${tid}/health?repoId=${encodeURIComponent(rid)}&mode=latest`, { headers: h }),
        fetch(`/api/teams/${tid}/health?repoId=${encodeURIComponent(rid)}&mode=trend&limit=30`, { headers: h }),
      ]);
      if (auditRes.ok) {
        const j = await auditRes.json();
        setEntries((j.entries ?? []).map((e: AuditEntry) => ({ ...e, isNew: false })));
      }
      if (healthRes.ok) {
        const j = await healthRes.json();
        setHealth(j.snapshot ?? null);
      }
      if (trendRes.ok) {
        const j = await trendRes.json();
        setTrend(j.snapshots ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  const subscribeRealtime = useCallback((tid: string) => {
    const sb = getSupabaseClient();
    if (!sb) { setRealtimeOn(false); return; }

    if (channelRef.current) {
      sb.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    channelRef.current = sb
      .channel(`team_audit_log:${tid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_audit_log', filter: `team_id=eq.${tid}` },
        (payload) => {
          const raw = payload.new as Record<string, unknown>;
          const newEntry: AuditEntry = {
            id:          raw.id as string,
            actorEmail:  raw.actor_email as string,
            actorRole:   raw.actor_role as OrgRole,
            eventType:   raw.event_type as string,
            repoId:      raw.repo_id as string | null,
            gitRef:      raw.git_ref as string | null,
            riskLevel:   raw.risk_level as string | null,
            blastRadius: raw.blast_radius as number | null,
            passed:      raw.passed as boolean | null,
            summary:     raw.summary as string | null,
            createdAt:   raw.created_at as string,
            isNew:       true,
          };
          setEntries(prev => [newEntry, ...prev].slice(0, 100));
          setTimeout(() => {
            setEntries(prev => prev.map(e => e.id === newEntry.id ? { ...e, isNew: false } : e));
          }, 3000);
        },
      )
      .subscribe((status) => setRealtimeOn(status === 'SUBSCRIBED'));
  }, []);

  useEffect(() => {
    return () => {
      const sb = getSupabaseClient();
      if (sb && channelRef.current) sb.removeChannel(channelRef.current);
    };
  }, []);

  async function handleLoad() {
    if (!token || !teamId || !repoId) return;
    setLoaded(true);
    await fetchAll(token, teamId, repoId);
    subscribeRealtime(teamId);
  }

  const filtered = entries.filter(e => {
    if (roleFilter  !== 'all' && e.actorRole  !== roleFilter)  return false;
    if (eventFilter !== 'all' && e.eventType  !== eventFilter) return false;
    return true;
  });

  const checkEntries = entries.filter(e => e.passed !== null);
  const passRate = checkEntries.length > 0
    ? Math.round((checkEntries.filter(e => e.passed).length / checkEntries.length) * 100)
    : null;

  const uniqueRoles  = [...new Set(entries.map(e => e.actorRole))];
  const uniqueEvents = [...new Set(entries.map(e => e.eventType))];
  const trendAvgBlast = trend.map(t => t.avgBlastRadius);
  const trendCoupling = trend.map(t => t.couplingScore);
  const trendFiles    = trend.map(t => t.fileCount);

  const inputStyle = {
    width: '100%', background: 'rgba(15,23,42,0.8)',
    border: '1px solid rgba(148,163,184,0.18)', borderRadius: '6px',
    padding: '7px 10px', color: '#f4f7ff', fontSize: '12px',
    outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: 'var(--font-geist-mono)',
  };

  const selectStyle = {
    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.18)',
    borderRadius: '6px', padding: '4px 8px', color: '#94a3b8', fontSize: '11px', cursor: 'pointer',
  };

  return (
    <div style={{ padding: '1.75rem 1.5rem', maxWidth: '1280px', margin: '0 auto', fontFamily: 'var(--font-geist-sans)' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#475569', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '4px' }}>Team</div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#f4f7ff', margin: 0 }}>Dashboard</h1>
        </div>
        {loaded && <LiveDot active={realtimeOn} />}
      </div>

      {/* Auth panel */}
      <div style={{ background: 'rgba(10,16,30,0.7)', border: '1px solid rgba(148,163,184,0.14)', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
        {([
          { label: 'Auth token', value: token,  set: setToken,  type: 'password', ph: 'cxgrd JWT' },
          { label: 'Team ID',    value: teamId, set: setTeamId, type: 'text',     ph: 'uuid' },
          { label: 'Repo ID',    value: repoId, set: setRepoId, type: 'text',     ph: 'folder name' },
        ] as const).map(({ label, value, set, type, ph }) => (
          <div key={label}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '5px' }}>{label}</div>
            <input type={type} value={value} onChange={e => set(e.target.value)} placeholder={ph} onKeyDown={e => e.key === 'Enter' && handleLoad()} style={inputStyle} />
          </div>
        ))}
        <button
          onClick={handleLoad}
          disabled={!token || !teamId || !repoId || loading}
          style={{ background: loading ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg,#3b82f6,#6366f1)', border: 'none', borderRadius: '6px', padding: '8px 18px', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
        >
          {loading ? 'Loading…' : loaded ? 'Refresh' : 'Load'}
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px', color: '#fca5a5', fontSize: '12px', marginBottom: '1.25rem' }}>
          {error}
        </div>
      )}

      {!loaded && !loading && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#475569', fontSize: '13px' }}>
          Enter your token, team ID, and repo ID to load the dashboard.
        </div>
      )}

      {loaded && (
        <>
          {/* Health cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '10px', marginBottom: '1.25rem' }}>
            <StatCard label="Files"           value={health?.fileCount ?? '—'}  trend={trendFiles} />
            <StatCard label="Dependencies"    value={health?.depCount  ?? '—'} />
            <StatCard label="Avg blast"       value={health ? health.avgBlastRadius : '—'} sub="files affected" trend={trendAvgBlast} />
            <StatCard label="Max blast"       value={health ? health.maxBlastRadius : '—'} sub="files affected" />
            <StatCard label="Coupling"        value={health ? health.couplingScore.toFixed(2) : '—'} trend={trendCoupling} />
            <StatCard label="Hub files"       value={health?.hubCount ?? '—'} />
            <StatCard label="Pass rate"       value={passRate !== null ? `${passRate}%` : '—'} sub={`${checkEntries.length} checks`} />
            <StatCard label="Events"          value={entries.length} sub="last 100" />
          </div>

          {/* Hotspots */}
          {health && health.hotspots.length > 0 && (
            <div style={{ background: 'rgba(10,16,30,0.7)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: '10px', padding: '12px 16px', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px' }}>🔥 Hotspot files</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {health.hotspots.map(f => (
                  <span key={f} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '99px', padding: '3px 12px', fontSize: '11px', color: '#fca5a5', fontFamily: 'var(--font-geist-mono)' }}>
                    {f.split(/[/\\]/).pop()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Activity feed */}
          <div style={{ background: 'rgba(10,16,30,0.7)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(148,163,184,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#f4f7ff' }}>Activity feed</span>
                <LiveDot active={realtimeOn} />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select value={roleFilter}  onChange={e => setRoleFilter(e.target.value)}  style={selectStyle}>
                  <option value="all">All roles</option>
                  {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={eventFilter} onChange={e => setEventFilter(e.target.value)} style={selectStyle}>
                  <option value="all">All events</option>
                  {uniqueEvents.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <span style={{ fontSize: '11px', color: '#475569' }}>{filtered.length} events</span>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: '2.5rem', color: '#475569', fontSize: '13px', textAlign: 'center' }}>
                No events yet. Run <code style={{ color: '#60a5fa', fontFamily: 'var(--font-geist-mono)' }}>cxgrd scan --team</code> to start.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                      {['Event', 'Actor', 'Role', 'Repo', 'Ref', 'Risk', 'Blast', 'Status', 'When'].map(h => (
                        <th key={h} style={{ padding: '8px 14px', textAlign: 'left', color: '#475569', fontWeight: 500, fontSize: '10px', letterSpacing: '.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((entry, i) => (
                      <tr key={entry.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.06)', background: entry.isNew ? 'rgba(59,130,246,0.07)' : i % 2 === 0 ? 'transparent' : 'rgba(148,163,184,0.02)', transition: 'background 0.6s ease' }}>
                        <td style={{ padding: '9px 14px', color: '#cbd5e1', whiteSpace: 'nowrap', fontFamily: 'var(--font-geist-mono)', fontSize: '11px' }}>
                          {EVENT_ICONS[entry.eventType] ?? '•'} {entry.eventType}
                        </td>
                        <td style={{ padding: '9px 14px', color: '#64748b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.actorEmail}</td>
                        <td style={{ padding: '9px 14px' }}><RoleBadge role={entry.actorRole} /></td>
                        <td style={{ padding: '9px 14px', color: '#64748b', fontFamily: 'var(--font-geist-mono)', fontSize: '11px' }}>{entry.repoId ?? '—'}</td>
                        <td style={{ padding: '9px 14px', color: '#475569', fontFamily: 'var(--font-geist-mono)', fontSize: '11px' }}>{shortRef(entry.gitRef)}</td>
                        <td style={{ padding: '9px 14px' }}>
                          {entry.riskLevel
                            ? <span style={{ color: RISK_COLORS[entry.riskLevel] ?? '#94a3b8', fontWeight: 600, fontSize: '11px' }}>{entry.riskLevel}</span>
                            : <span style={{ color: '#475569' }}>—</span>}
                        </td>
                        <td style={{ padding: '9px 14px', color: '#64748b', fontFamily: 'var(--font-geist-mono)', fontSize: '11px' }}>{entry.blastRadius != null ? entry.blastRadius : '—'}</td>
                        <td style={{ padding: '9px 14px' }}><StatusBadge passed={entry.passed} /></td>
                        <td style={{ padding: '9px 14px', color: '#475569', whiteSpace: 'nowrap', fontSize: '11px' }}>{timeAgo(entry.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
