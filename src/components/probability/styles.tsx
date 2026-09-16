const CSS = `
.pf-studio {
  --pf-blue: #2563eb;
  --pf-blue-soft: #dbeafe;
  --pf-ink: #0f172a;
  --pf-muted: #64748b;
  --pf-line: #e8eef6;
  --pf-card: #ffffff;
  --pf-wash: #f6f8fc;
  color: var(--pf-ink);
  background:
    radial-gradient(1200px 420px at 88% -10%, #eef4ff 0%, transparent 58%),
    var(--pf-wash);
}
.dark .pf-studio {
  --pf-ink: #f8fafc;
  --pf-muted: #94a3b8;
  --pf-line: #1e293b;
  --pf-card: #0f172a;
  --pf-wash: #020617;
  background:
    radial-gradient(1200px 420px at 88% -10%, #12203a 0%, transparent 58%),
    var(--pf-wash);
}
.pf-studio * { box-sizing: border-box; }
.pf-card {
  background: var(--pf-card);
  border: 1px solid var(--pf-line);
  border-radius: 22px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.045);
}
.pf-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 40px;
  padding: 0 1.15rem;
  border-radius: 999px;
  background: var(--pf-blue);
  color: #fff;
  font-weight: 700;
  font-size: 0.875rem;
  border: 0;
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
}
.pf-btn:hover { background: #1d4ed8; box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25); }
.pf-btn:focus-visible { outline: 2px solid #93c5fd; outline-offset: 3px; }
.pf-btn-ghost {
  background: #fff;
  color: #334155;
  border: 1px solid #dbe3ee;
}
.dark .pf-btn-ghost { background: #0f172a; color: #e2e8f0; border-color: #334155; }
.pf-btn-ghost:hover { background: #f8fafc; box-shadow: none; }
.pf-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.85rem;
  border-radius: 16px;
  background: #fff;
  border: 1px solid var(--pf-line);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
}
.dark .pf-chip { background: #0f172a; }
.pf-note {
  font-family: "Segoe Script", "Bradley Hand", "Comic Sans MS", cursive;
  color: #64748b;
  font-size: 0.92rem;
  line-height: 1.35;
  transform: rotate(-3deg);
}
.pf-die {
  width: 92px;
  height: 92px;
  border-radius: 22px;
  background: linear-gradient(160deg, #ffffff 0%, #f4f6fb 68%, #e7ebf3 100%);
  box-shadow:
    10px 14px 0 #d7deea,
    0 18px 28px rgba(15, 23, 42, 0.12);
  position: relative;
}
.pf-die-pip {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #111827;
}
.pf-mountain {
  height: 54px;
  background:
    radial-gradient(18px 18px at 86% 18%, #2563eb 0 55%, transparent 56%),
    linear-gradient(180deg, transparent 28%, #e8eef8 28%, #e8eef8 100%);
  -webkit-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 80'><path fill='black' d='M0 80 L70 42 L140 62 L250 18 L330 50 L420 28 L510 58 L600 22 L690 48 L800 10 V80 Z'/></svg>") center / 100% 100% no-repeat;
          mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 80'><path fill='black' d='M0 80 L70 42 L140 62 L250 18 L330 50 L420 28 L510 58 L600 22 L690 48 L800 10 V80 Z'/></svg>") center / 100% 100% no-repeat;
}
.pf-home-card { transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }
.pf-home-card:hover { transform: translateY(-3px); box-shadow: 0 16px 32px rgba(37, 99, 235, 0.1); border-color: #c7d7fb; }
@media (prefers-reduced-motion: reduce) {
  .pf-studio .pf-btn, .pf-studio .pf-home-card, .pf-studio .pf-die { transition: none; }
}
`

export function ProbabilityStudioStyles() {
  return <style>{CSS}</style>
}
