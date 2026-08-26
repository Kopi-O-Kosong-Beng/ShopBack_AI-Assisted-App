# 05 — Sequence Diagrams

This document shows the runtime interactions for each main use case of the To-Do List app. Every diagram follows the same layered flow: a UI component calls an action on the `useTodos` hook, the hook delegates to pure domain functions, React state updates, and a `useEffect` auto-saves the new list through the storage repository to browser localStorage.

## How to read these diagrams

| Participant | Maps to |
| --- | --- |
| User | Person using the app in a browser |
| AddTodoForm / TodoItem / TodoApp | React component in `src/components/` that initiates the flow |
| useTodos | `src/hooks/useTodos.ts` — state, actions, and the auto-save effect |
| Domain | `src/domain/todo.ts` — pure, immutable functions |
| Repository | `src/storage/todoRepository.ts` — load and save with error handling |
| localStorage | Browser `localStorage`, keyed by `shopback-todo.v1` |

Two conventions apply throughout:

- **Auto-save**: any state change re-runs the hook's `useEffect`, which calls `saveTodos`. It is shown in full in UC-01 and abbreviated with a note in later diagrams.
- **Error returns, not exceptions**: `addTask` and `editTask` return an error message string on validation failure and `null` on success; the component renders the string inline.

---

## UC-01 Add task — happy path

The user types a title and submits. The hook validates and trims the title, builds a new `Todo`, prepends it so the newest task appears on top, and the auto-save effect persists the new list.

```mermaid
sequenceDiagram
    actor User
    participant Form as AddTodoForm
    participant Hook as useTodos
    participant Domain
    participant Repo as Repository
    participant LS as localStorage

    User->>Form: type title and press Add
    Form->>Hook: addTask raw title
    Hook->>Domain: validateTitle raw
    Domain-->>Hook: ok true with trimmed value
    Hook->>Domain: createTodo value, id, now
    Domain-->>Hook: new Todo
    Hook->>Domain: addTodo todos, todo
    Domain-->>Hook: new list, newest first
    Hook->>Hook: setState new list
    Hook-->>Form: null means success
    Form->>Form: clear input
    Note over Hook,LS: after render the auto-save effect runs
    Hook->>Repo: saveTodos todos
    Repo->>LS: setItem STORAGE_KEY with JSON
    Repo-->>Hook: true
    opt saveTodos returns false
        Hook->>Hook: set storageWarning
        Note over Form,Hook: StorageWarning banner shown, app keeps running in memory
    end
```

## UC-01 Add task — validation error path

Submitting an empty or whitespace-only title is rejected before any state change; the same path applies to titles over 200 characters with a different message. The Repository and localStorage lifelines stay idle — nothing is saved.

```mermaid
sequenceDiagram
    actor User
    participant Form as AddTodoForm
    participant Hook as useTodos
    participant Domain
    participant Repo as Repository
    participant LS as localStorage

    User->>Form: press Add with empty input
    Form->>Hook: addTask raw title
    Hook->>Domain: validateTitle raw
    Domain-->>Hook: ok false, Task cannot be empty
    Hook-->>Form: error message
    Form->>Form: show inline error, keep input
    Note over Hook,LS: no state change and no save
```

## UC-02 Edit task title

The user activates inline editing on a task, then either saves a valid title, attempts an invalid save, or cancels. On an invalid save the task keeps its old title and stays in edit mode; Escape or Cancel discards the draft without touching the hook.

