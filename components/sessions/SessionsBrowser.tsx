'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Search, X, Users, MessageSquare, CalendarDays, ChevronRight, Layers } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useIsAdmin } from '@/components/auth/AuthContext'

export type SessionRow = {
  id: string
  date: string
  school: string
  city: string | null
  topic: string
  bootcamp_id: string | null
  bootcamp: string | null
  trainers: string[]
  attendance_count: number
  feedback_count: number
}

const COLORS = [
  'bg-blue-500', 'bg-orange-400', 'bg-red-500',
  'bg-cyan-500', 'bg-purple-500', 'bg-emerald-500',
]
function colorFor(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return COLORS[Math.abs(h) % COLORS.length]
}

const SORTS = [
  { value: 'date_desc', label: 'Newest first' },
  { value: 'date_asc', label: 'Oldest first' },
  { value: 'name_asc', label: 'Topic A–Z' },
  { value: 'name_desc', label: 'Topic Z–A' },
  { value: 'students_desc', label: 'Most students' },
  { value: 'students_asc', label: 'Fewest students' },
]

export function SessionsBrowser({
  sessions,
  availableBootcamps = [],
  cities,
  initialQuery = '',
}: {
  sessions: SessionRow[]
  availableBootcamps?: { id: string; name: string }[]
  cities: string[]
  initialQuery?: string
}) {
  const isAdmin = useIsAdmin()
  const [query, setQuery] = useState(initialQuery)
  const [sort, setSort] = useState('date_desc')
  const [bootcamp, setBootcamp] = useState('')
  const [city, setCity] = useState('')

  // Bootcamp filter options: every available bootcamp, plus any found on the
  // sessions themselves (covers data created before bootcamps were managed).
  const bootcamps = useMemo(() => {
    const map = new Map<string, string>()
    for (const b of availableBootcamps) map.set(b.id, b.name)
    for (const s of sessions) if (s.bootcamp_id && s.bootcamp && !map.has(s.bootcamp_id)) map.set(s.bootcamp_id, s.bootcamp)
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [availableBootcamps, sessions])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = sessions.filter((s) => {
      if (bootcamp && s.bootcamp_id !== bootcamp) return false
      if (city && s.city !== city) return false
      if (q) {
        // Search across topic, school, city, bootcamp and any trainer name
        const haystack = [s.topic, s.school, s.city ?? '', s.bootcamp ?? '', ...s.trainers]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
    return [...rows].sort((a, b) => {
      switch (sort) {
        case 'date_asc':      return a.date.localeCompare(b.date)
        case 'name_asc':      return a.topic.localeCompare(b.topic)
        case 'name_desc':     return b.topic.localeCompare(a.topic)
        case 'students_desc': return b.attendance_count - a.attendance_count
        case 'students_asc':  return a.attendance_count - b.attendance_count
        default:              return b.date.localeCompare(a.date)
      }
    })
  }, [sessions, query, sort, bootcamp, city])

  const hasFilters = !!(query.trim() || bootcamp || city) || sort !== 'date_desc'
  const selectClass =
    'rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring'

  function clearAll() {
    setQuery(''); setSort('date_desc'); setBootcamp(''); setCity('')
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-gray-800">All Sessions</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {hasFilters
              ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} of ${sessions.length}`
              : `${sessions.length} session${sessions.length !== 1 ? 's' : ''} total`}
          </p>
        </div>
        {isAdmin && (
          <Link href="/sessions/new" className="shrink-0">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Session</span><span className="sm:hidden">New</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topic, school, city or trainer…"
            className="w-full rounded-md border border-input bg-background pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <select value={sort} onChange={(e) => setSort(e.target.value)} className={`${selectClass} min-w-[140px]`} title="Sort by">
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {bootcamps.length > 0 && (
          <select value={bootcamp} onChange={(e) => setBootcamp(e.target.value)} className={`${selectClass} min-w-[150px]`} title="Filter by bootcamp">
            <option value="">All bootcamps</option>
            {bootcamps.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}

        <select value={city} onChange={(e) => setCity(e.target.value)} className={`${selectClass} min-w-[130px]`} title="Filter by city">
          <option value="">All cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-2 py-2"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 && (
          <p className="p-10 text-center text-sm text-gray-400">
            {sessions.length === 0 ? 'No sessions yet.' : 'No sessions match these filters.'}
          </p>
        )}
        <div className="divide-y divide-gray-50">
          {filtered.map((s) => {
            const color = colorFor(s.school ?? s.topic)
            return (
              <Link key={s.id} href={`/sessions/${s.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                  <CalendarDays className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{s.topic}</p>
                    {s.bootcamp && (
                      <span
                        className="hidden sm:inline-flex items-center gap-1 max-w-[220px] text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 shrink-0"
                        title={s.bootcamp}
                      >
                        <Layers className="w-3 h-3 shrink-0" />
                        <span className="truncate">{s.bootcamp}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5 truncate">
                    {s.school}
                    {s.city ? ` · ${s.city}` : ''}
                    {s.trainers.length ? ` · ${s.trainers.join(', ')}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-3 sm:gap-5 text-sm text-gray-400 shrink-0">
                  <div className="text-center hidden sm:block">
                    <p className="text-xs text-gray-300">Date</p>
                    <p className="font-medium text-gray-600">{formatDate(s.date)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-300 hidden sm:block">Students</p>
                    <p className="font-semibold text-gray-700 flex items-center gap-1 justify-center">
                      <Users className="w-3.5 h-3.5" />{s.attendance_count}
                    </p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-xs text-gray-300">Feedback</p>
                    <p className="font-semibold text-gray-700 flex items-center gap-1 justify-center">
                      <MessageSquare className="w-3.5 h-3.5" />{s.feedback_count}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
