import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Single source of truth for auth. Anonymous visitors are viewers (read-only);
// any authenticated Supabase user is an admin (admin accounts are created in the
// Supabase dashboard with public sign-ups disabled).

export async function getUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function isAdmin(): Promise<boolean> {
  return !!(await getUser())
}

// For route handlers: returns a 401 response when the caller isn't an admin,
// otherwise null. Usage: `const denied = await requireAdmin(); if (denied) return denied`
export async function requireAdmin(): Promise<NextResponse | null> {
  if (await isAdmin()) return null
  return NextResponse.json({ error: 'Unauthorized — admin access required' }, { status: 401 })
}
