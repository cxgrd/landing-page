'use client'

import { useState } from 'react'
import { Footer } from '@/components/Footer'
import Image from "next/image";

const faqItems = [
  {
    question: 'Does CXGRD replace unit tests or code review?',
    answer:
      'No. CXGRD complements testing and human code review by detecting the blast radius of a change — which files, functions, and dependencies are affected — before merge. Tests verify behavior; CXGRD identifies what\'s at risk from a change so you know where to focus testing and review attention.'
  },
  {
    question: 'How is CXGRD different from AI code review agents like Potpie?',
    answer:
      'CXGRD computes blast radius through deterministic dependency graph traversal — actual import and call relationships in your codebase — rather than an AI agent\'s interpretation of a diff. A dependency edge either exists or it doesn\'t; there\'s no model judgment or hallucination risk in the underlying analysis.'
  },
  {
    question: 'Does CXGRD work with GitHub Actions and CI pipelines?',
    answer:
      'Yes. CXGRD\'s Team tier includes a dedicated `cxgrd check --ci` command and CI tokens for use in GitHub Actions or any CI pipeline, enforcing merge policies automatically before code ships.'
  },
  {
    question: "What's the difference between the Free, Pro, and Team plans?",
    answer:
      'Free covers core blast radius scanning for individual developers. Pro adds AI prompt enrichment and expanded scan limits. Team adds GitHub App integration, CI enforcement, merge policies, audit logs, and a team dashboard for organizations enforcing rules across multiple repos.'
  },
  {
    question: 'Does CXGRD analyze my entire codebase or just the current diff?',
    answer:
      'CXGRD builds a dependency graph of your codebase and evaluates each change against it, so it can trace impact beyond the literal lines changed — catching downstream effects a diff-only view would miss.'
  },
  {
    question: 'Is my code sent to a third party or LLM during analysis?',
    answer:
      'Core blast radius and dependency graph analysis run deterministically without sending code to an LLM. Optional AI prompt enrichment (Pro/Team tiers) uses Groq for that specific feature only.'
  }
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer
    }
  }))
}

export default function FAQClient() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const githubLink = process.env.NEXT_PUBLIC_GITHUB_ORG_LINK || "https://github.com/cxgrd";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#05070f]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <a href="/" className="inline-flex items-center gap-3">
            <Image src="/cxgrdlogo.png" alt="cxgrd logo" width={36} height={36} className="rounded-lg" priority />
            <div className="flex flex-col leading-none">
            <span className="text-base font-semibold tracking-tight text-white">cxgrd</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-blue-200/80">
                AI Context Guardrail
            </span>
            </div>
        </a>

        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="/#how-it-works" className="transition-colors hover:text-white">How it works</a>
            <a href="/#architecture" className="transition-colors hover:text-white">Architecture</a>
            <a href="/#install" className="transition-colors hover:text-white">Install</a>
            <a href="/pricing" className="font-medium transition-colors hover:text-white">Pricing</a>
            <a href="https://cxgrd.com/docs" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">Docs</a>
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

      <main className="mx-auto w-full max-w-6xl px-6 pb-24 pt-14 sm:pt-20">
        <section className="mx-auto flex max-w-4xl flex-col">
          <section className="mx-auto max-w-4xl text-center">
            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
                Frequently Asked{" "}
            <span className="animated-gradient-text bg-gradient-to-r from-blue-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
            Questions
            </span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-pretty text-base leading-relaxed text-slate-300 sm:text-lg">
                Browse common questions about how CXGRD works, what it analyzes, and which plan fits your team.
            </p>
          </section>

          <div className="mt-10 overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/70 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_80px_rgba(2,8,23,0.45)] backdrop-blur">
            {faqItems.map((item, index) => {
              const isOpen = openIndex === index

              return (
                <div key={item.question} className={`border-b border-slate-800/80 last:border-b-0 ${isOpen ? 'bg-slate-800/40' : 'bg-transparent'}`}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors duration-200 hover:bg-slate-800/70"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                  >
                    <span className="text-lg font-medium text-slate-100">{item.question}</span>
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full border border-slate-700/80 bg-slate-950/70 text-slate-300 transition-all duration-300 ${isOpen ? 'rotate-180 border-cyan-500/40 text-cyan-300' : ''}`}
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        aria-hidden="true"
                      >
                        <path d="M5 7.5L10 12.5L15 7.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </button>

                  <div
                    className={`grid overflow-hidden px-5 transition-all duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] pb-5 opacity-100' : 'grid-rows-[0fr] pb-0 opacity-0'}`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-base leading-7 text-slate-400">{item.answer}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}