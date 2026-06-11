-- Sessions Dashboard Schema
-- Run this in your Supabase SQL editor

-- Trainers (reusable across sessions)
create table trainers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  credentials text,
  bio text,
  photo_url text,
  created_at timestamptz default now()
);

-- Sessions
create table sessions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  school text not null,
  location text,
  topic text not null,
  topic_summary text,
  created_at timestamptz default now()
);

-- Link sessions to trainers (many-to-many)
create table session_trainers (
  session_id uuid references sessions(id) on delete cascade,
  trainer_id uuid references trainers(id) on delete cascade,
  primary key (session_id, trainer_id)
);

-- Attendance records (one row per student)
create table attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  student_name text not null,
  class text not null,
  has_signature boolean default false,
  created_at timestamptz default now()
);

-- Feedback records (one row per student form)
create table feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  student_name text,
  class text,
  understanding_level text check (understanding_level in ('still_confused', 'understand_basics', 'need_more_practice')),
  would_attend_more text check (would_attend_more in ('yes', 'maybe', 'no')),
  trainer_rating text check (trainer_rating in ('excellent', 'average', 'poor')),
  learned_something text check (learned_something in ('yes', 'not_much', 'no')),
  favourite_part text,
  additional_comments text,
  created_at timestamptz default now()
);

-- Media files (images + videos, stored in Supabase Storage)
create table media (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  type text not null check (type in ('image', 'video')),
  file_url text not null,
  file_name text not null,
  uploaded_at timestamptz default now()
);

-- Soft-delete / Trash (30-day retention). A non-null deleted_at means the row
-- is in the Trash: hidden from the app but recoverable until purged after 30 days.
alter table sessions  add column if not exists deleted_at timestamptz;
alter table trainers  add column if not exists deleted_at timestamptz;
alter table bootcamps add column if not exists deleted_at timestamptz;
alter table media     add column if not exists deleted_at timestamptz;

create index if not exists idx_sessions_deleted_at  on sessions(deleted_at);
create index if not exists idx_trainers_deleted_at  on trainers(deleted_at);
create index if not exists idx_bootcamps_deleted_at on bootcamps(deleted_at);
create index if not exists idx_media_deleted_at     on media(deleted_at);

-- Indexes for common queries
create index idx_attendance_session on attendance(session_id);
create index idx_attendance_class on attendance(class);
create index idx_feedback_session on feedback(session_id);
create index idx_media_session on media(session_id);
create index idx_sessions_date on sessions(date desc);

-- Storage buckets (run these separately in Supabase dashboard or via API)
-- Bucket: session-media (for images and videos)
-- Bucket: trainer-photos (for trainer profile photos)
