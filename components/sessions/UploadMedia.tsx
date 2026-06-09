'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ImageIcon, Loader2, CheckCircle } from 'lucide-react'

export function UploadMedia({ sessionId, onDone }: { sessionId: string; onDone: () => void }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [count, setCount] = useState(0)
  const [error, setError] = useState('')

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setStatus('loading')
    setError('')
    const form = new FormData()
    files.forEach((f) => form.append('files', f))
    form.append('session_id', sessionId)
    const res = await fetch('/api/media', { method: 'POST', body: form })
    const data = await res.json()
    if (!res.ok) { setStatus('error'); setError(data.error); return }
    setCount((c) => c + data.uploaded)
    setStatus('done')
    onDone()
  }

  return (
    <div className="border-2 border-dashed rounded-xl p-6 text-center space-y-3">
      <ImageIcon className="w-8 h-8 text-gray-400 mx-auto" />
      <p className="text-sm text-gray-600">Upload photos and videos from the session</p>
      <label className="cursor-pointer inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
        {status === 'loading' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Choose Files
        <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFiles} disabled={status === 'loading'} />
      </label>
      {count > 0 && (
        <p className="text-sm text-green-600 flex items-center justify-center gap-1">
          <CheckCircle className="w-4 h-4" /> {count} files uploaded
        </p>
      )}
      {status === 'error' && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
