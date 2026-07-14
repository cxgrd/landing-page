'use client'
import { useState } from 'react'

const solutionsTopics = [
  { label: 'Monorepo Type Safety', href: '/solutions/prevent-ai-code-breaking-types-monorepo' },
  { label: 'AI-Generated PR Review at Scale', href: '/solutions/reviewing-ai-prs-at-scale' },
  { label: 'Automate Blast Radius (TypeScript)', href: '/solutions/automate-blast-radius-typescript' },
  // ...
]

export function SolutionsNav() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}>Solutions ▾</button>
      {open && (
        <div className="absolute top-full mt-2 bg-white shadow-lg rounded-lg">
          {solutionsTopics.map((t) => (
            <a key={t.href} href={t.href} className="block px-4 py-2 hover:bg-gray-50">
              {t.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}