export const fmt = (value: number, digits = 2) => Number.isFinite(value) ? value.toFixed(digits) : '—'
export const fmtP = (value: number) => value < 0.001 ? '< 0.001' : fmt(value, 3)
