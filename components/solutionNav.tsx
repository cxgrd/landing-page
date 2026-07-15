'use client'
import { useRef, useState } from 'react'

const solutionsTopics = [
  { label: 'Monorepo Type Safety', href: '/solutions/pacbtm' },
  { label: 'AI-Generated PR Review at Scale', href: '/solutions/review-ai-pr' },
  { label: 'AI Hallucinations', href: '/solutions/ai-hallucinations' },
  // ...
]

export function SolutionsNav() {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button className="text-slate-300 hover:text-white ease-out duration-700">
        Solutions ▾
      </button>

      {open && (
        <div className="absolute top-full mt-6 w-[250px] rounded-lg bg-[#05070f] border border-white/10 shadow-lg p-4">
          <div className="flex flex-col gap-2">
            {solutionsTopics.map((t) => (
              <a
                key={t.href}
                href={t.href}
                className="rounded-md px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                {t.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}