'use client'

export interface TrainerStat {
  id: string
  name: string
  credentials: string | null
  sessionCount: number
  studentCount: number
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-orange-400', 'bg-purple-500',
  'bg-emerald-500', 'bg-red-500', 'bg-cyan-500',
]
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

export function TrainerLeaderboard({ trainers }: { trainers: TrainerStat[] }) {
  if (trainers.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">No session data yet</p>
  }
  const maxSessions = Math.max(...trainers.map(t => t.sessionCount), 1)

  return (
    <div className="space-y-4">
      {trainers.map((t, i) => (
        <div key={t.id} className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-300 w-5 text-right shrink-0">{i + 1}</span>
          <div className={`w-8 h-8 rounded-full ${avatarColor(t.name)} flex items-center justify-center shrink-0`}>
            <span className="text-white font-bold text-xs">{t.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 truncate">{t.name}</p>
                {t.credentials && (
                  <p className="text-xs text-blue-600 truncate">{t.credentials}</p>
                )}
              </div>
              <div className="flex flex-col items-end text-xs text-gray-500 shrink-0">
                <span><span className="font-semibold text-gray-700">{t.sessionCount}</span> sessions</span>
                <span><span className="font-semibold text-gray-700">{t.studentCount}</span> students</span>
              </div>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-1.5 bg-blue-500 rounded-full"
                style={{ width: `${(t.sessionCount / maxSessions) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
