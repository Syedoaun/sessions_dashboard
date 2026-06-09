'use client'
import dynamic from 'next/dynamic'
import type { Session } from '@/types'

const SessionMap = dynamic(() => import('./SessionMap'), {
  ssr: false,
  loading: () => <div className="h-[500px] rounded-xl bg-gray-100 animate-pulse" />,
})

export default function SessionMapWrapper({ sessions }: { sessions: Session[] }) {
  return <SessionMap sessions={sessions} />
}
