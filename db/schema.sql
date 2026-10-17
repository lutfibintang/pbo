-- Jalankan di Supabase SQL Editor untuk proyek baru. Tidak menghapus data.
BEGIN;
CREATE TABLE IF NOT EXISTS public.students (
 user_id text PRIMARY KEY, nim text UNIQUE NOT NULL, name text NOT NULL,
 class_name text NOT NULL DEFAULT '', created_at text NOT NULL
);
CREATE TABLE IF NOT EXISTS public.assignments (
 user_id text PRIMARY KEY REFERENCES public.students(user_id),
 question_id integer UNIQUE NOT NULL CHECK(question_id BETWEEN 1 AND 40),
 started_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.student_sessions (
 token_hash text PRIMARY KEY, user_id text NOT NULL REFERENCES public.students(user_id), expires_at bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS public.submissions (
 id text PRIMARY KEY, seq bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
 user_id text NOT NULL REFERENCES public.students(user_id), question_id integer NOT NULL,
 code text NOT NULL, stdin text NOT NULL, status text NOT NULL, score integer,
 result text, created_at text NOT NULL, duration_seconds integer CHECK(duration_seconds>=0)
);
CREATE INDEX IF NOT EXISTS submissions_student_question ON public.submissions(user_id,question_id,seq);
CREATE TABLE IF NOT EXISTS public.login_limits (key text PRIMARY KEY, count integer NOT NULL, reset_at bigint NOT NULL);
-- Data hanya diakses backend lewat DATABASE_URL, bukan browser/anon key.
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_limits ENABLE ROW LEVEL SECURITY;
COMMIT;
