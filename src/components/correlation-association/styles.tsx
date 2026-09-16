const CSS = `
.corr-studio {
  --corr-blue: #2563eb;
  --corr-blue-soft: #dbeafe;
  --corr-pos: #059669;
  --corr-neg: #dc2626;
  --corr-none: #64748b;
  --corr-ink: #0f172a;
  --corr-muted: #64748b;
  --corr-line: #e8eef6;
  --corr-card: #ffffff;
  --corr-wash: #f6f8fc;
  color: var(--corr-ink);
  background:
    radial-gradient(1200px 420px at 88% -10%, #eef4ff 0%, transparent 58%),
    var(--corr-wash);
}
.dark .corr-studio {
  --corr-ink: #f8fafc;
  --corr-muted: #94a3b8;
  --corr-line: #1e293b;
  --corr-card: #0f172a;
  --corr-wash: #020617;
  background:
    radial-gradient(1200px 420px at 88% -10%, #12203a 0%, transparent 58%),
    var(--corr-wash);
}
.corr-studio * { box-sizing: border-box; }
.corr-card {
  background: var(--corr-card);
  border: 1px solid var(--corr-line);
  border-radius: 22px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.045);
}
.corr-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 40px;
  padding: 0 1.15rem;
  border-radius: 999px;
  background: var(--corr-blue);
  color: #fff;
  font-weight: 700;
  font-size: 0.875rem;
  border: 0;
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
}
.corr-btn:hover { background: #1d4ed8; box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25); }
.corr-btn:focus-visible { outline: 2px solid #93c5fd; outline-offset: 3px; }
.corr-btn:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
.corr-btn-ghost {
  background: #fff;
  color: #334155;
  border: 1px solid #dbe3ee;
}
.dark .corr-btn-ghost { background: #0f172a; color: #e2e8f0; border-color: #334155; }
.corr-btn-ghost:hover { background: #f8fafc; box-shadow: none; }
.corr-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.85rem;
  border-radius: 16px;
  background: #fff;
  border: 1px solid var(--corr-line);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
}
.dark .corr-chip { background: #0f172a; }
.corr-note {
  font-family: "Segoe Script", "Bradley Hand", "Comic Sans MS", cursive;
  color: #64748b;
  font-size: 0.92rem;
  line-height: 1.35;
  transform: rotate(-3deg);
}
.corr-mountain {
  height: 54px;
  background:
    radial-gradient(18px 18px at 86% 18%, #2563eb 0 55%, transparent 56%),
    linear-gradient(180deg, transparent 28%, #e8eef8 28%, #e8eef8 100%);
  -webkit-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 80'><path fill='black' d='M0 80 L70 42 L140 62 L250 18 L330 50 L420 28 L510 58 L600 22 L690 48 L800 10 V80 Z'/></svg>") center / 100% 100% no-repeat;
          mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 80'><path fill='black' d='M0 80 L70 42 L140 62 L250 18 L330 50 L420 28 L510 58 L600 22 L690 48 L800 10 V80 Z'/></svg>") center / 100% 100% no-repeat;
}
.corr-home-card { transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }
.corr-home-card:hover { transform: translateY(-3px); box-shadow: 0 16px 32px rgba(37, 99, 235, 0.1); border-color: #c7d7fb; }
.corr-select, .corr-input {
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
.dark .corr-select, .dark .corr-input { background: #0f172a; color: #e2e8f0; border-color: #334155; }
.corr-sidebar a {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 42px;
  padding: 0.45rem 0.7rem;
  border-radius: 12px;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #64748b;
  text-decoration: none;
}
.corr-sidebar a.is-on {
  background: #eef4ff;
  color: #1d4ed8;
}
.dark .corr-sidebar a.is-on { background: #12203a; color: #93c5fd; }
.corr-sidebar .corr-side-copy {
  display: block;
  margin-top: 0.1rem;
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
}
.corr-meter {
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(90deg, #dc2626 0%, #f8fafc 50%, #059669 100%);
  position: relative;
}
.corr-meter-thumb {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  margin-top: -7px;
  margin-left: -7px;
  border-radius: 50%;
  background: #0f172a;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px #2563eb;
}
.corr-heat {
  width: 100%;
  border-collapse: separate;
  border-spacing: 3px;
}
.corr-heat th, .corr-heat td {
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  border-radius: 8px;
  min-width: 46px;
  height: 36px;
  white-space: nowrap;
}
.corr-heat button {
  width: 100%;
  height: 100%;
  border: 0;
  border-radius: 8px;
  font: inherit;
  cursor: pointer;
}
.corr-heat button:focus-visible { outline: 2px solid #2563eb; outline-offset: 1px; }
.corr-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.corr-table th, .corr-table td {
  padding: 0.35rem 0.45rem;
  border-bottom: 1px solid var(--corr-line);
  text-align: right;
}
.corr-table th:first-child, .corr-table td:first-child { text-align: left; }
.corr-table tr.is-on td { background: #eff6ff; }
.dark .corr-table tr.is-on td { background: #12203a; }
@media (prefers-reduced-motion: reduce) {
  .corr-studio .corr-btn, .corr-studio .corr-home-card { transition: none; }
  .corr-studio .corr-home-card:hover { transform: none; }
}
`

export function CorrelationStudioStyles() {
  return <style>{CSS}</style>
}
