'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/utils'
import { UploadAttendance } from '@/components/sessions/UploadAttendance'
import { UploadFeedback } from '@/components/sessions/UploadFeedback'
import { UploadMedia } from '@/components/sessions/UploadMedia'
import { FeedbackCharts } from '@/components/charts/FeedbackCharts'
import type { Session, Attendance, Feedback, Media, FeedbackStats, Trainer, Bootcamp } from '@/types'
import {
  Users, MapPin, BookOpen, Image as ImageIcon, Video,
  UserCheck, Layers, Building2, ChevronLeft, Pencil,
  Trash2, X, Check,
} from 'lucide-react'

const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-56 rounded-xl border bg-gray-100 animate-pulse" />,
})

const PAKISTAN_CITIES = [
  'Islamabad', 'Rawalpindi', 'Lahore', 'Karachi', 'Peshawar', 'Quetta',
  'Multan', 'Faisalabad', 'Hyderabad', 'Gujranwala', 'Sialkot', 'Bahawalpur',
  'Sargodha', 'Sukkur', 'Larkana', 'Abbottabad', 'Mardan', 'Dera Ghazi Khan',
  'Sheikhupura', 'Muzaffarabad', 'Gilgit', 'Chitral', 'Swat', 'Mansehra',
  'Kohat', 'Bannu', 'Dera Ismail Khan', 'Mirpur', 'Khuzdar', 'Turbat',
]

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  // Data
  const [session, setSession] = useState<Session | null>(null)
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [media, setMedia] = useState<Media[]>([])
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [bootcamps, setBootcamps] = useState<Bootcamp[]>([])
  const [uploadedBy, setUploadedBy] = useState('')

  // Edit
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    date: '', school: '', city: '', location: '', topic: '', topic_summary: '', bootcamp_id: '',
  })
  const [editTrainers, setEditTrainers] = useState<string[]>([])
  const [editLatLng, setEditLatLng] = useState<{ lat: number; lng: number } | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

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
  useEffect(() => { fetch('/api/trainers').then((r) => r.json()).then((d) => setTrainers(Array.isArray(d) ? d : [])) }, [])
  useEffect(() => { fetch('/api/bootcamps').then((r) => r.json()).then((d) => setBootcamps(Array.isArray(d) ? d : [])) }, [])

  function startEdit() {
    if (!session) return
    setEditForm({
      date: session.date,
      school: session.school,
      city: session.city ?? '',
      location: session.location ?? '',
      topic: session.topic,
      topic_summary: session.topic_summary ?? '',
      bootcamp_id: session.bootcamp_id ?? '',
    })
    setEditTrainers(session.trainers?.map((t) => t.id) ?? [])
    setEditLatLng(
      session.latitude != null && session.longitude != null
        ? { lat: session.latitude, lng: session.longitude }
        : null
    )
    setEditError('')
    setEditMode(true)
    setDeleteConfirm(false)
  }

  async function saveEdit() {
    setEditLoading(true)
    setEditError('')
    const res = await fetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editForm,
        bootcamp_id: editForm.bootcamp_id || null,
        trainer_ids: editTrainers,
        latitude: editLatLng?.lat ?? null,
        longitude: editLatLng?.lng ?? null,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setEditError(data.error ?? 'Failed to save changes')
      setEditLoading(false)
      return
    }
    setEditMode(false)
    setEditLoading(false)
    load()
  }

  async function handleDelete() {
    setDeleteLoading(true)
    const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/sessions')
    else { setDeleteLoading(false); setDeleteConfirm(false) }
  }

  function toggleEditTrainer(tid: string) {
    setEditTrainers((prev) => prev.includes(tid) ? prev.filter((x) => x !== tid) : [...prev, tid])
  }

  if (!session) return <div className="text-gray-400 text-sm p-8">Loading…</div>

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
      {/* Back link */}
      <Link
        href="/sessions"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> All Sessions
      </Link>

      {/* Header — view or edit */}
      {editMode ? (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Edit Session</h3>
            <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>
              <X className="w-3.5 h-3.5 mr-1" /> Cancel
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Bootcamp">
              <select
                value={editForm.bootcamp_id}
                onChange={(e) => setEditForm({ ...editForm, bootcamp_id: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">No bootcamp</option>
                {bootcamps.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Date *">
              <Input
                type="date"
                required
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              />
            </Field>

            <Field label="School *">
              <Input
                required
                value={editForm.school}
                onChange={(e) => setEditForm({ ...editForm, school: e.target.value })}
              />
            </Field>

            <Field label="City">
              <select
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select city…</option>
                {PAKISTAN_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>

            <Field label="Venue / Location">
              <Input
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              />
            </Field>

            <Field label="Topic *">
              <Input
                required
                value={editForm.topic}
                onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Topic Summary">
            <Textarea
              rows={3}
              value={editForm.topic_summary}
              onChange={(e) => setEditForm({ ...editForm, topic_summary: e.target.value })}
            />
          </Field>

          {trainers.length > 0 && (
            <Field label="Trainer(s)">
              <select
                value=""
                onChange={(e) => { if (e.target.value) toggleEditTrainer(e.target.value) }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Add trainer…</option>
                {trainers.filter((t) => !editTrainers.includes(t.id)).map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {editTrainers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {editTrainers.map((id) => {
                    const t = trainers.find((x) => x.id === id)
                    if (!t) return null
                    return (
                      <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-blue-600 text-white">
                        {t.name}
                        <button type="button" onClick={() => toggleEditTrainer(id)} className="hover:text-blue-200 leading-none">×</button>
                      </span>
                    )
                  })}
                </div>
              )}
            </Field>
          )}

          <Field label="Update Map Location (optional)">
            <LocationPicker value={editLatLng} onChange={setEditLatLng} />
          </Field>

          {editError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {editError}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              onClick={saveEdit}
              disabled={editLoading || !editForm.topic.trim() || !editForm.school.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Check className="w-4 h-4 mr-1.5" />
              {editLoading ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-800">{session.topic}</h2>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm bg-blue-50 text-blue-600 font-medium px-3 py-1 rounded-full">
                {formatDate(session.date)}
              </span>
              <Button size="sm" variant="outline" onClick={startEdit} title="Edit session">
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              {deleteConfirm ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-red-600 font-medium">Delete session?</span>
                  <Button
                    size="sm"
                    disabled={deleteLoading}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleDelete}
                  >
                    {deleteLoading ? '…' : 'Delete'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(false)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  title="Delete session"
                  className="text-red-500 hover:text-red-700 hover:border-red-300"
                  onClick={() => setDeleteConfirm(true)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{session.school}</span>
            {session.city && <span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{session.city}</span>}
            {session.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{session.location}</span>}
            {session.bootcamp && (
              <span className="flex items-center gap-1 text-indigo-600">
                <Layers className="w-4 h-4" />{session.bootcamp.name}
              </span>
            )}
          </div>

          {/* Delivered by */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Delivered by</p>
            {session.trainers?.length ? (
              <div className="flex flex-wrap gap-3">
                {session.trainers.map((t) => {
                  const colors = ['bg-blue-500','bg-orange-400','bg-purple-500','bg-emerald-500','bg-red-500','bg-cyan-500']
                  let h = 0; for (let i = 0; i < t.name.length; i++) h = t.name.charCodeAt(i) + ((h << 5) - h)
                  const color = colors[Math.abs(h) % colors.length]
                  return (
                    <div key={t.id} className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                      <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center shrink-0`}>
                        <span className="text-white font-bold text-sm">{t.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 leading-tight">{t.name}</p>
                        {t.credentials && (
                          <p className="text-xs text-blue-600">{t.credentials}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No trainer assigned —{' '}
                <button type="button" onClick={startEdit} className="text-blue-500 hover:underline not-italic">add one</button>
              </p>
            )}
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
      )}

      {/* Uploader selector */}
      {trainers.length > 0 ? (
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700 shrink-0">
            <UserCheck className="w-4 h-4 text-gray-500" />
            Uploading as:
          </span>
          <select
            value={uploadedBy}
            onChange={(e) => setUploadedBy(e.target.value)}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Select trainer…</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
          {!uploadedBy && (
            <span className="text-xs text-amber-600 font-medium shrink-0">Required before uploading</span>
          )}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 flex items-center gap-2">
          <UserCheck className="w-4 h-4 shrink-0" />
          No trainers found.{' '}
          <Link href="/trainers/new" className="font-medium underline hover:text-amber-900">
            Add a trainer
          </Link>{' '}
          to track who uploads data.
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4 mt-4">
          <UploadAttendance sessionId={id} onDone={load} uploadedBy={uploadedBy} />

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
              <p className="text-xs text-gray-400 pt-1">
                Total: {attendance.length} students across {Object.keys(classCounts).length} classes
              </p>
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
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Uploaded by</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {attendance.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">{a.student_name}</td>
                      <td className="px-4 py-2.5"><Badge variant="outline">{a.class}</Badge></td>
                      <td className="px-4 py-2.5 text-gray-400">{a.has_signature ? '✓' : '—'}</td>
                      <td className="px-4 py-2.5 text-gray-400 text-sm">{a.uploaded_by ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-4 mt-4">
          <UploadFeedback sessionId={id} onDone={load} uploadedBy={uploadedBy} />

          {feedbackStats.total > 0 && (
            <>
              <FeedbackCharts stats={feedbackStats} />
              <div className="bg-white rounded-xl border p-5 space-y-4">
                <h3 className="font-semibold text-gray-700">Student Responses</h3>
                {feedback.filter((f) => f.favourite_part || f.additional_comments).map((f) => (
                  <div key={f.id} className="border-l-2 border-blue-200 pl-3 space-y-1">
                    <p className="text-xs text-gray-400">{f.student_name ?? 'Anonymous'} · {f.class ?? '—'}</p>
                    {f.favourite_part && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Favourite part:</span> {f.favourite_part}
                      </p>
                    )}
                    {f.additional_comments && (
                      <p className="text-sm text-gray-600 italic">{f.additional_comments}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-4 mt-4">
          <UploadMedia sessionId={id} onDone={load} uploadedBy={uploadedBy} />

          {images.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Photos ({images.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((m) => (
                  <div key={m.id} className="space-y-1">
                    <a href={m.file_url} target="_blank" rel="noreferrer">
                      <img
                        src={m.file_url}
                        alt={m.file_name}
                        className="rounded-lg aspect-square object-cover w-full hover:opacity-90 transition-opacity border"
                      />
                    </a>
                    {m.uploaded_by && <p className="text-xs text-gray-400 truncate">{m.uploaded_by}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {videos.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Video className="w-4 h-4" /> Videos ({videos.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {videos.map((m) => (
                  <div key={m.id} className="space-y-1">
                    <video src={m.file_url} controls className="rounded-lg w-full border" />
                    {m.uploaded_by && <p className="text-xs text-gray-400">{m.uploaded_by}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  )
}
