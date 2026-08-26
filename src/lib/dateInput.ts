/** Converts an <input type="date"> value to local-midnight epoch ms, or null when empty. */
export function parseDueInput(value: string): number | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).getTime()
}

/** Converts a due date back into the <input type="date"> value format. */
export function toDateInputValue(ts: number | null): string {
  if (ts === null) return ''
  const d = new Date(ts)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}
