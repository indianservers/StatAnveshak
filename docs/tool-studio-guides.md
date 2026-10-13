# Tool and studio guides

The collapsible **Guide · [method name]** panels contain method-specific purpose, required inputs, calculation steps, output interpretation, an example, and method limits. They are available before loading data, support keyboard disclosure, and use the existing light/dark theme.

Coverage:

- All 50 Tools Hub features.
- All 17 statistics studio landing pages and their 143 individual labs.
- All 70 analysis definitions in the analysis workspace and embedded analysis tools.
- All 32 distribution lessons, with distribution-specific assumptions and misuse guidance.
- All 7 computing modules, plus selected hash-function and collision-rule guidance.
- All 90 entries in the separate Stat Modules workspace, with its fixed algorithm settings and preview-only limits.

Algorithm selections update guidance for correlation methods, factor extraction, machine-learning algorithms, Welch/pooled t tests, logistic models, GLM families, preparation methods, and Bayesian branches. Bayesian ANOVA explicitly describes its first-factor-only implementation. Computing and ML guides identify demonstration-only methods and implementation approximations rather than implying unsupported execution.

Content lives in `src/lib/guides/`. `SpecificGuide` shares presentation only; it does not synthesize fallback teaching content. Unknown identifiers return no guide. Distribution content reuses the existing authored lessons and distribution-specific assumptions. Studio content is indexed by both studio and lab so similarly named labs retain their own explanations.

`guides.test.ts` checks complete coverage against the live catalogs and verifies selected algorithm changes. `specific-guides.spec.ts` checks every Hub feature and each studio's landing page and first lab in desktop/mobile browsers.
