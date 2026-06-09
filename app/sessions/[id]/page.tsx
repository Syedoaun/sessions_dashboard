'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { UploadAttendance } from '@/components/sessions/UploadAttendance'
import { UploadFeedback } from '@/components/sessions/UploadFeedback'
import { UploadMedia } from '@/components/sessions/UploadMedia'
import { FeedbackCharts } from '@/components/charts/FeedbackCharts'
import type { Session, Attendance, Feedback, Media, ClassCount, FeedbackStats } from '@/types'
import { Users, MapPin, BookOpen, Image as ImageIcon, Video } from 'lucide-react'

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [media, setMedia] = useState<Media[]>([])

  const load = useCallback(() => {
    fetch(`/api/sessions/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setSession(d.session)
        setAttendance(d.attendance)
        setFeedback(d.feedback)
        setMedia(d.media)
      })
  }, [id])

  useEffect(() => { load() }, [load])

  if (!session) return <div className="text-gray-400 text-sm p-8">Loading...</div>

  const classCounts = attendance.reduce<Record<string, number>>((acc, a) => {
    acc[a.class] = (acc[a.class] ?? 0) + 1
    return acc
  }, {})

  const feedbackStats: FeedbackStats = {
    total: feedback.length,
    understanding: {
      still_confused: feedback.filter((f) => f.understanding_level === 'still_confused').length,
      understand_basics: feedback.filter((f) => f.understanding_level === 'understand_basics').length,
      need_more_practice: feedback.filter((f) => f.understanding_level === 'need_more_practice').length,
    },
    would_attend_more: {
      yes: feedback.filter((f) => f.would_attend_more === 'yes').length,
      maybe: feedback.filter((f) => f.would_attend_more === 'maybe').length,
      no: feedback.filter((f) => f.would_attend_more === 'no').length,
    },
    trainer_rating: {
      excellent: feedback.filter((f) => f.trainer_rating === 'excellent').length,
      average: feedback.filter((f) => f.trainer_rating === 'average').length,
      poor: feedback.filter((f) => f.trainer_rating === 'poor').length,
    },
    learned_something: {
      yes: feedback.filter((f) => f.learned_something === 'yes').length,
      not_much: feedback.filter((f) => f.learned_something === 'not_much').length,
      no: feedback.filter((f) => f.learned_something === 'no').length,
    },
  }

  const images = media.filter((m) => m.type === 'image')
  const videos = media.filter((m) => m.type === 'video')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-800">{session.topic}</h2>
          <span className="text-sm bg-blue-50 text-blue-600 font-medium px-3 py-1 rounded-full shrink-0">
            {formatDate(session.date)}
          </span>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{session.school}</span>
          {session.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{session.location}</span>}
          {session.trainers?.length ? (
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {session.trainers.map((t) => t.name).join(', ')}
            </span>
          ) : null}
        </div>
        {session.topic_summary && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{session.topic_summary}</p>
        )}
        <div className="flex gap-6 pt-1 text-sm font-medium">
          <span className="text-blue-700">{attendance.length} students attended</span>
          <span className="text-purple-700">{feedback.length} feedback forms</span>
          <span className="text-gray-500">{media.length} media files</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4 mt-4">
          <UploadAttendance sessionId={id} onDone={load} />

          {Object.keys(classCounts).length > 0 && (
            <div className="bg-white rounded-xl border p-5 space-y-3">
              <h3 className="font-semibold text-gray-700">Class Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(classCounts).sort(([a], [b]) => a.localeCompare(b)).map(([cls, count]) => (
                  <div key={cls} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 w-24">{cls}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(count / attendance.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-12 text-right">{count} students</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 pt-1">Total: {attendance.length} students across {Object.keys(classCounts).length} classes</p>
            </div>
          )}

          {attendance.length > 0 && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Class</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Signature</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {attendance.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">{a.student_name}</td>
                      <td className="px-4 py-2.5"><Badge variant="outline">{a.class}</Badge></td>
                      <td className="px-4 py-2.5 text-gray-400">{a.has_signature ? '✓' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-4 mt-4">
          <UploadFeedback sessionId={id} onDone={load} />

          {feedbackStats.total > 0 && (
            <>
              <FeedbackCharts stats={feedbackStats} />
              <div className="bg-white rounded-xl border p-5 space-y-4">
                <h3 className="font-semibold text-gray-700">Student Responses</h3>
                {feedback.filter((f) => f.favourite_part || f.additional_comments).map((f) => (
                  <div key={f.id} className="border-l-2 border-blue-200 pl-3 space-y-1">
                    <p className="text-xs text-gray-400">{f.student_name ?? 'Anonymous'} · {f.class ?? '—'}</p>
                    {f.favourite_part && <p className="text-sm text-gray-700"><span className="font-medium">Favourite part:</span> {f.favourite_part}</p>}
                    {f.additional_comments && <p className="text-sm text-gray-600 italic">{f.additional_comments}</p>}
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-4 mt-4">
          <UploadMedia sessionId={id} onDone={load} />

          {images.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Photos ({images.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((m) => (
                  <a key={m.id} href={m.file_url} target="_blank" rel="noreferrer">
                    <img src={m.file_url} alt={m.file_name} className="rounded-lg aspect-square object-cover w-full hover:opacity-90 transition-opacity border" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {videos.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2"><Video className="w-4 h-4" /> Videos ({videos.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {videos.map((m) => (
                  <video key={m.id} src={m.file_url} controls className="rounded-lg w-full border" />
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
