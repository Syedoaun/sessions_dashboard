import { supabase } from '@/lib/supabase/client'
import { fetchAll } from '@/lib/supabase/fetch-all'
import Link from 'next/link'
import { CalendarDays, Users, MessageSquare, ArrowRight, ChevronRight, MapPin, BarChart2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Session } from '@/types'
import SessionMapWrapper from '@/components/map/SessionMapWrapper'
import { CompactTrendChart } from '@/components/charts/TrendChart'
import type { TrendPoint } from '@/components/charts/TrendChart'

export const revalidate = 60

const CARD_COLORS = [
  { bg: 'bg-blue-500',    text: 'text-white', bar: 'bg-blue-400'    },
  { bg: 'bg-orange-400',  text: 'text-white', bar: 'bg-orange-300'  },
  { bg: 'bg-red-500',     text: 'text-white', bar: 'bg-red-400'     },
  { bg: 'bg-cyan-500',    text: 'text-white', bar: 'bg-cyan-400'    },
  { bg: 'bg-purple-500',  text: 'text-white', bar: 'bg-purple-400'  },
  { bg: 'bg-emerald-500', text: 'text-white', bar: 'bg-emerald-400' },
]

function colorFor(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return CARD_COLORS[Math.abs(h) % CARD_COLORS.length]
}

