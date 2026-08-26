import { activeCount, filterTodos } from '../domain/todo'
import { useTodos } from '../hooks/useTodos'
import AddTodoForm from './AddTodoForm'
import EmptyState from './EmptyState'
import FilterBar from './FilterBar'
import StorageWarning from './StorageWarning'
import TodoList from './TodoList'

export default function TodoApp() {
  const {
    todos,
    filter,
    setFilter,
    storageWarning,
    addTask,
    editTask,
    toggleTask,
    deleteTask,
    clearCompletedTasks,
    dismissWarning,
  } = useTodos()

  const visibleTodos = filterTodos(todos, filter)
  const remaining = activeCount(todos)
  const hasCompleted = todos.length > remaining

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 sm:py-16">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">My Tasks</h1>
        <p className="mt-1 text-slate-500">
          A simple to-do list that saves right here in your browser.
        </p>
      </header>

      {storageWarning && (
        <StorageWarning error={storageWarning} onDismiss={dismissWarning} />
      )}

      <AddTodoForm onAdd={addTask} />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {visibleTodos.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <TodoList
            todos={visibleTodos}
            onToggle={toggleTask}
            onEdit={editTask}
            onDelete={deleteTask}
          />
        )}

        {todos.length > 0 && (
          <FilterBar
            filter={filter}
            onFilterChange={setFilter}
            remaining={remaining}
            hasCompleted={hasCompleted}
            onClearCompleted={clearCompletedTasks}
          />
        )}
      </section>
    </main>
  )
}
