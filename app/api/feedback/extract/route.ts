import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase/admin'
import { extractFeedback } from '@/lib/extract'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const files = formData.getAll('files') as File[]
  const sessionId = formData.get('session_id') as string
  const uploadedBy = (formData.get('uploaded_by') as string) || null

  if (!files.length || !sessionId) {
    return NextResponse.json({ error: 'files and session_id are required' }, { status: 400 })
  }

  // Process each file: save to storage first, then extract
  const results = await Promise.allSettled(
    files.map(async (file) => {
      const buffer = await file.arrayBuffer()
      const bytes = new Uint8Array(buffer)

      // Save original image first
      const storagePath = `${sessionId}/feedback/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`
      const { error: storageError } = await supabase.storage
        .from('session-media')
        .upload(storagePath, bytes, { contentType: file.type || 'image/jpeg' })

      if (storageError) {
        console.error('[feedback/extract] Storage upload failed:', storageError.message)
      }

      // Extract with Claude Haiku
      const base64 = Buffer.from(buffer).toString('base64')
      const mediaType = file.type || 'image/jpeg'
      return extractFeedback(base64, mediaType)
    })
  )

  const succeeded = results.filter((r) => r.status === 'fulfilled')
  const failed = results.filter((r) => r.status === 'rejected')

  if (failed.length > 0) {
    const firstErr = (failed[0] as PromiseRejectedResult).reason
    console.error('[feedback/extract] Extraction error(s):', firstErr?.message)
    // If ALL failed, return error
    if (succeeded.length === 0) {
      return NextResponse.json({ error: firstErr?.message ?? 'Extraction failed for all files' }, { status: 500 })
    }
  }

  const rows = succeeded.map((r) => ({
    ...(r as PromiseFulfilledResult<any>).value,
    session_id: sessionId,
    uploaded_by: uploadedBy,
  }))

  const { data, error } = await supabase.from('feedback').insert(rows).select()
  if (error) {
    console.error('[feedback/extract] DB insert failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    inserted: data?.length ?? 0,
    failed: failed.length,
    records: data,
  })
}
