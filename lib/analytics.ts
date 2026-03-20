import { AnalyticsEvent } from "@/lib/types";

export interface ExerciseAnalyticsSummary {
  slug: string;
  started: number;
  completed: number;
  avgScore: number;
  avgTimeSec: number;
  commonErrors: string[];
  recommendationHits: number;
  topDropStep?: string;
}

export function buildAnalyticsSummary(events: AnalyticsEvent[]): ExerciseAnalyticsSummary[] {
  const grouped = new Map<string, AnalyticsEvent[]>();

  for (const event of events) {
    grouped.set(event.slug, [...(grouped.get(event.slug) ?? []), event]);
  }

  return [...grouped.entries()].map(([slug, slugEvents]) => {
    const started = slugEvents.filter((event) => event.type === "started").length;
    const completed = slugEvents.filter((event) => event.type === "completed").length;
    const scoreEvents = slugEvents.filter((event) => event.type === "avg_score");
    const timeEvents = slugEvents.filter((event) => event.type === "avg_time");
    const commonErrors = slugEvents
      .filter((event) => event.type === "common_errors")
      .flatMap((event) => (event.payload.errors as string[]) ?? []);
    const recommendationHits = slugEvents.filter(
      (event) => event.type === "recommendation_hits"
    ).length;
    const dropSteps = slugEvents
      .filter((event) => event.type === "drop_step")
      .map((event) => String(event.payload.title ?? event.payload.stepId ?? ""));
    const topDropStep =
      dropSteps.length > 0
        ? Object.entries(
            dropSteps.reduce<Record<string, number>>((acc, step) => {
              acc[step] = (acc[step] ?? 0) + 1;
              return acc;
            }, {})
          ).sort((left, right) => right[1] - left[1])[0]?.[0]
        : undefined;

    return {
      slug,
      started,
      completed,
      avgScore:
        scoreEvents.reduce((sum, event) => sum + Number(event.payload.score ?? 0), 0) /
          (scoreEvents.length || 1) || 0,
      avgTimeSec:
        timeEvents.reduce((sum, event) => sum + Number(event.payload.seconds ?? 0), 0) /
          (timeEvents.length || 1) || 0,
      commonErrors: [...new Set(commonErrors)].slice(0, 3),
      recommendationHits,
      topDropStep
    };
  });
}
