import { supabaseAdmin as supabase } from '@/lib/supabase/admin'
import { BarChart2, Users, TrendingUp, MessageSquare, Star } from 'lucide-react'
import { FeedbackCharts } from '@/components/charts/FeedbackCharts'
import { TrendChart } from '@/components/charts/TrendChart'
import { HorizontalBarChart } from '@/components/charts/HorizontalBarChart'
import { TrainerLeaderboard } from '@/components/charts/TrainerLeaderboard'
import type { FeedbackStats } from '@/types'
import type { TrainerStat } from '@/components/charts/TrainerLeaderboard'
import type { BarItem } from '@/components/charts/HorizontalBarChart'
import type { TrendPoint } from '@/components/charts/TrendChart'

export const revalidate = 0

function Section({ title, subtitle, children }: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export default async function AnalyticsPage() {
  const [sessionsRes, feedbackRes, attendanceRes, trainersRes, bootcampsRes] = await Promise.all([
    supabase
      .from('sessions')
      .select('id, date, school, city, bootcamp_id, attendance_count:attendance(count), trainers:session_trainers(trainer_id)')
      .order('date', { ascending: true }),
    supabase.from('feedback').select('trainer_rating, understanding_level, would_attend_more, learned_something'),
    supabase.from('attendance').select('class'),
    supabase.from('trainers').select('id, name, credentials'),
    supabase.from('bootcamps').select('id, name'),
  ])

  const sessions   = (sessionsRes.data  ?? []) as any[]
  const feedback   = (feedbackRes.data  ?? []) as any[]
  const attendance = (attendanceRes.data ?? []) as any[]
  const trainers   = (trainersRes.data  ?? []) as any[]
  const bootcamps  = (bootcampsRes.data ?? []) as any[]

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalStudents   = attendance.length
  const totalSessions   = sessions.length
  const avgStudents     = totalSessions > 0 ? Math.round(totalStudents / totalSessions) : 0
  const feedbackRate    = totalStudents > 0 ? Math.round((feedback.length / totalStudents) * 100) : 0
  const excellentCount  = feedback.filter((f: any) => f.trainer_rating === 'excellent').length
  const excellentPct    = feedback.length > 0 ? Math.round((excellentCount / feedback.length) * 100) : 0

  // ── Monthly trend (last 12 months) ────────────────────────────────────────
  const months: string[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const byMonth: Record<string, { sessions: number; students: number }> = {}
  for (const m of months) byMonth[m] = { sessions: 0, students: 0 }
  for (const s of sessions) {
    const m = (s.date as string).slice(0, 7)
    if (byMonth[m]) {
      byMonth[m].sessions++
      byMonth[m].students += s.attendance_count?.[0]?.count ?? 0
    }
  }
  const trendData: TrendPoint[] = months.map(m => ({
    month: new Date(m + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    sessions: byMonth[m].sessions,
    students: byMonth[m].students,
  }))

  // ── Aggregate feedback stats ───────────────────────────────────────────────
  const feedbackStats: FeedbackStats = {
    total: feedback.length,
    understanding: {
      still_confused:    feedback.filter((f: any) => f.understanding_level === 'still_confused').length,
      understand_basics: feedback.filter((f: any) => f.understanding_level === 'understand_basics').length,
      need_more_practice:feedback.filter((f: any) => f.understanding_level === 'need_more_practice').length,
    },
    would_attend_more: {
      yes:   feedback.filter((f: any) => f.would_attend_more === 'yes').length,
      maybe: feedback.filter((f: any) => f.would_attend_more === 'maybe').length,
      no:    feedback.filter((f: any) => f.would_attend_more === 'no').length,
    },
    trainer_rating: {
      excellent: excellentCount,
      average:   feedback.filter((f: any) => f.trainer_rating === 'average').length,
      poor:      feedback.filter((f: any) => f.trainer_rating === 'poor').length,
    },
    learned_something: {
      yes:      feedback.filter((f: any) => f.learned_something === 'yes').length,
      not_much: feedback.filter((f: any) => f.learned_something === 'not_much').length,
      no:       feedback.filter((f: any) => f.learned_something === 'no').length,
    },
  }

  // ── Trainer leaderboard ───────────────────────────────────────────────────
  const trainerMap: Record<string, TrainerStat> = {}
  for (const t of trainers) {
    trainerMap[t.id] = { id: t.id, name: t.name, credentials: t.credentials, sessionCount: 0, studentCount: 0 }
  }
  for (const s of sessions) {
    const students = s.attendance_count?.[0]?.count ?? 0
    for (const link of (s.trainers ?? [])) {
      const tid = link.trainer_id
      if (trainerMap[tid]) {
        trainerMap[tid].sessionCount++
        trainerMap[tid].studentCount += students
      }
    }
  }
  const trainerStats = Object.values(trainerMap)
    .filter(t => t.sessionCount > 0)
    .sort((a, b) => b.sessionCount - a.sessionCount)

  // ── Geographic reach ──────────────────────────────────────────────────────
  const cityMap: Record<string, number> = {}
  const schoolMap: Record<string, number> = {}
  for (const s of sessions) {
    const students = s.attendance_count?.[0]?.count ?? 0
    if (s.city) cityMap[s.city] = (cityMap[s.city] ?? 0) + students
    const school = (s.school as string).slice(0, 28)
    schoolMap[school] = (schoolMap[school] ?? 0) + students
  }
  const topCities: BarItem[] = Object.entries(cityMap)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
  const topSchools: BarItem[] = Object.entries(schoolMap)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // ── Class distribution ────────────────────────────────────────────────────
  const classMap: Record<string, number> = {}
  for (const a of attendance) {
    const cls = (a.class ?? 'Unknown').trim()
    classMap[cls] = (classMap[cls] ?? 0) + 1
  }
  const classData: BarItem[] = Object.entries(classMap)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12)

  // ── Bootcamp breakdown ────────────────────────────────────────────────────
  const bootcampMap: Record<string, { name: string; sessions: number; students: number }> = {
    __none__: { name: 'No Bootcamp', sessions: 0, students: 0 },
  }
  for (const b of bootcamps) {
    bootcampMap[b.id] = { name: b.name, sessions: 0, students: 0 }
  }
  for (const s of sessions) {
    const bid = s.bootcamp_id ?? '__none__'
    if (!bootcampMap[bid]) bootcampMap[bid] = { name: '?', sessions: 0, students: 0 }
    bootcampMap[bid].sessions++
    bootcampMap[bid].students += s.attendance_count?.[0]?.count ?? 0
  }
  const bootcampData: BarItem[] = Object.values(bootcampMap)
    .filter(b => b.sessions > 0)
    .map(b => ({ label: b.name, value: b.sessions }))
    .sort((a, b) => b.value - a.value)

  const kpis = [
    { label: 'Total Students Reached', value: totalStudents.toLocaleString(), icon: Users,        color: 'text-blue-600',    bg: 'bg-blue-50'    },
    { label: 'Avg Students / Session', value: avgStudents,                    icon: TrendingUp,   color: 'text-orange-500',  bg: 'bg-orange-50'  },
    { label: 'Feedback Rate',           value: `${feedbackRate}%`,            icon: MessageSquare,color: 'text-purple-600',  bg: 'bg-purple-50'  },
    { label: 'Excellent Trainer Rating',value: `${excellentPct}%`,            icon: Star,         color: 'text-yellow-500',  bg: 'bg-yellow-50'  },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Analytics</h2>
          <p className="text-sm text-gray-400">
            {totalSessions} session{totalSessions !== 1 ? 's' : ''} · {totalStudents.toLocaleString()} students · {feedback.length} feedback forms
          </p>
        </div>
      </div>

      {/* Impact KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
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

      {/* Activity Over Time */}
      <Section title="Activity Over Time" subtitle="Sessions and students reached each month (last 12 months)">
        <TrendChart data={trendData} />
      </Section>

      {/* Feedback Health */}
      {feedback.length > 0 ? (
        <Section title="Feedback Health" subtitle={`Aggregated across all ${feedback.length} feedback forms collected`}>
          <FeedbackCharts stats={feedbackStats} />
        </Section>
      ) : (
        <Section title="Feedback Health" subtitle="Aggregated across all feedback forms">
          <p className="text-sm text-gray-400 text-center py-8">No feedback forms collected yet</p>
        </Section>
      )}

      {/* Trainer Leaderboard + Bootcamp Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Section title="Trainer Leaderboard" subtitle="Ranked by sessions led">
            <TrainerLeaderboard trainers={trainerStats} />
          </Section>
        </div>
        <div className="lg:col-span-2">
          <Section title="Bootcamp Breakdown" subtitle="Sessions per bootcamp">
            <HorizontalBarChart data={bootcampData} color="#8b5cf6" valueLabel="Sessions" />
          </Section>
        </div>
      </div>

      {/* Geographic Reach */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Top Cities" subtitle="By students reached">
          <HorizontalBarChart data={topCities} color="#2563eb" valueLabel="Students" />
        </Section>
        <Section title="Top Schools" subtitle="By students reached">
          <HorizontalBarChart data={topSchools} color="#22c55e" valueLabel="Students" />
        </Section>
      </div>

      {/* Class Distribution */}
      {classData.length > 0 && (
        <Section title="Grade Levels Reached" subtitle="Distribution of students by class across all attendance records">
          <HorizontalBarChart data={classData} color="#f59e0b" valueLabel="Students" />
        </Section>
      )}
    </div>
  )
}
