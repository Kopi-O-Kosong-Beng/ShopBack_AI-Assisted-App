const SESSION_KEY = 'shopback-todo.session.v1'

export function getSession(): { userId: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as { userId?: unknown }).userId === 'string'
    ) {
      return { userId: (parsed as { userId: string }).userId }
    }
    return null
  } catch {
    return null
  }
}

export function saveSession(userId: string): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }))
  } catch {
    // Session persistence is a convenience; failing to save only means
    // the user logs in again next visit.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // Ignore.
  }
}
