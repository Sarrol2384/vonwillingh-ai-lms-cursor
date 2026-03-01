-- RLS policies for VonWillingh AI LMS

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role(uid UUID)
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = uid LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update own; admin can read/update all
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

-- Courses: all authenticated can read; lecturer/admin can insert/update/delete
CREATE POLICY "Authenticated can view courses" ON public.courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Lecturer and admin can manage courses" ON public.courses
  FOR ALL TO authenticated USING (
    public.get_user_role(auth.uid()) IN ('admin', 'lecturer')
  );

-- Modules: same as courses (follow course access)
CREATE POLICY "Authenticated can view modules" ON public.modules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Lecturer and admin can manage modules" ON public.modules
  FOR ALL TO authenticated USING (
    public.get_user_role(auth.uid()) IN ('admin', 'lecturer')
  );

-- Units: same
CREATE POLICY "Authenticated can view units" ON public.units
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Lecturer and admin can manage units" ON public.units
  FOR ALL TO authenticated USING (
    public.get_user_role(auth.uid()) IN ('admin', 'lecturer')
  );

-- Enrollments: students see own; admin/lecturer see all (or by course)
CREATE POLICY "Users can view own enrollments" ON public.enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own enrollment" ON public.enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin and lecturer can view all enrollments" ON public.enrollments
  FOR SELECT USING (
    public.get_user_role(auth.uid()) IN ('admin', 'lecturer')
  );

CREATE POLICY "Admin can update enrollments (approve/reject)" ON public.enrollments
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

-- Module progress: students see own; lecturers see for their courses
CREATE POLICY "Users can view own module progress" ON public.module_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = module_progress.enrollment_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert/update own module progress" ON public.module_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = module_progress.enrollment_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Lecturer and admin can view all module progress" ON public.module_progress
  FOR SELECT USING (
    public.get_user_role(auth.uid()) IN ('admin', 'lecturer')
  );

CREATE POLICY "System can update module progress (grading)" ON public.module_progress
  FOR UPDATE USING (
    public.get_user_role(auth.uid()) IN ('admin', 'lecturer')
  );

-- Unit completions: students see and manage own
CREATE POLICY "Users can view own unit completions" ON public.unit_completions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = unit_completions.enrollment_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own unit completions" ON public.unit_completions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = unit_completions.enrollment_id AND e.user_id = auth.uid()
    )
  );

-- Assessments: all authenticated read; lecturer/admin manage
CREATE POLICY "Authenticated can view assessments" ON public.assessments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Lecturer and admin can manage assessments" ON public.assessments
  FOR ALL TO authenticated USING (
    public.get_user_role(auth.uid()) IN ('admin', 'lecturer')
  );

-- Submissions: students see own; lecturer/admin see all and can grade
CREATE POLICY "Users can view own submissions" ON public.submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = submissions.enrollment_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own submissions" ON public.submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = submissions.enrollment_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Lecturer and admin can view all submissions" ON public.submissions
  FOR SELECT USING (
    public.get_user_role(auth.uid()) IN ('admin', 'lecturer')
  );

CREATE POLICY "Lecturer and admin can update submissions (grade)" ON public.submissions
  FOR UPDATE USING (
    public.get_user_role(auth.uid()) IN ('admin', 'lecturer')
  );

-- Certificates: students see own; public verify by certificate_number (see API)
CREATE POLICY "Users can view own certificates" ON public.certificates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = certificates.enrollment_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Lecturer and admin can manage certificates" ON public.certificates
  FOR ALL TO authenticated USING (
    public.get_user_role(auth.uid()) IN ('admin', 'lecturer')
  );

-- Payments: link to enrollments
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = payments.enrollment_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can view all payments" ON public.payments
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');
