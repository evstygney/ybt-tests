"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExercisePlayer } from "@/components/exercise/exercise-player";
import { getBaseExercises } from "@/lib/catalog";
import { getAdminOverride, saveAdminOverride } from "@/lib/storage/local-storage";
import { ExerciseConfig } from "@/lib/types";
import { downloadText, toPrettyJson } from "@/lib/utils";
import { validateExerciseConfig } from "@/lib/validation";

interface AdminEditorProps {
  slug: string;
}

export function AdminEditor({ slug }: AdminEditorProps) {
  const base = getBaseExercises().find((item) => item.slug === slug);
  const [config, setConfig] = useState<ExerciseConfig | undefined>(base);
  const [rawOpen, setRawOpen] = useState(false);
  const [rawJson, setRawJson] = useState(base ? toPrettyJson(base) : "");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const override = getAdminOverride(slug);
    const initial = override ?? base;
    setConfig(initial);
    setRawJson(initial ? toPrettyJson(initial) : "");
  }, [slug, base]);

  if (!config) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-lg text-ink">Конфиг не найден.</p>
      </div>
    );
  }

  const validation = validateExerciseConfig(config);

  function saveCurrent(nextConfig: ExerciseConfig) {
    setConfig(nextConfig);
    setRawJson(toPrettyJson(nextConfig));
    saveAdminOverride(nextConfig);
    setStatus("Сохранено в localStorage.");
  }

  function duplicateTemplate() {
    const copySlug = `${config.slug}-copy`;
    const copy = {
      ...config,
      id: `${config.id}_copy`,
      slug: copySlug,
      title: `${config.title} (копия)`
    };
    saveCurrent(copy);
    setStatus(`Создана копия ${copySlug}.`);
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-pine/70">Admin editor</p>
          <h1 className="mt-3 text-4xl font-serif text-ink">{config.title}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin" className="rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold text-ink">
            К списку
          </Link>
          <Link href={`/exercise/${config.slug}`} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">
            Открыть модуль
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[30px] border border-ink/8 bg-white p-6 shadow-panel">
          <h2 className="text-2xl font-semibold text-ink">Визуальный редактор</h2>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm text-ink/64">Название</span>
              <input value={config.title} onChange={(event) => setConfig({ ...config, title: event.target.value })} className="rounded-2xl border border-ink/10 px-4 py-3" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm text-ink/64">Цель</span>
              <textarea value={config.goal} onChange={(event) => setConfig({ ...config, goal: event.target.value })} className="min-h-28 rounded-2xl border border-ink/10 px-4 py-3" />
            </label>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-sm text-ink/64">Неделя</span>
                <input type="number" value={config.week} onChange={(event) => setConfig({ ...config, week: Number(event.target.value) || 1 })} className="rounded-2xl border border-ink/10 px-4 py-3" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm text-ink/64">Бейдж</span>
                <input value={config.badge} onChange={(event) => setConfig({ ...config, badge: event.target.value })} className="rounded-2xl border border-ink/10 px-4 py-3" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm text-ink/64">Slug</span>
                <input value={config.slug} onChange={(event) => setConfig({ ...config, slug: event.target.value })} className="rounded-2xl border border-ink/10 px-4 py-3" />
              </label>
            </div>
            <label className="grid gap-2">
              <span className="text-sm text-ink/64">Рекомендация на 48 часов</span>
              <textarea value={config.recommendation_48h} onChange={(event) => setConfig({ ...config, recommendation_48h: event.target.value })} className="min-h-24 rounded-2xl border border-ink/10 px-4 py-3" />
            </label>
            <div className="flex flex-wrap gap-3 pt-2">
              <button type="button" onClick={() => saveCurrent(config)} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">
                Сохранить
              </button>
              <button type="button" onClick={() => downloadText(`${config.slug}.json`, toPrettyJson(config), "application/json")} className="rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold text-ink">
                Экспорт JSON
              </button>
              <button type="button" onClick={duplicateTemplate} className="rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold text-ink">
                Дублировать
              </button>
              <button type="button" onClick={() => setRawOpen((current) => !current)} className="rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold text-ink">
                {rawOpen ? "Скрыть JSON" : "Показать JSON"}
              </button>
            </div>
            {status ? <p className="text-sm text-pine">{status}</p> : null}
            {!validation.valid ? <div className="rounded-2xl border border-rust/20 bg-rust/5 px-4 py-4 text-sm text-rust">{validation.errors.join(" ")}</div> : null}
            {rawOpen ? (
              <div className="rounded-2xl border border-ink/10 bg-mist/35 p-4">
                <textarea value={rawJson} onChange={(event) => setRawJson(event.target.value)} className="min-h-[420px] w-full rounded-2xl border border-ink/10 bg-white px-4 py-4 font-mono text-xs" />
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        saveCurrent(JSON.parse(rawJson) as ExerciseConfig);
                      } catch {
                        setStatus("JSON не удалось распарсить.");
                      }
                    }}
                    className="rounded-full bg-pine px-5 py-3 text-sm font-semibold text-white"
                  >
                    Применить JSON
                  </button>
                  <label className="rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold text-ink">
                    Импорт JSON
                    <input
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) {
                          return;
                        }
                        setRawJson(await file.text());
                      }}
                    />
                  </label>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-[30px] border border-ink/8 bg-white p-3 shadow-panel">
          <div className="rounded-[24px] bg-mist/35 p-3">
            <p className="px-3 pt-2 text-xs uppercase tracking-[0.2em] text-pine/70">Preview</p>
            <ExercisePlayer slug={config.slug} embed previewConfig={config} />
          </div>
        </section>
      </div>
    </div>
  );
}
