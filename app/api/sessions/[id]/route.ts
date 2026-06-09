import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [sessionRes, attendanceRes, feedbackRes, mediaRes] = await Promise.all([
    supabase
      .from('sessions')
      .select('*, trainers:session_trainers(trainer:trainers(*))')
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
    },
    attendance: attendanceRes.data ?? [],
    feedback: feedbackRes.data ?? [],
    media: mediaRes.data ?? [],
  })
}
