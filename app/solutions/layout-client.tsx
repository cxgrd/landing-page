'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Footer } from '@/components/Footer'

const nav = [
  { title: 'Prevent AI Code From Breaking Types in a Monorepo', href: '/solutions/pacbtm' },
  { title: 'AI Hallucinations', href: '/solutions/ai-hallucinations' },
  { title: 'Reviewing AI Pull Requests at Scale', href: '/solutions/review-ai-pr' }
]

export default function SolLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [commandsOpen, setCommandsOpen] = useState(
    pathname.startsWith('https://docs.cxgrd.com/commands')
  )

  return (
    <div className="min-h-screen flex flex-col bg-[#05070f] text-slate-200 font-geist-mono">
      <header className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/cxgrdlogo.png" alt="cxgrd" width={24} height={24} className="rounded-md" />
          <span className="font-semibold text-sm">Solutions</span>
        </Link>
      </header>

      <div className="flex flex-1">
        <aside className="w-56 shrink-0 border-r border-white/10 px-4 py-8 hidden md:block">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Solutions</p>
          <nav className="flex flex-col gap-1">
            {nav.map((item) =>
              'children' in item ? (
                <div key={item.title}>
                  <button
                    onClick={() => setCommandsOpen((o) => !o)}
                    className="w-full flex items-center justify-between text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors"
                  >
                    {item.title}
                    <span className="text-xs">{commandsOpen ? '▾' : '▸'}</span>
                  </button>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                    pathname === item.href
                      ? 'text-white bg-white/5'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.title}
                </Link>
              )
            )}
          </nav>
        </aside>

        <main className="flex-1 px-8 py-10 max-w-3xl prose prose-invert prose-slate">
          {children}
        </main>
      </div>

      <Footer />
    </div>
  )
}