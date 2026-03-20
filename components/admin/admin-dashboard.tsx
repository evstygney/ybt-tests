"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buildAnalyticsSummary } from "@/lib/analytics";
import { getBaseExercises } from "@/lib/catalog";
import {
  getAdminCatalog,
  getAllAdminOverrides,
  getAnalytics,
  saveAdminCatalog
} from "@/lib/storage/local-storage";

export function AdminDashboard() {
  const baseExercises = getBaseExercises();
  const [catalog, setCatalog] = useState(
    baseExercises.map((exercise, index) => ({
      slug: exercise.slug,
      enabled: true,
      order: index + 1,
      week: exercise.week
    }))
  );
  const [analytics, setAnalytics] = useState(buildAnalyticsSummary([]));

  useEffect(() => {
    const stored = getAdminCatalog();
    const overrideSlugs = getAllAdminOverrides().map((item) => item.slug);
    setCatalog((current) => [
      ...current.map((item) => stored.find((storedItem) => storedItem.slug === item.slug) ?? item),
      ...overrideSlugs
        .filter((slug) => !current.some((item) => item.slug === slug))
        .map((slug, index) => ({
          slug,
          enabled: true,
          order: current.length + index + 1,
          week: 1
        }))
    ]);
    setAnalytics(buildAnalyticsSummary(getAnalytics()));
  }, []);

  function updateItem(slug: string, patch: Partial<(typeof catalog)[number]>) {
    const next = catalog.map((item) => (item.slug === slug ? { ...item, ...patch } : item));
    setCatalog(next);
    saveAdminCatalog(next);
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
      <section className="rounded-[32px] border border-ink/8 bg-white p-8 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-pine/70">Admin</p>
            <h1 className="mt-3 text-4xl font-serif text-ink">No-code редактор упражнений</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/68">
              Включайте и выключайте модули, меняйте порядок и неделю курса, переходите в визуальный редактор или работайте с raw JSON только при необходимости.
            </p>
          </div>
          <Link href="/" className="rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold text-ink">
            Назад к каталогу
          </Link>
        </div>
      </section>

      <section className="mt-8 rounded-[32px] border border-ink/8 bg-white p-8 shadow-panel">
        <h2 className="text-2xl font-semibold text-ink">Каталог модулей</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/8 text-ink/55">
                <th className="pb-3">Модуль</th>
                <th className="pb-3">Enabled</th>
                <th className="pb-3">Порядок</th>
                <th className="pb-3">Неделя</th>
                <th className="pb-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {catalog.map((item) => (
                <tr key={item.slug} className="border-b border-ink/5">
                  <td className="py-4 font-medium text-ink">{item.slug}</td>
                  <td className="py-4">
                    <input type="checkbox" checked={item.enabled} onChange={(event) => updateItem(item.slug, { enabled: event.target.checked })} />
                  </td>
                  <td className="py-4">
                    <input
                      type="number"
                      value={item.order}
                      onChange={(event) => updateItem(item.slug, { order: Number(event.target.value) || 1 })}
                      className="w-20 rounded-xl border border-ink/10 px-3 py-2"
                    />
                  </td>
                  <td className="py-4">
                    <input
                      type="number"
                      value={item.week}
                      onChange={(event) => updateItem(item.slug, { week: Number(event.target.value) || 1 })}
                      className="w-20 rounded-xl border border-ink/10 px-3 py-2"
                    />
                  </td>
                  <td className="py-4">
                    <Link href={`/admin/exercises/${item.slug}`} className="rounded-full border border-ink/10 px-4 py-2 text-xs font-semibold text-ink">
                      Редактировать
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-[32px] border border-ink/8 bg-white p-8 shadow-panel">
        <h2 className="text-2xl font-semibold text-ink">Аналитика по локальным событиям</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {analytics.map((item) => (
            <article key={item.slug} className="rounded-[24px] border border-ink/8 bg-mist/40 p-5">
              <h3 className="text-lg font-semibold text-ink">{item.slug}</h3>
              <p className="mt-3 text-sm text-ink/68">Started: {item.started}</p>
              <p className="mt-1 text-sm text-ink/68">Completed: {item.completed}</p>
              <p className="mt-1 text-sm text-ink/68">Avg score: {item.avgScore.toFixed(1)}</p>
              <p className="mt-1 text-sm text-ink/68">Avg time: {item.avgTimeSec.toFixed(1)}s</p>
              <p className="mt-1 text-sm text-ink/68">Recommendation hits: {item.recommendationHits}</p>
              {item.topDropStep ? <p className="mt-1 text-sm text-ink/68">Top drop step: {item.topDropStep}</p> : null}
              {item.commonErrors.length > 0 ? <p className="mt-3 text-sm text-rust">Ошибки: {item.commonErrors.join("; ")}</p> : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
