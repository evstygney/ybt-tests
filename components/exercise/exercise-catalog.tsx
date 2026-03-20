"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBaseExercises, mergeExercises } from "@/lib/catalog";
import {
  getAdminCatalog,
  getAllAdminOverrides,
  getProgress
} from "@/lib/storage/local-storage";
import { ExerciseConfig } from "@/lib/types";
import { formatFocus } from "@/lib/utils";

export function ExerciseCatalog() {
  const [exercises, setExercises] = useState<ExerciseConfig[]>(getBaseExercises());

  useEffect(() => {
    setExercises(
      mergeExercises(getBaseExercises(), getAdminCatalog(), getAllAdminOverrides())
    );
  }, []);

  const completed = exercises.filter((exercise) => Boolean(getProgress(exercise.slug)?.completedAt)).length;
  const percent = exercises.length ? Math.round((completed / exercises.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
      <section className="rounded-[36px] bg-[linear-gradient(135deg,#122023_0%,#31574f_50%,#c7b49b_140%)] p-8 text-white shadow-panel lg:p-12">
        <p className="text-xs uppercase tracking-[0.28em] text-white/60">PSYvIT School</p>
        <h1 className="mt-4 max-w-4xl font-serif text-4xl leading-tight md:text-6xl">
          Взрослая геймификация soft skills с отдельной ссылкой на каждый микротренажёр
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-white/75">
          Каждое упражнение живёт по собственному URL, может быть встроено в разные точки курса и использует общий движок, аналитику, no-code редактирование и хранение прогресса.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/admin" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink">
            Открыть админку
          </Link>
          <div className="rounded-full border border-white/20 px-6 py-3 text-sm text-white/80">
            Прогресс курса: {percent}% ({completed}/{exercises.length})
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {exercises.map((exercise) => {
          const progress = getProgress(exercise.slug);
          return (
            <article key={exercise.slug} className="rounded-[30px] border border-ink/8 bg-white p-6 shadow-panel">
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-full bg-mist px-3 py-2 text-xs uppercase tracking-[0.18em] text-pine/75">
                  Неделя {exercise.week}
                </span>
                <span className="text-xs text-ink/50">{exercise.duration_min} мин</span>
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-ink">{exercise.title}</h2>
              <p className="mt-3 text-sm leading-6 text-ink/68">{exercise.summary}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-ink/55">
                <span>{formatFocus(exercise.ybt_focus)}</span>
                <span>•</span>
                <span>{exercise.level}</span>
                <span>•</span>
                <span>{exercise.badge}</span>
              </div>
              <div className="mt-6 grid gap-3">
                <Link href={`/exercise/${exercise.slug}`} className="rounded-full bg-ink px-5 py-3 text-center text-sm font-semibold text-white">
                  Открыть упражнение
                </Link>
                <Link href={`/exercise/${exercise.slug}?embed=1`} className="rounded-full border border-ink/10 px-5 py-3 text-center text-sm font-semibold text-ink">
                  Embed-ссылка
                </Link>
              </div>
              {progress ? (
                <p className="mt-5 text-sm text-ink/58">Лучший балл: {progress.bestScore}. Серия: {progress.streak}.</p>
              ) : null}
            </article>
          );
        })}
      </section>
    </div>
  );
}
