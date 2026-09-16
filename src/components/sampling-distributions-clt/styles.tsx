const CSS = `
.clt-studio {
  --clt-blue: #2563eb;
  --clt-blue-soft: #dbeafe;
  --clt-ink: #0f172a;
  --clt-muted: #64748b;
  --clt-line: #e8eef6;
  --clt-card: #ffffff;
  --clt-wash: #f6f8fc;
  color: var(--clt-ink);
  background:
    radial-gradient(1200px 420px at 88% -10%, #eef4ff 0%, transparent 58%),
    var(--clt-wash);
}
.dark .clt-studio {
  --clt-ink: #f8fafc;
  --clt-muted: #94a3b8;
  --clt-line: #1e293b;
  --clt-card: #0f172a;
  --clt-wash: #020617;
  background:
    radial-gradient(1200px 420px at 88% -10%, #12203a 0%, transparent 58%),
    var(--clt-wash);
}
.clt-studio * { box-sizing: border-box; }
.clt-card {
  background: var(--clt-card);
  border: 1px solid var(--clt-line);
  border-radius: 22px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.045);
}
.clt-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 40px;
  padding: 0 1.15rem;
  border-radius: 999px;
  background: var(--clt-blue);
  color: #fff;
  font-weight: 700;
  font-size: 0.875rem;
  border: 0;
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
}
.clt-btn:hover { background: #1d4ed8; box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25); }
.clt-btn:focus-visible { outline: 2px solid #93c5fd; outline-offset: 3px; }
.clt-btn:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
.clt-btn-ghost {
  background: #fff;
  color: #334155;
  border: 1px solid #dbe3ee;
}
.dark .clt-btn-ghost { background: #0f172a; color: #e2e8f0; border-color: #334155; }
.clt-btn-ghost:hover { background: #f8fafc; box-shadow: none; }
.clt-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.85rem;
  border-radius: 16px;
  background: #fff;
  border: 1px solid var(--clt-line);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
}
.dark .clt-chip { background: #0f172a; }
.clt-note {
  font-family: "Segoe Script", "Bradley Hand", "Comic Sans MS", cursive;
  color: #64748b;
  font-size: 0.92rem;
  line-height: 1.35;
  transform: rotate(-3deg);
}
.clt-mountain {
  height: 54px;
  background:
    radial-gradient(18px 18px at 86% 18%, #2563eb 0 55%, transparent 56%),
    linear-gradient(180deg, transparent 28%, #e8eef8 28%, #e8eef8 100%);
  -webkit-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 80'><path fill='black' d='M0 80 L70 42 L140 62 L250 18 L330 50 L420 28 L510 58 L600 22 L690 48 L800 10 V80 Z'/></svg>") center / 100% 100% no-repeat;
          mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 80'><path fill='black' d='M0 80 L70 42 L140 62 L250 18 L330 50 L420 28 L510 58 L600 22 L690 48 L800 10 V80 Z'/></svg>") center / 100% 100% no-repeat;
}
.clt-home-card { transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }
.clt-home-card:hover { transform: translateY(-3px); box-shadow: 0 16px 32px rgba(37, 99, 235, 0.1); border-color: #c7d7fb; }
.clt-select, .clt-input {
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
.dark .clt-select, .dark .clt-input { background: #0f172a; color: #e2e8f0; border-color: #334155; }
.clt-dots { display: flex; gap: 6px; align-items: center; }
.clt-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #dbe3ee;
}
.clt-dot.is-on { background: #2563eb; }
.clt-shape {
  display: grid;
  place-items: center;
  min-height: 72px;
  padding: 0.4rem 0.5rem;
  border-radius: 16px;
  border: 1px solid #e5edf7;
  background: #fff;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}
.clt-shape.is-on { border-color: #93c5fd; background: #eff6ff; color: #1d4ed8; }
.clt-shape:focus-visible { outline: 2px solid #93c5fd; outline-offset: 2px; }
.clt-metric {
  min-width: 88px;
  padding: 0.55rem 0.7rem;
  border-radius: 14px;
  background: #f8fafc;
  text-align: center;
}
.dark .clt-metric { background: #0b1220; }
@media (prefers-reduced-motion: reduce) {
  .clt-studio .clt-btn, .clt-studio .clt-home-card { transition: none; }
}
`

export function SamplingDistributionsStudioStyles() {
  return <style>{CSS}</style>
}
