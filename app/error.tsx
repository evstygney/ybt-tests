"use client";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body className="bg-mist">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-10">
          <div className="w-full rounded-[32px] border border-rust/20 bg-white p-8 shadow-panel">
            <p className="text-xs uppercase tracking-[0.2em] text-rust">Application error</p>
            <h1 className="mt-3 text-3xl font-semibold text-ink">Приложение столкнулось с ошибкой</h1>
            <p className="mt-4 text-sm leading-6 text-ink/70">{error.message}</p>
            <button
              type="button"
              onClick={() => reset()}
              className="mt-6 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
