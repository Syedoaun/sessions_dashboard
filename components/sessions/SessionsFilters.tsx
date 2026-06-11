'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

export const SESSION_SORTS = [
  { value: 'date_desc', label: 'Newest first' },
  { value: 'date_asc', label: 'Oldest first' },
  { value: 'name_asc', label: 'Topic A–Z' },
  { value: 'name_desc', label: 'Topic Z–A' },
  { value: 'students_desc', label: 'Most students' },
  { value: 'students_asc', label: 'Fewest students' },
]

type Props = {
  q: string
  sort: string
  bootcamp: string
  city: string
  bootcamps: { id: string; name: string }[]
  cities: string[]
}

export function SessionsFilters({ q, sort, bootcamp, city, bootcamps, cities }: Props) {
  const router = useRouter()
  const [text, setText] = useState(q)
  useEffect(() => setText(q), [q])

  function pushWith(overrides: Partial<Pick<Props, 'q' | 'sort' | 'bootcamp' | 'city'>>) {
    const merged = { q, sort, bootcamp, city, ...overrides }
    const params = new URLSearchParams()
    if (merged.q) params.set('q', merged.q)
    if (merged.sort && merged.sort !== 'date_desc') params.set('sort', merged.sort)
    if (merged.bootcamp) params.set('bootcamp', merged.bootcamp)
    if (merged.city) params.set('city', merged.city)
    const qs = params.toString()
    router.push(qs ? `/sessions?${qs}` : '/sessions')
  }

  const hasFilters = !!(q || bootcamp || city) || sort !== 'date_desc'
  const selectClass =
    'rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring'

  return (
    <div className="bg-white rounded-xl border p-3 flex flex-wrap items-center gap-2">
      {/* Search */}
      <form
        onSubmit={(e) => { e.preventDefault(); pushWith({ q: text.trim() }) }}
        className="relative flex-1 min-w-[200px]"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search topic, school or city…"
          className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </form>

      {/* Sort */}
      <select value={sort} onChange={(e) => pushWith({ sort: e.target.value })} className={selectClass} title="Sort by">
        {SESSION_SORTS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Bootcamp */}
      <select value={bootcamp} onChange={(e) => pushWith({ bootcamp: e.target.value })} className={selectClass} title="Filter by bootcamp">
        <option value="">All bootcamps</option>
        {bootcamps.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>

      {/* City */}
      <select value={city} onChange={(e) => pushWith({ city: e.target.value })} className={selectClass} title="Filter by city">
        <option value="">All cities</option>
        {cities.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={() => { setText(''); router.push('/sessions') }}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-2 py-2"
        >
          <X className="w-3.5 h-3.5" /> Clear
        </button>
      )}
    </div>
  )
}
