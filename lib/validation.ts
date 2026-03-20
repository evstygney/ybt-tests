import { ExerciseConfig, ValidationResult } from "@/lib/types";

const REQUIRED_TOP_LEVEL_KEYS: Array<keyof ExerciseConfig> = [
  "id",
  "slug",
  "title",
  "goal",
  "week",
  "target_skill",
  "ybt_focus",
  "duration_min",
  "mode",
  "badge",
  "level",
  "summary",
  "steps",
  "content",
  "scoring",
  "feedback_rules",
  "reflection_prompt",
  "admin_editable_fields",
  "recommendation_48h",
  "micro_experiment_prompt",
  "week_theme"
];

export function validateExerciseConfig(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== "object") {
    return { valid: false, errors: ["Конфиг не является объектом."] };
  }

  const config = input as Partial<ExerciseConfig>;
  for (const key of REQUIRED_TOP_LEVEL_KEYS) {
    if (config[key] === undefined || config[key] === null) {
      errors.push(`Отсутствует обязательное поле "${key}".`);
    }
  }

  if (!Array.isArray(config.steps) || config.steps.length === 0) {
    errors.push("Поле steps должно содержать хотя бы один шаг.");
  }

  if (
    !config.scoring ||
    typeof config.scoring.base_points !== "number" ||
    typeof config.scoring.bonus_points !== "number" ||
    typeof config.scoring.penalty_points !== "number"
  ) {
    errors.push("Секция scoring заполнена не полностью.");
  }

  if (!Array.isArray(config.feedback_rules)) {
    errors.push("feedback_rules должен быть массивом.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
