'use client'
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts'
import type { FeedbackStats } from '@/types'

const COLORS = {
  good: '#22c55e',
  mid: '#f59e0b',
  bad: '#ef4444',
}

export function FeedbackCharts({ stats }: { stats: FeedbackStats }) {
  const understandingData = [
    { name: 'Understand Basics', value: stats.understanding.understand_basics, color: COLORS.good },
    { name: 'Need More Practice', value: stats.understanding.need_more_practice, color: COLORS.mid },
    { name: 'Still Confused', value: stats.understanding.still_confused, color: COLORS.bad },
  ]

  const trainerData = [
    { name: 'Excellent', value: stats.trainer_rating.excellent, color: COLORS.good },
    { name: 'Average', value: stats.trainer_rating.average, color: COLORS.mid },
    { name: 'Poor', value: stats.trainer_rating.poor, color: COLORS.bad },
  ]

  const attendMoreData = [
    { name: 'Yes', value: stats.would_attend_more.yes },
    { name: 'Maybe', value: stats.would_attend_more.maybe },
    { name: 'No', value: stats.would_attend_more.no },
  ]

  const learnedData = [
    { name: 'Yes', value: stats.learned_something.yes },
    { name: 'Not Much', value: stats.learned_something.not_much },
    { name: 'No', value: stats.learned_something.no },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ChartCard title="Understanding Level">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={understandingData}
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }: { name?: string; percent?: number }) =>
                percent ? `${name ?? ''} ${((percent) * 100).toFixed(0)}%` : ''
              }
              labelLine={false}
            >
              {understandingData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Trainer Rating">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={trainerData}
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }: { name?: string; percent?: number }) =>
                percent ? `${name ?? ''} ${((percent) * 100).toFixed(0)}%` : ''
              }
              labelLine={false}
            >
              {trainerData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Would Attend More Sessions?">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={attendMoreData}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Learned Something?">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={learnedData}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <h3 className="font-semibold text-gray-700 mb-3 text-sm">{title}</h3>
      {children}
    </div>
  )
}
