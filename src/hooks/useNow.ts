import { useEffect, useState } from 'react'

/**
 * A clock the UI can read during render. Date.now() called straight from a
 * component body is impure and never re-renders when the day rolls over, so
 * "Today" / "Overdue" badges would silently go stale on a long-open tab.
 */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])

  return now
}
