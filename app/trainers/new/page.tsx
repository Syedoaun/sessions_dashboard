'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function NewTrainerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', credentials: '', bio: '' })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/trainers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) router.push('/trainers')
    else setLoading(false)
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Add Trainer</h2>
        <p className="text-sm text-gray-500 mt-1">Trainer profiles are reused across sessions</p>
      </div>

      <form onSubmit={submit} className="bg-white rounded-xl border p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Full Name *</label>
          <Input required placeholder="e.g. Ali Hassan" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Credentials</label>
          <Input placeholder="e.g. MSc Environmental Science" value={form.credentials} onChange={(e) => setForm({ ...form, credentials: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Bio</label>
          <Textarea placeholder="Brief background about the trainer..." rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Saving...' : 'Add Trainer'}
        </Button>
      </form>
    </div>
  )
}
