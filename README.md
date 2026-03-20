# PSYvIT Soft Skills Engine

Next.js-приложение с единым движком микротренажёров soft skills, 12 упражнениями по ТЗ, отдельными URL для каждого модуля и no-code админкой на `localStorage`.

## Что внутри

- `app/` — маршруты каталога, пользовательских упражнений и админки.
- `data/exercises/` — JSON-конфиги упражнений и JSON Schema.
- `components/exercise/` — универсальный player и каталог.
- `components/admin/` — dashboard, редактор, preview.
- `lib/engine/` — rule-based scoring.
- `lib/storage/` — локальное хранение прогресса, аналитики и admin overrides.
- `tests/` — smoke-тесты для validation/scoring.

## Основные маршруты

- `/` — каталог всех упражнений.
- `/exercise/[slug]` — отдельная ссылка на модуль.
- `/exercise/[slug]?embed=1` — встраиваемый режим без лишней навигации.
- `/admin` — no-code админка.
- `/admin/exercises/[slug]` — редактор конкретного упражнения.

## Возможности

- 12 seed-модулей по ТЗ.
- Отдельная ссылка на каждое упражнение.
- Rule-based scoring и единый экран результата.
- Геймификация взрослого типа: уровни, бейджи, рефлексия, микроэксперимент.
- Прогресс, streak и артефакты в `localStorage`.
- Локальная аналитика событий `started/completed/avg_time/avg_score/common_errors/recommendation_hits`.
- Импорт/экспорт JSON, preview, raw JSON mode.

## Запуск

Требуется Node.js 20+ и npm/pnpm. В текущем окружении Node.js не установлен, поэтому запуск здесь не проверен.

```bash
npm install
npm run dev
```

## GitHub Pages

Проект подготовлен под статический export и деплой на GitHub Pages через GitHub Actions.

- workflow: [.github/workflows/deploy-pages.yml](/C:/Users/evstygney/Documents/еще%20один%20проект/.github/workflows/deploy-pages.yml)
- export включён в [next.config.ts](/C:/Users/evstygney/Documents/еще%20один%20проект/next.config.ts)

Что нужно сделать в GitHub:

1. Запушить проект в репозиторий.
2. В `Settings -> Pages` выбрать `Source: GitHub Actions`.
3. Запушить в `main` или вручную запустить workflow `Deploy GitHub Pages`.

Важно:

- workflow по умолчанию считает, что сайт публикуется как project site и ставит `BASE_PATH=/${repo-name}`;
- если это user/organization site на корне домена, в workflow нужно заменить `BASE_PATH` на пустую строку;
- статически экспортируются базовые маршруты из seed-конфигов;
- новые slug, созданные только через локальную админку в браузере, автоматически в Pages не попадут, пока их не перенесут в `data/exercises/*.json`.

## Тесты

```bash
npm test
```

## Ограничения текущей версии

- Источник правды для progress и analytics — браузерный `localStorage`.
- Дублирование шаблона создаёт локальный override и отдельный slug без серверного бэкенда.
- PDF пока не генерируется отдельно; вместо этого есть export-friendly HTML.
- Для GitHub Pages новые маршруты должны существовать на этапе сборки; локальные copy-slug из админки не публикуются автоматически.
