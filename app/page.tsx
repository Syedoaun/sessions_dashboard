import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { CalendarDays, Users, MessageSquare, ArrowRight, ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const revalidate = 0

const CARD_COLORS = [
  { bg: 'bg-blue-500',   text: 'text-white', bar: 'bg-blue-400'   },
  { bg: 'bg-orange-400', text: 'text-white', bar: 'bg-orange-300'  },
  { bg: 'bg-red-500',    text: 'text-white', bar: 'bg-red-400'     },
  { bg: 'bg-cyan-500',   text: 'text-white', bar: 'bg-cyan-400'    },
  { bg: 'bg-purple-500', text: 'text-white', bar: 'bg-purple-400'  },
  { bg: 'bg-emerald-500',text: 'text-white', bar: 'bg-emerald-400' },
]

function colorFor(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return CARD_COLORS[Math.abs(h) % CARD_COLORS.length]
}

export default async function DashboardPage() {
  const [sessionsRes, attendanceRes, feedbackRes, recentFeedbackRes] = await Promise.all([
    supabase
      .from('sessions')
      .select(`*, trainers:session_trainers(trainer:trainers(name)), attendance_count:attendance(count), feedback_count:feedback(count)`)
      .order('date', { ascending: false })
      .limit(8),
    supabase.from('attendance').select('id', { count: 'exact', head: true }),
    supabase.from('feedback').select('id', { count: 'exact', head: true }),
    supabase.from('feedback').select('student_name, class, trainer_rating, favourite_part').order('created_at', { ascending: false }).limit(5),
  ])

  const sessions = (sessionsRes.data ?? []).map((s: any) => ({
    ...s,
    trainers: s.trainers?.map((t: any) => t.trainer?.name).filter(Boolean) ?? [],
    attendance_count: s.attendance_count?.[0]?.count ?? 0,
    feedback_count: s.feedback_count?.[0]?.count ?? 0,
  }))

  const totalStudents = attendanceRes.count ?? 0
  const totalFeedback = feedbackRes.count ?? 0
  const recentFeedback = recentFeedbackRes.data ?? []

  const cardSessions = sessions.slice(0, 4)
  const listSessions = sessions.slice(0, 6)

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 rounded-2xl px-8 py-7 text-white overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-1">Welcome to SessionsHub!</h1>
          <p className="text-blue-100 text-base">Education is the passport to the future — track every session, every student.</p>
        </div>
        {/* Decorative shapes */}
        <div className="absolute right-0 top-0 w-72 h-full pointer-events-none">
          <div className="absolute -right-10 -top-10 w-56 h-56 bg-white/10 rounded-full" />
          <div className="absolute right-16 top-4  w-36 h-36 bg-white/10 rounded-full" />
          <div className="absolute right-4  bottom-2 w-24 h-24 bg-white/10 rounded-full" />
          {/* Simple person SVG */}
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

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Sessions',    value: sessions.length,  icon: CalendarDays, color: 'text-blue-600',    bg: 'bg-blue-50'    },
          { label: 'Students Reached',  value: totalStudents,    icon: Users,        color: 'text-orange-500',  bg: 'bg-orange-50'  },
          { label: 'Feedback Forms',    value: totalFeedback,    icon: MessageSquare,color: 'text-purple-600',  bg: 'bg-purple-50'  },
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

      {/* Session Cards — "Current Running Sessions" style */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-700">Recent Sessions</h2>
          <Link href="/sessions" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
                  {s.school}
                </span>
                <div>
                  <p className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">{s.topic}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(s.date)}</p>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400">Trainer</p>
                    <p className="text-xs font-medium text-gray-600 truncate max-w-[80px]">
                      {s.trainers[0] ?? '—'}
                    </p>
                  </div>
                  <div className="text-right">
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

      {/* Bottom section — 2 columns */}
      <div className="grid grid-cols-5 gap-6">
        {/* Sessions List — like "Upcoming Lessons" */}
        <div className="col-span-3 bg-white rounded-xl shadow-sm overflow-hidden">
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
                    <p className="text-xs text-gray-400">{s.school} · {formatDate(s.date)}</p>
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

        {/* Recent Feedback — like "Recent Notifications" */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
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
                f.trainer_rating === 'poor'      ? 'bg-red-400' : 'bg-gray-300'
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
    </div>
  )
}
