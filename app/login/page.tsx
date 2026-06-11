'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Loader2 } from 'lucide-react'
import { USERNAME_DOMAIN } from '@/lib/auth-config'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    // Accept a plain username (mapped to an internal email) or a full email.
    const value = username.trim()
    const email = value.includes('@') ? value : `${value}@${USERNAME_DOMAIN}`
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Incorrect username or password.')
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="max-w-sm mx-auto mt-10">
      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Admin Login</h2>
            <p className="text-xs text-gray-400">Sign in to manage sessions. Viewing is open to everyone.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Username</label>
            <Input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" autoCapitalize="none" autoComplete="username" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button type="submit" disabled={loading || !username || !password} className="w-full bg-blue-600 hover:bg-blue-700">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  )
}
