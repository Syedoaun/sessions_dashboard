'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Trainer } from '@/types'

export default function NewSessionPage() {
  const router = useRouter()
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    date: '',
    school: '',
    location: '',
    topic: '',
    topic_summary: '',
  })

  useEffect(() => {
    fetch('/api/trainers').then((r) => r.json()).then(setTrainers)
  }, [])

  function toggle(id: string) {
    setSelectedTrainers((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, trainer_ids: selectedTrainers }),
    })
    const data = await res.json()
    if (res.ok) router.push(`/sessions/${data.id}`)
    else setLoading(false)
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">New Session</h2>
        <p className="text-sm text-gray-500 mt-1">Fill in the session details</p>
      </div>

      <form onSubmit={submit} className="space-y-4 bg-white rounded-xl border p-6">
        <Field label="Date *">
          <Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </Field>
        <Field label="School *">
          <Input required placeholder="e.g. Beacon High School" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
        </Field>
        <Field label="Location">
          <Input placeholder="e.g. Auditorium, Room 3" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </Field>
        <Field label="Topic *">
          <Input required placeholder="e.g. Introduction to Climate Change" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
        </Field>
        <Field label="Topic Summary">
          <Textarea placeholder="Brief summary of what was covered..." rows={3} value={form.topic_summary} onChange={(e) => setForm({ ...form, topic_summary: e.target.value })} />
        </Field>

        {trainers.length > 0 && (
          <Field label="Trainer(s)">
            <div className="flex flex-wrap gap-2">
              {trainers.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggle(t.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selectedTrainers.includes(t.id)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </Field>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating...' : 'Create Session'}
        </Button>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  )
}
