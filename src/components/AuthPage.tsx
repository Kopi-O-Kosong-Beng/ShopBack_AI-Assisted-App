import { useState, type FormEvent } from 'react'
import { useApp } from '../app/appContext'
import { DEPARTMENTS } from '../domain/user'
import Logo from './Logo'

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100'
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-600'

function LoginForm() {
  const { login } = useApp()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    const failure = await login({ username, password })
    setBusy(false)
    if (failure) setError(failure)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="login-username" className={labelClass}>
          Username
        </label>
        <input
          id="login-username"
          type="text"
          value={username}
          autoComplete="username"
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="login-password" className={labelClass}>
          Password
        </label>
        <input
          id="login-password"
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-brand-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 disabled:opacity-60"
      >
        Log in
      </button>
    </form>
  )
}

function SignupForm() {
  const { signup } = useApp()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    const failure = await signup({ username, password, department })
    setBusy(false)
    if (failure) setError(failure)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="signup-username" className={labelClass}>
          Username
        </label>
        <input
          id="signup-username"
          type="text"
          value={username}
          autoComplete="username"
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="signup-password" className={labelClass}>
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          value={password}
          autoComplete="new-password"
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-slate-400">At least 8 characters.</p>
      </div>
      <div>
        <label htmlFor="signup-department" className={labelClass}>
          Department
        </label>
        <select
          id="signup-department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className={inputClass}
        >
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-brand-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 disabled:opacity-60"
      >
        Create account
      </button>
    </form>
  )
}

export default function AuthPage() {
  const { loginDemo } = useApp()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [demoError, setDemoError] = useState<string | null>(null)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <header className="mb-6 text-center">
        <div className="mb-3 flex justify-center">
          <Logo size={60} animated />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          ShopBack To-Do
        </h1>
        <p className="mt-1 text-slate-500">
          Your tasks, your XP, and one very chill capybara.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div role="tablist" aria-label="Authentication" className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          {(
            [
              ['login', 'Log in'],
              ['signup', 'Sign up'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              role="tab"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                mode === value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'login' ? <LoginForm /> : <SignupForm />}

        <div className="mt-5 border-t border-slate-100 pt-4 text-center">
          <button
            type="button"
            onClick={async () => setDemoError(await loginDemo())}
            className="w-full rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 font-medium text-brand-700 transition hover:bg-brand-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            Try the demo account
          </button>
          <p className="mt-2 text-xs text-slate-400">
            For evaluators: instant login as <code>demo</code> / <code>demo1234</code>.
          </p>
          {demoError && (
            <p role="alert" className="mt-2 text-sm text-rose-600">
              {demoError}
            </p>
          )}
        </div>
      </section>

      <p className="mt-4 text-center text-xs text-slate-400">
        Accounts live in this browser only — the database is SQLite running locally via
        WebAssembly.
      </p>
    </main>
  )
}
