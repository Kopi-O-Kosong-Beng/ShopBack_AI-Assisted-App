import { useState } from 'react'
import { useReadyApp } from '../app/appContext'
import { useToast } from '../app/toastContext'
import { useTodos } from '../hooks/useTodos'
import { levelForXp, levelProgress, levelTitle } from '../domain/xp'
import CalendarView from './CalendarView'
import Logo from './Logo'
import Leaderboard from './Leaderboard'
import OnboardingTour from './OnboardingTour'
import TodosView from './TodosView'

type Tab = 'tasks' | 'calendar' | 'leaderboard'

const TABS: [Tab, string][] = [
  ['tasks', 'Tasks'],
  ['calendar', 'Calendar'],
  ['leaderboard', 'Leaderboard'],
]

export default function Shell() {
  const { adb, user, logout, refreshUser, completeOnboarding } = useReadyApp()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('tasks')
  const [tourOpen, setTourOpen] = useState(!user.hasSeenOnboarding)
  // Bumped each time the guide is reopened so the tour remounts at step 1.
  const [tourOpenCount, setTourOpenCount] = useState(0)

  const todosApi = useTodos(adb, user.id, ({ xpGained, alreadyAwarded }) => {
    if (xpGained > 0) {
      refreshUser()
      toast.show(`+${xpGained} XP`, 'info')
    } else if (alreadyAwarded) {
      // Explain the zero: XP is banked once per task so it cannot be farmed.
      toast.show('XP already earned for this task', 'muted')
    }
  })

  async function handleAdd(title: string, dueDate: number | null) {
    const error = await todosApi.addTask(title, dueDate)
    // The form shows validation errors inline, so only success gets a toast.
    if (!error) toast.show('Task added')
    return error
  }

  async function handleEdit(id: string, title: string, dueDate: number | null) {
    const error = await todosApi.editTask(id, title, dueDate)
    if (!error) toast.show('Task updated')
    return error
  }

  async function handleDelete(id: string) {
    await todosApi.deleteTask(id)
    toast.show('Task deleted')
  }

  async function handleClearCompleted() {
    const cleared = todosApi.todos.filter((t) => t.completed).length
    await todosApi.clearCompletedTasks()
    toast.show(`Cleared ${cleared} completed ${cleared === 1 ? 'task' : 'tasks'}`)
  }

  const level = levelForXp(user.xp)
  const progress = levelProgress(user.xp)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-semibold tracking-tight text-slate-900">
              ShopBack To-Do
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-800">
                {user.username}
                <span className="ml-1.5 text-xs font-normal text-slate-400">
                  {user.department}
                </span>
              </p>
              <p className="text-xs text-slate-500">
                {levelTitle(level)} · {user.xp} XP
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setTourOpenCount((n) => n + 1)
                setTourOpen(true)
              }}
              aria-label="Open the guide"
              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              ?
            </button>
            <button
              type="button"
              onClick={() => {
                logout()
                toast.show('Signed out. See you soon!', 'muted')
              }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              Log out
            </button>
          </div>

          <div className="w-full sm:hidden">
            <p className="text-sm font-medium text-slate-800">
              {user.username}
              <span className="ml-1.5 text-xs font-normal text-slate-400">
                {levelTitle(level)} · {user.xp} XP
              </span>
            </p>
          </div>

          <div className="w-full">
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-500"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {progress.current}/{progress.needed} XP to level {level + 1}
            </p>
          </div>
        </div>

        <nav className="mx-auto w-full max-w-3xl px-4">
          <div role="tablist" aria-label="Sections" className="flex gap-1">
            {TABS.map(([value, label]) => (
              <button
                key={value}
                role="tab"
                aria-selected={tab === value}
                onClick={() => setTab(value)}
                className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                  tab === value
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        {tab === 'tasks' && (
          <TodosView
            todos={todosApi.todos}
            filter={todosApi.filter}
            onFilterChange={todosApi.setFilter}
            onAdd={handleAdd}
            onToggle={todosApi.toggleTask}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onClearCompleted={handleClearCompleted}
          />
        )}
        {tab === 'calendar' && <CalendarView todos={todosApi.todos} />}
        {tab === 'leaderboard' && <Leaderboard />}
      </main>

      {tourOpen && (
        <OnboardingTour
          key={tourOpenCount}
          onFinish={() => {
            setTourOpen(false)
            completeOnboarding()
          }}
        />
      )}
    </div>
  )
}
