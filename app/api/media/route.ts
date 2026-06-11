import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied
  const formData = await req.formData()
  const files = formData.getAll('files') as File[]
  const sessionId = formData.get('session_id') as string
  const uploadedBy = (formData.get('uploaded_by') as string) || null

  if (!files.length || !sessionId) {
    return NextResponse.json({ error: 'files and session_id are required' }, { status: 400 })
  }

  const results = await Promise.allSettled(
    files.map(async (file) => {
      const path = `${sessionId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`
      const buffer = await file.arrayBuffer()

      const { error: uploadError } = await supabase.storage
        .from('session-media')
        .upload(path, buffer, { contentType: file.type })

      if (uploadError) throw new Error(uploadError.message)

      const { data: urlData } = supabase.storage.from('session-media').getPublicUrl(path)

      const type = file.type.startsWith('video/') ? 'video' : 'image'
      return { session_id: sessionId, type, file_url: urlData.publicUrl, file_name: file.name, uploaded_by: uploadedBy }
    })
  )

  const succeeded = results.filter((r) => r.status === 'fulfilled')
  const failed = results.filter((r) => r.status === 'rejected').length

  if (succeeded.length === 0) {
    return NextResponse.json({ error: 'All file uploads failed' }, { status: 500 })
  }

  const rows = succeeded.map((r) => (r as PromiseFulfilledResult<any>).value)
  const { data, error } = await supabase.from('media').insert(rows).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ uploaded: data?.length ?? 0, failed, media: data })
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  // Soft delete — moves the file to Trash (recoverable for 30 days). The storage
  // object is kept so the media can be restored; it's only removed on permanent purge.
  const { error } = await supabase
    .from('media')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
