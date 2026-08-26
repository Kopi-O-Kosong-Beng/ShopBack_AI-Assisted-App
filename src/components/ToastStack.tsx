import type { Toast, ToastTone } from '../app/toastContext'

const TONE_STYLES: Record<ToastTone, string> = {
  success: 'bg-slate-900 text-white',
  info: 'bg-brand-600 text-white',
  error: 'bg-rose-600 text-white',
  muted: 'bg-slate-600 text-slate-100',
}

const TONE_ICONS: Record<ToastTone, string> = {
  success: '✓',
  info: 'ℹ',
  error: '!',
  muted: '•',
}

interface Props {
  toasts: Toast[]
  onDismiss: (id: number) => void
}

export default function ToastStack({ toasts, onDismiss }: Props) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`sb-toast pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${TONE_STYLES[toast.tone]}`}
        >
          <span aria-hidden="true" className="text-base leading-none opacity-80">
            {TONE_ICONS[toast.tone]}
          </span>
          <span className="min-w-0 flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
            className="shrink-0 rounded-md px-1.5 text-lg leading-none opacity-70 transition hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
