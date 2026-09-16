const CSS = `
.ds-studio {
  --ds-blue: #2563eb;
  --ds-blue-soft: #dbeafe;
  --ds-ink: #0f172a;
  --ds-muted: #64748b;
  --ds-line: #e8eef6;
  --ds-card: #ffffff;
  --ds-wash: #f6f8fc;
  color: var(--ds-ink);
  background:
    radial-gradient(1200px 420px at 88% -10%, #eef4ff 0%, transparent 58%),
    var(--ds-wash);
}
.dark .ds-studio {
  --ds-ink: #f8fafc;
  --ds-muted: #94a3b8;
  --ds-line: #1e293b;
  --ds-card: #0f172a;
  --ds-wash: #020617;
  background:
    radial-gradient(1200px 420px at 88% -10%, #12203a 0%, transparent 58%),
    var(--ds-wash);
}
.ds-studio * { box-sizing: border-box; }
.ds-card {
  background: var(--ds-card);
  border: 1px solid var(--ds-line);
  border-radius: 22px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.045);
}
.ds-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 40px;
  padding: 0 1.15rem;
  border-radius: 999px;
  background: var(--ds-blue);
  color: #fff;
  font-weight: 700;
  font-size: 0.875rem;
  border: 0;
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
}
.ds-btn:hover { background: #1d4ed8; box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25); }
.ds-btn:focus-visible { outline: 2px solid #93c5fd; outline-offset: 3px; }
.ds-btn-ghost {
  background: #fff;
  color: #334155;
  border: 1px solid #dbe3ee;
}
.dark .ds-btn-ghost { background: #0f172a; color: #e2e8f0; border-color: #334155; }
.ds-btn-ghost:hover { background: #f8fafc; box-shadow: none; }
.ds-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.85rem;
  border-radius: 16px;
  background: #fff;
  border: 1px solid var(--ds-line);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
}
.dark .ds-chip { background: #0f172a; }
.ds-note {
  font-family: "Segoe Script", "Bradley Hand", "Comic Sans MS", cursive;
  color: #64748b;
  font-size: 0.92rem;
  line-height: 1.35;
  transform: rotate(-3deg);
}
.ds-mountain {
  height: 54px;
  background:
    radial-gradient(18px 18px at 86% 18%, #2563eb 0 55%, transparent 56%),
    linear-gradient(180deg, transparent 28%, #e8eef8 28%, #e8eef8 100%);
  -webkit-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 80'><path fill='black' d='M0 80 L70 42 L140 62 L250 18 L330 50 L420 28 L510 58 L600 22 L690 48 L800 10 V80 Z'/></svg>") center / 100% 100% no-repeat;
          mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 80'><path fill='black' d='M0 80 L70 42 L140 62 L250 18 L330 50 L420 28 L510 58 L600 22 L690 48 L800 10 V80 Z'/></svg>") center / 100% 100% no-repeat;
}
.ds-home-card { transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }
.ds-home-card:hover { transform: translateY(-3px); box-shadow: 0 16px 32px rgba(37, 99, 235, 0.1); border-color: #c7d7fb; }
.ds-select, .ds-input, .ds-textarea {
  width: 100%;
  min-height: 38px;
  border-radius: 12px;
  border: 1px solid #dbe3ee;
  background: #fff;
  padding: 0 0.7rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}
.ds-textarea { min-height: 92px; padding: 0.65rem 0.75rem; resize: vertical; font-family: inherit; }
.dark .ds-select, .dark .ds-input, .dark .ds-textarea { background: #0f172a; color: #e2e8f0; border-color: #334155; }
.ds-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.ds-table th, .ds-table td { padding: 0.45rem 0.55rem; border-bottom: 1px solid var(--ds-line); text-align: center; }
.ds-table th { color: #64748b; font-size: 0.72rem; letter-spacing: 0.02em; }
.ds-cell-active { background: #dbeafe; font-weight: 800; }
.ds-dot { cursor: pointer; }
.ds-dot:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .ds-studio .ds-btn, .ds-studio .ds-home-card { transition: none; }
}
`

export function DescriptiveStatsStudioStyles() {
  return <style>{CSS}</style>
}
