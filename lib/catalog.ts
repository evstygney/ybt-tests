import { getExercises } from "@/lib/data";
import { ExerciseConfig } from "@/lib/types";

export interface ExerciseCatalogItem {
  slug: string;
  enabled: boolean;
  order: number;
  week: number;
}

export function getBaseExercises(): ExerciseConfig[] {
  return getExercises();
}

export function mergeExercises(
  baseExercises: ExerciseConfig[],
  catalog: ExerciseCatalogItem[],
  overrides: ExerciseConfig[]
): ExerciseConfig[] {
  const overrideMap = new Map(overrides.map((item) => [item.slug, item]));
  const merged = baseExercises.map((exercise) => overrideMap.get(exercise.slug) ?? exercise);

  for (const override of overrides) {
    if (!merged.some((item) => item.slug === override.slug)) {
      merged.push(override);
    }
  }

  return merged
    .map((exercise) => {
      const catalogEntry = catalog.find((item) => item.slug === exercise.slug);
      return {
        ...exercise,
        week: catalogEntry?.week ?? exercise.week,
        _enabled: catalogEntry?.enabled ?? true,
        _order: catalogEntry?.order ?? exercise.week * 10
      };
    })
    .filter((exercise) => (exercise as ExerciseConfig & { _enabled: boolean })._enabled)
    .sort((left, right) => {
      const leftOrder = (left as ExerciseConfig & { _order: number })._order;
      const rightOrder = (right as ExerciseConfig & { _order: number })._order;
      return leftOrder - rightOrder;
    }) as ExerciseConfig[];
}
