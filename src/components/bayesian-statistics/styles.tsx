const CSS = `
.bayes-studio {
  --bayes-blue: #2563eb;
  --bayes-blue-soft: #dbeafe;
  --bayes-prior: #2563eb;
  --bayes-like: #059669;
  --bayes-post: #dc2626;
  --bayes-ink: #0f172a;
  --bayes-muted: #64748b;
  --bayes-line: #e8eef6;
  --bayes-card: #ffffff;
  --bayes-wash: #f6f8fc;
  color: var(--bayes-ink);
  background:
    radial-gradient(1200px 420px at 88% -10%, #eef4ff 0%, transparent 58%),
    var(--bayes-wash);
}
.dark .bayes-studio {
  --bayes-ink: #f8fafc;
  --bayes-muted: #94a3b8;
  --bayes-line: #1e293b;
  --bayes-card: #0f172a;
  --bayes-wash: #020617;
  background:
    radial-gradient(1200px 420px at 88% -10%, #12203a 0%, transparent 58%),
    var(--bayes-wash);
}
.bayes-studio * { box-sizing: border-box; }
.bayes-card {
  background: var(--bayes-card);
  border: 1px solid var(--bayes-line);
  border-radius: 22px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.045);
}
.bayes-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 40px;
  padding: 0 1.15rem;
  border-radius: 999px;
  background: var(--bayes-blue);
  color: #fff;
  font-weight: 700;
  font-size: 0.875rem;
  border: 0;
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
}
.bayes-btn:hover { background: #1d4ed8; box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25); }
.bayes-btn:focus-visible { outline: 2px solid #93c5fd; outline-offset: 3px; }
.bayes-btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
.bayes-btn-ghost {
  background: #fff;
  color: #334155;
  border: 1px solid #dbe3ee;
}
.dark .bayes-btn-ghost { background: #0f172a; color: #e2e8f0; border-color: #334155; }
.bayes-btn-ghost:hover { background: #f8fafc; box-shadow: none; }
.bayes-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.85rem;
  border-radius: 16px;
  background: #fff;
  border: 1px solid var(--bayes-line);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
}
.dark .bayes-chip { background: #0f172a; }
.bayes-note {
  font-family: "Segoe Script", "Bradley Hand", "Comic Sans MS", cursive;
  color: #64748b;
  font-size: 0.92rem;
  line-height: 1.35;
  transform: rotate(-2deg);
}
.bayes-mountain {
  height: 54px;
  background:
    radial-gradient(18px 18px at 86% 18%, #2563eb 0 55%, transparent 56%),
    linear-gradient(180deg, transparent 28%, #e8eef8 28%, #e8eef8 100%);
  -webkit-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 80'><path fill='black' d='M0 80 L70 42 L140 62 L250 18 L330 50 L420 28 L510 58 L600 22 L690 48 L800 10 V80 Z'/></svg>") center / 100% 100% no-repeat;
          mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 80'><path fill='black' d='M0 80 L70 42 L140 62 L250 18 L330 50 L420 28 L510 58 L600 22 L690 48 L800 10 V80 Z'/></svg>") center / 100% 100% no-repeat;
}
.bayes-home-card { transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }
.bayes-home-card:hover { transform: translateY(-3px); box-shadow: 0 16px 32px rgba(37, 99, 235, 0.1); border-color: #c7d7fb; }
.bayes-select, .bayes-input {
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
.dark .bayes-select, .dark .bayes-input { background: #0f172a; color: #e2e8f0; border-color: #334155; }
.bayes-legend {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
}
.bayes-swatch {
  width: 18px;
  height: 0;
  border-top-width: 2.4px;
  border-top-style: solid;
  display: inline-block;
}
.bayes-swatch.is-prior { border-color: var(--bayes-prior); border-top-style: dashed; }
.bayes-swatch.is-like { border-color: var(--bayes-like); border-top-style: dotted; }
.bayes-swatch.is-post { border-color: var(--bayes-post); border-top-style: solid; }
.bayes-swatch.is-pred { border-color: #7c3aed; border-top-style: solid; }
.bayes-sidebar a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
  padding: 0.35rem 0.7rem;
  border-radius: 12px;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #64748b;
  text-decoration: none;
}
.bayes-sidebar a.is-on {
  background: #eef4ff;
  color: #1d4ed8;
}
.dark .bayes-sidebar a.is-on { background: #12203a; color: #93c5fd; }
.bayes-quote {
  border-radius: 18px;
  background: #f8fafc;
  padding: 0.9rem 1rem;
  color: #64748b;
  font-size: 0.8125rem;
  line-height: 1.5;
}
.dark .bayes-quote { background: #0b1220; }
@media (prefers-reduced-motion: reduce) {
  .bayes-studio .bayes-btn, .bayes-studio .bayes-home-card { transition: none; }
  .bayes-studio .bayes-home-card:hover { transform: none; }
}
`

export function BayesianStudioStyles() {
  return <style>{CSS}</style>
}
