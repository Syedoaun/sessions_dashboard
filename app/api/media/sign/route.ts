import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

// Issues short-lived signed upload URLs so the browser can send file bytes
// straight to Supabase Storage. This keeps large photos/videos off the Vercel
// serverless function, which caps request bodies at ~4.5 MB. The browser uploads
// with these tokens, then calls POST /api/media to record the rows.

type FileMeta = { name: string; type: string }

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied

  const { session_id, files } = (await req.json()) as { session_id?: string; files?: FileMeta[] }
  if (!session_id || !Array.isArray(files) || !files.length) {
    return NextResponse.json({ error: 'session_id and files are required' }, { status: 400 })
  }

  const signed = await Promise.allSettled(
    files.map(async (f, index) => {
      const safeName = f.name.replace(/[^\w.\-]+/g, '_')
      const path = `${session_id}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`
      const { data, error } = await supabase.storage.from('session-media').createSignedUploadUrl(path)
      if (error || !data) throw new Error(error?.message ?? 'Could not create upload URL')

      return {
        index,
        path: data.path,
        token: data.token,
        file_name: f.name,
        type: f.type?.startsWith('video/') ? 'video' : 'image',
      }
    })
  )

  const uploads = signed
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .map((r) => r.value)

  if (!uploads.length) {
    return NextResponse.json({ error: 'Could not start upload' }, { status: 500 })
  }

  return NextResponse.json({ uploads })
}
