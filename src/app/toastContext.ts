import { createContext, useContext } from 'react'

export type ToastTone = 'success' | 'info' | 'error' | 'muted'

export interface Toast {
  id: number
  message: string
  tone: ToastTone
}

export interface ToastApi {
  show(message: string, tone?: ToastTone): void
  dismiss(id: number): void
  toasts: Toast[]
}

export const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
