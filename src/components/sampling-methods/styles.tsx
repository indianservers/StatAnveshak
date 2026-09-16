const CSS = `
.sm-studio {
  --sm-blue: #2563eb;
  --sm-blue-soft: #dbeafe;
  --sm-ink: #0f172a;
  --sm-muted: #64748b;
  --sm-line: #e8eef6;
  --sm-card: #ffffff;
  --sm-wash: #f6f8fc;
  color: var(--sm-ink);
  background:
    radial-gradient(1200px 420px at 88% -10%, #eef4ff 0%, transparent 58%),
    var(--sm-wash);
}
.dark .sm-studio {
  --sm-ink: #f8fafc;
  --sm-muted: #94a3b8;
  --sm-line: #1e293b;
  --sm-card: #0f172a;
  --sm-wash: #020617;
  background:
    radial-gradient(1200px 420px at 88% -10%, #12203a 0%, transparent 58%),
    var(--sm-wash);
}
.sm-studio * { box-sizing: border-box; }
.sm-card {
  background: var(--sm-card);
  border: 1px solid var(--sm-line);
  border-radius: 22px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.045);
}
.sm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 40px;
  padding: 0 1.15rem;
  border-radius: 999px;
  background: var(--sm-blue);
  color: #fff;
  font-weight: 700;
  font-size: 0.875rem;
  border: 0;
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
}
.sm-btn:hover { background: #1d4ed8; box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25); }
.sm-btn:focus-visible { outline: 2px solid #93c5fd; outline-offset: 3px; }
.sm-btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
.sm-btn-ghost {
  background: #fff;
  color: #334155;
  border: 1px solid #dbe3ee;
}
.dark .sm-btn-ghost { background: #0f172a; color: #e2e8f0; border-color: #334155; }
.sm-btn-ghost:hover { background: #f8fafc; box-shadow: none; }
.sm-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.85rem;
  border-radius: 16px;
  background: #fff;
  border: 1px solid var(--sm-line);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
}
.dark .sm-chip { background: #0f172a; }
.sm-note {
  font-family: "Segoe Script", "Bradley Hand", "Comic Sans MS", cursive;
  color: #64748b;
  font-size: 0.92rem;
  line-height: 1.35;
  transform: rotate(-3deg);
}
.sm-mountain {
  height: 54px;
  background:
    radial-gradient(18px 18px at 86% 18%, #2563eb 0 55%, transparent 56%),
    linear-gradient(180deg, transparent 28%, #e8eef8 28%, #e8eef8 100%);
  -webkit-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 80'><path fill='black' d='M0 80 L70 42 L140 62 L250 18 L330 50 L420 28 L510 58 L600 22 L690 48 L800 10 V80 Z'/></svg>") center / 100% 100% no-repeat;
          mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 80'><path fill='black' d='M0 80 L70 42 L140 62 L250 18 L330 50 L420 28 L510 58 L600 22 L690 48 L800 10 V80 Z'/></svg>") center / 100% 100% no-repeat;
}
.sm-home-card { transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }
.sm-home-card:hover { transform: translateY(-3px); box-shadow: 0 16px 32px rgba(37, 99, 235, 0.1); border-color: #c7d7fb; }
.sm-select, .sm-input {
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
.dark .sm-select, .dark .sm-input { background: #0f172a; color: #e2e8f0; border-color: #334155; }
.sm-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  display: inline-block;
}
@media (prefers-reduced-motion: reduce) {
  .sm-studio .sm-btn, .sm-studio .sm-home-card { transition: none; }
  .sm-studio .sm-home-card:hover { transform: none; }
}
`

export function SamplingMethodsStudioStyles() {
  return <style>{CSS}</style>
}