export default async function DashboardPage() {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().slice(0, 10)

  const [rawSessions, attendanceRes, feedbackRes, recentFeedbackRes, allFeedback] = await Promise.all([
    fetchAll<any>((from, to) =>
      supabase
        .from('sessions')
        .select('id, date, school, city, topic, location, topic_summary, bootcamp_id, latitude, longitude, created_at, bootcamp:bootcamps(id, name, description, created_at), trainers:session_trainers(trainer:trainers(id, name, credentials, bio, photo_url, created_at)), attendance_count:attendance(count), feedback_count:feedback(count)')
        .is('deleted_at', null)
        .order('date', { ascending: false })
        .range(from, to)),
    // Counts/lists below exclude rows belonging to trashed sessions via an inner join
    supabase.from('attendance').select('id, sessions!inner(deleted_at)', { count: 'exact', head: true }).is('sessions.deleted_at', null),
    supabase.from('feedback').select('id, sessions!inner(deleted_at)', { count: 'exact', head: true }).is('sessions.deleted_at', null),
    supabase.from('feedback').select('student_name, class, trainer_rating, favourite_part, sessions!inner(deleted_at)').is('sessions.deleted_at', null).order('created_at', { ascending: false }).limit(5),
    fetchAll<any>((from, to) =>
      supabase.from('feedback').select('trainer_rating, understanding_level, would_attend_more, sessions!inner(deleted_at)').is('sessions.deleted_at', null).range(from, to)),
  ])

  // Top 8 for display — trainers as name strings
  const sessions = rawSessions.slice(0, 8).map((s: any) => ({
    ...s,
    trainers: s.trainers?.map((t: any) => t.trainer?.name).filter(Boolean) ?? [],
    attendance_count: s.attendance_count?.[0]?.count ?? 0,
    feedback_count: s.feedback_count?.[0]?.count ?? 0,
  }))

  // Map — only sessions with coordinates, trainers as Trainer objects
  const mapSessions: Session[] = rawSessions
    .filter((s: any) => s.latitude != null)
    .map((s: any) => ({
      ...s,
      trainers: s.trainers?.map((t: any) => t.trainer).filter(Boolean) ?? [],
      bootcamp: s.bootcamp ?? null,
      attendance_count: s.attendance_count?.[0]?.count ?? 0,
      feedback_count: s.feedback_count?.[0]?.count ?? 0,
    }))

  const totalStudents = attendanceRes.count ?? 0
  const totalFeedback = feedbackRes.count ?? 0
  const recentFeedback = recentFeedbackRes.data ?? []
  const citiesCount = new Set(rawSessions.map((s: any) => s.city).filter(Boolean)).size

  // Compact trend: last 6 months, derived from rawSessions
  const trendMonths: string[] = []
  const nowD = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(nowD.getFullYear(), nowD.getMonth() - i, 1)
    trendMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const trendByMonth: Record<string, { sessions: number; students: number }> = {}
  for (const m of trendMonths) trendByMonth[m] = { sessions: 0, students: 0 }
  for (const s of rawSessions) {
    if (s.date < sixMonthsAgoStr) continue
    const m = (s.date as string).slice(0, 7)
    if (trendByMonth[m]) {
      trendByMonth[m].sessions++
      trendByMonth[m].students += s.attendance_count?.[0]?.count ?? 0
    }
  }
  const trendData: TrendPoint[] = trendMonths.map(m => ({
    month: new Date(m + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    sessions: trendByMonth[m].sessions,
    students: trendByMonth[m].students,
  }))

  // Feedback health micro-stats
  const fbTotal = allFeedback.length
  const excellentPct   = fbTotal > 0 ? Math.round((allFeedback.filter((f: any) => f.trainer_rating === 'excellent').length / fbTotal) * 100) : null
  const understoodPct  = fbTotal > 0 ? Math.round(((allFeedback.filter((f: any) => f.understanding_level === 'understand_basics').length + allFeedback.filter((f: any) => f.understanding_level === 'need_more_practice').length) / fbTotal) * 100) : null
  const wantMorePct    = fbTotal > 0 ? Math.round((allFeedback.filter((f: any) => f.would_attend_more === 'yes').length / fbTotal) * 100) : null

  const cardSessions = sessions.slice(0, 4)
  const listSessions = sessions.slice(0, 6)

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 rounded-2xl px-5 py-6 sm:px-8 sm:py-8 text-white overflow-hidden">
        <div className="relative z-10 max-w-lg">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-2">Global Shapers Islamabad</p>
          <h1 className="text-2xl font-bold leading-tight mb-2">
            Career Counseling for All
          </h1>
          <p className="text-blue-100 text-sm leading-relaxed">
            Every child deserves guidance regardless of economic and geographic constraints
          </p>
        </div>
        <div className="absolute right-0 top-0 w-72 h-full pointer-events-none hidden sm:block">
          <div className="absolute -right-10 -top-10 w-56 h-56 bg-white/10 rounded-full" />
          <div className="absolute right-16 top-4  w-36 h-36 bg-white/10 rounded-full" />
          <div className="absolute right-4  bottom-2 w-24 h-24 bg-white/10 rounded-full" />
          <svg className="absolute right-10 top-1/2 -translate-y-1/2 w-28 h-28 opacity-90" viewBox="0 0 110 110" fill="none">
            <circle cx="55" cy="28" r="14" fill="white" />
            <path d="M40 42 C36 58 42 80 55 80 C68 80 74 58 70 42 Z" fill="white" />
            <path d="M40 50 C30 42 18 46 16 56" stroke="white" strokeWidth="5" strokeLinecap="round" />
            <path d="M70 50 C80 42 94 50 96 60" stroke="white" strokeWidth="5" strokeLinecap="round" />
            <path d="M46 80 C44 92 40 100 38 108" stroke="white" strokeWidth="5" strokeLinecap="round" />
            <path d="M64 80 C66 92 70 100 72 108" stroke="white" strokeWidth="5" strokeLinecap="round" />
            <circle cx="95" cy="30" r="5" fill="white" opacity="0.7" />
            <circle cx="14" cy="40" r="4" fill="white" opacity="0.5" />
            <circle cx="100" cy="70" r="3" fill="white" opacity="0.6" />
          </svg>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions',   value: rawSessions.length, icon: CalendarDays, color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'Students Reached', value: totalStudents,   icon: Users,        color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Feedback Forms',   value: totalFeedback,   icon: MessageSquare,color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Cities Covered',   value: citiesCount,     icon: MapPin,       color: 'text-emerald-600',bg: 'bg-emerald-50'},
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl p-5 flex items-center gap-4 shadow-sm">
            <div className={`${bg} p-3 rounded-xl`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Feedback health micro-row */}
      {fbTotal > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Excellent trainer rating', value: excellentPct, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
            { label: 'Understood basics or more', value: understoodPct, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
            { label: 'Want to attend again', value: wantMorePct, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} className={`${bg} border ${border} rounded-xl px-4 py-3 flex items-center gap-3`}>
              <p className={`text-2xl font-bold ${color}`}>{value}%</p>
              <p className="text-xs text-gray-500 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent session cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-700">Recent Sessions</h2>
          <Link href="/sessions" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cardSessions.length === 0 && (
            <div className="col-span-4 bg-white rounded-xl p-8 text-center text-sm text-gray-400 shadow-sm">
              No sessions yet. <Link href="/sessions/new" className="text-blue-600 underline">Add one</Link>
            </div>
          )}
          {cardSessions.map((s) => {
            const c = colorFor(s.school ?? s.topic)
            const maxStudents = Math.max(...sessions.map((x: any) => x.attendance_count), 1)
            const pct = Math.round((s.attendance_count / maxStudents) * 100)
            return (
              <Link key={s.id} href={`/sessions/${s.id}`}
                className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
                    {s.school}
                  </span>
                  {s.bootcamp?.name && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-600">
                      {s.bootcamp.name}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">{s.topic}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(s.date)}{s.city ? ` · ${s.city}` : ''}
                  </p>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400">Trainer{s.trainers.length > 1 ? 's' : ''}</p>
                    <p className="text-xs font-medium text-gray-600">
                      {s.trainers.length ? s.trainers.join(', ') : '—'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-700">{s.attendance_count}</p>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1">
                      <div className={`h-1.5 rounded-full ${c.bg}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-700">All Sessions</h3>
            <Link href="/sessions" className="text-xs text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {listSessions.length === 0 && (
              <p className="p-6 text-center text-sm text-gray-400">No sessions yet.</p>
            )}
            {listSessions.map((s) => {
              const c = colorFor(s.school ?? s.topic)
              return (
                <Link key={s.id} href={`/sessions/${s.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
                    <CalendarDays className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{s.topic}</p>
                    <p className="text-xs text-gray-400">
                      {s.school}{s.city ? ` · ${s.city}` : ''} · {formatDate(s.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{s.attendance_count}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-700">Recent Feedback</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {recentFeedback.length === 0 && (
              <p className="p-6 text-center text-sm text-gray-400">No feedback yet.</p>
            )}
            {recentFeedback.map((f, i) => {
              const ratingColor =
                f.trainer_rating === 'excellent' ? 'bg-green-500' :
                f.trainer_rating === 'average'   ? 'bg-yellow-400' :
                f.trainer_rating === 'poor'       ? 'bg-red-400' : 'bg-gray-300'
              return (
                <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                  <div className={`w-1 rounded-full self-stretch min-h-[2.5rem] ${ratingColor}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700">
                      {f.student_name ?? 'Student'} · <span className="text-gray-400 font-normal">{f.class ?? '—'}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {f.favourite_part ?? 'No comment'}
                    </p>
                    <span className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full text-white capitalize ${ratingColor}`}>
                      {f.trainer_rating ?? 'no rating'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Activity Trend */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-500" />
            <h2 className="font-semibold text-gray-700">Sessions per Month</h2>
            <span className="text-xs text-gray-400">last 6 months</span>
          </div>
          <Link href="/analytics" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            Full Analytics <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <CompactTrendChart data={trendData} />
      </div>

      {/* Pakistan Map */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-500" />
          <h2 className="font-semibold text-gray-700">Sessions Across Pakistan</h2>
          <span className="ml-auto text-xs text-gray-400">{mapSessions.length} plotted</span>
        </div>
        <SessionMapWrapper sessions={mapSessions} />
      </div>
    </div>
  )
}
