# UIUpdate.md

Visual-teaching upgrade plan for StatAnveshak.

**Goal:** Rank 1st in visual teaching against Seeing Theory, StatKey, Art of Stat, GeoGebra Probability, and CODAP.

**Current gap (Sep 2026 comparison):** StatAnveshak scored about **6.5 / 10** on visual pedagogy and **6th / 8** on the visual-teaching lens. Seeing Theory is ~**10 / 10** because it is a six-chapter, D3-crafted *story*, not a dashboard of Plotly widgets. StatAnveshak already wins breadth and local analysis. This document is how to keep that workbench and still *feel* like Seeing Theory.

Do not treat this as “add more cards.” Every change below is meant to make a statistical idea **visible, playable, and narrated in under 10 seconds**.

---

## 1. What “1st in visual teaching” requires

A first-place visual stats tool does five things at once:

1. **One idea per screen.** Seeing Theory never asks the learner to pick among 30 nav items.
2. **The graphic *is* the lesson.** Coins flip, sampling distributions grow, Bayes trees fill. Sliders exist, but they move *objects*, not just a Plotly trace.
3. **Cause and effect is instant.** Drag `n`, watch the sampling cloud tighten. No “Run” as the primary gesture.
4. **Words sit on the picture.** One sentence of intuition, one formula, one “what breaks this.”
5. **The same visual language everywhere.** Color, motion, and controls mean the same thing in Learn, Syllabus, Distributions, Inference, and Stat Modules.

If a module only shows numbers + a static chart, it cannot rank first, no matter how many tests it computes.

### Target scores after this plan

| Aspect | Now | Target |
|---|---|---|
| Visual pedagogy | 6.5 | 9.5+ |
| Interactive labs | 7.0 | 9.5 |
| UI / first-run UX | 6.5 | 9.0 |
| Charts (exploratory + teaching) | 7.0 | 8.5 |
| Classroom workflow | 7.5 | 8.5 |

---

## 2. Shared visual system (apply to every module)

Ship one `VisualLesson` shell. Every teaching surface must use it. No one-off layouts.

