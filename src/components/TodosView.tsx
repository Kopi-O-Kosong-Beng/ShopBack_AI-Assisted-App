import { activeCount, filterTodos, type Filter, type Todo } from '../domain/todo'
import AddTodoForm from './AddTodoForm'
import EmptyState from './EmptyState'
import FilterBar from './FilterBar'
import Mascot from './Mascot'
import TodoList from './TodoList'

interface Props {
  todos: Todo[]
  filter: Filter
  onFilterChange: (filter: Filter) => void
  onAdd: (title: string, dueDate: number | null) => Promise<string | null>
  onToggle: (id: string) => void
  onEdit: (id: string, title: string, dueDate: number | null) => Promise<string | null>
  onDelete: (id: string) => void
  onClearCompleted: () => void
}

export default function TodosView({
  todos,
  filter,
  onFilterChange,
  onAdd,
  onToggle,
  onEdit,
  onDelete,
  onClearCompleted,
}: Props) {
  const visible = filterTodos(todos, filter)
  const remaining = activeCount(todos)

  return (
    <>
      <Mascot todos={todos} />
      <AddTodoForm onAdd={onAdd} />
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {visible.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <TodoList
            todos={visible}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
        {todos.length > 0 && (
          <FilterBar
            filter={filter}
            onFilterChange={onFilterChange}
            remaining={remaining}
            hasCompleted={todos.length > remaining}
            onClearCompleted={onClearCompleted}
          />
        )}
      </section>
    </>
  )
}
