import { AppProvider } from './app/AppProvider'
import { useApp } from './app/appContext'
import AuthPage from './components/AuthPage'
import Shell from './components/Shell'
import { browserDatabase } from './db/browserDatabase'
import type { AppDatabase } from './db/database'

function BootScreen({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <p className="text-slate-500">{message}</p>
    </main>
  )
}

function Router() {
  const { status, user, dbLoadError } = useApp()

  if (status === 'booting') return <BootScreen message="Loading ShopBack To-Do…" />
  if (status === 'error') {
    return (
      <BootScreen message="The local database could not be started. Please reload the page." />
    )
  }

  return (
    <>
      {dbLoadError && (
        <div className="bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
          Your saved data could not be read, so the app started with a fresh database.
        </div>
      )}
      {user ? <Shell /> : <AuthPage />}
    </>
  )
}

export default function App({
  createDatabase = browserDatabase,
}: {
  createDatabase?: () => Promise<{ adb: AppDatabase; loadError: boolean }>
}) {
  return (
    <AppProvider createDatabase={createDatabase}>
      <Router />
    </AppProvider>
  )
}
