import {
  ExerciseConfig,
  ExerciseSessionResult,
  StepOption,
  UserStepAnswer
} from "@/lib/types";

function optionByValue(stepOptions: StepOption[] | undefined, value: string): StepOption | undefined {
  return stepOptions?.find((option) => option.id === value);
}

function getAnsweredCount(answers: Record<string, UserStepAnswer["value"]>): number {
  return Object.values(answers).filter((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === "object" && value !== null) {
      return Object.keys(value).length > 0;
    }

    return String(value ?? "").trim().length > 0;
  }).length;
}

function evaluatePredicate(
  predicate: string,
  context: {
    score: number;
    answers: Record<string, UserStepAnswer["value"]>;
    metrics: Record<string, number>;
    streak: number;
    answeredCount: number;
  }
): boolean {
  if (predicate.startsWith("score>")) {
    return context.score > Number(predicate.replace("score>", ""));
  }

  if (predicate.startsWith("metric:")) {
    const [metric, threshold] = predicate.replace("metric:", "").split(">");
    return (context.metrics[metric] ?? 0) > Number(threshold);
  }

  if (predicate.startsWith("textLength:")) {
    const [stepId, thresholdText] = predicate.replace("textLength:", "").split(">");
    const value = context.answers[stepId];
    return String(value ?? "").trim().length > Number(thresholdText);
  }

  if (predicate.startsWith("streak>")) {
    return context.streak > Number(predicate.replace("streak>", ""));
  }

  if (predicate.startsWith("answeredCount>")) {
    return context.answeredCount > Number(predicate.replace("answeredCount>", ""));
  }

  return false;
}

export function scoreExercise(
  config: ExerciseConfig,
  answers: Record<string, UserStepAnswer["value"]>,
  streak = 0
): ExerciseSessionResult {
  let score = config.scoring.base_points;
  const metrics: Record<string, number> = {};
  const commonErrors: string[] = [];

  for (const step of config.steps) {
    const value = answers[step.id];
    if (value === undefined || value === null || value === "") {
      continue;
    }

    if (typeof value === "string") {
      const option = optionByValue(step.options, value);
      if (option) {
        score += option.score ?? 0;
        for (const [metric, effect] of Object.entries(option.metricEffects ?? {})) {
          metrics[metric] = (metrics[metric] ?? 0) + effect;
        }
      } else {
        score += Math.min(String(value).trim().length / 8, config.scoring.bonus_points);
      }
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const option = optionByValue(step.options, item);
        score += option?.score ?? 0;
      }
    }

    if (typeof value === "number") {
      score += value;
    }

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const cards = step.cards ?? [];
      for (const [cardId, bucket] of Object.entries(value)) {
        const card = cards.find((entry) => entry.id === cardId);
        if (card?.correctBucket === bucket) {
          score += 5;
        } else {
          commonErrors.push(`Карточка "${card?.label ?? cardId}" помещена не в ту зону.`);
        }
      }
    }
  }

  if (getAnsweredCount(answers) === config.steps.length) {
    score += config.scoring.completion_bonus ?? 10;
  }

  for (const [metric, weight] of Object.entries(config.scoring.metricWeights ?? {})) {
    score += (metrics[metric] ?? 0) * weight;
  }

  score = Math.max(0, Math.round(score));

  const answeredCount = getAnsweredCount(answers);
  const firstMatchedRule = config.feedback_rules.find((rule) =>
    evaluatePredicate(rule.predicate, { score, answers, metrics, streak, answeredCount })
  );

  const artifactLines = config.steps.map((step) => {
    const value = answers[step.id];
    if (Array.isArray(value)) {
      return `${step.title}: ${value.join(", ")}`;
    }

    if (typeof value === "object" && value !== null) {
      return `${step.title}: ${Object.entries(value)
        .map(([key, bucket]) => `${key} -> ${bucket}`)
        .join("; ")}`;
    }

    return `${step.title}: ${String(value ?? "—")}`;
  });

  return {
    score,
    completed: answeredCount === config.steps.length,
    competencyLevel: config.level,
    badge: config.badge,
    reflectionPrompt: config.reflection_prompt,
    recommendation: firstMatchedRule?.recommendation ?? config.recommendation_48h,
    "48hAction": config.recommendation_48h,
    weeklyExperiment: config.micro_experiment_prompt,
    metrics,
    summary: firstMatchedRule?.message ?? config.summary,
    commonErrors,
    artifactText: [
      config.title,
      `Score: ${score}`,
      `Badge: ${config.badge}`,
      ...artifactLines,
      `Recommendation: ${firstMatchedRule?.recommendation ?? config.recommendation_48h}`
    ].join("\n")
  };
}
