import { supabaseAdmin as supabase } from '@/lib/supabase/admin'
import { fetchAll } from '@/lib/supabase/fetch-all'
import { SessionsBrowser, type SessionRow } from '@/components/sessions/SessionsBrowser'
import { PAKISTAN_CITIES } from '@/lib/cities'

export const revalidate = 0

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams

  const [sessions, bootcampsRes] = await Promise.all([
    fetchAll<any>((from, to) =>
      supabase
        .from('sessions')
        .select(`*, trainers:session_trainers(trainer:trainers(name)), bootcamp:bootcamps(name), attendance_count:attendance(count), feedback_count:feedback(count)`)
        .is('deleted_at', null)
        .order('date', { ascending: false })
        .range(from, to)),
    supabase.from('bootcamps').select('id, name').is('deleted_at', null).order('name'),
  ])

  const list: SessionRow[] = (sessions ?? []).map((s: any) => ({
    id: s.id,
    date: s.date,
    school: s.school,
    city: s.city ?? null,
    topic: s.topic,
    bootcamp_id: s.bootcamp_id ?? null,
    bootcamp: s.bootcamp?.name ?? null,
    trainers: s.trainers?.map((t: any) => t.trainer?.name).filter(Boolean) ?? [],
    attendance_count: s.attendance_count?.[0]?.count ?? 0,
    feedback_count:   s.feedback_count?.[0]?.count ?? 0,
  }))

  return (
    <SessionsBrowser
      sessions={list}
      availableBootcamps={bootcampsRes.data ?? []}
      cities={PAKISTAN_CITIES}
      initialQuery={q?.trim() ?? ''}
    />
  )
}
