export type Bootcamp = {
  id: string
  name: string
  description: string | null
  created_at: string
}

export type Trainer = {
  id: string
  name: string
  credentials: string | null
  bio: string | null
  photo_url: string | null
  created_at: string
}

export type Session = {
  id: string
  date: string
  school: string
  location: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  topic: string
  topic_summary: string | null
  bootcamp_id: string | null
  bootcamp?: Bootcamp | null
  created_at: string
  trainers?: Trainer[]
  attendance_count?: number
  feedback_count?: number
}

export type Attendance = {
  id: string
  session_id: string
  student_name: string
  class: string
  has_signature: boolean
  uploaded_by: string | null
  created_at: string
}

export type Feedback = {
  id: string
  session_id: string
  student_name: string | null
  class: string | null
  understanding_level: 'still_confused' | 'understand_basics' | 'need_more_practice' | null
  would_attend_more: 'yes' | 'maybe' | 'no' | null
  trainer_rating: 'excellent' | 'average' | 'poor' | null
  learned_something: 'yes' | 'not_much' | 'no' | null
  favourite_part: string | null
  additional_comments: string | null
  uploaded_by: string | null
  created_at: string
}

export type Media = {
  id: string
  session_id: string
  type: 'image' | 'video'
  file_url: string
  file_name: string
  uploaded_by: string | null
  uploaded_at: string
}

export type ClassCount = {
  class: string
  count: number
}

export type FeedbackStats = {
  understanding: { still_confused: number; understand_basics: number; need_more_practice: number }
  would_attend_more: { yes: number; maybe: number; no: number }
  trainer_rating: { excellent: number; average: number; poor: number }
  learned_something: { yes: number; not_much: number; no: number }
  total: number
}
