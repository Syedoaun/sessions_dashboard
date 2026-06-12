'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ImageIcon, Loader2, CheckCircle } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

// How many files to push to Storage at once. Keeps memory/bandwidth in check
// while still being much faster than one-at-a-time.
const CONCURRENCY = 4

type SignedUpload = { index: number; path: string; token: string; file_name: string; type: 'image' | 'video' }

export function UploadMedia({ sessionId, onDone }: { sessionId: string; onDone: () => void }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [count, setCount] = useState(0)
  const [error, setError] = useState('')

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setStatus('loading')
    setError('')

    try {
      // 1. Ask the server for a signed upload URL per file.
      const signRes = await fetch('/api/media/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, files: files.map((f) => ({ name: f.name, type: f.type })) }),
      })
      const signData = await signRes.json()
      if (!signRes.ok) throw new Error(signData.error || 'Could not start upload')

      const uploads: SignedUpload[] = signData.uploads
      // Files the server couldn't sign never get a URL — count them as failed.
      let failed = files.length - uploads.length

      // 2. Upload bytes straight to Storage, a few at a time. This bypasses the
      //    ~4.5 MB Vercel request-body limit that was breaking large batches.
      const supabase = createSupabaseBrowserClient()
      const recorded: { path: string; file_name: string; type: 'image' | 'video' }[] = []
      const queue = [...uploads]

      async function worker() {
        while (queue.length) {
          const u = queue.shift()!
          const file = files[u.index]
          const { error: upErr } = await supabase.storage
            .from('session-media')
            .uploadToSignedUrl(u.path, u.token, file, { contentType: file.type })
          if (upErr) failed++
          else recorded.push({ path: u.path, file_name: u.file_name, type: u.type })
        }
      }
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker))

      if (!recorded.length) throw new Error('All uploads failed — please try again')

      // 3. Record the rows for what made it to Storage.
      const recRes = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, items: recorded }),
      })
      const recData = await recRes.json()
      if (!recRes.ok) throw new Error(recData.error || 'Could not save uploads')

      setCount((c) => c + recData.uploaded)
      setError(failed ? `${failed} file(s) failed to upload` : '')
      setStatus('done')
      onDone()
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      // Allow re-selecting the same files after a failure.
      e.target.value = ''
    }
  }

  return (
    <div className="border-2 border-dashed rounded-xl p-6 text-center space-y-3">
      <ImageIcon className="w-8 h-8 mx-auto text-gray-400" />
      <p className="text-sm text-gray-600">Upload photos and videos from the session</p>
      <label className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors cursor-pointer hover:bg-accent hover:text-accent-foreground">
        {status === 'loading' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Choose Files
        <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFiles} disabled={status === 'loading'} />
      </label>
      {count > 0 && (
        <p className="text-sm text-green-600 flex items-center justify-center gap-1">
          <CheckCircle className="w-4 h-4" /> {count} files uploaded
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
