'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Trash2, RotateCcw, CalendarDays, Users, Layers, Image as ImageIcon, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type TrashType = 'session' | 'trainer' | 'bootcamp' | 'media'
type TrashItem = {
  type: TrashType
  id: string
  label: string
  sublabel: string
  deleted_at: string
  days_left: number
}

const GROUPS: { type: TrashType; title: string; icon: React.ElementType }[] = [
  { type: 'session', title: 'Sessions', icon: CalendarDays },
  { type: 'trainer', title: 'Trainers', icon: Users },
  { type: 'bootcamp', title: 'Bootcamps', icon: Layers },
  { type: 'media', title: 'Media', icon: ImageIcon },
]

function deletedAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return 'deleted today'
  if (days === 1) return 'deleted yesterday'
  return `deleted ${days} days ago`
}

export default function TrashPage() {
  const [items, setItems] = useState<TrashItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/trash')
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d.items) ? d.items : []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function act(item: TrashItem, action: 'restore' | 'purge') {
    setBusyId(item.id)
    const res = await fetch('/api/trash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: item.type, id: item.id, action }),
    })
    setBusyId(null)
    setConfirmId(null)
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== item.id))
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
          <Trash2 className="w-5 h-5 text-gray-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Trash</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Deleted items are kept here for 30 days, then permanently removed.
          </p>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-xl border p-8 text-center text-sm text-gray-400">Loading…</div>
      )}

      {!loading && items.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Trash2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Trash is empty.</p>
        </div>
      )}

      {!loading && GROUPS.map(({ type, title, icon: Icon }) => {
        const group = items.filter((i) => i.type === type)
        if (group.length === 0) return null
        return (
          <div key={type} className="space-y-2">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
              <Icon className="w-4 h-4 text-gray-400" /> {title} ({group.length})
            </h3>
            <div className="bg-white rounded-xl border divide-y divide-gray-50 overflow-hidden">
              {group.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{item.label || 'Untitled'}</p>
                    <p className="text-xs text-gray-400">
                      {item.sublabel ? `${item.sublabel} · ` : ''}{deletedAgo(item.deleted_at)}
                    </p>
                  </div>

                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      item.days_left <= 7 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
                    }`}
                    title="Days until permanent deletion"
                  >
                    {item.days_left}d left
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === item.id}
                    onClick={() => act(item, 'restore')}
                    title="Restore"
                    className="shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore
                  </Button>

                  {confirmId === item.id ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-red-600 font-medium whitespace-nowrap">Delete forever?</span>
                      <Button
                        size="sm"
                        disabled={busyId === item.id}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs"
                        onClick={() => act(item, 'purge')}
                      >
                        {busyId === item.id ? '…' : 'Delete'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmId(null)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      title="Delete permanently"
                      className="text-red-500 hover:text-red-700 hover:border-red-300 shrink-0"
                      onClick={() => setConfirmId(item.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
