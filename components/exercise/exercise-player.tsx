"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBaseExercises, mergeExercises } from "@/lib/catalog";
import { scoreExercise } from "@/lib/engine/scoring";
import {
  getAdminCatalog,
  getAllAdminOverrides,
  getProgress,
  saveProgress,
  trackEvent
} from "@/lib/storage/local-storage";
import { ExerciseConfig, UserStepAnswer } from "@/lib/types";
import { cn, downloadText, formatFocus, isNonEmptyText } from "@/lib/utils";
import { validateExerciseConfig } from "@/lib/validation";

interface ExercisePlayerProps {
  slug: string;
  embed?: boolean;
  previewConfig?: ExerciseConfig;
}

function resolveConfig(slug: string, previewConfig?: ExerciseConfig): ExerciseConfig | undefined {
  if (previewConfig) {
    return previewConfig;
  }

  return mergeExercises(getBaseExercises(), getAdminCatalog(), getAllAdminOverrides()).find(
    (item) => item.slug === slug
  );
}

export function ExercisePlayer({ slug, embed = false, previewConfig }: ExercisePlayerProps) {
  const [config, setConfig] = useState<ExerciseConfig | undefined>(previewConfig);
  const [answers, setAnswers] = useState<Record<string, UserStepAnswer["value"]>>({});
  const [startedAt, setStartedAt] = useState<number>(Date.now());
  const [resultOpen, setResultOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const nextConfig = resolveConfig(slug, previewConfig);
    setConfig(nextConfig);
    if (!nextConfig) {
      return;
    }

    const validation = validateExerciseConfig(nextConfig);
    setValidationErrors(validation.errors);
    const progress = getProgress(nextConfig.slug);
    setAnswers(progress?.answers ?? {});
    setStreak(progress?.streak ?? 0);
    setStartedAt(Date.now());
    trackEvent({
      type: "started",
      slug: nextConfig.slug,
      at: new Date().toISOString(),
      payload: { embed }
    });
  }, [slug, previewConfig, embed]);

  if (!config) {
    return (
      <div className="rounded-[28px] border border-rust/20 bg-white p-8 shadow-panel">
        <h2 className="text-2xl font-semibold text-ink">Упражнение не найдено</h2>
        <p className="mt-3 text-sm text-ink/70">
          Для этого slug нет базового конфига или локального override.
        </p>
      </div>
    );
  }

  const currentConfig = config;
  const result = scoreExercise(currentConfig, answers, streak);
  const completedCount = Object.values(answers).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / currentConfig.steps.length) * 100);

  function setAnswer(stepId: string, value: UserStepAnswer["value"]) {
    setAnswers((current) => ({ ...current, [stepId]: value }));
  }

  function submit() {
    setResultOpen(true);
    const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    const progress = saveProgress(
      currentConfig.slug,
      answers,
      result.score,
      result.completed,
      result.artifactText
    );
    setStreak(progress?.streak ?? streak);
    const firstIncomplete = currentConfig.steps.find((step) => !answers[step.id]);

    trackEvent({
      type: "completed",
      slug: currentConfig.slug,
      at: new Date().toISOString(),
      payload: { score: result.score, completed: result.completed }
    });
    trackEvent({
      type: "avg_score",
      slug: currentConfig.slug,
      at: new Date().toISOString(),
      payload: { score: result.score }
    });
    trackEvent({
      type: "avg_time",
      slug: currentConfig.slug,
      at: new Date().toISOString(),
      payload: { seconds }
    });
    trackEvent({
      type: "common_errors",
      slug: currentConfig.slug,
      at: new Date().toISOString(),
      payload: { errors: result.commonErrors }
    });
    trackEvent({
      type: "recommendation_hits",
      slug: currentConfig.slug,
      at: new Date().toISOString(),
      payload: { recommendation: result.recommendation }
    });
    if (firstIncomplete) {
      trackEvent({
        type: "drop_step",
        slug: currentConfig.slug,
        at: new Date().toISOString(),
        payload: { stepId: firstIncomplete.id, title: firstIncomplete.title }
      });
    }
  }

  return (
    <div className={cn("mx-auto w-full max-w-6xl", embed ? "py-4" : "py-10")}>
      <section className="overflow-hidden rounded-[36px] border border-white/60 bg-[linear-gradient(135deg,#f9fbf8_0%,#eef2ea_45%,#f6f1ea_100%)] shadow-panel">
        <div className={cn("grid gap-10", embed ? "p-6" : "p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10")}>
          <div>
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.24em] text-pine/70">
              <span>Неделя {currentConfig.week}</span>
              <span>{formatFocus(currentConfig.ybt_focus)}</span>
              <span>{currentConfig.duration_min} мин</span>
            </div>
            <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-ink md:text-5xl">
              {currentConfig.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink/72">{currentConfig.goal}</p>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-ink/64">{currentConfig.content.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-pine/20 bg-white/80 px-4 py-2 text-sm text-ink">
                Бейдж: {currentConfig.badge}
              </span>
              <span className="rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm text-ink">
                Уровень: {currentConfig.level}
              </span>
              {currentConfig.mode === "checkin" ? (
                <span className="rounded-full border border-rust/20 bg-rust/10 px-4 py-2 text-sm text-ink">
                  Серия: {streak} дней
                </span>
              ) : null}
            </div>
            {!embed ? (
              <div className="mt-8 flex flex-wrap gap-4 text-sm text-ink/66">
                <Link href="/" className="underline decoration-clay underline-offset-4">
                  Ко всем упражнениям
                </Link>
                <Link
                  href={`/exercise/${currentConfig.slug}?embed=1`}
                  className="underline decoration-clay underline-offset-4"
                >
                  Открыть embed-ссылку
                </Link>
              </div>
            ) : null}
          </div>

          <aside className="rounded-[28px] border border-ink/8 bg-white/90 p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink/60">Прогресс модуля</span>
              <span className="text-sm font-semibold text-ink">{progressPercent}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-mist">
              <div className="h-2 rounded-full bg-pine transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="mt-6 space-y-3">
              {currentConfig.steps.map((step, index) => (
                <div key={step.id} className="rounded-2xl border border-ink/8 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-ink">
                      {index + 1}. {step.title}
                    </p>
                    <span className="text-xs text-ink/50">{answers[step.id] ? "Готово" : "В работе"}</span>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {validationErrors.length > 0 ? (
        <section className="mt-6 rounded-[28px] border border-rust/20 bg-white p-6 shadow-panel">
          <h2 className="text-lg font-semibold text-ink">Конфиг требует внимания</h2>
          <ul className="mt-3 space-y-2 text-sm text-rust">
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8 space-y-5">
        {currentConfig.steps.map((step, index) => {
          const value = answers[step.id];

          return (
            <article key={step.id} className="rounded-[28px] border border-ink/8 bg-white p-6 shadow-panel">
              <span className="text-xs uppercase tracking-[0.2em] text-pine/70">Шаг {index + 1}</span>
              <h2 className="mt-2 text-2xl font-semibold text-ink">{step.title}</h2>

              {(step.kind === "singleChoice" || step.kind === "rating") && step.options ? (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {step.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setAnswer(step.id, option.id)}
                      className={cn(
                        "rounded-2xl border px-4 py-4 text-left transition",
                        value === option.id ? "border-pine bg-pine text-white" : "border-ink/10 bg-mist/50 hover:border-pine/40"
                      )}
                    >
                      <span className="block text-sm font-semibold">{option.label}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {step.kind === "multiChoice" && step.options ? (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {step.options.map((option) => {
                    const selected = Array.isArray(value) && value.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          const current = Array.isArray(value) ? value : [];
                          const next = selected ? current.filter((item) => item !== option.id) : [...current, option.id];
                          setAnswer(step.id, next);
                        }}
                        className={cn(
                          "rounded-2xl border px-4 py-4 text-left transition",
                          selected ? "border-pine bg-pine text-white" : "border-ink/10 bg-mist/50 hover:border-pine/40"
                        )}
                      >
                        <span className="block text-sm font-semibold">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {step.kind === "text" ? (
                <textarea
                  value={typeof value === "string" ? value : ""}
                  onChange={(event) => setAnswer(step.id, event.target.value)}
                  placeholder={step.placeholder}
                  className="mt-5 min-h-32 w-full rounded-2xl border border-ink/10 bg-mist/40 px-4 py-4 text-sm text-ink outline-none focus:border-pine"
                />
              ) : null}

              {step.kind === "builder" ? (
                <div className="mt-5 space-y-3">
                  {(step.template ?? []).map((block) => {
                    const current = Array.isArray(value) ? value : [];
                    const selected = current.includes(block);
                    return (
                      <button
                        key={block}
                        type="button"
                        onClick={() => setAnswer(step.id, selected ? current.filter((item) => item !== block) : [...current, block])}
                        className={cn(
                          "flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left",
                          selected ? "border-pine bg-pine/8" : "border-ink/10 bg-mist/40"
                        )}
                      >
                        <span className="text-sm font-medium text-ink">{block}</span>
                        <span className="text-xs text-ink/60">{selected ? "Добавлено" : "Добавить"}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {step.kind === "sort" && step.options ? (
                <div className="mt-5 space-y-3">
                  {(Array.isArray(value) ? value : step.options.map((item) => item.id)).map((optionId, currentIndex, current) => {
                    const option = step.options?.find((entry) => entry.id === optionId);
                    if (!option) {
                      return null;
                    }
                    return (
                      <div key={option.id} className="flex items-center justify-between rounded-2xl border border-ink/10 bg-mist/40 px-4 py-3">
                        <span className="text-sm text-ink">{currentIndex + 1}. {option.label}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...current];
                              if (currentIndex > 0) {
                                [next[currentIndex - 1], next[currentIndex]] = [next[currentIndex], next[currentIndex - 1]];
                              }
                              setAnswer(step.id, next);
                            }}
                            className="rounded-full border border-ink/10 px-3 py-1 text-xs text-ink/70"
                          >
                            Вверх
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...current];
                              if (currentIndex < next.length - 1) {
                                [next[currentIndex + 1], next[currentIndex]] = [next[currentIndex], next[currentIndex + 1]];
                              }
                              setAnswer(step.id, next);
                            }}
                            className="rounded-full border border-ink/10 px-3 py-1 text-xs text-ink/70"
                          >
                            Вниз
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {step.kind === "categorize" ? (
                <div className="mt-5 space-y-4">
                  {(step.cards ?? []).map((card) => {
                    const current: Record<string, string> =
                      typeof value === "object" && value !== null && !Array.isArray(value)
                        ? (value as Record<string, string>)
                        : {};
                    return (
                      <div key={card.id} className="rounded-2xl border border-ink/10 bg-mist/40 px-4 py-4">
                        <p className="text-sm font-medium text-ink">{card.label}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(step.buckets ?? []).map((bucket) => (
                            <button
                              key={bucket}
                              type="button"
                              onClick={() => setAnswer(step.id, { ...current, [card.id]: bucket })}
                              className={cn(
                                "rounded-full border px-3 py-2 text-xs",
                                current[card.id] === bucket ? "border-pine bg-pine text-white" : "border-ink/10 bg-white"
                              )}
                            >
                              {bucket}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </article>
          );
        })}
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button type="button" onClick={submit} className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-pine">
          Показать результат
        </button>
        <button
          type="button"
          onClick={() =>
            downloadText(
              `${currentConfig.slug}.json`,
              JSON.stringify(answers, null, 2),
              "application/json"
            )
          }
          className="rounded-full border border-ink/10 bg-white px-6 py-3 text-sm font-semibold text-ink"
        >
          Экспорт ответов
        </button>
      </div>

      {resultOpen ? (
        <section className="mt-8 rounded-[28px] border border-pine/15 bg-white p-7 shadow-panel">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[24px] bg-[linear-gradient(160deg,#122023_0%,#31574f_100%)] p-6 text-white">
              <p className="text-xs uppercase tracking-[0.25em] text-white/65">Результат</p>
              <p className="mt-4 text-5xl font-serif">{result.score}</p>
              <p className="mt-4 text-sm leading-6 text-white/75">{result.summary}</p>
              <div className="mt-6 space-y-2 text-sm text-white/80">
                <p>Уровень: {result.competencyLevel}</p>
                <p>Бейдж: {result.badge}</p>
                <p>Пройдено: {result.completed ? "Да" : "Частично"}</p>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-ink">Разбор и перенос в работу</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-ink/8 bg-mist/50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-pine/70">48 часов</p>
                  <p className="mt-2 text-sm leading-6 text-ink">{result["48hAction"]}</p>
                </div>
                <div className="rounded-2xl border border-ink/8 bg-mist/50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-pine/70">Микроэксперимент</p>
                  <p className="mt-2 text-sm leading-6 text-ink">{result.weeklyExperiment}</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-ink/8 bg-white px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-pine/70">Рефлексия</p>
                <p className="mt-2 text-sm leading-6 text-ink">{result.reflectionPrompt}</p>
              </div>
              {Object.keys(result.metrics).length > 0 ? (
                <div className="mt-4 rounded-2xl border border-ink/8 bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-pine/70">Профиль поведения</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {Object.entries(result.metrics).map(([metric, metricValue]) => (
                      <div key={metric} className="rounded-2xl bg-mist/50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.15em] text-ink/50">{metric}</p>
                        <p className="mt-1 text-lg font-semibold text-ink">{metricValue}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {result.commonErrors.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-rust/15 bg-rust/5 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-rust">Частые ошибки</p>
                  <ul className="mt-2 space-y-2 text-sm text-ink/75">
                    {result.commonErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => downloadText(`${currentConfig.slug}-result.txt`, result.artifactText)} className="rounded-full bg-pine px-5 py-3 text-sm font-semibold text-white">
                  Скачать результат
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadText(
                      `${currentConfig.slug}-result.html`,
                      `<html><body><pre>${result.artifactText}</pre></body></html>`,
                      "text/html"
                    )
                  }
                  className="rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink"
                >
                  Скачать HTML
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {!embed && isNonEmptyText(currentConfig.content.outro) ? (
        <p className="mt-8 text-sm leading-6 text-ink/60">{currentConfig.content.outro}</p>
      ) : null}
    </div>
  );
}
