const CSS = `
.reg-studio {
  --reg-blue: #2563eb;
  --reg-navy: #0f172a;
  --reg-ink: #0f172a;
  --reg-muted: #64748b;
  --reg-line: #e6edf6;
  --reg-card: #ffffff;
  --reg-wash: #f5f8fc;
  --reg-ci: #2563eb;
  --reg-pi: #7c3aed;
  color: var(--reg-ink);
  background:
    radial-gradient(1100px 380px at 90% -12%, #e8f0ff 0%, transparent 56%),
    var(--reg-wash);
}
.dark .reg-studio {
  --reg-ink: #f8fafc;
  --reg-muted: #94a3b8;
  --reg-line: #1e293b;
  --reg-card: #0f172a;
  --reg-wash: #020617;
  background:
    radial-gradient(1100px 380px at 90% -12%, #12203a 0%, transparent 56%),
    var(--reg-wash);
}
.reg-studio * { box-sizing: border-box; }
.reg-card {
  background: var(--reg-card);
  border: 1px solid var(--reg-line);
  border-radius: 20px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.045);
}
.reg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 40px;
  padding: 0 1.1rem;
  border-radius: 999px;
  background: var(--reg-blue);
  color: #fff;
  font-weight: 700;
  font-size: 0.875rem;
  border: 0;
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
}
.reg-btn:hover { background: #1d4ed8; box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25); }
.reg-btn:focus-visible { outline: 2px solid #93c5fd; outline-offset: 3px; }
.reg-btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
.reg-btn-ghost {
  background: #fff;
  color: #334155;
  border: 1px solid #dbe3ee;
}
.dark .reg-btn-ghost { background: #0f172a; color: #e2e8f0; border-color: #334155; }
.reg-btn-ghost:hover { background: #f8fafc; box-shadow: none; }
.reg-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.85rem;
  border-radius: 16px;
  background: #fff;
  border: 1px solid var(--reg-line);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
}
.dark .reg-chip { background: #0f172a; }
.reg-home-card { transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }
.reg-home-card:hover { transform: translateY(-3px); box-shadow: 0 16px 32px rgba(37, 99, 235, 0.1); border-color: #c7d7fb; }
.reg-select, .reg-input {
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
.dark .reg-select, .dark .reg-input { background: #0f172a; color: #e2e8f0; border-color: #334155; }
.reg-sidebar a {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 42px;
  padding: 0.42rem 0.7rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  text-decoration: none;
}
.reg-sidebar a.is-on {
  background: #eef4ff;
  color: #1d4ed8;
}
.dark .reg-sidebar a.is-on { background: #12203a; color: #93c5fd; }
.reg-sidebar .reg-side-copy {
  display: block;
  margin-top: 0.1rem;
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
}
.reg-formula {
  border-radius: 16px;
  background: #eef4ff;
  padding: 0.9rem 1rem;
  text-align: center;
}
.dark .reg-formula { background: #12203a; }
.reg-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.reg-table th, .reg-table td {
  padding: 0.38rem 0.45rem;
  border-bottom: 1px solid var(--reg-line);
  text-align: right;
}
.reg-table th:first-child, .reg-table td:first-child { text-align: left; }
.reg-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #475569;
}
.reg-toggle input { accent-color: #2563eb; width: 1.05rem; height: 1.05rem; }
.reg-ok { background: #ecfdf3; color: #166534; }
.reg-warn { background: #fff7ed; color: #9a3412; }
.reg-info { background: #eff6ff; color: #1e3a8a; }
.dark .reg-ok { background: #052e16; color: #bbf7d0; }
.dark .reg-warn { background: #431407; color: #fed7aa; }
.dark .reg-info { background: #172554; color: #bfdbfe; }
@media (prefers-reduced-motion: reduce) {
  .reg-studio .reg-btn, .reg-studio .reg-home-card { transition: none; }
  .reg-studio .reg-home-card:hover { transform: none; }
}
`

export function RegressionStudioStyles() {
  return <style>{CSS}</style>
}
