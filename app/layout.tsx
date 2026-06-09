import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { LayoutShell } from '@/components/dashboard/LayoutShell'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SessionsHub',
  description: 'Track school session attendance and feedback',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${geist.className} h-full`} suppressHydrationWarning>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  )
}
