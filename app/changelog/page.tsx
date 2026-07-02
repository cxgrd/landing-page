import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";

const releases = [
  {
    version: "v0.1.33",
    date: "July 2, 2026",
    badge: "latest",
    badgeColor: "emerald",
    changes: [
      { type: "fixed", text: "Documentation updated with clearer examples and explanations for all tiers" },
      { type: "improved", text: "Landing page UI improved to give clear distinction between other AI tools and CXGRD" },
    ],
  },
  {
    version: "v0.1.30",
    date: "June 29, 2026",
    badge: null,
    badgeColor: null,
    changes: [
      { type: "improved", text: "`check --ci` command improved, pushes PR statuses to GitHub" },
      { type: "new", text: "github-installation route added to fetch github details for dashboard" },
      { type: "breaking", text: "docs need to be updated to reflect new changes in check command and github-installation route" },
    ],
  },
  {
    version: "v0.1.23",
    date: "June 28, 2026",
    badge: null,
    badgeColor: null,
    changes: [
      { type: "improved", text: "config command now provides clearer feedback and options" },
      { type: "improved", text: "Documentation updated with clearer examples and explanations" },
      { type: "new", text: "added billing page "}
    ],
  },
  {
    version: "v0.1.22",
    date: "June 17, 2026",
    badge: null,
    badgeColor: null,
    changes: [
      { type: "new", text: "--ci flag for check command" },
      { type: "new", text: "github webhook, ci-check and merge policies routes implemented" },
    ],
  },
  {
    version: "v0.1.21",
    date: "June 16, 2026",
    badge: null,
    badgeColor: null,
    changes: [
      { type: "improved", text: "improved input command's results" },
      { type: "new", text: "team dashboard UI built and supabase realtime subscriptions implemented" },
    ],
  },
  {
    version: "v0.1.20",
    date: "June 15, 2026",
    badge: null,
    badgeColor: null,
    changes: [
      { type: "improved", text: "scan command now posts health snapshots and audit events" },
      { type: "new", text: "team dashboard UI built" },
    ],
  },
  {
    version: "v0.1.19",
    date: "June 14, 2026",
    badge: null,
    badgeColor: null,
    changes: [
      { type: "new", text: "shared dep graph sync (POST /teams/:id/graph/sync) route created" },
      { type: "new", text: "pushgraph(), pullgraph() and fetchOrgPolicy() functions implemented in CLI" },
    ],
  },
  {
    version: "v0.1.17",
    date: "June 13, 2026",
    badge: null,
    badgeColor: null,
    changes: [
      { type: "new", text: "Started work on Team tier" },
      { type: "new", text: "team_member and role schemas , role based /check middleware and --team flag for scan command" },
    ],
  },
  {
    version: "v0.1.16",
    date: "June 7, 2026",
    badge: null,
    badgeColor: null,
    changes: [
      { type: "improved", text: "Blast radius calculation now normalizes Python dot-notation imports (e.g. app.oauth) to file paths, fixing 0-affected-files false negatives" },
      { type: "improved", text: "Symbol extraction now catches class methods and async functions, not just top-level definitions" },
      { type: "improved", text: "Reverse dependency graph rebuilt to correctly traverse transitive impact chains" },
    ],
  },
  {
    version: "v0.1.14",
    date: "June 7, 2026",
    badge: null,
    badgeColor: null,
    changes: [
      { type: "fixed", text: "cxgrd input command fixed — symbol matching now uses whole-token matching instead of substring matching, eliminating false positives" },
      { type: "fixed", text: "Input command now searches symbols.json for function and class names mentioned in the change description" },
    ],
  },
  {
    version: "v0.1.12",
    date: "June 6, 2026",
    badge: null,
    badgeColor: null,
    changes: [
      { type: "fixed", text: "Authorization header now sent as x-cxgrd-token fallback to bypass reverse proxy stripping on cloud deployments" },
      { type: "fixed", text: "cxgrd prompt now correctly reaches the cloud API endpoint in production" },
    ],
  },
  {
    version: "v0.1.10",
    date: "June 6, 2026",
    badge: null,
    badgeColor: null,
    changes: [
      { type: "fixed", text: "Resolved 401 Unauthorized errors on cxgrd prompt — token verification now works correctly on the server" },
      { type: "improved", text: "Auth token TTL increased to 30 days — users no longer need to re-login frequently" },
    ],
  },
  {
    version: "v0.1.5",
    date: "June 5, 2026",
    badge: null,
    badgeColor: null,
    changes: [
      { type: "fixed", text: "LLM cloud API correctly configured — cxgrd prompt now calls Groq via server endpoint instead of requiring a local API key" },
      { type: "fixed", text: "CLI auth login polling fixed — session was not being registered before polling began, causing immediate timeout" },
    ],
  },
  {
    version: "v0.1.3",
    date: "June 5, 2026",
    badge: null,
    badgeColor: null,
    changes: [
      { type: "fixed", text: "GitHub OAuth redirect URI errors resolved — callback URL now correctly configured for production" },
      { type: "fixed", text: "cxgrd auth login flow stabilized end to end" },
    ],
  },
  {
    version: "v0.1.2",
    date: "June 4, 2026",
    badge: null,
    badgeColor: null,
    changes: [
      { type: "fixed", text: "Switched module system from ESM to CommonJS — resolved ERR_MODULE_NOT_FOUND errors after global install" },
      { type: "fixed", text: "import.meta.url removed from env.ts — incompatible with CommonJS target" },
    ],
  },
  {
    version: "v0.1.1",
    date: "June 4, 2026",
    badge: null,
    badgeColor: null,
    changes: [
      { type: "fixed", text: "First npm publish — dist/ folder now correctly included in the published package" },
      { type: "fixed", text: "prepublishOnly script added to auto-build before publish" },
    ],
  },
  {
    version: "v0.1.0",
    date: "June 3, 2026",
    badge: "initial release",
    badgeColor: "blue",
    changes: [
      { type: "new", text: "cxgrd scan — AST dependency graph written to .cg/ with symbols, arch layers, and repo memory" },
      { type: "new", text: "cxgrd input — blast radius analysis with affected file detection and risk scoring" },
      { type: "new", text: "cxgrd prompt — architecture-aware AI prompt generation via cloud API (Pro)" },
      { type: "new", text: "cxgrd check — compiler-backed diff verification for AI-generated code" },
      { type: "new", text: "cxgrd auth login — GitHub OAuth with JWT, plan gating, 30-day sessions" },
      { type: "new", text: "Free plan: 50 audits/month. Pro plan: unlimited audits + prompt enrichment" },
      { type: "new", text: "Dodo Payments integration for Pro upgrades with webhook-confirmed plan updates" },
      { type: "new", text: "Published to npm as cxgrd — install with npm install -g cxgrd" },
    ],
  },
];

