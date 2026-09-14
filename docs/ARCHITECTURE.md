# Architecture

StatAnveshak is a Vite React application that runs analysis entirely in the browser.

## Layers

- Routing: `src/App.tsx` declares lazy-loaded pages under `AppShell`.
- Layout: `src/components/layout` owns global navigation and top-level controls.
- State: `src/store/useStore.ts` holds active datasets, projects, charts, preferences, and hydrated IndexedDB data.
- Storage: `src/lib/storage.ts` wraps Dexie for datasets and projects.
- Analysis registry: `src/analysis/catalog.ts` is the canonical list of JASP modules. `runAnalysis(id, rows, options)` in `src/analysis/runAnalysis.ts` is the only math entry point. Frequentist and Bayesian are a toggle on the same analysis ID.
- Engines: `src/analysis/engines/frequentist/` and `src/analysis/engines/bayesian/` implement tables, plots, and footnotes. Learn Stats and Learn Bayes are UI shells over those engines.
- Golden tests: `src/analysis/golden/` is the numeric ship gate (`npm run test:unit`).
- Samples: `src/lib/sampleData.ts` creates built-in datasets for demos and teaching.
- Tests: `tests` contains Playwright browser checks.

## Persistence Model

Datasets and projects are saved to IndexedDB. Lightweight preferences are saved to localStorage. Startup hydration loads IndexedDB data into Zustand so refreshes do not leave the in-memory app empty.

## Privacy Model

Data import, analysis, and export happen locally. Any future server-backed feature should be visibly opt-in and documented in `docs/PRIVACY.md`.

