import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase/admin'

const RETENTION_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

// Trash item types → their tables
const TABLES = {
  session: 'sessions',
  trainer: 'trainers',
  bootcamp: 'bootcamps',
  media: 'media',
} as const
type TrashType = keyof typeof TABLES

// Derive the storage path from a public URL (…/session-media/<path>)
function storagePath(fileUrl: string): string | null {
  const marker = '/session-media/'
  const idx = fileUrl.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(fileUrl.slice(idx + marker.length))
}

// Permanently remove a set of media rows + their storage objects
async function purgeMedia(rows: { id: string; file_url: string }[]) {
  if (!rows.length) return
  const paths = rows.map((r) => storagePath(r.file_url)).filter(Boolean) as string[]
  if (paths.length) await supabase.storage.from('session-media').remove(paths)
  await supabase.from('media').delete().in('id', rows.map((r) => r.id))
}

// Delete anything that has sat in the Trash longer than the retention window
async function purgeExpired() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * DAY_MS).toISOString()

  const { data: oldMedia } = await supabase
    .from('media')
    .select('id, file_url')
    .lt('deleted_at', cutoff)
  await purgeMedia(oldMedia ?? [])

  // Sessions cascade-delete their attendance/feedback/media via FK
  for (const table of ['sessions', 'trainers', 'bootcamps'] as const) {
    await supabase.from(table).delete().lt('deleted_at', cutoff).not('deleted_at', 'is', null)
  }
}

function daysLeft(deletedAt: string): number {
  const elapsed = (Date.now() - new Date(deletedAt).getTime()) / DAY_MS
  return Math.max(0, Math.ceil(RETENTION_DAYS - elapsed))
}

export async function GET() {
  await purgeExpired()

  const [sessions, trainers, bootcamps, media] = await Promise.all([
    supabase.from('sessions').select('id, topic, school, date, deleted_at').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    supabase.from('trainers').select('id, name, credentials, deleted_at').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    supabase.from('bootcamps').select('id, name, deleted_at').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    supabase.from('media').select('id, file_name, type, file_url, deleted_at').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
  ])

  const items = [
    ...(sessions.data ?? []).map((s: any) => ({ type: 'session' as const, id: s.id, label: s.topic, sublabel: s.school, deleted_at: s.deleted_at, days_left: daysLeft(s.deleted_at) })),
    ...(trainers.data ?? []).map((t: any) => ({ type: 'trainer' as const, id: t.id, label: t.name, sublabel: t.credentials ?? '', deleted_at: t.deleted_at, days_left: daysLeft(t.deleted_at) })),
    ...(bootcamps.data ?? []).map((b: any) => ({ type: 'bootcamp' as const, id: b.id, label: b.name, sublabel: '', deleted_at: b.deleted_at, days_left: daysLeft(b.deleted_at) })),
    ...(media.data ?? []).map((m: any) => ({ type: 'media' as const, id: m.id, label: m.file_name, sublabel: m.type, deleted_at: m.deleted_at, days_left: daysLeft(m.deleted_at) })),
  ]

  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const { type, id, action } = await req.json()

  if (!type || !(type in TABLES) || !id || !['restore', 'purge'].includes(action)) {
    return NextResponse.json({ error: 'type, id and a valid action are required' }, { status: 400 })
  }

  const table = TABLES[type as TrashType]

  if (action === 'restore') {
    const { error } = await supabase.from(table).update({ deleted_at: null }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // action === 'purge' — permanent delete
  if (type === 'media') {
    const { data: row } = await supabase.from('media').select('id, file_url').eq('id', id).single()
    if (row) await purgeMedia([row])
  } else {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
