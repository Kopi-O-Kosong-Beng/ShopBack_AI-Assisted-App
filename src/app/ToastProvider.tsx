import { useCallback, useRef, useState, type ReactNode } from 'react'
import ToastStack from '../components/ToastStack'
import { ToastContext, type Toast, type ToastTone } from './toastContext'

const AUTO_DISMISS_MS = 3200
/** Ticking off several tasks quickly should not bury the screen in toasts. */
const MAX_VISIBLE = 3

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = nextId.current++
      setToasts((current) => [...current, { id, message, tone }].slice(-MAX_VISIBLE))
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ show, dismiss, toasts }}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}
