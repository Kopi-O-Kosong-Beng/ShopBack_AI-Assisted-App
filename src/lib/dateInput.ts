/**
 * Converts an <input type="date"> value to local-midnight epoch ms, or null
 * when empty or malformed. Strict on shape: some browsers surface partial or
 * non-conforming values, and a NaN here would slip past every null check and
 * end up stored as a broken due date.
 */
export function parseDueInput(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const ts = new Date(year, month - 1, day).getTime()
  return Number.isNaN(ts) ? null : ts
}

/** Converts a due date back into the <input type="date"> value format. */
export function toDateInputValue(ts: number | null): string {
  if (ts === null) return ''
  const d = new Date(ts)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}
