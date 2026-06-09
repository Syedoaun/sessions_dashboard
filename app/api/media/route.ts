import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const files = formData.getAll('files') as File[]
  const sessionId = formData.get('session_id') as string

  if (!files.length || !sessionId) {
    return NextResponse.json({ error: 'files and session_id are required' }, { status: 400 })
  }

  const uploaded = await Promise.all(
    files.map(async (file) => {
      const ext = file.name.split('.').pop()
      const path = `${sessionId}/${Date.now()}-${file.name}`
      const buffer = await file.arrayBuffer()

      const { error: uploadError } = await supabase.storage
        .from('session-media')
        .upload(path, buffer, { contentType: file.type })

      if (uploadError) throw new Error(uploadError.message)

      const { data: urlData } = supabase.storage.from('session-media').getPublicUrl(path)

      const type = file.type.startsWith('video/') ? 'video' : 'image'
      return { session_id: sessionId, type, file_url: urlData.publicUrl, file_name: file.name }
    })
  )

  const { data, error } = await supabase.from('media').insert(uploaded).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ uploaded: data?.length ?? 0, media: data })
}
