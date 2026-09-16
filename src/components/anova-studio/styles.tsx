const CSS = `
.anova-studio {
  --anova-blue: #2563eb;
  --anova-navy: #0f172a;
  --anova-ink: #0f172a;
  --anova-muted: #64748b;
  --anova-line: #e6edf6;
  --anova-card: #ffffff;
  --anova-wash: #f5f8fc;
  --anova-a: #2563eb;
  --anova-b: #7c3aed;
  --anova-c: #16a34a;
  --anova-d: #db2777;
  color: var(--anova-ink);
  background:
    radial-gradient(1100px 380px at 92% -10%, #e8f0ff 0%, transparent 56%),
    var(--anova-wash);
}
.dark .anova-studio {
  --anova-ink: #f8fafc;
  --anova-muted: #94a3b8;
  --anova-line: #1e293b;
  --anova-card: #0f172a;
  --anova-wash: #020617;
  background:
    radial-gradient(1100px 380px at 92% -10%, #12203a 0%, transparent 56%),
    var(--anova-wash);
}
.anova-studio * { box-sizing: border-box; }
.anova-card {
  background: var(--anova-card);
  border: 1px solid var(--anova-line);
  border-radius: 20px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.045);
}
.anova-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 40px;
  padding: 0 1.1rem;
  border-radius: 999px;
  background: var(--anova-blue);
  color: #fff;
  font-weight: 700;
  font-size: 0.875rem;
  border: 0;
  cursor: pointer;
  text-decoration: none;
  transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
}
.anova-btn:hover { background: #1d4ed8; box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25); }
.anova-btn:focus-visible { outline: 2px solid #93c5fd; outline-offset: 3px; }
.anova-btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
.anova-btn-ghost {
  background: #fff;
  color: #334155;
  border: 1px solid #dbe3ee;
}
.dark .anova-btn-ghost { background: #0f172a; color: #e2e8f0; border-color: #334155; }
.anova-btn-ghost:hover { background: #f8fafc; box-shadow: none; }
.anova-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.5rem 0.8rem;
  border-radius: 16px;
  background: #fff;
  border: 1px solid var(--anova-line);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
}
.dark .anova-chip { background: #0f172a; }
.anova-home-card { transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }
.anova-home-card:hover { transform: translateY(-3px); box-shadow: 0 16px 32px rgba(37, 99, 235, 0.1); border-color: #c7d7fb; }
.anova-select, .anova-input {
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
.dark .anova-select, .dark .anova-input { background: #0f172a; color: #e2e8f0; border-color: #334155; }
.anova-sidebar a {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 38px;
  padding: 0.4rem 0.65rem;
  border-radius: 12px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #64748b;
  text-decoration: none;
}
.anova-sidebar a:hover { background: #f8fafc; color: #1e293b; }
.dark .anova-sidebar a:hover { background: #12203a; color: #e2e8f0; }
.anova-sidebar a.is-on {
  background: #eef4ff;
  color: #1d4ed8;
}
.dark .anova-sidebar a.is-on { background: #12203a; color: #93c5fd; }
.anova-sidebar a:focus-visible { outline: 2px solid #93c5fd; outline-offset: 2px; }
.anova-formula {
  border-radius: 16px;
  background: #eef4ff;
  padding: 0.9rem 1rem;
  text-align: center;
}
.dark .anova-formula { background: #12203a; }
.anova-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.anova-table th, .anova-table td {
  padding: 0.42rem 0.5rem;
  border-bottom: 1px solid var(--anova-line);
  text-align: right;
}
.anova-table th:first-child, .anova-table td:first-child { text-align: left; }
.anova-table button {
  width: 100%;
  background: transparent;
  border: 0;
  color: inherit;
  font: inherit;
  text-align: inherit;
  cursor: pointer;
  border-radius: 8px;
  padding: 0.15rem 0.2rem;
}
.anova-table button:hover, .anova-table tr.is-on td { background: #eff6ff; }
.dark .anova-table button:hover, .dark .anova-table tr.is-on td { background: #12203a; }
.anova-table button:focus-visible { outline: 2px solid #93c5fd; }
.anova-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #475569;
}
.anova-toggle input { accent-color: #2563eb; width: 1.05rem; height: 1.05rem; }
.anova-ok { background: #ecfdf3; color: #166534; }
.anova-warn { background: #fff7ed; color: #9a3412; }
.anova-info { background: #eff6ff; color: #1e3a8a; }
.dark .anova-ok { background: #052e16; color: #bbf7d0; }
.dark .anova-warn { background: #431407; color: #fed7aa; }
.dark .anova-info { background: #172554; color: #bfdbfe; }
.anova-hero {
  border-radius: 28px;
  background:
    radial-gradient(520px 180px at 88% 10%, #e0eaff 0%, transparent 60%),
    linear-gradient(180deg, #f8fbff 0%, #ffffff 70%);
  border: 1px solid var(--anova-line);
  padding: 1.4rem 1.5rem 1.2rem;
}
.dark .anova-hero {
  background:
    radial-gradient(520px 180px at 88% 10%, #12203a 0%, transparent 60%),
    linear-gradient(180deg, #0b1220 0%, #0f172a 70%);
}
.anova-sig {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  font-size: 11px;
  font-weight: 800;
}
.anova-sig-yes { background: #ecfdf3; color: #166534; }
.anova-sig-no { background: #f1f5f9; color: #475569; }
@media (prefers-reduced-motion: reduce) {
  .anova-studio .anova-btn, .anova-studio .anova-home-card { transition: none; }
  .anova-studio .anova-home-card:hover { transform: none; }
}
@media (max-width: 900px) {
  .anova-chrome { grid-template-columns: 1fr !important; }
}
`

export function AnovaStudioStyles() {
  return <style>{CSS}</style>
}
