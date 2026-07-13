export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export type SubjectKind =
  | "physics"
  | "mathematics"
  | "chemistry"
  | "lab"
  | "language";

export type LearningMode =
  | "diagnostic"
  | "retrieval"
  | "worked-example"
  | "exercise"
  | "mixed-exam"
  | "error-review"
  | "debrief";

export type TopicPhase =
  | "diagnostic"
  | "guided"
  | "autonomous"
  | "exam-ready";

export type ErrorType =
  | "concept"
  | "modelisation"
  | "methode"
  | "algebre"
  | "signe-unite"
  | "lecture"
  | "rigueur"
  | "vitesse";

export interface Topic {
  id: string;
  name: string;
  mastery: number;
  calibrated: boolean;
  stabilityDays: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  phase: TopicPhase;
  lastReviewed: string | null;
  dueDate: string;
  repetitions: number;
  lapses: number;
  prerequisites?: string[];
}

export interface Resource {
  id: string;
  name: string;
  type: "poly" | "td" | "annale" | "livre" | "fiche";
  detail: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  shortName: string;
  kind: SubjectKind;
  color: string;
  semester: "S3" | "S4";
  priority: 1 | 2 | 3 | 4 | 5;
  examDate: string | null;
  topics: Topic[];
  resources: Resource[];
}

export interface DailyCheckIn {
  date: string;
  sleepHours: number;
  energy: EnergyLevel;
  focus: EnergyLevel;
  stress: EnergyLevel;
  availableMinutes: number;
}

export interface PlanTask {
  id: string;
  date: string;
  order: number;
  subjectId: string | null;
  topicId: string | null;
  title: string;
  subtitle: string;
  mode: LearningMode;
  durationMinutes: number;
  rationale: string;
  resource: string;
  intensity: "light" | "normal" | "deep";
  steps: string[];
  completed: boolean;
}

export interface SessionLog {
  id: string;
  taskId: string;
  subjectId: string | null;
  topicId: string | null;
  date: string;
  mode?: LearningMode;
  durationMinutes: number;
  score: number;
  confidence: EnergyLevel;
  hintsUsed: number;
  calibrationGap: number;
  errorTypes: ErrorType[];
  note: string;
}

export interface ErrorEntry {
  id: string;
  subjectId: string;
  topicId: string | null;
  createdAt: string;
  nextReview: string;
  type: ErrorType;
  title: string;
  cause: string;
  correction: string;
  prevention: string;
  recurrence: number;
  resolved: boolean;
}

export interface CalendarBlock {
  id: string;
  weekday: number;
  start: string;
  end: string;
  title: string;
  kind: "course" | "lab" | "personal" | "sport";
  subjectId?: string;
}

export interface UserProfile {
  firstName: string;
  track: string;
  objective: string;
  weeklyTargetHours: number;
  activePracticeTarget: number;
  semesterStart: string;
}

export interface AppState {
  version: 1;
  profile: UserProfile;
  subjects: Subject[];
  checkIn: DailyCheckIn;
  currentPlan: PlanTask[];
  logs: SessionLog[];
  errors: ErrorEntry[];
  calendar: CalendarBlock[];
  lastPlanDate: string;
}

export interface SessionResult {
  score: number;
  confidence: EnergyLevel;
  hintsUsed: number;
  errorTypes: ErrorType[];
  note: string;
  actualMinutes: number;
}

export interface PlannerCandidate {
  subject: Subject;
  topic: Topic;
  score: number;
  retention: number;
  examDays: number | null;
  mode: LearningMode;
}
