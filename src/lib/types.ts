export type Tab = 'dashboard' | 'physical' | 'match' | 'archive';
export type AdminTab = 'admin-dashboard' | 'admin-analysis' | 'admin-manage' | 'admin-settings';
export type ReportType = 'physical' | 'match';
export type ReportStatus = 'pending' | 'approved' | 'rejected';

export type TechnicalMetric = { success: number; error: number };

export type CustomTestParam = {
  id: string;
  name: string;
  unit: string;
};

export type PhysicalIndicator = {
  id: string;
  name: string;
  unit: string;
  key: string;
};

export type Report = {
  id: string;
  report_type: ReportType;
  athlete_name: string;
  team_group?: string;
  report_date: string;
  readiness_score: number | null;
  status: ReportStatus;
  coach_notes: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export type PhysicalForm = {
  athleteName: string;
  date: string;
  heartRate: string;
  beepTest: string;
  shuttleRun: string;
  pushUp: string;
  sitUp: string;
  backUp: string;
  verticalJump: string;
  customValues: Record<string, string>;
};

export type MatchForm = {
  athleteName: string;
  date: string;
  metrics: Record<string, TechnicalMetric>;
  zones: number[];
};

export type CoachSettings = {
  id: string;
  coach_name: string;
  pin_hash: string;
  custom_params: CustomTestParam[];
  technique_targets: Record<string, number>;
  updated_at: string;
};

export type ViewMode = 'student' | 'admin';
