'use client'
import { useState } from 'react'
import { CheckCircle, Loader2, Upload, AlertCircle, X } from 'lucide-react'

type State = 'idle' | 'uploading' | 'done' | 'error'

export function UploadFeedback({ sessionId, onDone }: { sessionId: string; onDone: () => void }) {
  const [state, setState] = useState<State>('idle')
  const [previews, setPreviews] = useState<string[]>([])
  const [result, setResult] = useState<{ inserted: number; failed: number } | null>(null)
  const [error, setError] = useState('')

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    // Show local previews immediately
    setPreviews(files.map((f) => URL.createObjectURL(f)))
    setState('uploading')
    setError('')

    const form = new FormData()
    files.forEach((f) => form.append('files', f))
    form.append('session_id', sessionId)

    const res = await fetch('/api/feedback/extract', { method: 'POST', body: form })
    const data = await res.json().catch(() => ({ error: 'Server error — check terminal' }))

    if (!res.ok) {
      setState('error')
      setError(data.error ?? 'Unknown error')
      return
    }

    setResult(data)
    setState('done')
    onDone()
    e.target.value = ''
  }

  function clearPreviews() {
    previews.forEach((p) => URL.revokeObjectURL(p))
    setPreviews([])
    setState('idle')
    setResult(null)
    setError('')
  }

  return (
    <div className="space-y-3">
      <label className={`
        relative flex flex-col items-center justify-center gap-3 w-full rounded-xl border-2 border-dashed p-6 text-center transition-colors
        ${state === 'uploading' ? 'border-blue-300 bg-blue-50 cursor-wait' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 cursor-pointer'}
      `}>
        <input type="file" accept="image/*" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFiles} disabled={state === 'uploading'} />

        {state === 'uploading' ? (
          <>
            <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
            <p className="text-sm text-blue-600 font-medium">Saving &amp; reading {previews.length} form{previews.length !== 1 ? 's' : ''}…</p>
          </>
        ) : (
          <>
            <Upload className="w-7 h-7 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">Upload feedback form photos</p>
              <p className="text-xs text-gray-400 mt-0.5">Select multiple at once — one photo per form</p>
            </div>
          </>
        )}
      </label>

      {/* Preview grid + result */}
      {previews.length > 0 && (
        <div className="bg-gray-50 rounded-xl border p-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            {previews.map((src, i) => (
              <img key={i} src={src} alt={`Form ${i + 1}`} className="w-16 h-16 object-cover rounded-lg border" />
            ))}
          </div>

          {state === 'uploading' && <p className="text-xs text-gray-500">Extracting data from each form…</p>}

          {state === 'done' && result && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {result.inserted} form{result.inserted !== 1 ? 's' : ''} extracted
                  {result.failed > 0 && <span className="text-amber-600 ml-1">({result.failed} failed)</span>}
                </span>
              </div>
              <button onClick={clearPreviews} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <X className="w-3 h-3" /> Clear
              </button>
            </div>
          )}

          {state === 'error' && (
            <div className="flex items-start gap-1.5 text-red-600">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Extraction failed</p>
                <p className="text-xs text-gray-500 mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
