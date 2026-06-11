'use client'
import { useState, useRef, useEffect } from 'react'
import type { Trainer } from '@/types'
import { Search } from 'lucide-react'

export function TrainerMultiSelect({
  trainers,
  selected,
  onToggle,
}: {
  trainers: Trainer[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close the dropdown when clicking outside
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const q = query.trim().toLowerCase()
  const available = trainers.filter((t) => !selected.includes(t.id))
  const matches = q
    ? available.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.credentials ?? '').toLowerCase().includes(q),
      )
    : available

  const selectedTrainers = selected
    .map((id) => trainers.find((t) => t.id === id))
    .filter(Boolean) as Trainer[]

  return (
    <div ref={ref} className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search trainers by name…"
          className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {open && (
          <div className="absolute z-[2000] mt-1 w-full max-h-56 overflow-auto rounded-md border bg-white shadow-lg">
            {matches.length === 0 ? (
              <p className="px-3 py-2.5 text-sm text-gray-400">
                {available.length === 0 ? 'All trainers added' : 'No trainers match'}
              </p>
            ) : (
              matches.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { onToggle(t.id); setQuery('') }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center justify-between gap-2"
                >
                  <span className="truncate">{t.name}</span>
                  {t.credentials && (
                    <span className="text-xs text-gray-400 shrink-0">{t.credentials}</span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {selectedTrainers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTrainers.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-blue-600 text-white"
            >
              {t.name}
              <button
                type="button"
                onClick={() => onToggle(t.id)}
                className="hover:text-blue-200 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
