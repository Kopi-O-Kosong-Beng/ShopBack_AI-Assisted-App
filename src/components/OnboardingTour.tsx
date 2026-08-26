import { useState } from 'react'

const STEPS = [
  {
    emoji: '📝',
    title: 'Capture your tasks',
    body: 'Add tasks with an optional due date, edit them inline, and tick them off as you go. Everything is saved instantly to a SQLite database in your browser.',
  },
  {
    emoji: '⭐',
    title: 'Earn XP for finishing',
    body: 'Every completed task earns 10 XP, and finishing on or before the due date adds a 5 XP bonus. Level up from Window Shopper all the way to Rebate Royalty.',
  },
  {
    emoji: '🦫',
    title: 'Keep Kapi calm',
    body: 'Kapi the capybara mirrors your workload. The more open and overdue tasks you have, the higher the cortisol bar climbs, so clear tasks to keep Kapi zen.',
  },
  {
    emoji: '📅',
    title: 'Plan with the calendar',
    body: 'Switch to the Calendar tab to see every task on its due date, spot overdue ones at a glance, and check the Leaderboard to see your team ranking.',
  },
]

interface Props {
  onFinish: () => void
}

/** Rendered only while the tour is open; Shell remounts it to restart at step 1. */
export default function OnboardingTour({ onFinish }: Props) {
  const [step, setStep] = useState(0)

  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to ShopBack To-Do"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <p aria-hidden="true" className="mb-3 text-4xl">
          {current.emoji}
        </p>
        <h2 className="text-lg font-semibold text-slate-900">{current.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{current.body}</p>

        <div className="mt-4 flex gap-1.5" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-brand-600' : 'w-1.5 bg-slate-200'
              }`}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onFinish}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            Skip
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? onFinish() : setStep((s) => s + 1))}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              {isLast ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
