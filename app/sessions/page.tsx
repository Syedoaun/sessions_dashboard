import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Users, MessageSquare, CalendarDays, ChevronRight, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const revalidate = 0

const COLORS = [
  'bg-blue-500', 'bg-orange-400', 'bg-red-500',
  'bg-cyan-500', 'bg-purple-500', 'bg-emerald-500',
]
function colorFor(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return COLORS[Math.abs(h) % COLORS.length]
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const search = q?.trim() ?? ''

  let query = supabase
    .from('sessions')
    .select(`*, trainers:session_trainers(trainer:trainers(name)), bootcamp:bootcamps(name), attendance_count:attendance(count), feedback_count:feedback(count)`)
    .order('date', { ascending: false })

  if (search) {
    query = query.or(`topic.ilike.%${search}%,school.ilike.%${search}%,city.ilike.%${search}%`)
  }

  const { data: sessions } = await query

  const list = (sessions ?? []).map((s: any) => ({
    ...s,
    trainers: s.trainers?.map((t: any) => t.trainer?.name).filter(Boolean) ?? [],
    bootcamp: s.bootcamp?.name ?? null,
    attendance_count: s.attendance_count?.[0]?.count ?? 0,
    feedback_count:   s.feedback_count?.[0]?.count ?? 0,
  }))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-gray-800">All Sessions</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {search ? `${list.length} result${list.length !== 1 ? 's' : ''} for "${search}"` : `${list.length} sessions total`}
          </p>
        </div>
        <Link href="/sessions/new" className="shrink-0">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Session</span><span className="sm:hidden">New</span>
          </Button>
        </Link>
      </div>

      {/* Active search banner */}
      {search && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-blue-700">
          <span>Showing results for <strong>"{search}"</strong></span>
          <Link href="/sessions" className="ml-auto flex items-center gap-1 text-blue-500 hover:text-blue-700">
            <X className="w-3.5 h-3.5" /> Clear
          </Link>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {list.length === 0 && (
          <p className="p-10 text-center text-sm text-gray-400">
            {search ? `No sessions match "${search}".` : 'No sessions yet.'}
          </p>
        )}
        <div className="divide-y divide-gray-50">
          {list.map((s) => {
            const color = colorFor(s.school ?? s.topic)
            return (
              <Link key={s.id} href={`/sessions/${s.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                  <CalendarDays className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800 truncate">{s.topic}</p>
                    {s.bootcamp && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 shrink-0">
                        {s.bootcamp}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">
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
