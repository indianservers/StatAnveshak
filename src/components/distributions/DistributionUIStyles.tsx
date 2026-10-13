const CSS = `
.dist-studio { color: #0f172a; background: #f7f8fc; }
.dist-studio div:has(> .dist-chart-frame) { height: auto; }
.dist-chart-frame { min-width: 0; }
.dist-ui-button:disabled { opacity: .5; cursor: not-allowed; }
.dark .dist-studio { color: #f1f5f9; background: #020617; }
.dist-studio :is(button, select, summary, input:not([type=range]):not([type=checkbox]):not([type=radio])) { min-height: 44px; }
.dist-studio :is(button, input, select, summary, a, textarea):focus-visible { outline: 3px solid var(--dist-line); outline-offset: 3px; }
.dist-studio .bg-indigo-600 { background-color: var(--dist-primary) !important; }
.dist-studio :is(.bg-indigo-50, .bg-indigo-100) { background-color: var(--dist-wash); }
.dist-studio :is(.text-indigo-500, .text-indigo-600, .text-indigo-700) { color: var(--dist-primary); }
.dark .dist-studio :is(.text-indigo-300, .text-indigo-400, .text-indigo-500, .text-indigo-600, .text-indigo-700) { color: var(--dist-line); }
.dist-studio .accent-indigo-600 { accent-color: var(--dist-primary); }
.dist-studio :is(.text-slate-400, .text-slate-500) { color: #475569; }
.dark .dist-studio :is(.text-slate-400, .text-slate-500) { color: #cbd5e1; }
.dist-studio select { background-color: white; color: #0f172a; }
.dark .dist-studio select { background-color: #0f172a; color: #f1f5f9; }
.dist-studio[data-density=compact] .dist-lesson > header { gap: 12px; }
.dist-studio[data-density=compact] .dist-lesson section { padding: 12px; border-radius: 16px; }
.dist-studio[data-density=compact] .dist-lesson { gap: 10px; }
.dist-studio[data-readable=true] :is(.text-xs, .text-\\[11px\\], .text-\\[10px\\]) { font-size: .875rem; line-height: 1.6; }
.dist-studio[data-readable=true] .text-sm { font-size: 1rem; line-height: 1.7; }
.dist-studio[data-contrast=true] { --dist-line: #172554 !important; --dist-selection: #065f46 !important; }
.dist-studio[data-contrast=true] :is(section, article, input, select, button) { border-color: #64748b; }
.dist-studio[data-contrast=true] :is(.text-slate-400, .text-slate-500, .text-slate-600) { color: #0f172a; }
.dark .dist-studio[data-contrast=true] { --dist-line: #c7d2fe !important; --dist-selection: #6ee7b7 !important; }
.dark .dist-studio[data-contrast=true] :is(.text-slate-400, .text-slate-500, .text-slate-600) { color: #f8fafc; }
.dist-studio[data-focus=true] .dist-navigation { display: none; }
.dist-studio[data-focus=true] .dist-header-hero { display: none; }
.dist-studio[data-focus=true] .dist-lesson > header { display: block; }
.dist-studio[data-motion=reduced] * { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
.dist-studio[data-motion=reduced] .dl-trace, .dist-studio[data-motion=reduced] .dl-line { stroke-dashoffset: 0 !important; }
.dist-studio .dl-panel { animation-duration: calc(.32s * var(--dist-motion-scale)); }
.dist-studio .dl-step { animation-duration: calc(.4s * var(--dist-motion-scale)); }
.dist-studio .dl-chart-in .dl-bar { animation-duration: calc(.5s * var(--dist-motion-scale)); }
.dist-studio .dl-chart-in .dl-line { animation-duration: calc(.7s * var(--dist-motion-scale)); }
.dist-studio .dl-hero-on :is(.dl-dot, svg .dl-bar) { animation-duration: calc(1.8s * var(--dist-motion-scale)); }
.dist-studio .dl-hero-on .dl-coin { animation-duration: calc(2.8s * var(--dist-motion-scale)); }
.dist-studio .dl-hero-on .dl-coin-b { animation-duration: calc(2.4s * var(--dist-motion-scale)); }
.dist-studio .dl-hero-on :is(.dl-mark, .dl-drop) { animation-duration: calc(2s * var(--dist-motion-scale)); }
.dist-studio .dl-hero-on .dl-trace { animation-duration: calc(2.6s * var(--dist-motion-scale)); }
.dist-studio [data-animation-visible=false] * { animation-play-state: paused !important; }
.dist-ui-control { border: 1px solid #94a3b8; border-radius: 10px; padding: 8px 12px; font-size: .8125rem; font-weight: 600; }
.dist-ui-button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid #cbd5e1; border-radius: 10px; padding: 8px 12px; font-size: .8125rem; font-weight: 700; background: white; color: #334155; }
.dist-ui-button:hover { background: var(--dist-wash); color: var(--dist-primary); }
.dist-ui-button[aria-pressed=true] { border-color: var(--dist-primary); background: var(--dist-wash); color: var(--dist-primary); }
.dark .dist-ui-button { background: #0f172a; color: #e2e8f0; border-color: #475569; }
.dark .dist-ui-button:hover, .dark .dist-ui-button[aria-pressed=true] { background: #1e293b; color: var(--dist-line); }
.dist-chart-dialog { margin: auto; width: min(1100px, 96vw); max-height: 92vh; overflow: auto; border: 1px solid #94a3b8; border-radius: 20px; padding: 20px; background: white; color: #0f172a; }
.dist-chart-dialog .dl-line { animation: none !important; stroke-dashoffset: 0; }
.dark .dist-chart-dialog { background: #0f172a; color: #f1f5f9; }
.dist-chart-dialog::backdrop { background: rgb(15 23 42 / .7); backdrop-filter: blur(4px); }
.dist-chart-tooltip { border-left: 4px solid var(--dist-line); background: #f8fafc; border-radius: 8px; padding: 8px 12px; }
.dark .dist-chart-tooltip { background: #020617; }
.dist-tab-shell { background: #f7f8fcf2; }
.dark .dist-tab-shell { background: #020617f2; }
@media (min-width: 1024px) { .dist-studio .dist-tab-shell { top: 0; } }
@media (max-width: 1023px) { .dist-studio .dist-tab-shell { position: static; } }
@media (prefers-reduced-motion: reduce) { .dist-studio * { animation: none !important; scroll-behavior: auto !important; } }
`
export function DistributionUIStyles() { return <style>{CSS}</style> }
