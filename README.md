# StatAnveshak

StatAnveshak is a browser-only statistics and data analytics workbench for teaching, exploratory analysis, statistical tests, distributions, reports, and reproducible local workflows.

## What It Does

- Imports CSV, TSV, Excel, and JSON files in the browser.
- Stores datasets and projects locally in IndexedDB.
- Provides schema detection, data preview, grid editing, cleaning, transformations, summaries, charts, correlations, frequency tables, inference tests, regression, distributions, and learning modules.
- Exports CSV, Excel, HTML, Markdown, Word-compatible reports, chart images, and analysis recipes.
- Keeps data on the user's device. No dataset is transmitted to a server by the app.

## Quick Start

```bash
npm install
npm run dev
```

Open the local Vite URL printed by the command.

## Scripts

```bash
npm run dev       # start local development server
npm run build     # type-check and produce production build
npm run lint      # run ESLint
npm run test:e2e  # run Playwright smoke tests
npm run preview   # preview production build
```

## Architecture

- `src/pages`: route-level screens.
- `src/components`: shared UI and layout components.
- `src/lib`: statistics, inference, distributions, storage, sample data, workbench helpers, and validation utilities.
- `src/store`: global Zustand state.
- `public`: static PWA assets and service worker.
- `tests`: Playwright end-to-end checks.

The app is intentionally client-side first. IndexedDB is used for persistence, Plotly and AG Grid power heavier UI surfaces, and statistics are computed with browser JavaScript libraries.

## Data Privacy

StatAnveshak processes imported data locally in the browser. Files are read with browser APIs, saved datasets are kept in IndexedDB, and exports are generated locally. If future network features are added, they should be opt-in and documented here before release.

## Browser Support

Use a modern Chromium, Firefox, or Safari browser with IndexedDB and WebAssembly support. Large datasets depend on available device memory.

## Development Notes

- Keep statistical helpers deterministic where possible.
- Prefer focused tests around import parsing, schema detection, statistical calculations, and export flows.
- Avoid adding server calls to dataset workflows unless the privacy model is explicitly changed.
- When adding heavy visualization or spreadsheet libraries, watch the production bundle report.