```mermaid
sequenceDiagram
    actor User
    participant Item as TodoItem
    participant Hook as useTodos
    participant Domain
    participant Repo as Repository
    participant LS as localStorage

    User->>Item: start edit
    Item->>Item: enter edit mode with current title
    alt save valid title with Enter
        User->>Item: change text and press Enter
        Item->>Hook: editTask id and new title
        Hook->>Domain: validateTitle raw
        Domain-->>Hook: ok true with trimmed value
        Hook->>Domain: editTodoTitle todos, id, value
        Domain-->>Hook: updated list
        Hook->>Hook: setState updated list
        Hook-->>Item: null means success
        Item->>Item: exit edit mode
        Note over Hook,LS: auto-save effect
        Hook->>Repo: saveTodos todos
        Repo->>LS: setItem STORAGE_KEY with JSON
    else save invalid title with Enter
        User->>Item: clear text and press Enter
        Item->>Hook: editTask id and empty title
        Hook->>Domain: validateTitle raw
        Domain-->>Hook: ok false with error
        Hook-->>Item: error message
        Item->>Item: show inline error and stay in edit mode
        Note over Hook,LS: no state change, task keeps old title
    else cancel with Escape
        User->>Item: press Escape or Cancel
        Item->>Item: discard draft and exit edit mode
        Note over Item,Hook: no hook call and no state change
    end
```

## UC-03 Delete task

Deletion is immediate by design — no confirmation dialog and no undo. The domain returns a new list without the task and the auto-save effect persists it.

```mermaid
sequenceDiagram
    actor User
    participant Item as TodoItem
    participant Hook as useTodos
    participant Domain
    participant Repo as Repository
    participant LS as localStorage

    User->>Item: click Delete
    Note over User,Item: immediate, no confirmation dialog
    Item->>Hook: deleteTask id
    Hook->>Domain: deleteTodo todos, id
    Domain-->>Hook: list without the task
    Hook->>Hook: setState new list
    Note over Hook,LS: auto-save effect
    Hook->>Repo: saveTodos todos
    Repo->>LS: setItem STORAGE_KEY with JSON
```

## UC-04 Mark task complete / incomplete

Clicking the checkbox flips the task's `completed` flag immutably. The same flow handles both directions; the FilterBar counter and any active filter re-render from the new state.

```mermaid
sequenceDiagram
    actor User
    participant Item as TodoItem
    participant Hook as useTodos
    participant Domain
    participant Repo as Repository
    participant LS as localStorage

    User->>Item: click checkbox
    Item->>Hook: toggleTask id
    Hook->>Domain: toggleTodo todos, id
    Domain-->>Hook: list with completed flipped
    Hook->>Hook: setState new list
    Note over Item,Hook: item restyles, items-left counter updates
    Note over Hook,LS: auto-save effect
    Hook->>Repo: saveTodos todos
    Repo->>LS: setItem STORAGE_KEY with JSON
```

## UC-05 Persist and restore tasks — startup and restore

On mount, `useTodos` calls `loadTodos` exactly once. The repository distinguishes four outcomes: valid stored data, no data yet, corrupted JSON, and inaccessible storage — the last two surface a dismissible StorageWarning banner while the app keeps working.

```mermaid
sequenceDiagram
    actor User
    participant App as TodoApp
    participant Hook as useTodos
    participant Domain
    participant Repo as Repository
    participant LS as localStorage

    User->>App: open app
    App->>Hook: mount calls useTodos
    Hook->>Repo: loadTodos
    Repo->>LS: getItem STORAGE_KEY
    alt stored data ok
        LS-->>Repo: JSON string
        Repo->>Repo: parse and isValidTodoArray passes
        Repo-->>Hook: todos with no error
        Hook-->>App: todos
        App-->>User: render task list
    else no stored data
        LS-->>Repo: null
        Repo-->>Hook: empty list with no error
        Hook-->>App: empty todos
        App-->>User: render EmptyState
    else corrupted JSON
        LS-->>Repo: unreadable or invalid data
        Repo->>Repo: parse fails or shape check fails
        Repo-->>Hook: empty list with corrupted error
        Hook->>Hook: set storageWarning
        Hook-->>App: empty todos and warning
        App-->>User: render EmptyState and StorageWarning banner
        Note over Repo,LS: next successful save overwrites the bad data
    else storage unavailable
        LS--xRepo: access throws
        Repo-->>Hook: empty list with unavailable error
        Hook->>Hook: set storageWarning
        Hook-->>App: empty todos and warning
        App-->>User: render StorageWarning banner, app runs in memory
    end
```
