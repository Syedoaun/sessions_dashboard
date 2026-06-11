import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
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
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { data: row, error: fetchError } = await supabase
    .from('media')
    .select('file_url')
    .eq('id', id)
    .single()

  if (fetchError || !row) return NextResponse.json({ error: 'Media not found' }, { status: 404 })

  // Derive the storage path from the public URL (…/session-media/<path>)
  const marker = '/session-media/'
  const idx = row.file_url.indexOf(marker)
  if (idx !== -1) {
    const path = decodeURIComponent(row.file_url.slice(idx + marker.length))
    await supabase.storage.from('session-media').remove([path])
  }

  const { error } = await supabase.from('media').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
