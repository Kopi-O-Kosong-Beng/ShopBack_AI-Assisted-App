# ShopBack To-Do

A to-do list web app built for the ShopBack AI-Assisted App assessment. It has personal
accounts, XP and a team leaderboard, due dates with a calendar view, and a capybara
mascot whose cortisol level rises with your workload.

**Live demo:** https://shopback-todo.vercel.app
**Evaluator login:** click **Try the demo account** (or use `demo` / `demo1234`).

---

## Features

| Feature | Notes |
| --- | --- |
| Accounts | Sign up with a username, password and ShopBack department. Passwords are hashed with PBKDF2-SHA256 and a per-user salt via Web Crypto. Sessions are restored on the next visit. |
| Add a task | Enter key or the **Add** button, with an optional due date. Titles are trimmed; empty and over-long titles are rejected inline. |
| Edit a task | Inline editor for the title and the due date. Enter saves, Escape cancels. |
| Delete a task | Removes the task immediately. |
| Mark complete | Checkbox toggles a task done, with a live "N items left" counter. |
| XP and levels | 10 XP per completed task, plus 5 XP for finishing on or before the due date. Levels run from Window Shopper to Rebate Royalty. |
| Leaderboard | Ranks everyone by XP with their department, highlighting your row. Seeded with demo colleagues so the board is populated. |
| Calendar | Month grid showing every task on its due date, with overdue tasks flagged. |
| Mascot | Kapi the capybara reacts to your open and overdue tasks through a cortisol bar, from zen to full panic. |
| Onboarding | A four-step guide on first login, reopenable any time from the **?** button. |
| Toasts | Every action confirms itself with a dismissible notification. |
| Persistence | A real SQLite database running in the browser, saved to IndexedDB after every change. |

---

## Tech stack

- **TypeScript** + **React 19**
- **Vite** for the dev server and build
- **Tailwind CSS v4** for styling
- **SQLite** compiled to WebAssembly (`sql.js`), persisted to **IndexedDB**
- **Web Crypto** (PBKDF2-SHA256) for password hashing
- **Vitest** + **React Testing Library** for unit and integration tests
- **Playwright** for end-to-end tests
- **Vercel** for hosting

### Why SQLite in the browser?

The app has no backend, so the database runs client-side as WebAssembly and the whole
file is exported and saved into IndexedDB after each change. That gives real SQL
(tables, foreign keys, migrations) with no server to deploy.

The trade-off is deliberate and documented: **accounts are local to one browser on one
device**. A genuine cross-device login needs a server, which is out of scope here. See
[specs/01-scope.md](specs/01-scope.md).

---

## Getting started

**Requirements:** Node.js 20.19+ (built on Node 24) and npm.

```bash
npm install
npm run dev
```

Then open **http://localhost:3000**.

---

## Available scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server on port 3000. |
| `npm run build` | Type-check with `tsc` and build into `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm test` | Run the unit and integration tests once (Vitest). |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run test:e2e` | Run the Playwright end-to-end tests, starting the dev server automatically. |
| `npm run lint` | Lint the codebase. |

**Before the first e2e run**, install the browser binary:

```bash
npx playwright install chromium
```

---

## Testing

140 unit and integration tests plus 14 end-to-end tests, layered so each level covers
what the others cannot.

- **Unit, bottom-up.** Pure domain rules (`src/domain/`), password hashing, and the
  repositories and services, run against a real in-memory SQLite database. Storage
  failure modes are forced deterministically with an in-memory snapshot adapter.
- **Integration, top-down.** `src/App.test.tsx` renders the whole app and drives it as a
  user would: signing up, adding tasks, earning XP, opening the calendar and leaderboard.
- **End-to-end.** `e2e/todo.spec.ts` runs the real app in Chromium against real
  IndexedDB, including a genuine page reload to prove persistence.

```bash
npm test          # 140 unit + integration tests
npm run test:e2e  # 14 end-to-end tests
```

Two Playwright files are tools rather than tests: `e2e/screenshots.spec.ts` captures the
images in [screenshots/](screenshots/), and `e2e/gen-icons.spec.ts` rasterises the
favicon into exact-size PNGs.

---

## Architecture

```
components  ->  hooks / context  ->  services  ->  pure domain + repositories  ->  SQLite (wasm)  ->  IndexedDB
```

Business rules live in `src/domain/` as pure functions with no React or browser imports,
which is why XP maths, cortisol levels and the calendar grid can be unit-tested without
rendering anything. Components hold no business logic. See
[specs/04-component-architecture.md](specs/04-component-architecture.md).

```
.
├── e2e/                      # Playwright end-to-end tests and tooling
├── screenshots/              # UI screenshots of the working app
├── specs/                    # Pre-implementation design documents
│   ├── 01-scope.md               # scope, assumptions, definition of done
│   ├── 02-use-cases.md           # UC-01..UC-14 with flows and error states
│   ├── 03-domain-model.md        # domain class model
│   ├── 04-component-architecture.md
│   ├── 05-sequence-diagrams.md
│   └── 06-test-plan.md           # test cases per use case
├── src/
│   ├── app/                  # app context, boot, toast system
│   ├── auth/                 # password hashing, session storage
│   ├── components/           # presentational React components
│   ├── db/                   # SQLite setup, migrations, seeding, snapshots
│   ├── domain/               # pure business rules: todo, xp, mascot, calendar
│   ├── hooks/                # useTodos, useNow
│   ├── services/             # auth and todo use cases
│   └── storage/              # SQL repositories
├── prompt.md                 # the initial AI prompt used for this project
└── Reflection.md             # AI usage write-up
```

---

## Known limitations

- **Accounts are per-browser.** There is no server, so signing up on another device
  creates a separate account.
- **XP is a motivator, not a currency.** Tasks are self-entered, so anyone can add and
  complete tasks to raise their own score. Re-completing the same task never pays twice,
  but unlimited task creation cannot be policed without a backend.
- **Demo-grade auth.** PBKDF2 hashing is real, but everything runs client-side, so it is
  suitable for an assessment rather than production.

---

## Deploying

The app is a static build, already deployed on Vercel:

```bash
npm run build
npx vercel deploy --prod
```

---

## Documentation

- [prompt.md](prompt.md): the initial AI prompt, as written.
- [Reflection.md](Reflection.md): AI usage write-up.
- [specs/](specs/): the design documents written before implementation.
