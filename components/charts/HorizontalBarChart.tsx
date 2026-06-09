'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export interface BarItem {
  label: string
  value: number
}

interface Props {
  data: BarItem[]
  color?: string
  valueLabel?: string
}

export function HorizontalBarChart({ data, color = '#2563eb', valueLabel = 'Count' }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">No data yet</p>
  }
  const maxLen = Math.max(...data.map(d => d.label.length))
  const yWidth = Math.min(Math.max(60, maxLen * 7), 150)
  const height = Math.max(data.length * 38 + 20, 100)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 2, right: 24, bottom: 2, left: 0 }}>
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis type="category" dataKey="label" width={yWidth} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => [v, valueLabel]} />
        <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
