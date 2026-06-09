import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

type Props = {
  label: string
  value: string | number
  icon: LucideIcon
  sub?: string
}

export function StatsCard({ label, value, icon: Icon, sub }: Props) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="bg-blue-50 p-3 rounded-lg">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
