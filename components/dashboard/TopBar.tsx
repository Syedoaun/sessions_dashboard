'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, Search, User } from 'lucide-react'

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) router.push(`/sessions?q=${encodeURIComponent(q)}`)
    else router.push('/sessions')
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

      {/* Avatar */}
      <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
        <User className="w-4 h-4 text-white" />
      </div>
    </header>
  )
}
