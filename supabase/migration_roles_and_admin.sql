-- Migration script: Add USER + ADMIN role-based system, structured resume analysis, adaptive interview reports, and admin management tables

-- 1. Add role column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN role text NOT NULL DEFAULT 'user' 
        CHECK (role IN ('user', 'admin'));
    END IF;
END $$;

-- Index for quick role filtering
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);

-- 2. Resume Analysis Table (Structured extraction from resume text)
CREATE TABLE IF NOT EXISTS public.resume_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text,
  parsed_text text NOT NULL,
  summary text,
  skills text[] DEFAULT '{}',
  technologies text[] DEFAULT '{}',
  projects jsonb DEFAULT '[]'::jsonb,
  experience jsonb DEFAULT '[]'::jsonb,
  certifications text[] DEFAULT '{}',
  interview_topics text[] DEFAULT '{}',
  potential_weaknesses text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resume_analysis_user_id_idx ON public.resume_analysis (user_id);

-- 3. Interview Reports Table (Comprehensive performance breakdown)
CREATE TABLE IF NOT EXISTS public.interview_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  overall_score numeric(5,2) NOT NULL,
  technical_score numeric(5,2),
  communication_score numeric(5,2),
  depth_score numeric(5,2),
  resume_knowledge_score numeric(5,2),
  strengths text[] DEFAULT '{}',
  weaknesses text[] DEFAULT '{}',
  recommended_topics text[] DEFAULT '{}',
  summary_narrative text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS interview_reports_session_id_idx ON public.interview_reports (session_id);
CREATE INDEX IF NOT EXISTS interview_reports_user_id_idx ON public.interview_reports (user_id);

-- 4. Programs table (for learning program management)
CREATE TABLE IF NOT EXISTS public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  domain text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS programs_status_idx ON public.programs (status);

-- 5. Program Enrollments table
CREATE TABLE IF NOT EXISTS public.program_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs (id) ON DELETE CASCADE,
  progress numeric(5,2) NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'dropped')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, program_id)
);

CREATE INDEX IF NOT EXISTS program_enrollments_user_id_idx ON public.program_enrollments (user_id);

-- 6. Admin Audit Logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx ON public.admin_audit_logs (created_at DESC);

-- 7. Admin Notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  category text NOT NULL DEFAULT 'system' CHECK (category IN ('system', 'announcement', 'assessment', 'security')),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.resume_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies
CREATE POLICY "resume_analysis: owner read/write" ON public.resume_analysis
  FOR ALL USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "interview_reports: owner read/write" ON public.interview_reports
  FOR ALL USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "programs: read active" ON public.programs
  FOR SELECT USING (status = 'active' OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "programs: admin write" ON public.programs
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "program_enrollments: owner read/write" ON public.program_enrollments
  FOR ALL USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "admin_audit_logs: admin read" ON public.admin_audit_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "admin_notifications: admin read/write" ON public.admin_notifications
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));
