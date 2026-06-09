'use client'
import { useState } from 'react'
import { CheckCircle, Loader2, Upload, AlertCircle } from 'lucide-react'

type State = 'idle' | 'uploading' | 'done' | 'error'

export function UploadAttendance({ sessionId, onDone, uploadedBy }: { sessionId: string; onDone: () => void; uploadedBy: string }) {
  const [state, setState] = useState<State>('idle')
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<{ inserted: number } | null>(null)
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Show local preview immediately
    setPreview(URL.createObjectURL(file))
    setState('uploading')
    setError('')

    const form = new FormData()
    form.append('file', file)
    form.append('session_id', sessionId)
    if (uploadedBy) form.append('uploaded_by', uploadedBy)

    const res = await fetch('/api/attendance/extract', { method: 'POST', body: form })
    const data = await res.json().catch(() => ({ error: 'Server error — check terminal' }))

    if (!res.ok) {
      setState('error')
      setError(data.error ?? 'Unknown error')
      return
    }

    setResult(data)
    setState('done')
    onDone()
    // Reset input so same file can be re-uploaded if needed
    e.target.value = ''
  }

  return (
    <div className="space-y-3">
      <label className={`
        relative flex flex-col items-center justify-center gap-3 w-full rounded-xl border-2 border-dashed p-6 text-center transition-colors
        ${!uploadedBy ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60' : state === 'uploading' ? 'border-blue-300 bg-blue-50 cursor-wait' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 cursor-pointer'}
      `}>
        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFile} disabled={state === 'uploading' || !uploadedBy} />

        {!uploadedBy ? (
          <>
            <Upload className="w-7 h-7 text-gray-300" />
            <p className="text-sm text-gray-400">Select who's uploading above first</p>
          </>
        ) : state === 'uploading' ? (
          <>
            <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
            <p className="text-sm text-blue-600 font-medium">Saving image &amp; reading names…</p>
          </>
        ) : (
          <>
            <Upload className="w-7 h-7 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">Upload attendance sheet photo</p>
              <p className="text-xs text-gray-400 mt-0.5">JPG, PNG — any phone photo works</p>
            </div>
          </>
        )}
      </label>

      {/* Image preview + result */}
      {preview && (
        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3 border">
          <img src={preview} alt="Attendance sheet" className="w-20 h-20 object-cover rounded-lg border shrink-0" />
          <div className="flex-1 min-w-0 pt-1">
            {state === 'uploading' && <p className="text-xs text-gray-500">Processing…</p>}
            {state === 'done' && result && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{result.inserted} students extracted</span>
                </div>
                <p className="text-xs text-gray-400">Image saved · Data recorded</p>
              </div>
            )}
            {state === 'error' && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-amber-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Extraction failed</span>
                </div>
                <p className="text-xs text-gray-500">{error}</p>
                <p className="text-xs text-gray-400">Image was saved to storage — you can retry</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
