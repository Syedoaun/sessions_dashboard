import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  const { data, error } = await supabase
    .from('trainers')
    .select('*, sessions:session_trainers(session:sessions(deleted_at))')
    .is('deleted_at', null)
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const trainers = (data ?? []).map((t: any) => ({
    ...t,
    // Count only sessions that aren't in the Trash
    session_count: (t.sessions ?? []).filter((l: any) => l.session && l.session.deleted_at === null).length,
    sessions: undefined,
  }))
  return NextResponse.json(trainers)
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied
  const body = await req.json()
  const { data, error } = await supabase.from('trainers').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
