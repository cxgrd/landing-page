'use client';

import { useState } from "react";
import Image from "next/image";
import { Footer } from "@/components/Footer";
import { UserNav } from "@/components/useNav";
import { SolutionsNav } from "@/components/solutionNav";


const capabilities = [
  {
    title: "Persistent dependency memory",
    description:
      "CXGRD writes structural intelligence to a local .cg/ folder so your architecture context survives across AI sessions.",
    detail: ".cg/graph.json · symbols.json · arch.json · history.json",
  },
  {
    title: "Blast radius before edits",
    description:
      "Before prompting AI to change code, CXGRD shows what modules, schemas, and APIs will be impacted downstream.",
    detail: "Unlike session-level AI guardrails, blast radius analysis persists across tools and sessions",
  },
  {
    title: "Prompt enrichment for coding agents",
    description:
      "Generate architecture-aware prompts with the right file context instead of relying on temporary agent memory.",
    detail: "Improves AI output quality on large codebases",
  },
  {
    title: "Compiler-backed guardrails",
    description:
      "Check AI-generated diffs for logic gaps, missing imports, and dependency breakage before shipping to production.",
    detail: "Designed for safe, high-velocity AI-native workflows",
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

export default function HomeClient() {
  const githubLink = process.env.GITHUB_ORG_LINK || "https://github.com";
  const [copied, setCopied] = useState(false);

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

          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="/#how-it-works" className="transition-colors hover:text-white">How it works</a>
            <a href="/pricing" className="font-medium transition-colors hover:text-white">Pricing</a>
            <a href="/docs" className="transition-colors hover:text-white">Docs</a>
            <SolutionsNav />
            <a href="/faq" className="font-medium transition-colors hover:text-white">FAQs</a>
          </nav>

          <UserNav githublink={githubLink} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-24 pt-14 sm:pt-20 mt-0 sm:mt-4">

        <section id="home" className="flex flex-col gap-12 md:flex-row md:items-center md:gap-16">

          <div className="flex-1">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs font-medium text-blue-100">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Automated Architectural Guardrail for AI-Native Development
            </div>

            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
              Move fast with AI{" "}
              <span className="animated-gradient-text bg-gradient-to-r from-blue-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
                without silently breaking your architecture
              </span>
            </h1>

            <p className="mt-6 text-pretty text-base leading-relaxed text-slate-300">
              <span className="font-semibold text-white">cxgrd</span> is a lightweight developer CLI that maps codebase
              dependencies, computes downstream blast radius before sweeping AI edits, and checks generated diffs for
              structural and logic risks before commit.
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
                href="/docs/quickstart"
                className="inline-flex items-center justify-center rounded-lg bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-100 transition hover:bg-blue-500/20"
              >
                Quickstart →
              </a>
            </div>
          </div>

          <div className="flex-1 max-w-md w-full">
            <div className="feature-card glass-surface rounded-2xl p-6">
              <p className="text-s font-semibold uppercase tracking-widest text-blue-300 mb-4">Get started</p>
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

        <section id="watch-demo" className="mt-28 sm:mt-36">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">See it in action</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
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
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
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
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
              AI coding tools are fast, but they are often stateless and context-limited. CXGRD adds architectural
              memory and dependency-aware safety checks so velocity does not come at the cost of production stability.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
              A command-first flow that fits naturally into modern AI-assisted coding loops.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
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
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
            A lightweight TypeScript CLI paired with a cloud backend — no native dependencies, works anywhere Node runs.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
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
