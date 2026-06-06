import Image from "next/image";
import { Footer } from "@/components/Footer";

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
    detail: "Prevent silent breakage before implementation begins",
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
    command: "cxgrd scan",
    summary: "Crawls the repo and builds dependency + symbol graphs.",
    output: "Creates and updates .cg/ graph memory.",
  },
  {
    command: "cxgrd input",
    summary: "Analyzes a planned change and computes blast radius.",
    output: "Returns impacted files and architectural dependencies.",
  },
  {
    command: "cxgrd prompt",
    summary: "Builds an architecture-aware prompt for your AI assistant.",
    output: "Produces enriched prompt context for safer code generation.",
  },
  {
    command: "cxgrd check",
    summary: "Verifies implementation quality with compiler-backed checks.",
    output: "Flags structural issues before merge or commit.",
  },
];

const architecture = [
  {
    title: "C++ core engine",
    points: [
      "High-performance scanning and filesystem crawling",
      "AST graph building with caching and parallel analysis",
      "Foundation for fast repo-scale dependency traversal",
    ],
  },
  {
    title: "TypeScript CLI and integrations",
    points: [
      "Framework intelligence and plugin-ready wrappers",
      "Usable CLI commands and workflow integrations",
      "Future ecosystem hooks for IDEs and team workflows",
    ],
  },
];

const roadmap = [
  "AST dependency graph foundation",
  "Blast radius analysis + pre-commit workflow hooks",
  "Compiler-backed semantic diff verification",
  "Prompt generation + persistent repo memory",
  "Team workflows: shared graphs, policies, dashboards",
  "Cursor / VS Code plugin integrations",
];

export default function Home() {
  const githubLink = process.env.GITHUB_ORG_LINK || "https://github.com";

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
            href={githubLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-all duration-300 hover:border-blue-300/60 hover:text-white hover:shadow-lg hover:shadow-blue-500/20"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-24 pt-14 sm:pt-20 mt-0 sm:mt-4">
        <section id="home" className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs font-medium text-blue-100">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Automated Architectural Guardrail for AI-Native Development
          </div>

          <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
            Move fast with AI{" "}
            <span className="animated-gradient-text bg-gradient-to-r from-blue-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
              without silently breaking your architecture
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-pretty text-base leading-relaxed text-slate-300 sm:text-lg">
            <span className="font-semibold text-white">cxgrd</span> is a lightweight developer CLI that maps codebase
            dependencies, computes downstream blast radius before sweeping AI edits, and checks generated diffs for
            structural and logic risks before commit.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300 sm:text-sm">
            <span className="command-chip rounded-full px-3 py-1.5">AST graph intelligence</span>
            <span className="command-chip rounded-full px-3 py-1.5">Persistent .cg/ repo memory</span>
            <span className="command-chip rounded-full px-3 py-1.5">Compiler-backed validation</span>
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
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Hybrid architecture</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
            CXGRD combines a high-performance native core with an ecosystem-friendly TypeScript command layer.
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

        <section id="install" className="mt-28 sm:mt-36">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Install CXGRD</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Get started with CXGRD in minutes.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-1">
            <article className="feature-card glass-surface rounded-2xl p-6">
              <p className="text-sm font-semibold text-blue-200">Install via npm</p>
              <pre className="mt-4 overflow-x-auto rounded bg-[#0a0f1a] p-4 text-left text-sm text-green-400">
                npm install -g cxgrd
              </pre>
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
