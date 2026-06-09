'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarDays, Users, Plus, Layers, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 bg-[#1a2035] flex flex-col shrink-0 h-full">
      {/* Logo */}
      <div className="px-5 h-16 flex items-center gap-3 border-b border-white/10">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-xs">GSI</span>
        </div>
        <div>
          <span className="text-white font-bold text-sm tracking-tight leading-none">Global Shapers</span>
          <span className="block text-white/40 text-[10px]">Islamabad</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        <Section label="Main">
          <NavItem href="/" icon={LayoutDashboard} label="Dashboard"
            active={pathname === '/'} />
          <NavItem href="/analytics" icon={BarChart2} label="Analytics"
            active={pathname.startsWith('/analytics')} />
        </Section>

        <Section label="Sessions">
          <NavItem href="/sessions" icon={CalendarDays} label="All Sessions"
            active={pathname === '/sessions' || (pathname.startsWith('/sessions/') && pathname !== '/sessions/new')} />
          <NavItem href="/sessions/new" icon={Plus} label="New Session"
            active={pathname === '/sessions/new'} />
        </Section>

        <Section label="Setup">
          <NavItem href="/bootcamps" icon={Layers} label="Bootcamps"
            active={pathname.startsWith('/bootcamps')} />
          <NavItem href="/trainers" icon={Users} label="Trainers"
            active={pathname.startsWith('/trainers')} />
        </Section>
      </nav>
    </aside>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1 px-3">{label}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function NavItem({ href, icon: Icon, label, active }: {
  href: string; icon: React.ElementType; label: string; active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
        active
          ? 'bg-white/10 text-white font-medium border-l-2 border-blue-400 pl-[10px]'
          : 'text-white/50 hover:text-white/80 hover:bg-white/5'
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  )
}
