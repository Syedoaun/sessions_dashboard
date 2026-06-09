import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET() {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      trainers:session_trainers(trainer:trainers(*)),
      attendance_count:attendance(count),
      feedback_count:feedback(count)
    `)
    .order('date', { ascending: false })

  if (error) { console.error('[GET /api/sessions]', error); return NextResponse.json({ error: error.message }, { status: 500 }) }

  const sessions = data.map((s: any) => ({
    ...s,
    trainers: s.trainers?.map((t: any) => t.trainer) ?? [],
    attendance_count: s.attendance_count?.[0]?.count ?? 0,
    feedback_count: s.feedback_count?.[0]?.count ?? 0,
  }))

  return NextResponse.json(sessions)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { trainer_ids, ...sessionData } = body

  const { data: session, error } = await supabase
    .from('sessions')
    .insert(sessionData)
    .select()
    .single()

  if (error) { console.error('[POST /api/sessions]', error); return NextResponse.json({ error: error.message }, { status: 500 }) }

  if (trainer_ids?.length) {
    const links = trainer_ids.map((tid: string) => ({ session_id: session.id, trainer_id: tid }))
    await supabase.from('session_trainers').insert(links)
  }

  return NextResponse.json(session, { status: 201 })
}
