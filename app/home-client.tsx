'use client';

import { useState } from "react";
import Image from "next/image";
import { Footer } from "@/components/Footer";
import { UserNav } from "@/components/useNav";
import { SolutionsNav } from "@/components/solutionNav";


const capabilities = [
  {
    title: ".cg/ - the memory your AI agents don't have",
    description:
      "Every new AI session starts from zero. Yours doesn't have to. cxgrd builds a .cg/ folder, your codebase's memory",
    detail: "No re-explaining your architecture to the agent every session.",
  },
  {
    title: "See what breaks before you prompt",
    description:
      "Most review tools tell you what broke after the AI already wrote the diff. cxgrd shows you what will break before you even send the prompt",
    detail: "Steer the agent instead of cleaning up after it.",
  },
  {
    title: "Prompt enrichment for coding agents",
    description:
      "Generate architecture-aware prompts with the right file context instead of relying on temporary agent memory.",
    detail: "Improves AI output quality on large codebases",
  },
  {
    title: "A compiler check, not a second AI",
    description:
      "Compilers verify every AI-generated diff—not another AI guessing whether the first one got it right.",
    detail: "If it doesn't compile clean, it doesn't ship",
  },
];

const commandFlow = [
  {
    command: "scan",
    summary: "Crawls the repo and builds dependency + symbol graphs.",
    output: "Creates and updates .cg/ graph memory.",
  },
  {
    command: "input",
    summary: "Analyzes a planned change and computes blast radius.",
    output: "Returns impacted files and architectural dependencies.",
  },
  {
    command: "prompt",
    summary: "Builds an architecture-aware prompt for your AI assistant.",
    output: "Produces enriched prompt context for safer code generation.",
  },
  {
    command: "check",
    summary: "Verifies implementation quality with compiler-backed checks.",
    output: "Flags structural issues before merge or commit.",
  },
];

const architecture = [
  {
    title: "TypeScript CLI",
    points: [
      "Dependency graph construction from static import analysis",
      "Blast radius computation across the full file graph",
      "Compiler-backed checks via tsc, pyright, and cargo",
    ],
  },
  {
    title: "Cloud backend",
    points: [
      "Shared team graph storage and health snapshots",
      "GitHub App integration for PR commit status enforcement",
      "Merge policy evaluation, audit log, and team dashboard",
    ],
  },
];

const mobileNavLinks = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/faq", label: "FAQs" },
];

