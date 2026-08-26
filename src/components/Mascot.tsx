import {
  cortisolLevel,
  mascotMessage,
  moodForCortisol,
  type Mood,
} from '../domain/mascot'
import type { Todo } from '../domain/todo'
import { useNow } from '../hooks/useNow'

const BAR_COLORS: Record<Mood, string> = {
  zen: 'bg-emerald-500',
  chill: 'bg-lime-500',
  worried: 'bg-amber-500',
  stressed: 'bg-orange-500',
  panic: 'bg-rose-600',
}

function CortisolBar({ value, mood }: { value: number; mood: Mood }) {
  return (
    <div className="mt-2">
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-medium uppercase tracking-wide text-slate-400">
          Cortisol level
        </span>
        <span className="font-semibold tabular-nums text-slate-500">{value}/100</span>
      </div>
      <div
        role="progressbar"
        aria-label="Cortisol level"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2.5 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[mood]}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function KapiSvg({ mood }: { mood: Mood }) {
  return (
    <svg viewBox="0 0 120 110" className="h-24 w-24 shrink-0" aria-hidden="true">
      {/* body */}
      <ellipse cx="60" cy="78" rx="38" ry="26" fill="#b08150" />
      {/* head */}
      <ellipse cx="60" cy="42" rx="30" ry="24" fill="#c19163" />
      {/* ears */}
      <circle cx="38" cy="24" r="7" fill="#a5744a" />
      <circle cx="82" cy="24" r="7" fill="#a5744a" />
      {/* snout */}
      <ellipse cx="60" cy="52" rx="16" ry="11" fill="#d9b18a" />
      <ellipse cx="55" cy="49" rx="2" ry="2.6" fill="#5b4632" />
      <ellipse cx="65" cy="49" rx="2" ry="2.6" fill="#5b4632" />

      {/* eyes per mood */}
      {mood === 'zen' && (
        <g stroke="#4a3826" strokeWidth="2.4" strokeLinecap="round" fill="none">
          <path d="M42 36 q4 4 8 0" />
          <path d="M70 36 q4 4 8 0" />
        </g>
      )}
      {mood === 'chill' && (
        <g fill="#4a3826">
          <circle cx="46" cy="36" r="3.2" />
          <circle cx="74" cy="36" r="3.2" />
        </g>
      )}
      {mood === 'worried' && (
        <g>
          <circle cx="46" cy="37" r="3.4" fill="#4a3826" />
          <circle cx="74" cy="37" r="3.4" fill="#4a3826" />
          <path d="M40 30 l10 3 M80 30 l-10 3" stroke="#4a3826" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
      {mood === 'stressed' && (
        <g>
          <circle cx="46" cy="36" r="5" fill="#fff" />
          <circle cx="74" cy="36" r="5" fill="#fff" />
          <circle cx="46" cy="37" r="2.2" fill="#3a2c1e" />
          <circle cx="74" cy="37" r="2.2" fill="#3a2c1e" />
          <path d="M97 22 q4 8 -2 10 q-6 -3 2 -10" fill="#7cc4f0" />
        </g>
      )}
      {mood === 'panic' && (
        <g>
          <circle cx="46" cy="36" r="6" fill="#fff" />
          <circle cx="74" cy="36" r="6" fill="#fff" />
          <circle cx="46" cy="36" r="1.8" fill="#3a2c1e" />
          <circle cx="74" cy="36" r="1.8" fill="#3a2c1e" />
          <path d="M95 18 q4 8 -2 10 q-6 -3 2 -10" fill="#7cc4f0" />
          <path d="M103 30 q3 6 -1.5 7.5 q-4.5 -2.5 1.5 -7.5" fill="#7cc4f0" />
          <text x="14" y="26" fontSize="16" fontWeight="bold" fill="#e11d48">
            !
          </text>
        </g>
      )}

      {/* mouth per mood */}
      {(mood === 'zen' || mood === 'chill') && (
        <path d="M54 60 q6 5 12 0" stroke="#5b4632" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      )}
      {mood === 'worried' && (
        <path d="M54 61 h12" stroke="#5b4632" strokeWidth="2.2" strokeLinecap="round" />
      )}
      {mood === 'stressed' && (
        <path d="M53 61 q3 -3 7 0 q4 3 7 0" stroke="#5b4632" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      )}
      {mood === 'panic' && <ellipse cx="60" cy="62" rx="4.5" ry="5.5" fill="#5b4632" />}

      {/* zen leaf */}
      {mood === 'zen' && (
        <path d="M60 14 q10 -8 16 0 q-8 6 -16 0" fill="#65a30d" />
      )}
      {/* legs */}
      <rect x="34" y="96" width="9" height="9" rx="4" fill="#a5744a" />
      <rect x="77" y="96" width="9" height="9" rx="4" fill="#a5744a" />
    </svg>
  )
}

export default function Mascot({ todos }: { todos: Todo[] }) {
  const cortisol = cortisolLevel(todos, useNow())
  const mood = moodForCortisol(cortisol)

  return (
    <section
      data-testid="mascot"
      data-mood={mood}
      aria-label="Kapi the mascot"
      className="mb-5 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
    >
      <KapiSvg mood={mood} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-800">Kapi</p>
        <p className="mt-0.5 text-sm text-slate-500">{mascotMessage(mood)}</p>
        <CortisolBar value={cortisol} mood={mood} />
      </div>
    </section>
  )
}
