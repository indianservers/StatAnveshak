# Contributing

## Local Workflow

1. Install dependencies with `npm install`.
2. Run `npm run dev` for development.
3. Run `npm run lint`, `npm run build`, and `npm run test:e2e` before opening a pull request.

## Code Style

- Follow the existing React and TypeScript patterns.
- Keep route-level features in `src/pages` and reusable logic in `src/lib`.
- Keep UI controls accessible with labels, button text, or tooltips.
- Use local browser APIs for data workflows unless a feature explicitly requires a backend.

## Testing Expectations

- Add Playwright coverage for user-facing workflows.
- Add focused helper tests when a test runner is introduced for pure statistics and parsing code.
- Keep sample fixtures small enough for fast CI runs.