export default function HomeClient() {
  const githubLink = process.env.GITHUB_ORG_LINK || "https://github.com/cxgrd";
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("npm install -g cxgrd");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#05070f] text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora-orb aurora-orb--one"></div>
        <div className="aurora-orb aurora-orb--two"></div>
        <div className="aurora-orb aurora-orb--three"></div>
        <div className="grid-overlay"></div>
      </div>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#05070f]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <a href="#home" className="inline-flex items-center gap-3">
            <Image
              src="/cxgrdlogo.png"
              alt="cxgrd logo"
              width={36}
              height={36}
              className="rounded-lg"
              priority
            />
            <div className="flex flex-col leading-none">
              <span className="text-base font-semibold tracking-tight text-white">cxgrd</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-blue-200/80">
                AI Context Guardrail
              </span>
            </div>
          </a>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 md:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="sr-only">Toggle menu</span>
              <div className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-4 rounded-full bg-current" />
                <span className="block h-0.5 w-4 rounded-full bg-current" />
                <span className="block h-0.5 w-4 rounded-full bg-current" />
              </div>
            </button>

            <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
              <a href="/#how-it-works" className="transition-colors hover:text-white">How it works</a>
              <a href="/pricing" className="font-medium transition-colors hover:text-white">Pricing</a>
              <a href="/docs" className="transition-colors hover:text-white">Docs</a>
              <SolutionsNav />
              <a href="/faq" className="font-medium transition-colors hover:text-white">FAQs</a>
            </nav>

            <UserNav githublink={githubLink} />
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 bg-[#05070f]/95 md:hidden">
            <nav className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-4 text-sm text-slate-300">
              {mobileNavLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2 transition hover:bg-white/5 hover:text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}

              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Solutions
                </p>
                <div className="flex flex-col gap-1">
                  <a href="/solutions/pacbtm" className="rounded px-2 py-1.5 hover:bg-white/5 hover:text-white" onClick={() => setMenuOpen(false)}>
                    Monorepo Type Safety
                  </a>
                  <a href="/solutions/review-ai-pr" className="rounded px-2 py-1.5 hover:bg-white/5 hover:text-white" onClick={() => setMenuOpen(false)}>
                    AI-Generated PR Review at Scale
                  </a>
                  <a href="/solutions/ai-hallucinations" className="rounded px-2 py-1.5 hover:bg-white/5 hover:text-white" onClick={() => setMenuOpen(false)}>
                    AI Hallucinations
                  </a>
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-24 pt-14 sm:pt-20 mt-0 sm:mt-4">

        <section id="home" className="mt-16 flex flex-col gap-12 md:flex-row md:items-center md:gap-18">

          <div className="flex-1">
            {/* <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs font-medium text-blue-100">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Automated Architectural Guardrail for AI-Native Development
            </div> */}

            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
              Your AI agent's edit{" "}
              <span className="animated-gradient-text bg-gradient-to-r from-blue-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
                looked fine, until it wasn't
              </span>
            </h1>

            <p className="mt-6 text-pretty text-base leading-relaxed text-slate-300">
              <span className="font-semibold text-white">cxgrd</span> gives your AI coding tools-Cursor, Claude Code, or Windsurf a memory of your codebase, 
              so it catches the breakage three files away—before you commit, not after you ship. <br/>
              Free to start, one command to install.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={githubLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.31.468-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .322.216.694.825.576C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub
              </a>
              <a
                href="/docs/get-started"
                className="inline-flex items-center justify-center rounded-lg bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-100 transition hover:bg-blue-500/20"
              >
                Get started →
              </a>
            </div>
          </div>

          <div className="flex-1 max-w-md w-full">
            <div className="feature-card glass-surface rounded-2xl p-6">
              <p className="text-s font-semibold uppercase tracking-widest text-blue-300 mb-4">Install for free</p>
              <div className="space-y-2">
                {[
                  "npm install -g cxgrd",
                  "cxgrd scan",
                  "cxgrd check --ci",
                ].map((cmd) => (
                  <pre key={cmd} className="rounded bg-[#0a0f1a] px-4 py-2 text-sm text-green-400">
                    <span className="text-slate-500 select-none">$ </span>{cmd}
                  </pre>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-100 transition hover:bg-blue-500/20"
                >
                  {copied ? "Copied!" : "Copy install"}
                </button>
                <a
                  href="/docs"
                  className="inline-flex items-center justify-center rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white"
                >
                  Read the docs →
                </a>
              </div>
            </div>
          </div>

        </section>

        <section id="watch-demo" className="mt-38 sm:mt-36">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">See it in action</h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
            See CXGRD in action with this quick walkthrough.
          </p>
          <div className="mt-8 flex justify-center">
            <iframe
              className="aspect-video w-full max-w-4xl rounded-xl border border-white/10"
              src="https://www.youtube-nocookie.com/embed/boxXIXMDHYc?rel=0"
              title="CXGRD demo video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        </section>

        <section id="not-another" className="mt-28 sm:mt-36 flex flex-col items-center gap-10 md:flex-row">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Not another agent guardrail</h2>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Cursor, Claude Code and other tools guard what the AI does in your editor — permissions, hooks,
              rules, one session at a time. CXGRD guards what actually merges — dependency-graph-aware, enforced 
              org-wide, regardless of which tool or person wrote the code.
            </p>
          </div>
          <div className="flex-1 flex justify-center">
            <Image
              src="/infographic.png"
              alt="cursor/claude code: session → editor → local machine vs cxgrd: PR → merge gate → whole org"
              width={800}
              height={600}
              className="rounded-xl scale-120"
            />
          </div>
        </section>

        <section id="why" className="mt-28 sm:mt-36">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Why teams are interested</h2>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
              AI coding tools are fast, but they are often stateless and context-limited. CXGRD adds architectural
              memory and dependency-aware safety checks so velocity does not come at the cost of production stability.
            </p>
          </div>
          <div className="mt-15 grid gap-4 sm:grid-cols-2">
            {capabilities.map((item) => (
              <article key={item.title} className="feature-card glass-surface rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.description}</p>
                <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-blue-200/80">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mt-28 sm:mt-36">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">How CXGRD works</h2>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
              A command-first flow that fits naturally into modern AI-assisted coding loops.
            </p>
          </div>
          <div className="mt-15 grid gap-4 md:grid-cols-2">
            {commandFlow.map((step) => (
              <article key={step.command} className="feature-card glass-surface rounded-2xl p-6">
                <p className="text-sm font-semibold text-blue-200">{step.command}</p>
                <p className="mt-2 text-base font-medium text-white">{step.summary}</p>
                <p className="mt-2 text-sm text-slate-300">{step.output}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="architecture" className="mt-28 sm:mt-36">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Architecture</h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
            A lightweight TypeScript CLI paired with a cloud backend — no native dependencies, works anywhere Node runs.
          </p>
          <div className="mt-15 grid gap-4 md:grid-cols-2">
            {architecture.map((layer) => (
              <article key={layer.title} className="feature-card glass-surface rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white">{layer.title}</h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  {layer.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="mt-[6px] h-1.5 w-1.5 flex-none rounded-full bg-blue-300"></span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
