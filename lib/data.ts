import exercise01 from "@/data/exercises/exercise-01-route.json";
import exercise02 from "@/data/exercises/exercise-02-dialogue.json";
import exercise03 from "@/data/exercises/exercise-03-meeting.json";
import exercise04 from "@/data/exercises/exercise-04-conflict.json";
import exercise05 from "@/data/exercises/exercise-05-negotiation.json";
import exercise06 from "@/data/exercises/exercise-06-energy.json";
import exercise07 from "@/data/exercises/exercise-07-stop-doing.json";
import exercise08 from "@/data/exercises/exercise-08-self-care.json";
import exercise09 from "@/data/exercises/exercise-09-checkin.json";
import exercise10 from "@/data/exercises/exercise-10-responsibility.json";
import exercise11 from "@/data/exercises/exercise-11-safety.json";
import exercise12 from "@/data/exercises/exercise-12-canvas.json";
import { ExerciseConfig } from "@/lib/types";
import { validateExerciseConfig } from "@/lib/validation";

const sourceExercises = [
  exercise01,
  exercise02,
  exercise03,
  exercise04,
  exercise05,
  exercise06,
  exercise07,
  exercise08,
  exercise09,
  exercise10,
  exercise11,
  exercise12
] as ExerciseConfig[];

export function getExercises(): ExerciseConfig[] {
  return sourceExercises.map((config) => {
    const validation = validateExerciseConfig(config);
    if (!validation.valid) {
      throw new Error(
        `Конфиг ${config.slug} невалиден: ${validation.errors.join("; ")}`
      );
    }

    return config;
  });
}

export function getExerciseBySlug(slug: string): ExerciseConfig | undefined {
  return getExercises().find((exercise) => exercise.slug === slug);
}
