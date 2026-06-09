import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase/admin'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { trainer_ids, ...sessionData } = body

  const { data: session, error } = await supabase
    .from('sessions')
    .update(sessionData)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (trainer_ids !== undefined) {
    await supabase.from('session_trainers').delete().eq('session_id', id)
    if (trainer_ids.length > 0) {
      const links = trainer_ids.map((tid: string) => ({ session_id: id, trainer_id: tid }))
      await supabase.from('session_trainers').insert(links)
    }
  }

  return NextResponse.json(session)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [sessionRes, attendanceRes, feedbackRes, mediaRes] = await Promise.all([
    supabase
      .from('sessions')
      .select('*, trainers:session_trainers(trainer:trainers(*)), bootcamp:bootcamps(*)')
      .eq('id', id)
      .single(),
    supabase.from('attendance').select('*').eq('session_id', id).order('class'),
    supabase.from('feedback').select('*').eq('session_id', id),
    supabase.from('media').select('*').eq('session_id', id).order('uploaded_at', { ascending: false }),
  ])

  if (sessionRes.error) return NextResponse.json({ error: sessionRes.error.message }, { status: 404 })

  return NextResponse.json({
    session: {
      ...sessionRes.data,
      trainers: sessionRes.data.trainers?.map((t: any) => t.trainer) ?? [],
      bootcamp: sessionRes.data.bootcamp ?? null,
    },
    attendance: attendanceRes.data ?? [],
    feedback: feedbackRes.data ?? [],
    media: mediaRes.data ?? [],
  })
}
