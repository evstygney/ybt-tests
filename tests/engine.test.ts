import { describe, expect, test } from "vitest";
import routeExercise from "@/data/exercises/exercise-01-route.json";
import dialogueExercise from "@/data/exercises/exercise-02-dialogue.json";
import { scoreExercise } from "@/lib/engine/scoring";
import { validateExerciseConfig } from "@/lib/validation";

describe("validation", () => {
  test("base exercise config is valid", () => {
    const result = validateExerciseConfig(routeExercise);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe("scoring", () => {
  test("scores text and options", () => {
    const result = scoreExercise(routeExercise, {
      role: "lead",
      pain_points: ["dialogue"],
      priority_skill: "communication",
      micro_goal: "На этой неделе я завершу минимум два сложных диалога явным owner и сроком.",
      deadline_strength: "5"
    });

    expect(result.score).toBeGreaterThan(50);
    expect(result.completed).toBe(true);
  });

  test("builds metric profile for simulation", () => {
    const result = scoreExercise(dialogueExercise, {
      opening: "balanced",
      assembly: ["Зафиксировать влияние на задачу", "Уточнить причину срыва", "Договориться о следующем шаге и владельце"],
      closing: "owner"
    });

    expect(result.metrics.clarity).toBeGreaterThan(0);
    expect(result.metrics.respect).toBeGreaterThan(0);
  });
});
