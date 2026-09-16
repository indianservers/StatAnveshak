const CSS = `
.ts-studio {
  --ts-blue: #2563eb;
  --ts-ink: #0f172a;
  --ts-muted: #64748b;
  --ts-line: #e6edf6;
  --ts-card: #ffffff;
  --ts-wash: #f5f8fc;
  color: var(--ts-ink);
  background:
    radial-gradient(1200px 420px at 92% -8%, #eaf1ff 0%, transparent 58%),
    var(--ts-wash);
}
.dark .ts-studio {
  --ts-ink: #f8fafc;
  --ts-muted: #94a3b8;
  --ts-line: #1e293b;
  --ts-card: #0f172a;
  --ts-wash: #020617;
  background:
    radial-gradient(1200px 420px at 92% -8%, #12203a 0%, transparent 58%),
    var(--ts-wash);
}
.ts-studio * { box-sizing: border-box; }
.ts-card {
  background: var(--ts-card);
  border: 1px solid var(--ts-line);
  border-radius: 22px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.045);
}
.ts-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 42px;
  padding: 0 1.2rem;
  border-radius: 999px;
  background: var(--ts-blue);
  color: #fff;
  font-weight: 700;
  font-size: 0.875rem;
  border: 0;
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
}
.ts-btn:hover { background: #1d4ed8; box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25); }
.ts-btn:focus-visible { outline: 2px solid #93c5fd; outline-offset: 3px; }
.ts-btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
.ts-btn-ghost {
  background: #fff;
  color: #334155;
  border: 1px solid #dbe3ee;
}
.dark .ts-btn-ghost { background: #0f172a; color: #e2e8f0; border-color: #334155; }
.ts-btn-ghost:hover { background: #f8fafc; box-shadow: none; }
.ts-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.7rem 0.95rem;
  border-radius: 18px;
  background: #fff;
  border: 1px solid var(--ts-line);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
}
.dark .ts-chip { background: #0f172a; }
.ts-home-card { transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }
.ts-home-card:hover { transform: translateY(-3px); box-shadow: 0 16px 32px rgba(37, 99, 235, 0.1); border-color: #c7d7fb; }
.ts-select, .ts-input {
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
.dark .ts-select, .dark .ts-input { background: #0f172a; color: #e2e8f0; border-color: #334155; }
.ts-note {
  font-family: "Segoe Script", "Bradley Hand", "Comic Sans MS", cursive;
  color: #64748b;
  font-size: 0.92rem;
  line-height: 1.35;
  transform: rotate(-3deg);
}
.ts-mountain {
  height: 72px;
  background:
    radial-gradient(10px 10px at 88% 22%, #2563eb 0 55%, transparent 56%),
    linear-gradient(180deg, transparent 34%, #e8eef8 34%, #e8eef8 100%);
  -webkit-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 80'><path fill='black' d='M0 80 L80 38 L150 58 L250 16 L340 48 L430 24 L520 56 L610 20 L700 46 L800 12 V80 Z'/></svg>") center / 100% 100% no-repeat;
          mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 80'><path fill='black' d='M0 80 L80 38 L150 58 L250 16 L340 48 L430 24 L520 56 L610 20 L700 46 L800 12 V80 Z'/></svg>") center / 100% 100% no-repeat;
}
.ts-sidebar a {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.55rem 0.7rem;
  border-radius: 12px;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.25;
}
.ts-sidebar a:hover, .ts-sidebar a.is-on { background: #eff6ff; color: #1d4ed8; }
.dark .ts-sidebar a:hover, .dark .ts-sidebar a.is-on { background: #12203a; color: #93c5fd; }
.ts-side-copy { display: block; margin-top: 0.15rem; font-size: 0.68rem; font-weight: 600; color: #94a3b8; }
.ts-formula {
  overflow-x: auto;
  padding: 0.7rem 0.8rem;
  border-radius: 14px;
  background: #f8fafc;
}
.dark .ts-formula { background: #0b1220; }
.ts-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 40px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}
.ts-toggle input {
  width: 2.4rem;
  height: 1.25rem;
  appearance: none;
  border-radius: 999px;
  background: #cbd5e1;
  position: relative;
  cursor: pointer;
}
.ts-toggle input:checked { background: #2563eb; }
.ts-toggle input::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform 160ms ease;
}
.ts-toggle input:checked::after { transform: translateX(18px); }
.ts-toggle input:focus-visible { outline: 2px solid #93c5fd; outline-offset: 2px; }
.ts-wash { background: #f8fafc; }
.ts-wash-blue { background: #eff6ff; }
.ts-wash-violet { background: #f5f3ff; }
.ts-wash-rose { background: #fff1f2; }
.ts-wash-amber { background: #fff7ed; }
.ts-wash-emerald { background: #ecfdf5; }
@media (prefers-reduced-motion: reduce) {
  .ts-studio .ts-btn, .ts-studio .ts-home-card, .ts-studio .ts-toggle input::after { transition: none; }
}
`

export function TimeSeriesStudioStyles() {
  return <style>{CSS}</style>
}
