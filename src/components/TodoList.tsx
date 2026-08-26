import type { Todo } from '../domain/todo'
import TodoItem from './TodoItem'

interface Props {
  todos: Todo[]
  onToggle: (id: string) => void
  onEdit: (id: string, title: string, dueDate: number | null) => Promise<string | null>
  onDelete: (id: string) => void
}

export default function TodoList({ todos, onToggle, onEdit, onDelete }: Props) {
  return (
    <ul aria-label="Task list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}
