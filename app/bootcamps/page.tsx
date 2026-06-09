'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Bootcamp } from '@/types'
import { Plus, Pencil, Trash2, Check, X, Layers } from 'lucide-react'

export default function BootcampsPage() {
  const [bootcamps, setBootcamps] = useState<Bootcamp[]>([])
  const [loading, setLoading] = useState(true)

  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', description: '' })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '' })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function load() {
    const data = await fetch('/api/bootcamps').then((r) => r.json())
    setBootcamps(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    if (!addForm.name.trim()) return
    setAddLoading(true)
    setAddError('')
    const res = await fetch('/api/bootcamps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    })
    if (!res.ok) {
      const data = await res.json()
      setAddError(data.error ?? 'Failed to add bootcamp')
      setAddLoading(false)
      return
    }
    setAddForm({ name: '', description: '' })
    setShowAdd(false)
    setAddLoading(false)
    load()
  }

  async function handleSave(id: string) {
    if (!editForm.name.trim()) return
    setEditLoading(true)
    setEditError('')
    const res = await fetch(`/api/bootcamps/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    if (!res.ok) {
      const data = await res.json()
      setEditError(data.error ?? 'Failed to save changes')
      setEditLoading(false)
      return
    }
    setEditId(null)
    setEditLoading(false)
    load()
  }

  async function handleDelete(id: string) {
    setDeleteLoading(true)
    setDeleteError('')
    const res = await fetch(`/api/bootcamps/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setDeleteError(data.error ?? 'Failed to delete')
      setDeleteId(null)
      setDeleteLoading(false)
      return
    }
    setDeleteId(null)
    setDeleteLoading(false)
    load()
  }

  function startEdit(bc: Bootcamp) {
    setEditId(bc.id)
    setEditForm({ name: bc.name, description: bc.description ?? '' })
    setEditError('')
    setDeleteId(null)
    setDeleteError('')
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Bootcamps</h2>
          <p className="text-sm text-gray-400 mt-0.5">Organising groups — select one when creating a session</p>
        </div>
        {!showAdd && (
          <Button onClick={() => setShowAdd(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add Bootcamp
          </Button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-xl border p-5 space-y-3 shadow-sm">
          <p className="font-semibold text-gray-700">New Bootcamp</p>
          <Input
            placeholder="Name — e.g. Pathfinders Group"
            value={addForm.name}
            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Textarea
            placeholder="Description (optional)"
            rows={2}
            value={addForm.description}
            onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
          />
          {addError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{addError}</p>
          )}
          <div className="flex gap-2">
            <Button
              onClick={handleAdd}
              disabled={addLoading || !addForm.name.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {addLoading ? 'Saving…' : 'Save'}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setShowAdd(false); setAddForm({ name: '', description: '' }); setAddError('') }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading && (
          <div className="bg-white rounded-xl border p-8 text-center text-sm text-gray-400">Loading…</div>
        )}
        {!loading && bootcamps.length === 0 && (
          <div className="bg-white rounded-xl border p-10 text-center">
            <Layers className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No bootcamps yet. Add your first one above.</p>
          </div>
        )}

        {deleteError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{deleteError}</p>
        )}
        {bootcamps.map((bc) => (
          <div key={bc.id} className="bg-white rounded-xl border p-5 shadow-sm">
            {editId === bc.id ? (
              <div className="space-y-3">
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
                <Textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
                {editError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{editError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSave(bc.id)}
                    disabled={editLoading || !editForm.name.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    {editLoading ? 'Saving…' : 'Save'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditId(null); setEditError('') }}>
                    <X className="w-3.5 h-3.5 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{bc.name}</p>
                  {bc.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{bc.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(bc)}
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>

                  {deleteId === bc.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-red-600 font-medium whitespace-nowrap">Sure?</span>
                      <Button
                        size="sm"
                        disabled={deleteLoading}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs"
                        onClick={() => handleDelete(bc.id)}
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
                      onClick={() => { setDeleteId(bc.id); setEditId(null) }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