### 2.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Lesson title · 1-line intuition · dataset chip             │
├──────────────────────────────┬──────────────────────────────┤
│                              │ Controls (right, 280–320px) │
│   Stage (60–70% of width)    │ • 3–6 live controls max      │
│   Full-bleed visual, not a   │ • Immediate effect           │
│   card inside a card         │ • “What this changes” copy   │
│                              │ • Reset · Slow-mo · Narrate  │
├──────────────────────────────┴──────────────────────────────┤
│ Caption strip: formula (KaTeX) · readout · “if you break it” │
└─────────────────────────────────────────────────────────────┘
```

Rules:

- **Stage first.** The visual occupies the first viewport. Sidebars, metric grids, and “5 enhancements” cards go below the fold or behind a `Details` disclosure.
- **No nested scroll traps.** One page scroll. The stage height is `min(62vh, 560px)` on desktop, full width on mobile.
- **Workbench chrome hides in Learner mode.** Analysis nav is a single “Open analysis” door, not 30 destinations.

### 2.2 Motion language

| Event | Motion | Duration |
|---|---|---|
| New sample / coin / draw | Object appears or moves into a bin | 180–280 ms |
| Parameter drag | Curve/bars interpolate; no jump-cut | 80–120 ms |
| Sampling distribution build | Points accumulate; histogram morphs | Continuous |
| Reject / fail H0 | Decision band lights; sample marker slides | 300 ms |
| Reset | Reverse to initial scene | 250 ms |

Use D3 / Canvas / WebGL for particle labs. Keep Plotly for *data* charts (scatter, heatmap, regression diagnostics). Do not use Plotly as the CLT or Bayes explainer.

### 2.3 Color language (fixed)

| Meaning | Use |
|---|---|
| Population / truth | Slate |
| Sample / one draw | Indigo |
| Sampling distribution of a statistic | Violet |
| Success / reject H0 / event | Emerald |
| Failure / fail to reject / warning | Amber |
| Invalid assumption / misuse | Rose |
| Observed data overlay | Green dashed or rug |

Colorblind-safe palette is required (`Colorblind-safe` already exists on Charts). Never encode the lesson in hue alone; use shape + motion.

### 2.4 Control rules

Every control must answer: **what object on stage moves?**

| Control type | When to use | Anti-pattern |
|---|---|---|
| Slider | Continuous param (`μ`, `σ`, `n`, `p`) | Slider for a 2-option choice |
| Stepper + play | Discrete counts, sample size | Tiny unlabeled range input |
| Toggle | Density vs CDF, with/without replacement | 4 radio groups for one idea |
| Drag on the stage | Mean, threshold, CI bound | Only form fields |
| Scrubber | Time / trials / bootstrap iteration | “Run 1000” with no replay |
| Slow-mo | First 20 draws of any Monte Carlo | Instant 10k draws as default |

Defaults:

- Max **6** live controls on a lesson stage.
- Every slider shows **current value, unit, and a one-line effect**.
- `Play` is the default for sampling labs, not `Run` buried in a toolbar.
- `Reset` always restores the *story*, not just numeric defaults.
- Keyboard: `Space` play/pause, `←/→` step, `R` reset. Document this in a small `?` popover.

### 2.5 Copy rules

On-stage copy is three lines, always:

1. **Intuition** (plain language).
2. **Formula** (KaTeX, not a screenshot of a PDF).
3. **Misuse** (what this visual is *not*).

Long theorem text, proofs, APA wording, and 5-card “depth” grids move to `Learn more`.

### 2.6 Learner / Analyst modes

| Mode | Nav | Default dataset | Success |
|---|---|---|---|
| **Learn** | 6 chapters only | Built-in teaching sets auto-loaded | Finish a chapter without opening Upload |
| **Analyze** | Full current IA | User or sample data | Run a test and export |

Toggle lives in the top bar: `Learn` | `Analyze`. Persist in `localStorage`. First visit opens **Learn**.

### 2.7 Six-chapter map (Learner home)

Replace the current “30-link sidebar + theorem list” first impression with Seeing Theory’s information architecture:

1. **Chance** — coins, sample space, expectation, variance.
2. **Compound probability** — sets, counting, Bayes tree.
3. **Distributions** — discrete vs continuous, named families, CLT.
4. **Frequentist inference** — sampling distribution, point/interval, bootstrap.
5. **Bayesian inference** — prior → likelihood → posterior.
6. **Regression** — scatter, residual, OLS, correlation vs causation.

Every existing lab, syllabus module, and distribution studio **maps into a chapter**. The analysis workbench remains, behind `Analyze`.

---

## 3. App shell, Home, Projects, Settings

### Home

**Now:** Overview / Datasets / Guided / Recent, many action cards.

**Change:**

- First screen in Learn mode is the **six-chapter gallery**, large visual tiles (not icon+text cards).
- Hover/click a chapter: 2-second looping preview of that chapter’s hero lab (CLT coins, Bayes tree, OLS line).
- Guided Analysis stays, but as “What do you want to know?” with four visual questions, not method names.
- Auto-load **Student Marks** (already started). Show a chip: `Teaching dataset · Student Marks · 100 rows`. One click to swap sample.

**Controls:** Chapter tiles, dataset chip, mode toggle. Remove competing CTAs (Import / Explore / Run a Test) from the first viewport in Learn mode.

### Projects

Keep for Analyze mode. In Learn mode, Projects is “My lessons”: saved lab states, not empty folders.

### Solver

**Now:** Spreadsheet-like exam solver (Pearson, index numbers, SD). Useful, not visual.

**Change:**

- Dual pane: **worked numbers** (keep) + **geometry of the formula**.
- Pearson: live scatter; each row is a point; mean lines; product-of-deviations as rectangles (positive indigo, negative rose).
- SD: dots on a number line; mean as a fulcrum; squared deviations as growing squares.
- Index numbers: stacked bars for price/qty years, not only a table.
- Controls: load a 25-example preset, **scrub which row is highlighted**, show/hide formula overlay.

### Settings

Add **Motion: full / reduced**, **Learner default chapter**, **Colorblind palette**, **Caption size**. Respect `prefers-reduced-motion`.

### Documentation / Sitemap

Learner mode: hide sitemap from primary nav. Keep it for SEO and Analyze.

---

## 4. Data modules

Visual teaching rank is not won on upload UX, but empty or broken data pages kill trust. These pages must *show data as a picture* the moment a sample loads.

### Upload

- Sample library as **visual cards**: mini histogram + 1 teaching task, not only tags.
- Primary button: `Open and see it` (goes to Preview with a sparkline already drawn).
- Multi-file queue stays, below the fold.

### Preview

- Linked highlighting: hover a row → point highlights on a default scatter/histogram.
- Schema chips: numeric / categorical as colored tokens; click a numeric column to pin it as the “teaching variable.”

### Data Grid

- Keep AG Grid. Add a **column histogram header** (tiny bar under each numeric header).
- Selection in grid brushes Preview/Charts (CODAP-style). This is a rank-1 differentiator vs Seeing Theory.

### Clean & Transform

- Before/after **paired histograms** for every transform (log, z-score, impute).
- Formula column: live preview of the new column’s shape, not only first rows.

### Stats Workbench

- Recommendation list must show a **thumbnail of the suggested visual**, not only text.

### Query Workbench

- Query result always opens with an auto-chart of the result set.
- Empty SQL still offers “Show me study_hours vs total” chips that write the query *and* the chart.

---

## 5. Explore modules

These should feel like CODAP, not Excel charts.

### Summary Stats

- Every statistic is a **handle on the picture**: drag the mean on a dotplot; SD bands breathe; median is a different glyph.
- Controls: column picker, `Show mean/median/mode`, `Show outliers`, `Split by` (one categorical).
- Caption: “Mean is the balance point. Median is the middle item.”

### Charts

- Default is **dotplot / histogram of the teaching variable**, not an empty type picker.
- Add **linked brushing** with Grid and Correlation.
- Type picker: histogram, bar, scatter, box, line, violin (keep) + **dotplot** and **beeswarm** (teaching-first).
- Annotation tool stays; add “explain this chart” one-liner generated from the selection.

### Correlation

- Scatter is the stage. `r` is a **live ellipse** plus a numeric readout.
- Controls: X, Y, color, `Show least-squares line`, `Show residual stalks` (vertical drops), `Shuffle Y` (destroys r — this is the lesson).
- Misuse caption: “Association is not causation.”

### Frequency

- Animated bar growth from counts.
- Mosaic / spine plot for two categoricals (better teaching than pie).
- Controls: one or two categoricals, `Show percent vs count`, `Sort by frequency`.

---

## 6. Distributions studio (all 24)

**Now:** Explore / Learn / Simulate / Fit, lots of cards, Plotly/SVG mix, parameter forms. Strong content, weak *theatre*.

**Shared studio chrome:**

- Left: compact family list (Discrete / Continuous / Multivariate / Data-first), not a long dump.
- Stage is the distribution visual (see per-family below).
- Right: **only the parameters that change the picture**, plus `n` for simulation.
- Modes become **stage tools**, not page tabs that reset attention:
  - `Shape` (density/PMF)
  - `Area` (shade probability)
  - `Quantile` (inverse)
  - `Draw` (animate samples)
  - `Fit` (overlay data)

**Global distribution controls:**

| Control | Binding |
|---|---|
| Parameter sliders | Morph the curve / bars |
| Shade handles on the axis | Left / between / right probability |
| `n` + Play | Falling samples onto a rug, then histogram |
| Overlay data | Green rug + translucent histogram |
| Compare | Second ghost curve (e.g. Normal vs t) |

### Discrete family

**Bernoulli.** Two large blocks (0 / 1). Slider `p` reallocates width. Coin flip Play. Caption: one trial, two outcomes.

**Binomial.** Trial grid (keep) + live PMF bars. Controls: `n`, `p`. Play: fill grid then drop the count `X` onto the PMF. Show `np` marker.

**Geometric.** Sequence of F…FS. Slider `p`. Play: repeat until first S; stack waiting times into a PMF.

**Negative binomial.** Same as geometric but stop at `r` successes. Control `r` as a counter of S chips.

**Hypergeometric.** Urn of N balls (K gold). Draw `n` without replacement. Balls physically leave the urn. Contrast toggle: “with replacement (Binomial).”

**Poisson.** Timeline of ticks in a window. `λ` changes tick rate. Count per window feeds the PMF. Caption: mean = variance.

**Discrete uniform.** Fair die / spinner. Controls `a`, `b`. Every face equal. Contrast: loaded die (unequal bars) as misuse.

### Continuous family

**Uniform (continuous).** Rectangle area. Drag interval `[c, d]` on the rectangle; area *is* probability.

**Normal / Standard Normal.** Bell as an area. Drag `μ` (slides), `σ` (stretches). Shade via handles. z-score converter **on the axis**, not a side form. Empirical 68–95–99.7 bands as optional overlay.

**Lognormal.** Dual stage: original (skew) vs log scale (bell). Toggle `Show log scale`. Caption: multiplicative growth.

**Exponential.** Waiting-time clock. `λ` as rate. Memoryless demo: pause at time t, remaining wait has the same shape.

**Gamma.** Water filling a tank of `shape` exponential waits. Shape slider adds “events until stop.”

**Beta.** Unit interval. `α`, `β` as two stacks of prior chips. Bayesian update: add success/failure chips, watch the curve.

**Chi-square.** Sum of `df` squared z-draws, visualized as squares. Increase `df`, watch skew fade.

**Student t.** Overlay vs Normal. `df` slider: tails shrink toward Normal. Caption: unknown σ.

**F.** Two variance piles (numerator / denominator). Ratio as a see-saw. `df1`, `df2`.

**Weibull.** Hazard as a slope: decreasing / flat / increasing. Shape `<1`, `=1`, `>1` with a reliability timeline of failures.

**Pareto.** Stack of wealth bars; few bars dominate. `α` thinner tail vs heavier. Caption: mean may not exist.

**Cauchy.** Running mean of samples that **does not settle** vs Normal that does. This is the whole lesson.

**Logistic.** S-shaped CDF as the primary visual (density secondary). Location / scale drag on the S-curve.

### Multivariate / data-first

**Multinomial.** Ternary or stacked counts. `n` trials drop into 3 bins. `p1`, `p2` sliders; `p3` fills remainder.

**Dirichlet.** Ternary simplex (keep) but **samples** as moving dots, concentration `α0` pulls toward center.

**Empirical.** Data-only: histogram, ECDF, box, violin (keep). Fit mode ranks candidate curves with a live overlay. Never invent a theoretical curve when empty; auto-use Student Marks.

---

## 7. Inference, Regression, Advanced

### Inference Tests

**Now:** Dropdown of 4 tests, numeric result, assumption bullets.

**Change to StatKey-class:**

- **Sampling-distribution stage** is default. Population as a wide dotplot; each Play draws a sample; the statistic falls into a growing sampling distribution below (two-row visual).
- Controls: test type, column(s), `μ0` / hypothesized value as a **draggable fence**, `α` as shaded tail area, `n` (resample from the column).
- One-sample t: sample mean as a triangle sliding on the axis; t-distribution overlay; p-value as **tail area**, not only a number.
- Two-sample t: two colored groups; mean gap is a bar between them; shuffle/permutation sibling.
- Chi-square GOF: observed vs expected **bars that morph**, Pearson residuals as color.
- CI: interval as a **segment that traps μ or misses**; Play 100 intervals (coverage demo). This single demo is how StatKey wins labs.

**Readout:** `decision`, `p`, `CI`, `effect size` as four chips under the stage, not a wall of text.

### Regression

- Stage: scatter + movable line. **Drag the line**; SSE as residual squares (Seeing Theory OLS). Then “Fit OLS” snaps to the minimum.
- Controls: X, Y, `Show residuals`, `Show confidence band`, `Show prediction band`, `Influence: leave-one-out` (click a point, line jumps).
- Caption: “Line minimizes squared vertical misses.”

### Advanced Analysis

Whatever lives here (PCA, clustering, time series) must follow the same stage+controls pattern:

- PCA: points in 2D, principal axes as draggable; variance explained as axis length.
- Clustering: points colored live as k changes (`k` stepper).
- Time series: series + animated forecast fan, not only AR(1) metrics.

---

## 8. Core Statistics (`/learn`) — 12 labs

These labs are the direct Seeing Theory competitors. They must be rebuilt as hero canvases.

| Lab | Stage | Controls | UX notes |
|---|---|---|---|
| **Bayes** | Tree or area-proportional boxes (base rate vs hits) | Prior, sensitivity, false-positive; Play one test | Base-rate neglect caption |
| **CLT** | Population shape picker + sample means pile | Population (skew/uniform/bimodal), `n`, Play | Show “n = 2, 5, 30” presets |
| **LLN** | Running mean vs true μ | `n` growth, distribution | Mean path, not only a number |
| **Sampling** | Population → sample window | `n`, with/without replacement | Animate which dots are drawn |
| **Type I / II** | Two overlapping distributions, α slider | H0/H1 means, σ, α, n | Power as a shaded H1 tail |
| **CI** | Many intervals vs μ | Confidence %, n, Play 100 | Coverage % live counter |
| **Bootstrap** | Resample with replacement, statistic histogram | `B`, statistic (mean/median) | Highlight one resample in the data |
| **Permutation** | Shuffle group labels | Observed gap freeze, Play shuffles | Observed line on null histogram |
| **ANOVA** | Group boxes + between/within arrows | Groups, Play | Between vs within as two stacked variances |
| **MLE** | Likelihood hill, sample on axis | Parameter walk, or “climb” | Likelihood as a landscape, not a formula only |
| **Bayesian (advanced)** | Prior curve → posterior | Prior params, data n, successes | Same visual as Beta distribution studio |
| **Regression** | Same residual-squares OLS as Regression page | — | One shared component |

**Theorem list (Bayes, CLT, LLN, Chebyshev, Markov, Slutsky, Neyman–Pearson, MLE):** keep as a **drawer** on the matching lab, not the home of Learn.

---

## 9. Professional Learning

Keep Paths / Practice / Wizard / Assumptions / Formulas / Instructor.

Visual upgrades:

- **Paths:** each step is a mini-preview of the lab, not a text checklist.
- **Practice:** after an MCQ, show the *picture* that justifies the answer (e.g. p-value tail).
- **Decision Wizard:** flowchart that **lights a path** as the user picks goal / shape / design; recommended test opens the matching visual, not a string name.
- **Assumptions:** traffic-light chips **on the chart** (skew, n, expected counts).
- Expand practice bank later; for rank-1 visual, quality of explanation pictures > item count.

---

## 10. Syllabus modules (all 28)

Each syllabus topic becomes a `VisualLesson`. Stop shipping “kit: calculator + teaching guide” as the product. The kit is the stage.

### Probability Foundations

| Module | Visual | Controls |
|---|---|---|
| Sample Spaces & Events | Venn / outcome grid | Toggle A, B, A∪B, A∩B, complement |
| Conditional & Bayes | Area boxes + tree | Prior, P(B\|A), P(B\|Aᶜ) |
| Counting | Objects arranging into slots | n, r, with/without order, replacement |
| Distribution Explorer | Deep-link into Distributions studio | Family filter |
| Joint / Marginal / Conditional | 2D heat table; row/column highlight is the conditional | Row, column, “condition on” |
| Random Variable Simulator | Spinner + live PMF/PDF | Discrete vs continuous toggle |

### Probability Labs

| Module | Visual | Controls |
|---|---|---|
| LLN | Running mean | n, Play |
| CLT | Means pile | Population, n |
| Bayesian inference | Prior/posterior morph | Prior, data |
| Markov chains | Node graph, walker | P matrix cells as sliders, steps |
| Poisson process | Random dots on a timeline | λ, window |
| Monte Carlo | Estimator vs truth, error vs n | n, Play |

### Inference & Resampling

| Module | Visual | Controls |
|---|---|---|
| Bootstrap lab | Resample + statistic histogram | B, statistic |
| Permutation tests | Shuffle + null | Observed lock, Play |
| Resampling vs parametric | Split stage: t-curve vs bootstrap | Same data, both methods |

### Design & Experimentation

| Module | Visual | Controls |
|---|---|---|
| Experimental design | Units assigned to treatment/control | Randomize button, blocking toggle |
| A/B testing | Two conversion funnels + CI for difference | n, baseline p, lift |
| Survival | KM steps that drop at events | Time, event, group |

### Modeling & Validation

| Module | Visual | Controls |
|---|---|---|
| Advanced time series | Series + seasonal overlay | Period, Play forecast |
| Multivariate | PCA/biplot or pair plot | Variables, k |
| Model selection | Train/test error vs complexity | Degree / λ |

### Data Quality

| Module | Visual | Controls |
|---|---|---|
| Missing data | Grid with holes; impute morph | Mechanism (MCAR/MAR), method |
| Outlier & influence | Scatter; click point, Cook’s distance bar | Residual vs leverage plot |

### Theorems & Learning / Reporting

| Module | Visual | Controls |
|---|---|---|
| Theorem library | Pick a theorem → its lab | Search |
| Proof intuition | Stepper that **animates** each proof step | Next / back |
| Learning paths | Chapter map | — |
| Practice quizzes | Question + reveal visual | — |
| Report narration | Highlight the chart region the sentence refers to | Sentence picker |

---

## 11. Stat Modules (90)

**Now:** Dense module menu, metric tables, optional Plotly, Work/Learn toggle. Feels like a toolbox, not a teacher.

**Global Stat Module chrome:**

```
[ Why this test ] [ Picture ] [ Numbers ] [ Report ]
```

Default tab: **Picture**.

Shared picture grammar:

- One **hero chart** that is the definition of the procedure.
- Parameter `α` as a **tail shade**, not only a number input.
- Assumption warnings as **on-chart badges**, not a separate wall.
- Teaching-only modules (`MANOVA screening`, undo/redo preview, report-builder metadata) get a **Teaching approximation** pill. Never look like a finished research result.

### Inferential modules

| Module | Picture | Extra controls |
|---|---|---|
| Confidence interval | Coverage machine (100 intervals) | Confidence %, n |
| One-sample tests | H0 sampling dist + observed statistic | μ0 fence, α |
| Two-sample tests | Two groups + gap; optional permutation | Paired vs independent |
| ANOVA | Box/dot by group; between vs within | Post-hoc pairs on the same chart |
| Chi-square | Mosaic + residual heatmap | Expected vs observed morph |
| Non-parametric | Rank number line (points become ranks) | Test family |
| Correlation testing | Scatter + r; shuffle null | Pearson/Spearman/Kendall |
| Power & sample size | Power curve vs n | Effect size, α |
| Effect size | Same test picture with overlapping distributions | d / η² overlay |
| GOF to distribution | Overlay histogram vs fitted curve | Family picker |

### Regression & modeling

| Module | Picture | Extra controls |
|---|---|---|
| Simple / multiple regression | Residual squares / added-variable | Predictors on/off |
| Logistic | S-curve of p vs x | Threshold slider, confusion overlay |
| ROC AUC | ROC with moving threshold on both ROC and histogram | Threshold |
| Ridge / lasso | Coefficient paths vs λ | λ scrubber |
| Stepwise | Predictors lighting on as they enter | — |
| Train/test CV | Error bars for train vs test | k |
| Robust regression | Points downweighted (opacity) | Huber k |

### Charting modules

These should **share the Explore Charts engine** (one visual system). Each module is a **preset** of that engine, plus one teaching caption:

- Histogram: bin-width slider (Scott/Freedman vs manual) — *the* teaching control.
- Box / violin: show underlying dots.
- QQ: sample vs theoretical with a drag-to-see-quantile.
- ECDF: step function drawing left to right.
- Pareto: bars + cumulative line with 80% marker.
- Control chart: UCL/LCL as fences; points beyond blink.
- Sankey / treemap: keep, but add hover that states the share in words.

### Advanced workflows (teaching approximations)

For each, the visual is the *idea*, with an honest label:

- Bootstrap / permutation: same as Learn labs, wired to the active columns.
- Bayesian basics: Beta-binomial animation (prior → posterior).
- Multiple testing: p-value dots, α line, Bonferroni line moves.
- Missing imputation: holes fill; distribution before/after.
- Time series / seasonal: components stacked (trend, seasonal, remainder).
- Clustering / PCA: 2D stage as in Advanced Analysis.
- Survival KM: step curve with at-risk counts.
- Workflow-only modules (undo, report builder, saved sessions): **do not** live in the teaching gallery. Move to Analyze tooling.

---

## 12. CS Modules

These hurt visual-teaching rank if they appear as first-class “statistics” nav.

**UX:** In Learn mode, nest them under `Optional: computing for stats` or hide. In Analyze, keep.

If kept visible, each needs a stats-flavored visual:

| Module | Visual teaching angle |
|---|---|
| Sorting | Animate comparisons; relate to order statistics |
| Searching | Linear vs binary on a sorted sample |
| Hashing | Buckets as a discrete uniform misuse demo |
| Data structures | Stack/queue as sampling without replacement |
| DP | Fibonacci table vs naive recursion cost |
| Complexity | Overlay n vs n² on sample size (why simulation gets slow) |
| Cryptography | Avalanche as a “independence of bits” demo — or hide from stats learners |

---

## 13. Output: Dashboard, Reports

### Dashboard

- Learner: a **lesson wall** of saved stages (CLT, CI coverage, OLS).
- Analyze: KPI + charts, but **click a panel to reopen the lesson** that produced it.
- Linked highlighting across panels.

### Export & Reports

- Export must include the **stage PNG** and a 3-line caption (intuition, formula, caveat).
- Classroom pack: “replay this lab” JSON (parameters + dataset id).

---

## 14. Cross-cutting UX bugs that block rank 1

These are not optional polish:

1. **Never show the crash empty-state as a lesson.** Inner error boundary + reset on route (started). Stage fallback: “Reload this lab,” not a dead end.
2. **Never open a teaching page without data.** Student Marks (or the chapter’s teaching set) auto-loads.
3. **Never clone all 80 samples to render a dropdown.** That froze/crashed Distributions. Sample picker is metadata-only until chosen.
4. **One visual language.** Kill competing card grids (“5 enhancements,” “5 tools”) above the fold.
5. **Play is the default.** Monte Carlo that only appears after a small `Run` button will lose to StatKey.
6. **Mobile:** stage full width; controls in a bottom sheet; 44px targets.
7. **Accessibility:** every stage has a text readout of the current probability/statistic; reduced motion uses cross-fade not particles.
8. **Performance:** particle labs cap at a visible 400–800 marks; extra draws update a counter only.

---

## 15. Implementation order (to actually reach 1st)

Do not start by restyling all 90 Stat Modules. Rank 1 is won by **six hero labs** plus shell.

### Phase A — Shell (1 sprint)

- Learn / Analyze mode.
- Six-chapter gallery on Home.
- Auto-load teaching dataset.
- `VisualLesson` layout + control primitives (slider, play, reset, slow-mo, caption).

### Phase B — Six hero labs (the Seeing Theory set)

1. Chance / Bernoulli coins.
2. Bayes tree / area boxes.
3. CLT means pile.
4. Bootstrap + CI coverage.
5. Prior → posterior (Beta).
6. OLS residual squares.

Ship these at D3 quality. If only Phase B lands, visual rank should already enter the **top 2**.

### Phase C — Wire existing product into the shell

- Distributions studio uses the same stage tools.
- Inference page becomes the sampling-distribution machine.
- Syllabus modules deep-link to the matching hero, with extra controls.
- Correlation shuffle, histogram bin-width, residual stalks.

### Phase D — Stat Modules as presets

- Picture tab default.
- Teaching-approximation pills.
- Move non-visual workflow modules out of the teaching gallery.

### Phase E — Classroom

- Instructor: assign a chapter, collect a replay JSON.
- Practice items that reveal the picture.

---

## 16. Definition of done (visual rank 1)

A reviewer who has used Seeing Theory should be able to:

1. Open StatAnveshak and, **without reading the sidebar**, start a CLT lab in two clicks.
2. Change `n` and **see** the sampling distribution tighten without pressing Run.
3. Explain Bayes’ base-rate trap from the **picture alone**.
4. Drag an OLS line and watch residual squares shrink to the fit.
5. Still import their own CSV and run a t-test (Analyze mode) without losing the teaching visuals.

Until those five are true, do not spend design time on new metric cards.

---

## 17. What not to do

- Do not add more homepage tiles.
- Do not duplicate Stat Modules as yet another menu of the same tests.
- Do not animate for decoration (gradients, particles with no statistical meaning).
- Do not chase JASP’s table density on teaching screens.
- Do not hide formulas; pin them to the picture.

The product that ranks first is not the one with the most modules. It is the one where **every control moves a statistical object the learner can see**.
