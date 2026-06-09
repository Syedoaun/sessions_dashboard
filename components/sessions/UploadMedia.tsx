'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ImageIcon, Loader2, CheckCircle } from 'lucide-react'

export function UploadMedia({ sessionId, onDone, uploadedBy }: { sessionId: string; onDone: () => void; uploadedBy: string }) {
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
    if (uploadedBy) form.append('uploaded_by', uploadedBy)
    const res = await fetch('/api/media', { method: 'POST', body: form })
    const data = await res.json()
    if (!res.ok) { setStatus('error'); setError(data.error); return }
    setCount((c) => c + data.uploaded)
    setStatus('done')
    onDone()
  }

  return (
    <div className={`border-2 border-dashed rounded-xl p-6 text-center space-y-3 transition-opacity ${!uploadedBy ? 'opacity-60' : ''}`}>
      <ImageIcon className={`w-8 h-8 mx-auto ${!uploadedBy ? 'text-gray-300' : 'text-gray-400'}`} />
      <p className="text-sm text-gray-600">
        {!uploadedBy ? "Select who's uploading above first" : 'Upload photos and videos from the session'}
      </p>
      <label className={`inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors ${!uploadedBy ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-accent hover:text-accent-foreground'}`}>
        {status === 'loading' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Choose Files
        <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFiles} disabled={status === 'loading' || !uploadedBy} />
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
