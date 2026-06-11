import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { LayoutShell } from '@/components/dashboard/LayoutShell'
import { getUser } from '@/lib/auth'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SessionsHub',
  description: 'Track school session attendance and feedback',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${geist.className} h-full`} suppressHydrationWarning>
        <LayoutShell isAdmin={!!user} email={user?.email ?? null}>{children}</LayoutShell>
      </body>
    </html>
  )
}
