# Distributions: 25 UI enhancements implemented

The review found long mobile navigation, fixed chart colors, uncontrolled motion, missing chart inspection/export, and incomplete keyboard tab behavior. The existing distribution-specific experiments remain the foundation. All changes below are implemented in the Distributions Studio.

1. **Appearance toolbar:** a visible entry point for personalizing the studio.
2. **Six app themes:** Light, Dark, Midnight, Forest, Rose, and Sepia, selected inside the studio.
3. **Four studio palettes:** Indigo, Ocean, Forest, and Sunset coordinate charts and studio controls.
4. **High contrast:** stronger chart strokes, text, and boundaries in light and dark modes.
5. **Layout density:** comfortable and compact lesson layouts.
6. **Larger text:** a readability setting for small explanatory text.
7. **Focus mode:** hide the browser and decorative hero while retaining a distribution selector.
8. **Pause/resume motion:** keep charts and experiments usable with animations disabled.
9. **Animation speed:** slow, normal, and fast illustration/chart entrances.
10. **Reduced-motion support:** honor both app preferences and the operating system.
11. **Automatic animation pause:** stop hero/chart motion offscreen and when the document is hidden.
12. **Replay illustrations:** restart hero and chart animations without resetting lab parameters.
13. **Saved appearance:** remember studio settings locally, with a reset action.
14. **Coherent chart colors:** palette-aware curves, bars, gradients, and selected events.
15. **Point inspection:** pointer crosshair/readout plus a keyboard-operated sampled-point control.
16. **Chart grid control:** toggle the grid globally or directly beside a chart.
17. **Chart legends:** label curves, selected events, and comparison overlays; allow hiding legends.
18. **Expanded charts:** accessible modal view with close button, focus containment, and Escape dismissal.
19. **SVG export:** downloadable chart with resolved theme colors and a matching background.
20. **Chart data table:** inspect plotted values in a paginated, scrollable table.
21. **Distribution search:** filter by name, family, or explanation; show result counts and empty states.
22. **Favorites:** save distributions and filter the browser to saved entries.
23. **Recent distributions:** return to the last five viewed distributions.
24. **Compact mobile browser:** an immediate selector plus an expandable search/browser instead of a long initial list.
25. **Keyboard tabs and history:** arrow/Home/End navigation, visible focus, and tab selection synchronized with the URL and browser history.

Additional review fixes: summary metrics wrap instead of truncating; parameter sliders have explicit accessible names and range hints; formula-copy failures receive feedback; non-finite endpoint densities cannot corrupt SVG geometry; probability-explorer and standard-normal two-tail shading now matches the calculated event.

Settings are browser-local. Theme selection affects the whole app; palette, motion, density, and chart settings affect this studio. Focus mode is temporary. Curve inspection displays sampled values rather than implying an exact analytic evaluation.
