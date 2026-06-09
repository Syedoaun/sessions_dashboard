import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopBar } from '@/components/dashboard/TopBar'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SessionsHub',
  description: 'Track school session attendance and feedback',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${geist.className} h-full`} suppressHydrationWarning>
        <div className="flex h-full">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-y-auto bg-[#f4f6f9] p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
