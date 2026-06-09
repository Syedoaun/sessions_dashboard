'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search, User } from 'lucide-react'

export function TopBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) router.push(`/sessions?q=${encodeURIComponent(q)}`)
    else router.push('/sessions')
  }

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 shrink-0 z-10">
      <div className="flex-1" />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 w-64">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sessions…"
          className="bg-transparent text-sm outline-none flex-1 text-gray-600 placeholder:text-gray-400"
        />
      </form>

      {/* Avatar */}
      <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
        <User className="w-4 h-4 text-white" />
      </div>
    </header>
  )
}
