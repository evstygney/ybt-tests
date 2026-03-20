import {
  AnalyticsEvent,
  ExerciseConfig,
  ExerciseProgressRecord,
  UserStepAnswer
} from "@/lib/types";
import { safeJsonParse } from "@/lib/utils";

const progressKey = (slug: string) => `psyvit:progress:${slug}`;
const analyticsKey = "psyvit:analytics";
const adminOverrideKey = (slug: string) => `psyvit:admin-override:${slug}`;
const adminCatalogKey = "psyvit:admin-catalog";
const adminSlugsKey = "psyvit:admin-slugs";

export function getProgress(slug: string): ExerciseProgressRecord | null {
  if (typeof window === "undefined") {
    return null;
  }

  return safeJsonParse<ExerciseProgressRecord | null>(
    window.localStorage.getItem(progressKey(slug)) ?? "null",
    null
  );
}

export function saveProgress(
  slug: string,
  answers: Record<string, UserStepAnswer["value"]>,
  score: number,
  completed: boolean,
  artifactText?: string
): ExerciseProgressRecord | null {
  if (typeof window === "undefined") {
    return null;
  }

  const existing = getProgress(slug);
  const now = new Date().toISOString();
  const streak = completed
    ? calculateStreak(existing?.completedAt, existing?.streak ?? 0)
    : existing?.streak ?? 0;
  const nextRecord: ExerciseProgressRecord = {
    slug,
    startedAt: existing?.startedAt ?? now,
    updatedAt: now,
    completedAt: completed ? now : existing?.completedAt,
    totalSessions: (existing?.totalSessions ?? 0) + 1,
    bestScore: Math.max(existing?.bestScore ?? 0, score),
    latestScore: score,
    streak,
    answers,
    lastArtifact: artifactText ?? existing?.lastArtifact
  };
  window.localStorage.setItem(progressKey(slug), JSON.stringify(nextRecord));
  return nextRecord;
}

function calculateStreak(lastCompletedAt: string | undefined, currentStreak: number): number {
  if (!lastCompletedAt) {
    return 1;
  }

  const last = new Date(lastCompletedAt);
  const diffDays = Math.round((Date.now() - last.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays <= 1) {
    return currentStreak + 1;
  }

  return 1;
}

export function getAnalytics(): AnalyticsEvent[] {
  if (typeof window === "undefined") {
    return [];
  }

  return safeJsonParse<AnalyticsEvent[]>(
    window.localStorage.getItem(analyticsKey) ?? "[]",
    []
  );
}

export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === "undefined") {
    return;
  }

  const events = getAnalytics();
  events.push(event);
  window.localStorage.setItem(analyticsKey, JSON.stringify(events));
}

export function saveAdminOverride(config: ExerciseConfig): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(adminOverrideKey(config.slug), JSON.stringify(config));
  const slugs = new Set<string>(
    safeJsonParse<string[]>(window.localStorage.getItem(adminSlugsKey) ?? "[]", [])
  );
  slugs.add(config.slug);
  window.localStorage.setItem(adminSlugsKey, JSON.stringify([...slugs]));
}

export function getAdminOverride(slug: string): ExerciseConfig | null {
  if (typeof window === "undefined") {
    return null;
  }

  return safeJsonParse<ExerciseConfig | null>(
    window.localStorage.getItem(adminOverrideKey(slug)) ?? "null",
    null
  );
}

export function saveAdminCatalog(
  items: Array<{ slug: string; enabled: boolean; order: number; week: number }>
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(adminCatalogKey, JSON.stringify(items));
}

export function getAdminCatalog(): Array<{
  slug: string;
  enabled: boolean;
  order: number;
  week: number;
}> {
  if (typeof window === "undefined") {
    return [];
  }

  return safeJsonParse(window.localStorage.getItem(adminCatalogKey) ?? "[]", []);
}

export function getAllAdminOverrides(): ExerciseConfig[] {
  if (typeof window === "undefined") {
    return [];
  }

  const slugs = safeJsonParse<string[]>(
    window.localStorage.getItem(adminSlugsKey) ?? "[]",
    []
  );
  return slugs
    .map((slug) => getAdminOverride(slug))
    .filter((item): item is ExerciseConfig => Boolean(item));
}
