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

type MergePolicy = {
  id: string;
  repoFullName: string;
  maxBlastRadius: number;
  blockOnRisk: string[];
  enabled: boolean;
  createdBy: string;
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

const ALL_RISK_LEVELS = ['critical', 'high', 'medium', 'low'];

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

function TrendChart({ title, series, height = 160 }: {
  title: string;
  series: { label: string; color: string; points: { x: string; y: number }[] }[];
  height?: number;
}) {
  const width = 560;
  const pad = { top: 16, right: 16, bottom: 28, left: 40 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const allY = series.flatMap(s => s.points.map(p => p.y));
  if (allY.length < 2) return (
    <div style={{ background: 'rgba(10,16,30,0.7)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: '10px', padding: '14px 16px' }}>
      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.05em' }}>{title}</div>
      <div style={{ color: '#475569', fontSize: '12px', padding: '2rem 0', textAlign: 'center' }}>Not enough data</div>
    </div>
  );
  const yMin = Math.min(...allY);
  const yMax = Math.max(...allY, yMin + 1);
  const yRange = yMax - yMin || 1;
  const maxLen = Math.max(...series.map(s => s.points.length));
  const xPos = (i: number, len: number) => pad.left + (len <= 1 ? innerW / 2 : (i / (len - 1)) * innerW);
  const yPos = (v: number) => pad.top + innerH - ((v - yMin) / yRange) * innerH;
  const yTicks = [yMin, yMin + yRange / 2, yMax];
  return (
    <div style={{ background: 'rgba(10,16,30,0.7)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: '10px', padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>{title}</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {series.map(s => (
            <span key={s.label} style={{ fontSize: '10px', color: s.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 8, height: 2, background: s.color, borderRadius: 1, display: 'inline-block' }} />{s.label}
            </span>
          ))}
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', maxWidth: '100%' }}>
        {yTicks.map((tick, i) => {
          const y = yPos(tick);
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="rgba(148,163,184,0.08)" strokeWidth="1" />
              <text x={pad.left - 6} y={y + 3} textAnchor="end" fill="#475569" fontSize="9">{tick.toFixed(tick < 10 ? 1 : 0)}</text>
            </g>
          );
        })}
        {series.map(s => {
          if (s.points.length < 2) return null;
          const d = s.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xPos(i, s.points.length)},${yPos(p.y)}`).join(' ');
          const last = s.points[s.points.length - 1];
          return (
            <g key={s.label}>
              <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
              <circle cx={xPos(s.points.length - 1, s.points.length)} cy={yPos(last.y)} r="3" fill={s.color} />
            </g>
          );
        })}
        {series[0]?.points.map((p, i) => {
          if (i % Math.ceil(maxLen / 5) !== 0 && i !== maxLen - 1) return null;
          return <text key={i} x={xPos(i, series[0].points.length)} y={height - 6} textAnchor="middle" fill="#475569" fontSize="9">{new Date(p.x).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</text>;
        })}
      </svg>
    </div>
  );
}

function HotspotHeatmap({ hotspots }: { hotspots: string[] }) {
  if (hotspots.length === 0) return null;
  const cols = Math.min(4, Math.ceil(Math.sqrt(hotspots.length)));
  const cellSize = 72;
  const heatColor = (i: number) => {
    const t = 1 - i / Math.max(hotspots.length - 1, 1);
    return `rgba(${Math.round(239 * t + 59 * (1 - t))},${Math.round(68 * t + 130 * (1 - t))},${Math.round(68 * t + 246 * (1 - t))},${0.15 + (1 - i / hotspots.length) * 0.45})`;
  };
  const borderColor = (i: number) => {
    const t = 1 - i / Math.max(hotspots.length - 1, 1);
    return `rgba(${Math.round(239 * t + 96 * (1 - t))},${Math.round(68 * t + 165 * (1 - t))},${Math.round(68 * t + 250 * (1 - t))},0.5)`;
  };
  return (
    <div style={{ background: 'rgba(10,16,30,0.7)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: '10px', padding: '12px 16px', marginBottom: '1.25rem' }}>
      <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px' }}>
        🔥 Hotspot heatmap <span style={{ marginLeft: '8px', color: '#475569', textTransform: 'none', letterSpacing: 0 }}>— darker = higher blast radius risk</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`, gap: '8px' }}>
        {hotspots.map((file, i) => {
          const name = file.split(/[/\\]/).pop() ?? file;
          const dir = (file.includes('/') || file.includes('\\')) ? file.replace(/[/\\][^/\\]+$/, '').split(/[/\\]/).slice(-2).join('/') : '';
          return (
            <div key={file} title={file} style={{ width: cellSize, height: cellSize, borderRadius: '8px', background: heatColor(i), border: `1px solid ${borderColor(i)}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px', textAlign: 'center', overflow: 'hidden' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: i < 3 ? '#fca5a5' : '#94a3b8', fontFamily: 'var(--font-geist-mono)', lineHeight: 1.2, wordBreak: 'break-all' }}>{name}</span>
              {dir && <span style={{ fontSize: '8px', color: '#64748b', marginTop: '3px', fontFamily: 'var(--font-geist-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{dir}</span>}
              <span style={{ fontSize: '8px', color: '#475569', marginTop: '2px' }}>#{i + 1}</span>
            </div>
          );
        })}
      </div>
    </div>
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
  return <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 600, background: s.bg, color: s.color, textTransform: 'uppercase', letterSpacing: '.04em' }}>{role}</span>;
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

// ─── Merge policies panel ─────────────────────────────────────────────────────

function MergePoliciesPanel({ token, teamId, role }: { token: string; teamId: string; role: OrgRole }) {
  const [policies, setPolicies]     = useState<MergePolicy[]>([]);
  const [loadingP, setLoadingP]     = useState(true);
  const [saving, setSaving]         = useState(false);
  const [policyError, setPolicyError] = useState('');
  const [saved, setSaved]           = useState(false);

  // Form state
  const [repo, setRepo]         = useState('');
  const [maxBlast, setMaxBlast] = useState(50);
  const [blockOn, setBlockOn]   = useState<string[]>(['critical', 'high']);
  const [enabled, setEnabled]   = useState(true);

  const canEdit = role === 'owner' || role === 'admin';

  const loadPolicies = useCallback(async () => {
    setLoadingP(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/merge-policies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const j = await res.json() as { policies: MergePolicy[] };
        setPolicies(j.policies ?? []);
      }
    } catch {
      // non-fatal
    } finally {
      setLoadingP(false);
    }
  }, [token, teamId]);

  useEffect(() => { loadPolicies(); }, [loadPolicies]);

  function toggleRisk(level: string) {
    setBlockOn(prev =>
      prev.includes(level) ? prev.filter(r => r !== level) : [...prev, level]
    );
  }

  function editPolicy(p: MergePolicy) {
    setRepo(p.repoFullName);
    setMaxBlast(p.maxBlastRadius);
    setBlockOn(p.blockOnRisk);
    setEnabled(p.enabled);
  }

  async function save() {
    if (!repo.trim() || !repo.includes('/')) {
      setPolicyError('Repo must be in owner/repo format (e.g. acme/backend)');
      return;
    }
    setPolicyError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/merge-policies`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoFullName:   repo.trim(),
          maxBlastRadius: maxBlast,
          blockOnRisk:    blockOn,
          enabled,
        }),
      });
      if (!res.ok) {
        const j = await res.json() as { error?: string };
        throw new Error(j.error ?? 'Failed to save');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setRepo(''); setMaxBlast(50); setBlockOn(['critical', 'high']); setEnabled(true);
      await loadPolicies();
    } catch (e) {
      setPolicyError(e instanceof Error ? e.message : 'Failed to save policy');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.18)',
    borderRadius: '6px', padding: '7px 10px', color: '#f4f7ff', fontSize: '12px',
    outline: 'none', fontFamily: 'var(--font-geist-mono)',
  };

  return (
    <div style={{ background: 'rgba(10,16,30,0.7)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: '10px', overflow: 'hidden', marginBottom: '1.25rem' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(148,163,184,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#f4f7ff' }}>Merge policies</span>
        {!canEdit && <span style={{ fontSize: '11px', color: '#475569' }}>read-only — devs cannot edit policies</span>}
      </div>

      {/* Existing policies table */}
      <div style={{ padding: '12px 16px', borderBottom: loadingP || policies.length === 0 ? 'none' : '1px solid rgba(148,163,184,0.08)' }}>
        {loadingP ? (
          <div style={{ color: '#475569', fontSize: '12px' }}>Loading policies…</div>
        ) : policies.length === 0 ? (
          <div style={{ color: '#475569', fontSize: '12px' }}>No policies yet.{canEdit ? ' Add one below.' : ''}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                {['Repo', 'Max blast', 'Block on', 'Status', canEdit ? 'Edit' : ''].filter(Boolean).map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: '#475569', fontWeight: 500, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {policies.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                  <td style={{ padding: '8px 10px', color: '#cbd5e1', fontFamily: 'var(--font-geist-mono)', fontSize: '11px' }}>{p.repoFullName}</td>
                  <td style={{ padding: '8px 10px', color: '#94a3b8' }}>{p.maxBlastRadius} files</td>
                  <td style={{ padding: '8px 10px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {p.blockOnRisk.map(r => (
                        <span key={r} style={{ padding: '1px 6px', borderRadius: '99px', fontSize: '10px', background: `${RISK_COLORS[r] ?? '#94a3b8'}18`, color: RISK_COLORS[r] ?? '#94a3b8', border: `1px solid ${RISK_COLORS[r] ?? '#94a3b8'}40` }}>{r}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ fontSize: '11px', color: p.enabled ? '#22c55e' : '#475569' }}>{p.enabled ? '● active' : '○ disabled'}</span>
                  </td>
                  {canEdit && (
                    <td style={{ padding: '8px 10px' }}>
                      <button onClick={() => editPolicy(p)} style={{ background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '4px', padding: '3px 8px', color: '#94a3b8', fontSize: '11px', cursor: 'pointer' }}>
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / edit form — owner/admin only */}
      {canEdit && (
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '12px' }}>
            {repo ? 'Edit policy' : 'Add policy'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px', alignItems: 'end', marginBottom: '10px' }}>
            {/* Repo */}
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Repo (owner/repo)</div>
              <input
                value={repo}
                onChange={e => setRepo(e.target.value)}
                placeholder="acme/backend"
                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }}
              />
            </div>
            {/* Max blast */}
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Max blast radius</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button onClick={() => setMaxBlast(m => Math.max(1, m - 5))} style={{ ...inputStyle, padding: '7px 10px', cursor: 'pointer' }}>−</button>
                <input type="number" min={1} value={maxBlast} onChange={e => setMaxBlast(Math.max(1, parseInt(e.target.value) || 1))} style={{ ...inputStyle, width: '60px', textAlign: 'center' }} />
                <button onClick={() => setMaxBlast(m => m + 5)} style={{ ...inputStyle, padding: '7px 10px', cursor: 'pointer' }}>+</button>
                <span style={{ fontSize: '11px', color: '#64748b' }}>files</span>
              </div>
            </div>
            {/* Enabled toggle */}
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Enabled</div>
              <button
                onClick={() => setEnabled(e => !e)}
                style={{ ...inputStyle, cursor: 'pointer', padding: '7px 14px', color: enabled ? '#22c55e' : '#475569', borderColor: enabled ? 'rgba(34,197,94,0.3)' : 'rgba(148,163,184,0.18)' }}
              >
                {enabled ? '● on' : '○ off'}
              </button>
            </div>
          </div>

          {/* Block on risk checkboxes */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>Block on risk level</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {ALL_RISK_LEVELS.map(level => {
                const checked = blockOn.includes(level);
                const color = RISK_COLORS[level];
                return (
                  <button
                    key={level}
                    onClick={() => toggleRisk(level)}
                    style={{
                      padding: '4px 12px', borderRadius: '99px', fontSize: '11px', cursor: 'pointer',
                      background: checked ? `${color}18` : 'transparent',
                      border: `1px solid ${checked ? `${color}60` : 'rgba(148,163,184,0.2)'}`,
                      color: checked ? color : '#475569',
                      fontWeight: checked ? 600 : 400,
                      transition: 'all .15s',
                    }}
                  >
                    {checked ? '✓ ' : ''}{level}
                  </button>
                );
              })}
            </div>
          </div>

          {policyError && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '8px 12px', color: '#fca5a5', fontSize: '12px', marginBottom: '10px' }}>
              {policyError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={save}
              disabled={saving}
              style={{
                background: saved ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg,#3b82f6,#6366f1)',
                border: saved ? '1px solid rgba(34,197,94,0.4)' : 'none',
                borderRadius: '6px', padding: '8px 20px', color: saved ? '#22c55e' : '#fff',
                fontSize: '12px', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1, transition: 'all .2s',
              }}
            >
              {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save policy'}
            </button>
            {repo && (
              <button
                onClick={() => { setRepo(''); setMaxBlast(50); setBlockOn(['critical', 'high']); setEnabled(true); setPolicyError(''); }}
                style={{ background: 'transparent', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '6px', padding: '8px 14px', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [token, setToken]   = useState('');
  const [teamId, setTeamId] = useState('');
  const [repoId, setRepoId] = useState('');
  const [role, setRole]     = useState<OrgRole>('dev');
  const [loaded, setLoaded] = useState(false);

  const [entries, setEntries]       = useState<AuditEntry[]>([]);
  const [health, setHealth]         = useState<HealthSnapshot | null>(null);
  const [trend, setTrend]           = useState<TrendPoint[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [realtimeOn, setRealtimeOn] = useState(false);

  const [roleFilter, setRoleFilter]   = useState('all');
  const [eventFilter, setEventFilter] = useState('all');

  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchAll = useCallback(async (t: string, tid: string, rid: string) => {
    setLoading(true);
    setError(null);
    try {
      const h = { Authorization: `Bearer ${t}` };
      const requests: Promise<Response>[] = [
        fetch(`/api/teams/${tid}/audit?limit=100`, { headers: h }),
      ];
      if (rid) {
        requests.push(
          fetch(`/api/teams/${tid}/health?repoId=${encodeURIComponent(rid)}&mode=latest`, { headers: h }),
          fetch(`/api/teams/${tid}/health?repoId=${encodeURIComponent(rid)}&mode=trend&limit=30`, { headers: h }),
        );
      }
      const [auditRes, healthRes, trendRes] = await Promise.all(requests);
      if (auditRes?.ok) {
        const j = await auditRes.json();
        setEntries((j.entries ?? []).map((e: AuditEntry) => ({ ...e, isNew: false })));
      }
      if (healthRes?.ok) {
        const j = await healthRes.json();
        setHealth(j.snapshot ?? null);
      }
      if (trendRes?.ok) {
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
    if (channelRef.current) { sb.removeChannel(channelRef.current); channelRef.current = null; }
    channelRef.current = sb
      .channel(`team_audit_log:${tid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_audit_log', filter: `team_id=eq.${tid}` }, (payload) => {
        const raw = payload.new as Record<string, unknown>;
        const newEntry: AuditEntry = {
          id: raw.id as string, actorEmail: raw.actor_email as string, actorRole: raw.actor_role as OrgRole,
          eventType: raw.event_type as string, repoId: raw.repo_id as string | null, gitRef: raw.git_ref as string | null,
          riskLevel: raw.risk_level as string | null, blastRadius: raw.blast_radius as number | null,
          passed: raw.passed as boolean | null, summary: raw.summary as string | null, createdAt: raw.created_at as string, isNew: true,
        };
        setEntries(prev => [newEntry, ...prev].slice(0, 100));
        setTimeout(() => setEntries(prev => prev.map(e => e.id === newEntry.id ? { ...e, isNew: false } : e)), 3000);
      })
      .subscribe((status) => setRealtimeOn(status === 'SUBSCRIBED'));
  }, []);

  useEffect(() => {
    return () => {
      const sb = getSupabaseClient();
      if (sb && channelRef.current) sb.removeChannel(channelRef.current);
    };
  }, []);

  // Auto-load from httpOnly cookie on mount
  useEffect(() => {
    async function autoLoad() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return;
        const me = await res.json() as { authenticated: boolean; token: string; teamId: string | null; role: string | null };
        if (!me.authenticated || !me.token || !me.teamId) return;
        setToken(me.token);
        setTeamId(me.teamId);
        if (me.role === 'owner' || me.role === 'admin') setRole(me.role);
        setLoaded(true);
        await fetchAll(me.token, me.teamId, '');
        subscribeRealtime(me.teamId);
      } catch { /* not logged in */ }
    }
    autoLoad();
  }, [fetchAll, subscribeRealtime]);

  async function handleLoad() {
    if (!token || !teamId) return;
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
  const passRate = checkEntries.length > 0 ? Math.round((checkEntries.filter(e => e.passed).length / checkEntries.length) * 100) : null;
  const uniqueRoles  = [...new Set(entries.map(e => e.actorRole))];
  const uniqueEvents = [...new Set(entries.map(e => e.eventType))];
  const trendPoints = trend.map(t => ({ x: t.createdAt, avgBlast: t.avgBlastRadius, maxBlast: t.maxBlastRadius, coupling: t.couplingScore, files: t.fileCount }));

  const inputStyle = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: '6px', padding: '7px 10px', color: '#f4f7ff', fontSize: '12px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'var(--font-geist-mono)' };
  const selectStyle = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: '6px', padding: '4px 8px', color: '#94a3b8', fontSize: '11px', cursor: 'pointer' };

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

      {/* Auth panel — shown when not auto-loaded from cookie */}
      {!loaded && (
        <div style={{ background: 'rgba(10,16,30,0.7)', border: '1px solid rgba(148,163,184,0.14)', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
          {([
            { label: 'Auth token', value: token,  set: setToken,  type: 'password', ph: 'cxgrd JWT' },
            { label: 'Team ID',    value: teamId, set: setTeamId, type: 'text',     ph: 'uuid' },
            { label: 'Repo ID',    value: repoId, set: setRepoId, type: 'text',     ph: 'folder name (optional)' },
          ] as const).map(({ label, value, set, type, ph }) => (
            <div key={label}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '5px' }}>{label}</div>
              <input type={type} value={value} onChange={e => set(e.target.value)} placeholder={ph} onKeyDown={e => e.key === 'Enter' && handleLoad()} style={{ ...inputStyle, width: '100%' }} />
            </div>
          ))}
          <button onClick={handleLoad} disabled={!token || !teamId || loading} style={{ background: loading ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg,#3b82f6,#6366f1)', border: 'none', borderRadius: '6px', padding: '8px 18px', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
            {loading ? 'Loading…' : 'Load'}
          </button>
        </div>
      )}

      {/* Repo ID input when auto-loaded but no repo selected */}
      {loaded && !repoId && (
        <div style={{ background: 'rgba(10,16,30,0.7)', border: '1px solid rgba(148,163,184,0.14)', borderRadius: '10px', padding: '12px 16px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Repo ID for health data:</span>
          <input value={repoId} onChange={e => setRepoId(e.target.value)} placeholder="folder name" onKeyDown={e => e.key === 'Enter' && fetchAll(token, teamId, repoId)} style={{ ...inputStyle, width: '200px' }} />
          <button onClick={() => fetchAll(token, teamId, repoId)} style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '6px', padding: '6px 14px', color: '#60a5fa', fontSize: '12px', cursor: 'pointer' }}>Load health</button>
        </div>
      )}

      {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px', color: '#fca5a5', fontSize: '12px', marginBottom: '1.25rem' }}>{error}</div>}

      {!loaded && !loading && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#475569', fontSize: '13px' }}>
          Logging in at <a href="/api/auth/github" style={{ color: '#60a5fa' }}>cxgrd.com</a> will load your dashboard automatically.
        </div>
      )}

      {loaded && (
        <>
          {/* Health cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '10px', marginBottom: '1.25rem' }}>
            <StatCard label="Files"        value={health?.fileCount ?? '—'} trend={trend.map(t => t.fileCount)} />
            <StatCard label="Dependencies" value={health?.depCount  ?? '—'} />
            <StatCard label="Avg blast"    value={health ? health.avgBlastRadius : '—'} sub="files affected" trend={trend.map(t => t.avgBlastRadius)} />
            <StatCard label="Max blast"    value={health ? health.maxBlastRadius : '—'} sub="files affected" />
            <StatCard label="Coupling"     value={health ? health.couplingScore.toFixed(2) : '—'} trend={trend.map(t => t.couplingScore)} />
            <StatCard label="Hub files"    value={health?.hubCount ?? '—'} />
            <StatCard label="Pass rate"    value={passRate !== null ? `${passRate}%` : '—'} sub={`${checkEntries.length} checks`} />
            <StatCard label="Events"       value={entries.length} sub="last 100" />
          </div>

          {/* Trend charts */}
          {trend.length >= 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '10px', marginBottom: '1.25rem' }}>
              <TrendChart title="Blast radius trend" series={[
                { label: 'Avg blast', color: '#60a5fa', points: trendPoints.map(p => ({ x: p.x, y: p.avgBlast })) },
                { label: 'Max blast', color: '#f97316', points: trendPoints.map(p => ({ x: p.x, y: p.maxBlast })) },
              ]} />
              <TrendChart title="Architecture health trend" series={[
                { label: 'Coupling', color: '#a78bfa', points: trendPoints.map(p => ({ x: p.x, y: p.coupling })) },
                { label: 'Files',    color: '#22c55e', points: trendPoints.map(p => ({ x: p.x, y: p.files })) },
              ]} />
            </div>
          )}

          {/* Hotspot heatmap */}
          {health && health.hotspots.length > 0 && <HotspotHeatmap hotspots={health.hotspots} />}

          {/* Hotspot chips */}
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

          {/* Merge policies */}
          <MergePoliciesPanel token={token} teamId={teamId} role={role} />

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
                        <td style={{ padding: '9px 14px', color: '#cbd5e1', whiteSpace: 'nowrap', fontFamily: 'var(--font-geist-mono)', fontSize: '11px' }}>{EVENT_ICONS[entry.eventType] ?? '•'} {entry.eventType}</td>
                        <td style={{ padding: '9px 14px', color: '#64748b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.actorEmail}</td>
                        <td style={{ padding: '9px 14px' }}><RoleBadge role={entry.actorRole} /></td>
                        <td style={{ padding: '9px 14px', color: '#64748b', fontFamily: 'var(--font-geist-mono)', fontSize: '11px' }}>{entry.repoId ?? '—'}</td>
                        <td style={{ padding: '9px 14px', color: '#475569', fontFamily: 'var(--font-geist-mono)', fontSize: '11px' }}>{shortRef(entry.gitRef)}</td>
                        <td style={{ padding: '9px 14px' }}>
                          {entry.riskLevel ? <span style={{ color: RISK_COLORS[entry.riskLevel] ?? '#94a3b8', fontWeight: 600, fontSize: '11px' }}>{entry.riskLevel}</span> : <span style={{ color: '#475569' }}>—</span>}
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
