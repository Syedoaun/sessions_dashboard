import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Users, MessageSquare, CalendarDays, ChevronRight } from 'lucide-react'
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

export default async function SessionsPage() {
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`*, trainers:session_trainers(trainer:trainers(name)), attendance_count:attendance(count), feedback_count:feedback(count)`)
    .order('date', { ascending: false })

  const list = (sessions ?? []).map((s: any) => ({
    ...s,
    trainers: s.trainers?.map((t: any) => t.trainer?.name).filter(Boolean) ?? [],
    attendance_count: s.attendance_count?.[0]?.count ?? 0,
    feedback_count:   s.feedback_count?.[0]?.count ?? 0,
  }))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">All Sessions</h2>
          <p className="text-sm text-gray-400 mt-0.5">{list.length} sessions total</p>
        </div>
        <Link href="/sessions/new">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4" /> New Session
          </Button>
        </Link>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {list.length === 0 && (
          <p className="p-10 text-center text-sm text-gray-400">No sessions yet.</p>
        )}
        <div className="divide-y divide-gray-50">
          {list.map((s) => {
            const color = colorFor(s.school ?? s.topic)
            return (
              <Link key={s.id} href={`/sessions/${s.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
                {/* Color icon */}
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                  <CalendarDays className="w-5 h-5 text-white" />
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{s.topic}</p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {s.school}{s.trainers.length ? ` · ${s.trainers.join(', ')}` : ''}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-5 text-sm text-gray-400 shrink-0">
                  <div className="text-center hidden sm:block">
                    <p className="text-xs text-gray-300">Date</p>
                    <p className="font-medium text-gray-600">{formatDate(s.date)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-300">Attended</p>
                    <p className="font-semibold text-gray-700 flex items-center gap-1 justify-center">
                      <Users className="w-3.5 h-3.5" />{s.attendance_count}
                    </p>
                  </div>
                  <div className="text-center">
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
