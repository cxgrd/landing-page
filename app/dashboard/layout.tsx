import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — cxgrd',
  description: 'Team dependency graph, audit log, and architecture health',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top nav */}
      <header style={{
        borderBottom: '1px solid rgba(148,163,184,0.1)',
        padding: '0 1.5rem',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(5,7,15,0.85)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '15px', fontWeight: 700, color: '#f4f7ff', letterSpacing: '-0.02em' }}>
              cx<span style={{ color: '#60a5fa' }}>grd</span>
            </span>
          </a>
          <span style={{ color: 'rgba(148,163,184,0.3)', fontSize: '14px' }}>/</span>
          <span style={{ fontSize: '13px', color: '#94a3b8', fontFamily: 'var(--font-geist-mono)' }}>dashboard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="https://docs.cxgrd.com" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>Docs</a>
          <p>|</p>
          <a href="https://docs.cxgrd.com/merge-policies" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>How Merge Policies work</a>
        </div>
      </header>
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
}
