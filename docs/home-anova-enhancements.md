# Home and ANOVA enhancements

Implemented on 3 October 2026. The following checklists explain where to find each feature.

## Home: 30 requested improvements

1. **Continue where you left off:** resume the most recently visited searchable destination, with a suggested learning start when history is empty.
2. **Recently opened analyses:** recent analysis links and saved report summaries appear in the workspace.
3. **Favorites:** stars on studio cards and search results save studios, labs, analyses, and data tools; the workspace lists them.
4. **Beginner/advanced views:** a saved selector retains the introductory hero in beginner view and removes it in advanced view.
5. **First-use tour:** four steps explain search, studios, datasets, and analysis; dismiss or reopen it anytime.
6. **Clear primary action:** the hero action reads “Upload Dataset.”
7. **Samples beside upload:** the hero links to samples; Dataset Studio presents popular samples beside file import.
8. **Drag-and-drop upload:** drop one CSV, TSV, TXT, Excel, or JSON file into Dataset Studio and review the imported dataset.
9. **Active dataset summary:** see name, dimensions, numeric column count, and missing-value column count.
10. **Dataset recommendations:** summary, correlation, and group-comparison links depend on available column types, with study-design context.
11. **Test-selection guide:** choose a goal and independent/paired design to open a suitable starting method.
12. **Studios grouped by learning level:** switch between topic grouping and introductory/core/advanced entry grouping.
13. **Lab time estimates:** expandable lab lists show approximate 10- or 20-minute estimates; these are estimates rather than timers.
14. **Studio progress:** cards display saved completion counts and progress bars for studios with existing progress tracking.
15. **Goal-based learning paths:** open the existing learning-path selector from the workspace.
16. **Topic/difficulty filters:** filter studios and lab lists; reset restores all options.
17. **Search category filters:** narrow results to studios, labs, analyses, or data tools.
18. **Search synonyms:** “bell curve,” “average,” “import,” “linear model,” and other terms map to catalog terminology.
19. **Highlighted matches:** query words are highlighted in result titles and descriptions.
20. **Search shortcut:** Ctrl/⌘ K focuses home search; Escape clears it. The global command palette remains available on other pages.
21. **Recent searches:** opening a result saves its query; saved queries can be reused or cleared.
22. **Collapsible sections:** collapse studios, datasets, analysis tools, and modules independently.
23. **Remembered preferences:** view, filters, studio grouping, and collapsed sections survive reloads.
24. **Section navigation:** a sticky section bar scrolls within home without changing the hash-router route.
25. **Consistent cards:** studio grids stretch cards consistently and share spacing and control styling.
26. **Mobile touch targets:** home controls use a minimum 44px target; grids and forms wrap on narrow screens.
27. **Text contrast:** muted home text uses stronger light/dark colors, with visible keyboard focus.
28. **Animation control:** pause/resume uses the existing motion preference and pauses decorative home animations.
29. **Browser-storage explanation:** import and help text explain local storage and what clearing site data removes.
30. **Help and feedback:** help, report access, and a locally saved/copied feedback draft are available. Feedback is not transmitted automatically.

## ANOVA: 25 suggested and implemented improvements

Data-analysis additions are in **ANOVA → One-Way ANOVA**. Shared learning, accessibility, and explicit-completion improvements apply across all six ANOVA labs.

1. **Visible data source:** distinguish simulated, imported, and edited data with observation counts.
2. **Use the active dataset:** analyze the dataset already selected in the app.
3. **Local file import:** import CSV, TSV, TXT, Excel, or JSON directly into the lab.
4. **Column mapping:** select the grouping factor and numeric outcome explicitly.
5. **Exclusion accounting:** show how many rows lack valid groups or numeric outcomes.
6. **Data validation:** reject insufficient groups, singleton groups, duplicate IDs, zero error variance, or interactive-limit violations.
7. **Full data exploration:** inspect all rows with ten observations per page rather than relying on the six-row example preview.
8. **Group filtering:** narrow the data explorer to a specific group.
9. **Keyboard editing:** edit outcomes with Enter or blur; invalid values are rejected.
10. **Undo/redo:** restore imports, point edits, simulation changes, and snapshot restores; a drag is recorded as one change.
11. **Adjustable alpha:** 0.01, 0.05, and 0.10 consistently update decisions, intervals, critical F, and comparisons.
12. **Reproducible seeds:** enter an exact simulation seed; sliders also provide exact numeric inputs across ANOVA labs.
13. **Reliable resampling:** replace imported/edited points with newly generated data instead of leaving old edits on screen.
14. **Reset safeguard:** inline confirmation allows saving/exporting before reset.
15. **Group summaries and intervals:** display n, mean, SD, and individual t confidence intervals with their confidence level.
16. **Effect sizes:** show η² and bias-adjusted ω², with practical-importance guidance.
17. **Design balance:** identify equal versus unequal group sizes.
18. **Assumption diagnostics:** residual Q–Q/histogram views and Brown–Forsythe testing use current data, with independence guidance.
19. **F-distribution visualization:** show observed F, critical F, and the rejection tail for the chosen alpha.
20. **Same-data pairwise comparisons:** choose Holm-adjusted pooled t tests or Tukey HSD/Tukey–Kramer, with a forest plot and table. Holm intervals are labeled as unadjusted individual t intervals.
21. **Data export:** download all observations as CSV, with escaped cells and formula-safe string labels.
22. **Report export:** preview, copy, or download source, settings, results, effect sizes, group summaries, and interpretation.
23. **Snapshots and comparison:** save up to three local snapshots, compare F/p/η²/alpha, restore, or delete them.
24. **Explicit completion:** opening a lab does not mark it complete; a button saves progress and updates sidebar checks. Completion can be undone.
25. **Guided learning notebook:** each lab has a suggested experiment, saved notes, searchable glossary, and interpretation questions with explanatory feedback. Controls have keyboard focus and mobile touch targets; mobile lab navigation collapses so the experiment appears first.

## Verification and scope

Focused unit tests cover search, module navigation, ANOVA calculations, confidence intervals, effect sizes, row validation, CSV safety, and local import. Browser tests cover desktop Chromium and Pixel 5 layouts, saved preferences, shortcuts, favorites/history, dataset import, ANOVA edits/undo/redo/resampling, snapshots, CSV download, notes/completion, and all six lab routes. TypeScript, lint on changed feature files, and the production build are checked.

ANOVA import supports 2–6 groups and up to 5,000 rows to keep plots practical. Imported lab files stay in the lab unless separately loaded into the dataset workspace. Snapshots, notes, favorites, and preferences are stored in the current browser. Reports explain that failing to reject equal means does not establish their equality; Holm p-values are adjusted while its displayed t intervals are individual intervals.
