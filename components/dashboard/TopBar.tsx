import { Bell, Search, User } from 'lucide-react'

export function TopBar() {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 shrink-0 z-10">
      <div className="flex-1" />

      {/* Search */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 w-56">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent text-sm outline-none flex-1 text-gray-600 placeholder:text-gray-400"
        />
      </div>

      {/* Bell */}
      <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
        <Bell className="w-5 h-5" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
      </button>

      {/* Avatar */}
      <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
        <User className="w-4 h-4 text-white" />
      </div>
    </header>
  )
}
