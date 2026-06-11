'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, Search, LogOut, LogIn, ShieldCheck, Eye } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthContext'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const { isAdmin, email } = useAuth()
  const displayName = email ? email.split('@')[0] : null

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) router.push(`/sessions?q=${encodeURIComponent(q)}`)
    else router.push('/sessions')
  }

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 sm:px-6 gap-3 shrink-0 z-10">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-500 hover:text-gray-800 shrink-0"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 w-40 sm:w-64">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="bg-transparent text-sm outline-none flex-1 text-gray-600 placeholder:text-gray-400 min-w-0"
        />
      </form>

      {/* Role + auth */}
      {isAdmin ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" /> {displayName ? `Admin · ${displayName}` : 'Admin'}
          </span>
          <button
            onClick={handleLogout}
            title={displayName ? `Logged in as ${displayName}` : 'Log out'}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border rounded-md px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            <Eye className="w-3.5 h-3.5" /> Viewer
          </span>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md px-3 py-1.5 transition-colors"
          >
            <LogIn className="w-4 h-4" /> <span className="hidden sm:inline">Admin login</span>
          </Link>
        </div>
      )}
    </header>
  )
}
