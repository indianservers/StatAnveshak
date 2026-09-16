const CSS = `
.rv-studio {
  --rv-blue: #2563eb;
  --rv-blue-soft: #dbeafe;
  --rv-ink: #0f172a;
  --rv-muted: #64748b;
  --rv-line: #e8eef6;
  --rv-card: #ffffff;
  --rv-wash: #f6f8fc;
  color: var(--rv-ink);
  background:
    radial-gradient(1200px 420px at 88% -10%, #eef4ff 0%, transparent 58%),
    var(--rv-wash);
}
.dark .rv-studio {
  --rv-ink: #f8fafc;
  --rv-muted: #94a3b8;
  --rv-line: #1e293b;
  --rv-card: #0f172a;
  --rv-wash: #020617;
  background:
    radial-gradient(1200px 420px at 88% -10%, #12203a 0%, transparent 58%),
    var(--rv-wash);
}
.rv-studio * { box-sizing: border-box; }
.rv-card {
  background: var(--rv-card);
  border: 1px solid var(--rv-line);
  border-radius: 22px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.045);
}
.rv-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 40px;
  padding: 0 1.15rem;
  border-radius: 999px;
  background: var(--rv-blue);
  color: #fff;
  font-weight: 700;
  font-size: 0.875rem;
  border: 0;
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
}
.rv-btn:hover { background: #1d4ed8; box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25); }
.rv-btn:focus-visible { outline: 2px solid #93c5fd; outline-offset: 3px; }
.rv-btn-ghost {
  background: #fff;
  color: #334155;
  border: 1px solid #dbe3ee;
}
.dark .rv-btn-ghost { background: #0f172a; color: #e2e8f0; border-color: #334155; }
.rv-btn-ghost:hover { background: #f8fafc; box-shadow: none; }
.rv-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.85rem;
  border-radius: 16px;
  background: #fff;
  border: 1px solid var(--rv-line);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
}
.dark .rv-chip { background: #0f172a; }
.rv-note {
  font-family: "Segoe Script", "Bradley Hand", "Comic Sans MS", cursive;
  color: #64748b;
  font-size: 0.92rem;
  line-height: 1.35;
  transform: rotate(-3deg);
}
.rv-mountain {
  height: 54px;
  background:
    radial-gradient(18px 18px at 86% 18%, #2563eb 0 55%, transparent 56%),
    linear-gradient(180deg, transparent 28%, #e8eef8 28%, #e8eef8 100%);
  -webkit-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 80'><path fill='black' d='M0 80 L70 42 L140 62 L250 18 L330 50 L420 28 L510 58 L600 22 L690 48 L800 10 V80 Z'/></svg>") center / 100% 100% no-repeat;
          mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 80'><path fill='black' d='M0 80 L70 42 L140 62 L250 18 L330 50 L420 28 L510 58 L600 22 L690 48 L800 10 V80 Z'/></svg>") center / 100% 100% no-repeat;
}
.rv-home-card { transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }
.rv-home-card:hover { transform: translateY(-3px); box-shadow: 0 16px 32px rgba(37, 99, 235, 0.1); border-color: #c7d7fb; }
.rv-tab-active { background: #fff; color: #2563eb; box-shadow: 0 1px 4px rgba(15,23,42,0.04); }
.rv-select, .rv-input {
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
.dark .rv-select, .dark .rv-input { background: #0f172a; color: #e2e8f0; border-color: #334155; }
.rv-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.rv-table th, .rv-table td { padding: 0.45rem 0.55rem; border-bottom: 1px solid var(--rv-line); text-align: center; }
.rv-table th { color: #64748b; font-size: 0.72rem; letter-spacing: 0.02em; }
.rv-cell-active { background: #dbeafe; font-weight: 800; }
@media (prefers-reduced-motion: reduce) {
  .rv-studio .rv-btn, .rv-studio .rv-home-card { transition: none; }
}
`

export function RandomVariablesStudioStyles() {
  return <style>{CSS}</style>
}
