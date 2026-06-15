'use client';

import { useEffect, useState, useCallback } from 'react';

type AuditEntry = {
  id: string;
  actorEmail: string;
  actorRole: 'owner' | 'admin' | 'dev';
  eventType: string;
  repoId: string | null;
  gitRef: string | null;
  riskLevel: string | null;
  blastRadius: number | null;
  passed: boolean | null;
  summary: string | null;
  createdAt: string;
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

type DashboardData = {
  teamId: string;
  repoId: string;
  auditEntries: AuditEntry[];
  health: HealthSnapshot | null;
};

const RISK_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const EVENT_ICONS: Record<string, string> = {
  scan: '🔍',
  check: '✓',
  input: '💥',
  prompt: '✨',
  sync: '☁',
  precommit: '🔒',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getRoleBadgeStyle(role: string): string {
  if (role === 'owner') return 'background:rgba(139,92,246,0.18);color:#a78bfa';
  if (role === 'admin') return 'background:rgba(59,130,246,0.18);color:#60a5fa';
  return 'background:rgba(148,163,184,0.12);color:#94a3b8';
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [teamId, setTeamId] = useState('');
  const [repoId, setRepoId] = useState('');

  const fetchDashboard = useCallback(async (t: string, tid: string, rid: string) => {
    setLoading(true);
    setError(null);
    try {
      const headers = { 'x-cxgrd-token': t, 'Content-Type': 'application/json' };

      const [auditRes, healthRes] = await Promise.all([
        fetch(`/api/teams/${tid}/audit?limit=50`, { headers }),
        fetch(`/api/teams/${tid}/health?repoId=${encodeURIComponent(rid)}&mode=latest`, { headers }),
      ]);

      const auditJson = auditRes.ok ? await auditRes.json() : { entries: [] };
      const healthJson = healthRes.ok ? await healthRes.json() : null;

      setData({
        teamId: tid,
        repoId: rid,
        auditEntries: auditJson.entries ?? [],
        health: healthJson?.snapshot ?? null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  function handleLoad() {
    if (!token || !teamId || !repoId) return;
    fetchDashboard(token, teamId, repoId);
  }

  const passRate = data
    ? Math.round(
        (data.auditEntries.filter((e) => e.passed === true).length /
          Math.max(data.auditEntries.filter((e) => e.passed !== null).length, 1)) *
          100,
      )
    : 0;

  return (
    <div style={{ minHeight: '100vh', padding: '2rem 1.5rem', fontFamily: 'var(--font-geist-mono, monospace)' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '11px', color: '#64748b', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
          cxgrd / team
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#f4f7ff', margin: 0 }}>Dashboard</h1>
      </div>

      {/* Token + team input */}
      <div style={{
        background: 'rgba(10,16,30,0.7)', border: '1px solid rgba(148,163,184,0.15)',
        borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem',
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', alignItems: 'end',
      }}>
        {[
          { label: 'Auth token', value: token ?? '', set: setToken, placeholder: 'your cxgrd JWT' },
          { label: 'Team ID', value: teamId, set: setTeamId, placeholder: 'uuid' },
          { label: 'Repo ID', value: repoId, set: setRepoId, placeholder: 'folder name' },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '5px' }}>{label}</div>
            <input
              value={value}
              onChange={(e) => set(e.target.value)}
              placeholder={placeholder}
              style={{
                width: '100%', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)',
                borderRadius: '6px', padding: '7px 10px', color: '#f4f7ff', fontSize: '12px',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        ))}
        <button
          onClick={handleLoad}
          style={{
            background: 'linear-gradient(135deg,#3b82f6,#6366f1)', border: 'none',
            borderRadius: '6px', padding: '8px 18px', color: '#fff', fontSize: '12px',
            fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          Load
        </button>
      </div>

      {loading && !data && (
        <div style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '3rem 0' }}>
          Loading dashboard...
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '8px', padding: '12px 16px', color: '#fca5a5', fontSize: '13px', marginBottom: '1.5rem',
        }}>
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Health cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '10px', marginBottom: '1.5rem' }}>
            {[
              { label: 'Files', value: data.health?.fileCount ?? '—' },
              { label: 'Dependencies', value: data.health?.depCount ?? '—' },
              { label: 'Avg blast radius', value: data.health ? `${data.health.avgBlastRadius} files` : '—' },
              { label: 'Max blast radius', value: data.health ? `${data.health.maxBlastRadius} files` : '—' },
              { label: 'Coupling score', value: data.health ? data.health.couplingScore.toFixed(2) : '—' },
              { label: 'Hub files', value: data.health?.hubCount ?? '—' },
              { label: 'Check pass rate', value: `${passRate}%` },
              { label: 'Events (50)', value: data.auditEntries.length },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: 'rgba(10,16,30,0.7)', border: '1px solid rgba(148,163,184,0.12)',
                borderRadius: '10px', padding: '1rem',
              }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>{label}</div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: '#f4f7ff' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Hotspots */}
          {data.health && data.health.hotspots.length > 0 && (
            <div style={{
              background: 'rgba(10,16,30,0.7)', border: '1px solid rgba(148,163,184,0.12)',
              borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem',
            }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px' }}>
                Hotspot files
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {data.health.hotspots.map((f) => (
                  <span key={f} style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: '99px', padding: '3px 12px', fontSize: '11px', color: '#fca5a5',
                  }}>
                    {f.split(/[/\\]/).pop()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Audit log */}
          <div style={{
            background: 'rgba(10,16,30,0.7)', border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: '10px', overflow: 'hidden',
          }}>
            <div style={{
              padding: '1rem 1.25rem', borderBottom: '1px solid rgba(148,163,184,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#f4f7ff' }}>Audit log</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{data.auditEntries.length} events</div>
            </div>

            {data.auditEntries.length === 0 ? (
              <div style={{ padding: '2rem', color: '#64748b', fontSize: '13px', textAlign: 'center' }}>
                No events yet. Run <code style={{ color: '#60a5fa' }}>cxgrd scan --team</code> to start.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                      {['Event', 'Actor', 'Role', 'Repo', 'Ref', 'Risk', 'Blast', 'Status', 'When'].map((h) => (
                        <th key={h} style={{
                          padding: '8px 14px', textAlign: 'left', color: '#64748b',
                          fontWeight: 500, fontSize: '11px', letterSpacing: '.04em',
                          textTransform: 'uppercase', whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.auditEntries.map((entry, i) => (
                      <tr key={entry.id} style={{
                        borderBottom: '1px solid rgba(148,163,184,0.06)',
                        background: i % 2 === 0 ? 'transparent' : 'rgba(148,163,184,0.02)',
                      }}>
                        <td style={{ padding: '10px 14px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                          <span style={{ marginRight: '6px' }}>{EVENT_ICONS[entry.eventType] ?? '•'}</span>
                          {entry.eventType}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#94a3b8', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {entry.actorEmail}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '99px', fontSize: '10px',
                            fontWeight: 500, ...(Object.fromEntries(
                              getRoleBadgeStyle(entry.actorRole).split(';').map((s) => {
                                const [k, v] = s.split(':');
                                return [k?.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v?.trim()];
                              }).filter(([k]) => k),
                            )),
                          }}>
                            {entry.actorRole}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{entry.repoId ?? '—'}</td>
                        <td style={{ padding: '10px 14px', color: '#64748b', fontFamily: 'monospace', fontSize: '11px' }}>
                          {entry.gitRef ? entry.gitRef.slice(0, 7) : '—'}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {entry.riskLevel ? (
                            <span style={{ color: RISK_COLORS[entry.riskLevel] ?? '#94a3b8', fontWeight: 500 }}>
                              {entry.riskLevel}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#94a3b8' }}>
                          {entry.blastRadius != null ? entry.blastRadius : '—'}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {entry.passed === true && <span style={{ color: '#22c55e' }}>✓ pass</span>}
                          {entry.passed === false && <span style={{ color: '#ef4444' }}>✗ fail</span>}
                          {entry.passed == null && <span style={{ color: '#64748b' }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {timeAgo(entry.createdAt)}
                        </td>
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
