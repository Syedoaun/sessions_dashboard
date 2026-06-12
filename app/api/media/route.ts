import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

// Records media rows for files the browser already uploaded directly to Storage
// via signed URLs (see ./sign/route.ts). The public URL is derived server-side
// from the storage path so it can't be forged by the client.
type MediaItem = { path: string; file_name: string; type: 'image' | 'video' }

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied

  const { session_id, items, uploaded_by } = (await req.json()) as {
    session_id?: string
    items?: MediaItem[]
    uploaded_by?: string | null
  }

  if (!session_id || !Array.isArray(items) || !items.length) {
    return NextResponse.json({ error: 'session_id and items are required' }, { status: 400 })
  }

  const rows = items.map((it) => {
    const { data: urlData } = supabase.storage.from('session-media').getPublicUrl(it.path)
    return {
      session_id,
      type: it.type === 'video' ? 'video' : 'image',
      file_url: urlData.publicUrl,
      file_name: it.file_name,
      uploaded_by: uploaded_by ?? null,
    }
  })

  const { data, error } = await supabase.from('media').insert(rows).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ uploaded: data?.length ?? 0, media: data })
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
