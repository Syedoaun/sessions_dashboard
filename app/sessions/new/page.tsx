'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Trainer, Bootcamp } from '@/types'

const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-60 rounded-xl border bg-gray-100 animate-pulse" />,
})

const PAKISTAN_CITIES = [
  'Islamabad', 'Rawalpindi', 'Lahore', 'Karachi', 'Peshawar', 'Quetta',
  'Multan', 'Faisalabad', 'Hyderabad', 'Gujranwala', 'Sialkot', 'Bahawalpur',
  'Sargodha', 'Sukkur', 'Larkana', 'Abbottabad', 'Mardan', 'Dera Ghazi Khan',
  'Sheikhupura', 'Muzaffarabad', 'Gilgit', 'Chitral', 'Swat', 'Mansehra',
  'Kohat', 'Bannu', 'Dera Ismail Khan', 'Mirpur', 'Khuzdar', 'Turbat',
]

export default function NewSessionPage() {
  const router = useRouter()
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [bootcamps, setBootcamps] = useState<Bootcamp[]>([])
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([])
  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    date: '',
    school: '',
    location: '',
    topic: '',
    topic_summary: '',
    bootcamp_id: '',
    city: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/trainers').then((r) => r.json()),
      fetch('/api/bootcamps').then((r) => r.json()),
    ]).then(([t, b]) => {
      setTrainers(t)
      setBootcamps(Array.isArray(b) ? b : [])
    })
  }, [])

  function toggle(id: string) {
    setSelectedTrainers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        bootcamp_id: form.bootcamp_id || null,
        trainer_ids: selectedTrainers,
        latitude: latLng?.lat ?? null,
        longitude: latLng?.lng ?? null,
      }),
    })
    const data = await res.json()
    if (res.ok) router.push(`/sessions/${data.id}`)
    else {
      setError(data.error ?? 'Failed to create session. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">New Session</h2>
        <p className="text-sm text-gray-500 mt-1">Fill in the session details</p>
      </div>

      <form onSubmit={submit} className="space-y-4 bg-white rounded-xl border p-6">

        {/* Bootcamp */}
        <Field label="Bootcamp *">
          <select
            required
            value={form.bootcamp_id}
            onChange={(e) => setForm({ ...form, bootcamp_id: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Select a bootcamp…</option>
            {bootcamps.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          {bootcamps.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              No bootcamps yet —{' '}
              <a href="/bootcamps" className="underline hover:text-amber-800">add one first</a>
            </p>
          )}
        </Field>

        <Field label="Date *">
          <Input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </Field>

        <Field label="School *">
          <Input
            required
            placeholder="e.g. Beacon High School"
            value={form.school}
            onChange={(e) => setForm({ ...form, school: e.target.value })}
          />
        </Field>

        {/* City */}
        <Field label="City *">
          <select
            required
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Select city…</option>
            {PAKISTAN_CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>

        <Field label="Venue / Location">
          <Input
            placeholder="e.g. Auditorium, Room 3"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </Field>

        <Field label="Topic *">
          <Input
            required
            placeholder="e.g. Introduction to Climate Change"
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
          />
        </Field>

        <Field label="Topic Summary">
          <Textarea
            placeholder="Brief summary of what was covered…"
            rows={3}
            value={form.topic_summary}
            onChange={(e) => setForm({ ...form, topic_summary: e.target.value })}
          />
        </Field>

        {/* Trainers */}
        {trainers.length > 0 && (
          <Field label="Trainer(s)">
            <select
              value=""
              onChange={(e) => { if (e.target.value) toggle(e.target.value) }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Add trainer…</option>
              {trainers.filter((t) => !selectedTrainers.includes(t.id)).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {selectedTrainers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedTrainers.map((id) => {
                  const t = trainers.find((x) => x.id === id)
                  if (!t) return null
                  return (
                    <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-blue-600 text-white">
                      {t.name}
                      <button type="button" onClick={() => toggle(id)} className="hover:text-blue-200 leading-none">×</button>
                    </span>
                  )
                })}
              </div>
            )}
          </Field>
        )}

        {/* Map location picker */}
        <Field label="Pin on Map (optional)">
          <LocationPicker value={latLng} onChange={setLatLng} />
        </Field>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {error}
          </div>
        )}
        <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
          {loading ? 'Creating…' : 'Create Session'}
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