const typeConfig = {
  new: { label: "New", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  improved: { label: "Improved", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  fixed: { label: "Fixed", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  breaking: { label: "Breaking", color: "text-red-400 bg-red-500/10 border-red-500/20" },
} as const;

export default function ChangelogPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#05070f] text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora-orb aurora-orb--one"></div>
        <div className="aurora-orb aurora-orb--two"></div>
        <div className="grid-overlay"></div>
      </div>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#05070f]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="inline-flex items-center gap-3">
            <Image src="/cxgrdlogo.png" alt="cxgrd" width={36} height={36} className="rounded-lg" priority />
            <div className="flex flex-col leading-none">
              <span className="text-base font-semibold tracking-tight text-white">cxgrd</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-blue-200/80">AI Context Guardrail</span>
            </div>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-white">
              How it works
            </a>
            <a href="#architecture" className="transition-colors hover:text-white">
              Architecture
            </a>
            <a href="#install" className="transition-colors hover:text-white">
              Install
            </a>
            <a href="/pricing" className="transition-colors hover:text-white">
              Pricing
            </a>
            <a href="https://cxgrd.com/docs" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
              Docs
            </a>
          </nav>
          <a
            href="https://github.com/cxgrd"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-all hover:border-blue-300/60 hover:text-white"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 pb-24 pt-14 sm:pt-20">
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Changelog</h1>
          <p className="mt-4 text-slate-400">Every release, every fix. The full history of cxgrd.</p>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-blue-500/40 via-slate-700/40 to-transparent" />

          <div className="space-y-12 pl-8">
            {releases.map((release, i) => (
              <article key={release.version} className="relative">
                {/* Timeline dot */}
                <div className={`absolute -left-[2.15rem] top-1.5 h-3 w-3 rounded-full border-2 ${i === 0 ? 'border-emerald-400 bg-emerald-400/30' : 'border-slate-600 bg-slate-800'}`} />

                <div className="glass-surface rounded-2xl p-6">
                  {/* Header */}
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span className="font-mono text-lg font-semibold text-white">{release.version}</span>
                    {release.badge && (
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        release.badgeColor === 'emerald'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                      }`}>
                        {release.badge}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-slate-500">{release.date}</span>
                  </div>

                  {/* Changes */}
                  <ul className="space-y-3">
                    {release.changes.map((change, j) => {
                      const config = typeConfig[change.type as keyof typeof typeConfig];
                      return (
                        <li key={j} className="flex items-start gap-3">
                          <span className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${config.color}`}>
                            {config.label}
                          </span>
                          <span className="text-sm leading-relaxed text-slate-300">{change.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-16 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-6 text-center">
          <p className="text-sm text-slate-300">
            Want to follow along?{" "}
            <a href="https://github.com/cxgrd" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
              Star the repo on GitHub
            </a>{" "}
            or{" "}
            for release updates.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
