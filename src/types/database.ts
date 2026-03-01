export type UserRole = "admin" | "lecturer" | "student";
export type EnrollmentStatus = "pending_approval" | "approved" | "rejected";
export type AssessmentType = "quiz" | "assignment";

export interface Profile {
  id: string;
  full_name: string | null;
  id_number: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  code: string;
  description: string | null;
  nqf_level: number | null;
  credits: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  proof_of_payment_url: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
}

export interface ModuleProgress {
  id: string;
  enrollment_id: string;
  module_id: string;
  quiz_passed: boolean;
  assignment_passed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UnitCompletion {
  id: string;
  enrollment_id: string;
  unit_id: string;
  completed_at: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface QuizConfig {
  questions: QuizQuestion[];
}

export interface AssignmentConfig {
  instructions: string;
  max_score: number;
}

export interface Assessment {
  id: string;
  module_id: string;
  type: AssessmentType;
  title: string;
  config: QuizConfig | AssignmentConfig;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  assessment_id: string;
  enrollment_id: string;
  payload: { answers?: number[]; file_url?: string };
  score: number | null;
  feedback: string | null;
  graded_at: string | null;
  graded_by: string | null;
  created_at: string;
}

export interface Certificate {
  id: string;
  enrollment_id: string;
  certificate_number: string;
  issued_at: string;
  pdf_url: string | null;
}

export interface Payment {
  id: string;
  enrollment_id: string;
  proof_url: string | null;
  status: string | null;
  created_at: string;
}
