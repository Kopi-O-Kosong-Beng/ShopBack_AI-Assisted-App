# ShopBack To-Do List

A small, fast to-do list web app built for the ShopBack AI-Assisted App assessment.
Tasks are stored in the browser's `localStorage`, so they survive a page refresh with no backend involved.

**Live demo:** _(add your Vercel URL here after deploying)_

---

## Features

| Feature | Notes |
| --- | --- |
| Add a task | Enter key or the **Add** button. Titles are trimmed; empty and whitespace-only titles are rejected with an inline error. |
| Edit a task | **Edit** opens an inline editor. Enter saves, Escape cancels. |
| Delete a task | **Delete** removes the task immediately. |
| Mark complete | Checkbox toggles a task done / not done, with a live "N items left" counter. |
| Persistence | Every change is written to `localStorage` straight away and restored on the next visit. |
| Filter | All / Active / Completed views. |
| Clear completed | Removes every completed task at once. |
| Graceful storage failure | If storage is unavailable or the saved data is unreadable, the app still runs and shows a dismissible warning instead of crashing. |

---

## Tech stack

- **TypeScript** + **React 19**
- **Vite** (dev server and build)
- **Tailwind CSS v4** for styling
- **localStorage** for persistence
- **Vitest** + **React Testing Library** for unit and integration tests
- **Playwright** for end-to-end tests
- **Vercel** for deployment

---

## Getting started

**Requirements:** Node.js 20.19+ (built on Node 24) and npm.

```bash
# 1. install dependencies
npm install

# 2. start the dev server
npm run dev
```

Then open **http://localhost:3000**.

---

## Available scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server on port 3000. |
| `npm run build` | Type-check with `tsc` and build for production into `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm test` | Run the unit + integration tests once (Vitest). |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run test:e2e` | Run the Playwright end-to-end tests. Starts the dev server automatically. |
| `npm run lint` | Lint the codebase. |

**First time running e2e tests only**, install the browser binary:

```bash
npx playwright install chromium
```

---

## Testing

The suite is layered so each level tests something the others cannot:

- **Unit (bottom-up)** — `src/domain/todo.test.ts`, `src/storage/todoRepository.test.ts`.
  Pure logic and the storage boundary, tested in isolation with a mocked `Storage` object so failure modes (unavailable, corrupted data) can be forced deterministically.
- **Integration (top-down)** — `src/components/TodoApp.test.tsx`.
  Renders the real app and drives it the way a user would (typing, clicking, checking boxes) against the real domain, hook, and jsdom `localStorage`.
- **End-to-end** — `e2e/todo.spec.ts`.
  Runs the built app in a real Chromium browser, including a genuine page reload to prove persistence.

```bash
npm test          # 54 unit + integration tests
npm run test:e2e  # 7 end-to-end tests
```

---

## Project structure

```
.
├── e2e/                      # Playwright end-to-end tests
├── screenshots/              # UI screenshots of the working app
├── specs/                    # Pre-implementation design documents
│   ├── 01-scope.md               # scope, assumptions, definition of done
│   ├── 02-use-cases.md           # UC-01..UC-07 with flows and error states
│   ├── 03-domain-model.md        # domain class model
│   ├── 04-component-architecture.md
│   ├── 05-sequence-diagrams.md
│   └── 06-test-plan.md           # test cases per use case
├── src/
│   ├── components/           # presentational React components
│   │   ├── TodoApp.tsx           # container
│   │   ├── AddTodoForm.tsx
│   │   ├── TodoList.tsx
│   │   ├── TodoItem.tsx
│   │   ├── FilterBar.tsx
│   │   ├── EmptyState.tsx
│   │   └── StorageWarning.tsx
│   ├── domain/todo.ts        # pure business rules, no React or browser APIs
│   ├── hooks/useTodos.ts     # state + actions, the only stateful layer
│   ├── storage/todoRepository.ts  # localStorage read/write with validation
│   └── App.tsx
├── prompt.md                 # the initial AI prompt used for this project
└── Reflection.md             # AI usage write-up
```

### Architecture in one line

`components → useTodos hook → pure domain functions + storage repository → localStorage`

Business rules live in `src/domain/todo.ts` as pure functions, which is why they can be unit-tested without rendering React. Components hold no business logic; `useTodos` is the single source of truth. See [specs/04-component-architecture.md](specs/04-component-architecture.md) for the full picture.

---

## Deploying to Vercel

```bash
npm i -g vercel
vercel
```

Vercel auto-detects Vite. If asked, the build command is `npm run build` and the output directory is `dist`.

---

## Documentation

- [prompt.md](prompt.md) — the initial AI prompt, as written.
- [Reflection.md](Reflection.md) — AI usage write-up.
- [specs/](specs/) — the design documents written before implementation.
