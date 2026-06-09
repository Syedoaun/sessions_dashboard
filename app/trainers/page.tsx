import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, User, Mail } from 'lucide-react'

export const revalidate = 0

const AVATAR_COLORS = ['bg-blue-500','bg-orange-400','bg-purple-500','bg-emerald-500','bg-red-500','bg-cyan-500']
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

export default async function TrainersPage() {
  const { data: trainers } = await supabase.from('trainers').select('*').order('name')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Trainers</h2>
          <p className="text-sm text-gray-400 mt-0.5">{trainers?.length ?? 0} trainers</p>
        </div>
        <Link href="/trainers/new">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add Trainer
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(!trainers || trainers.length === 0) && (
          <p className="col-span-3 text-sm text-gray-400 text-center py-12">No trainers yet.</p>
        )}
        {trainers?.map((t) => (
          <div key={t.id} className="bg-white rounded-xl shadow-sm p-5 space-y-3 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              {t.photo_url ? (
                <img src={t.photo_url} alt={t.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
              ) : (
                <div className={`w-12 h-12 rounded-full ${avatarColor(t.name)} flex items-center justify-center shrink-0`}>
                  <span className="text-white font-bold text-lg">{t.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-800">{t.name}</p>
                {t.credentials && (
                  <p className="text-xs text-blue-600 font-medium mt-0.5">{t.credentials}</p>
                )}
              </div>
            </div>
            {t.bio && (
              <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{t.bio}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
