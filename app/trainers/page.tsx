'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Trainer } from '@/types'
import { Plus, Pencil, Trash2, Check, X, Users } from 'lucide-react'
import { useIsAdmin } from '@/components/auth/AuthContext'

const AVATAR_COLORS = ['bg-blue-500', 'bg-orange-400', 'bg-purple-500', 'bg-emerald-500', 'bg-red-500', 'bg-cyan-500']
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

export default function TrainersPage() {
  const isAdmin = useIsAdmin()
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(true)

  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', credentials: '', bio: '' })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function load() {
    const data = await fetch('/api/trainers').then((r) => r.json())
    setTrainers(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave(id: string) {
    if (!editForm.name.trim()) return
    setEditLoading(true)
    setEditError('')
    const res = await fetch(`/api/trainers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    const data = await res.json()
    if (!res.ok) {
      setEditError(data.error ?? 'Failed to save')
      setEditLoading(false)
      return
    }
    setEditId(null)
    setEditLoading(false)
    load()
  }

  async function handleDelete(id: string) {
    setDeleteLoading(true)
    await fetch(`/api/trainers/${id}`, { method: 'DELETE' })
    setDeleteId(null)
    setDeleteLoading(false)
    load()
  }

  function startEdit(t: Trainer) {
    setEditId(t.id)
    setEditForm({ name: t.name, credentials: t.credentials ?? '', bio: t.bio ?? '' })
    setEditError('')
    setDeleteId(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Trainers</h2>
          <p className="text-sm text-gray-400 mt-0.5">{trainers.length} trainer{trainers.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <Link href="/trainers/new">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Add Trainer
            </Button>
          </Link>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-5 h-28 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && trainers.length === 0 && (
        <div className="bg-white rounded-xl border p-10 text-center">
          <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No trainers yet.</p>
          <Link href="/trainers/new" className="text-sm text-blue-600 hover:underline mt-1 inline-block">
            Add the first trainer
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {trainers.map((t) => (
          <div key={t.id} className="bg-white rounded-xl shadow-sm p-5 space-y-3 hover:shadow-md transition-shadow">
            {editId === t.id ? (
              /* Edit form */
              <div className="space-y-3">
                <Input
                  placeholder="Full Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
                <Input
                  placeholder="Credentials (optional)"
                  value={editForm.credentials}
                  onChange={(e) => setEditForm({ ...editForm, credentials: e.target.value })}
                />
                <Textarea
                  placeholder="Bio (optional)"
                  rows={2}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                />
                {editError && (
                  <p className="text-xs text-red-600">{editError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSave(t.id)}
                    disabled={editLoading || !editForm.name.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    {editLoading ? 'Saving…' : 'Save'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditId(null)}>
                    <X className="w-3.5 h-3.5 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* Display */
              <>
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-full ${avatarColor(t.name)} flex items-center justify-center shrink-0`}>
                    <span className="text-white font-bold text-base">{t.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{t.name}</p>
                    {t.credentials && (
                      <p className="text-xs text-blue-600 font-medium mt-0.5">{t.credentials}</p>
                    )}
                    {(t as any).session_count > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">{(t as any).session_count} session{(t as any).session_count !== 1 ? 's' : ''} led</p>
                    )}
                  </div>
                  <div className={`flex gap-1.5 shrink-0 ${isAdmin ? '' : 'hidden'}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(t)}
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>

                    {deleteId === t.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-red-600 font-medium">Sure?</span>
                        <Button
                          size="sm"
                          disabled={deleteLoading}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs"
                          onClick={() => handleDelete(t.id)}
                        >
                          {deleteLoading ? '…' : 'Delete'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        title="Delete"
                        className="text-red-500 hover:text-red-700 hover:border-red-300"
                        onClick={() => { setDeleteId(t.id); setEditId(null) }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                {t.bio && (
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{t.bio}</p>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
