'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export interface TrendPoint {
  month: string
  sessions: number
  students: number
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="sessions" fill="#2563eb" radius={[4, 4, 0, 0]} name="Sessions" />
        <Bar dataKey="students" fill="#f97316" radius={[4, 4, 0, 0]} name="Students" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CompactTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -24 }}>
        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
        <Tooltip />
        <Bar dataKey="sessions" fill="#2563eb" radius={[3, 3, 0, 0]} name="Sessions" />
      </BarChart>
    </ResponsiveContainer>
  )
}
