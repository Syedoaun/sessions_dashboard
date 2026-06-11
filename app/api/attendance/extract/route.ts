import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase/admin'
import { extractAttendance } from '@/lib/extract'
import { requireAdmin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied
  console.log('[attendance/extract] GEMINI_API_KEY set:', !!process.env.GEMINI_API_KEY)

  const formData = await req.formData()
  const file = formData.get('file') as File
  const sessionId = formData.get('session_id') as string
  const uploadedBy = (formData.get('uploaded_by') as string) || null

  if (!file || !sessionId) {
    return NextResponse.json({ error: 'file and session_id are required' }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  // Save original image to storage first — preserved even if extraction fails
  const storagePath = `${sessionId}/attendance/${Date.now()}-${file.name}`
  const { data: stored, error: storageError } = await supabase.storage
    .from('session-media')
    .upload(storagePath, bytes, { contentType: file.type || 'image/jpeg' })

  if (storageError) {
    console.error('[attendance/extract] Storage upload failed:', storageError.message)
  }

  const { data: urlData } = supabase.storage.from('session-media').getPublicUrl(storagePath)
  const imageUrl = stored ? urlData.publicUrl : null

  // Extract with Claude Haiku
  const base64 = Buffer.from(buffer).toString('base64')
  const mediaType = file.type || 'image/jpeg'

  let records
  try {
    records = await extractAttendance(base64, mediaType)
  } catch (err: any) {
    console.error('[attendance/extract] Extraction failed:', err.message)
    return NextResponse.json({
      error: err.message,
      image_url: imageUrl,
    }, { status: 500 })
  }

  const rows = records.map((r) => ({ ...r, session_id: sessionId, uploaded_by: uploadedBy }))
  const { data, error } = await supabase.from('attendance').insert(rows).select()

  if (error) {
    console.error('[attendance/extract] DB insert failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ inserted: data?.length ?? 0, records: data, image_url: imageUrl })
}
