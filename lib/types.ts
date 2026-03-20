export type YbtFocus = "Я" | "Бизнес" | "Команда";

export type ExerciseMode =
  | "quiz"
  | "builder"
  | "canvas"
  | "reflection"
  | "simulation"
  | "checkin";

export type StepKind =
  | "singleChoice"
  | "multiChoice"
  | "rating"
  | "text"
  | "sort"
  | "categorize"
  | "builder"
  | "canvas"
  | "checkin";

export interface StepOption {
  id: string;
  label: string;
  description?: string;
  tags?: string[];
  score?: number;
  metricEffects?: Record<string, number>;
  category?: string;
}

export interface ExerciseStep {
  id: string;
  kind: StepKind;
  title: string;
  description?: string;
  required?: boolean;
  minSelections?: number;
  maxSelections?: number;
  placeholder?: string;
  prompt?: string;
  options?: StepOption[];
  buckets?: string[];
  cards?: Array<{ id: string; label: string; correctBucket?: string }>;
  template?: string[];
  streakMode?: "checkin" | "checkout";
}

export interface ExerciseConfig {
  id: string;
  slug: string;
  title: string;
  goal: string;
  week: number;
  target_skill: string;
  ybt_focus: YbtFocus[];
  duration_min: number;
  mode: ExerciseMode;
  badge: string;
  level: "наблюдаю" | "пробую" | "применяю" | "веду других";
  summary: string;
  steps: ExerciseStep[];
  content: {
    intro: string;
    outro?: string;
    caseLabel?: string;
    metrics?: string[];
    ritualSet?: string[];
    exportTemplate?: string;
    [key: string]: unknown;
  };
  scoring: {
    base_points: number;
    bonus_points: number;
    penalty_points: number;
    completion_bonus?: number;
    metricWeights?: Record<string, number>;
  };
  feedback_rules: Array<{
    id: string;
    title: string;
    predicate: string;
    message: string;
    recommendation: string;
  }>;
  reflection_prompt: string;
  admin_editable_fields: string[];
  recommendation_48h: string;
  micro_experiment_prompt: string;
  week_theme: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface UserStepAnswer {
  stepId: string;
  value: string | string[] | Record<string, string> | number;
}

export interface ExerciseSessionResult {
  score: number;
  completed: boolean;
  competencyLevel: ExerciseConfig["level"];
  badge: string;
  reflectionPrompt: string;
  recommendation: string;
  "48hAction": string;
  weeklyExperiment: string;
  metrics: Record<string, number>;
  summary: string;
  commonErrors: string[];
  artifactText: string;
}

export interface ExerciseProgressRecord {
  slug: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  totalSessions: number;
  bestScore: number;
  latestScore: number;
  streak: number;
  answers: Record<string, UserStepAnswer["value"]>;
  lastArtifact?: string;
}

export interface AnalyticsEvent {
  type:
    | "started"
    | "completed"
    | "avg_time"
    | "drop_step"
    | "avg_score"
    | "common_errors"
    | "recommendation_hits";
  slug: string;
  at: string;
  payload: Record<string, unknown>;
}
