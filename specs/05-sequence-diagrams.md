# 05 - Sequence Diagrams

This document shows the runtime interactions for the main use cases of the ShopBack To-Do app (v2). Every flow follows the same layered path: a UI component calls an action exposed by the hooks/context layer (`useApp` from `AppContext` for auth and onboarding, the `useTodos` hook for task mutations), which delegates to a service (`authService` or `todoService`); services combine pure domain functions with repository calls against the in-browser SQLite database (sql.js), and after every mutation the service persists the whole database as a binary snapshot into IndexedDB.

## How to read these diagrams

| Participant | Maps to |
| --- | --- |
| User | Person using the app in a browser |
| AuthPage / LoginForm / SignupForm | Auth components in `src/components/` |
| AddTodoForm / TodoItem / TodosView | Task components in `src/components/` |
| Shell / Leaderboard / OnboardingTour | Shell-level components in `src/components/` |
| AppContext | `src/app/AppContext.tsx` - `AppProvider` boots the app; `useApp` exposes `adb`, `user`, auth actions, and `completeOnboarding` |
| useTodos | `src/hooks/useTodos.ts` - task state for the logged-in user; delegates every mutation to `todoService` and re-queries via `todoSqlRepository.listByUser` afterwards |
| AuthService | `src/services/authService.ts` - signup, login, demo login, legacy import |
| TodoService | `src/services/todoService.ts` - task mutations, XP award, snapshot persistence |
| Domain | Pure functions in `src/domain/` - `todo.ts`, `xp.ts`, `mascot.ts`, `calendar.ts` |
| Password | `src/auth/password.ts` - PBKDF2-SHA256 hashing |
| WebCrypto | Browser Web Crypto API used by Password |
| SessionStore | `src/auth/sessionStore.ts` - localStorage key `shopback-todo.session.v1` |
| UserRepo | `src/storage/userRepository.ts` - SQL access to the `users` table |
| TodoRepo | `src/storage/todoSqlRepository.ts` - SQL access to the `todos` table |
| AppDatabase | `src/db/database.ts` - sql.js SQLite database with `persist` and `close` |
| IndexedDB | Browser IndexedDB holding the binary database snapshot |
| localStorage | Browser localStorage - the session key and the legacy v1 task key `shopback-todo.v1` |

Three conventions apply throughout:

- **Persist after every mutation**: instead of the v1 auto-save effect, each service mutation ends by calling `persist` on `AppDatabase`, which exports the database to bytes and writes the snapshot into IndexedDB. It is shown in full in UC-01 and abbreviated with a note in later diagrams. Reads never persist.
- **Error returns, not exceptions**: validation failures come back as error message strings and `null` means success; the component renders the string inline. Only a failed database boot surfaces as an error screen.
- **State refresh**: after a successful mutation the hooks/context layer re-reads the affected rows and React re-renders; derived UI such as the mascot mood, due badges, and the items-left counter recompute from the new state.

---

## UC-05 Persist and restore tasks - startup

On first paint, `AppProvider` boots the database and restores the session. `createAppDatabase` loads the sql.js WASM binary, asks the IndexedDB storage adapter for an existing snapshot, and either opens it and runs any pending migrations recorded in the `meta` table, or creates a fresh schema and seeds the demo account plus 7 demo colleagues. A stored session then decides whether the user lands in the Shell or on the AuthPage.

```mermaid
sequenceDiagram
    actor User
    participant App as AppProvider
    participant DB as AppDatabase
    participant IDB as IndexedDB
    participant Sess as SessionStore
    participant UserRepo
    participant TodoRepo

    User->>App: open app
    App->>DB: createAppDatabase with wasm binary and IndexedDB adapter
    DB->>IDB: read snapshot bytes
    alt snapshot exists
        IDB-->>DB: bytes
        DB->>DB: open database from bytes
        DB->>DB: run pending migrations via meta schema version
    else fresh database
        IDB-->>DB: nothing stored
        DB->>DB: create schema users todos meta
        DB->>DB: seed demo account and 7 demo colleagues
        DB->>IDB: persist first snapshot
    end
    DB-->>App: AppDatabase ready
    App->>Sess: getSession
    alt session found and user exists
        Sess-->>App: userId
        App->>UserRepo: findById userId
        UserRepo-->>App: user
        App->>TodoRepo: listByUser userId
        TodoRepo-->>App: todos for this user
        App-->>User: render Shell with Tasks tab
    else no session or user missing
        Sess-->>App: null
        App-->>User: render AuthPage
    end
    opt boot fails
        Note over App,IDB: WASM load or IndexedDB error renders a boot error screen with a retry action, replacing the v1 StorageWarning banner
    end
```

## UC-01 Add task - happy path

The user types a title, optionally picks a due date, and submits. The service validates and trims the title, builds a new `Todo` with `xpAwarded` false, inserts it for the current user, and persists the snapshot. The newest task appears on top.

```mermaid
sequenceDiagram
    actor User
    participant Form as AddTodoForm
    participant Hook as useTodos
    participant Svc as TodoService
    participant Domain
    participant TodoRepo
    participant DB as AppDatabase
    participant IDB as IndexedDB

    User->>Form: type title, pick optional due date, press Add
    Form->>Hook: addTask title and dueDate
    Hook->>Svc: addTask adb, userId, title, dueDate
    Svc->>Domain: validateTitle raw
    Domain-->>Svc: ok true with trimmed value
    Svc->>Domain: createTodo value, id, now, dueDate
    Domain-->>Svc: new Todo with xpAwarded false
    Svc->>TodoRepo: insert userId, todo
    TodoRepo->>DB: run INSERT INTO todos
    Svc->>DB: persist
    DB->>DB: export database to bytes
    DB->>IDB: write snapshot
    Svc-->>Hook: null means success
    Hook->>Hook: refresh todos state
    Hook-->>Form: success
    Form->>Form: clear inputs, newest task on top with due badge
```

## UC-01 Add task - validation error path

Submitting an empty or whitespace-only title is rejected before any write; the same path applies to titles over 200 characters with a different message. The repository, database, and IndexedDB lifelines stay idle - nothing is saved.

```mermaid
sequenceDiagram
    actor User
    participant Form as AddTodoForm
    participant Hook as useTodos
    participant Svc as TodoService
    participant Domain
    participant TodoRepo
    participant DB as AppDatabase

    User->>Form: press Add with empty input
    Form->>Hook: addTask raw title
    Hook->>Svc: addTask adb, userId, raw title
    Svc->>Domain: validateTitle raw
    Domain-->>Svc: ok false, Task cannot be empty
    Svc-->>Hook: error message
    Hook-->>Form: error message
    Form->>Form: show inline error, keep input
    Note over Svc,DB: no write and no snapshot persist
```

## UC-02 Edit task title (and due date)

The user activates inline editing on a task, then either saves valid changes, attempts an invalid save, or cancels. A save can change the title, the due date, or both; past due dates are allowed. On an invalid title the task keeps its old values and stays in edit mode; Escape or Cancel discards the draft without touching the service.

```mermaid
sequenceDiagram
    actor User
    participant Item as TodoItem
    participant Hook as useTodos
    participant Svc as TodoService
    participant Domain
    participant TodoRepo
    participant DB as AppDatabase

    User->>Item: start edit
    Item->>Item: enter edit mode with current title and due date
    alt save valid changes with Enter
        User->>Item: change text or due date and press Enter
        Item->>Hook: editTask id, title, dueDate
        Hook->>Svc: editTask adb, id, title, dueDate
        Svc->>Domain: validateTitle raw
        Domain-->>Svc: ok true with trimmed value
        Svc->>TodoRepo: updateTitle id, value
        Svc->>TodoRepo: updateDueDate id, dueDate
        Note over Svc,DB: persist snapshot
        Svc-->>Hook: null means success
        Hook-->>Item: success
        Item->>Item: exit edit mode, due badge re-renders
    else save invalid title with Enter
        User->>Item: clear text and press Enter
        Item->>Hook: editTask id, empty title
        Hook->>Svc: editTask adb, id, empty title
        Svc->>Domain: validateTitle raw
        Domain-->>Svc: ok false with error
        Svc-->>Hook: error message
        Hook-->>Item: error message
        Item->>Item: show inline error and stay in edit mode
        Note over Svc,DB: no write and no persist, task keeps old values
    else cancel with Escape
        User->>Item: press Escape or Cancel
        Item->>Item: discard draft and exit edit mode
        Note over Item,Hook: no service call and no state change
    end
```

## UC-03 Delete task

Deletion is immediate by design - no confirmation dialog and no undo. The row is removed from the `todos` table and the snapshot persisted. XP already earned from the task is kept, because XP lives on the user row, not the task.

```mermaid
sequenceDiagram
    actor User
    participant Item as TodoItem
    participant Hook as useTodos
    participant Svc as TodoService
    participant TodoRepo
    participant DB as AppDatabase

    User->>Item: click Delete
    Note over User,Item: immediate, no confirmation dialog
    Item->>Hook: deleteTask id
    Hook->>Svc: deleteTask adb, id
    Svc->>TodoRepo: remove id
    TodoRepo->>DB: run DELETE FROM todos for this id
    Note over Svc,DB: persist snapshot
    Svc-->>Hook: done
    Hook->>Hook: refresh todos, mascot cortisol drops
```

UC-07 Clear completed tasks follows this exact pattern with `clearCompletedTasks`, which removes every completed row for the current user in one statement before persisting.

## UC-04 Mark task complete / incomplete and UC-10 Earn XP and level up

Clicking the checkbox flips `completed` through `setCompleted`. Completing a task for the first time awards `COMPLETION_XP` 10, plus `ON_TIME_BONUS_XP` 5 when the task has a due date and is completed on or before the end of that day - `completionXp` in `src/domain/xp.ts` decides the amount. The `xpAwarded` flag guarantees XP is granted at most once per task: un-ticking keeps the XP and re-ticking awards nothing.

```mermaid
sequenceDiagram
    actor User
    participant Item as TodoItem
    participant Hook as useTodos
    participant Svc as TodoService
    participant XP as Domain xp
    participant TodoRepo
    participant UserRepo
    participant DB as AppDatabase

    User->>Item: click checkbox
    Item->>Hook: toggleTask id
    Hook->>Svc: toggleTask adb, userId, id
    alt completing and xpAwarded is false
        Svc->>TodoRepo: setCompleted id true
        Svc->>XP: completionXp todo, completedAt
        XP-->>Svc: 10 or 15 with on time bonus
        Svc->>UserRepo: addXp userId, amount
        Svc->>TodoRepo: markXpAwarded id
        Svc-->>Hook: xpGained amount
        Hook-->>Item: XP toast, header chip updates, level up if a 50 XP threshold is crossed
    else completing but xpAwarded already true
        Svc->>TodoRepo: setCompleted id true
        Note over Svc,UserRepo: no XP calls, re-ticking cannot farm XP
        Svc-->>Hook: xpGained 0
    else un-completing
        Svc->>TodoRepo: setCompleted id false
        Note over Svc,UserRepo: XP is kept and xpAwarded stays true
        Svc-->>Hook: xpGained 0
    end
    Note over Svc,DB: persist snapshot after the mutation
    Hook->>Hook: refresh todos and user, items-left counter and mascot recompute
```

## UC-08 Sign up for an account

Signup validates the username, password, and department, checks uniqueness, hashes the password with a fresh per-user salt via Web Crypto, and inserts the user with `xp` 0 and `has_seen_onboarding` 0. If the legacy v1 localStorage key still holds tasks, they are imported into the new account exactly once and the key is removed, so a second account on the same browser cannot import them again.

```mermaid
sequenceDiagram
    actor User
    participant Form as SignupForm
    participant Auth as AuthService
    participant UserRepo
    participant Pwd as Password
    participant WC as WebCrypto
    participant TodoRepo
    participant LS as localStorage
    participant Sess as SessionStore
    participant DB as AppDatabase

    User->>Form: enter username, password, department and submit
    Form->>Auth: signup username, password, department
    Auth->>Auth: validate username 3 to 20 alphanumeric, password min 8 chars, department from DEPARTMENTS
    Auth->>UserRepo: findByUsername
    alt username already taken
        UserRepo-->>Auth: existing user
        Auth-->>Form: error, username is taken
        Form->>Form: show inline error
    else username free
        UserRepo-->>Auth: null
        Auth->>Pwd: hashPassword password
        Pwd->>WC: PBKDF2 SHA-256 with 100000 iterations and random salt
        WC-->>Pwd: derived key
        Pwd-->>Auth: hash and salt
        Auth->>UserRepo: insertUser with xp 0 and has_seen_onboarding 0
        Auth->>LS: read legacy key shopback-todo.v1
        opt legacy v1 tasks found
            LS-->>Auth: stored task array
            Auth->>TodoRepo: insert each imported task for the new user
            Auth->>LS: remove legacy key
            Note over Auth,LS: one-time import, the key is gone afterwards
        end
        Note over Auth,DB: persist snapshot
        Auth->>Sess: saveSession userId
        Auth-->>Form: user
        Form-->>User: enter Shell, onboarding tour opens per UC-14
    end
```

## UC-09 Log in and log out

Login looks the user up, verifies the password by re-deriving the PBKDF2 hash with the stored salt, and saves the session. Unknown username and wrong password deliberately return the same generic message so the form cannot be used to probe which accounts exist. The demo button on the AuthPage runs this same flow with the seeded credentials, username demo and password demo1234.

```mermaid
sequenceDiagram
    actor User
    participant Form as LoginForm
    participant Auth as AuthService
    participant UserRepo
    participant Pwd as Password
    participant Sess as SessionStore
    participant Ctx as AppContext

    User->>Form: enter username and password, submit
    Note over User,Form: the demo button submits demo and demo1234 through the same path
    Form->>Auth: login username, password
    Auth->>UserRepo: findByUsername
    alt unknown user
        UserRepo-->>Auth: null
        Auth-->>Form: error, invalid username or password
        Note over Auth,Form: same message as wrong password, no account probing
    else user found
        UserRepo-->>Auth: user with password hash and salt
        Auth->>Pwd: verifyPassword password, hash, salt
        alt wrong password
            Pwd-->>Auth: false
            Auth-->>Form: error, invalid username or password
        else correct password
            Pwd-->>Auth: true
            Auth->>Sess: saveSession userId
            Auth-->>Form: user
            Ctx->>Ctx: set user and load their todos
            Form-->>User: render Shell with Tasks tab
        end
    end
    Note over Auth,Sess: login is read only against the database, no snapshot persist
```

Logging out clears only the session - the database and its snapshot are untouched, so the account and its tasks are still there on the next login.

```mermaid
sequenceDiagram
    actor User
    participant Shell
    participant Ctx as AppContext
    participant Sess as SessionStore

    User->>Shell: click Logout
    Shell->>Ctx: logout
    Ctx->>Sess: clearSession
    Ctx->>Ctx: clear user and todos state
    Ctx-->>User: render AuthPage
```

## UC-11 View the leaderboard

The Leaderboard tab is a pure read. `listLeaderboard` returns every user ordered by XP descending, then domain functions apply competition ranking - tied XP shares a rank and the next rank is skipped - and map XP to level titles. The current user's row is highlighted and the UI notes that the seeded rows are demo colleagues.

```mermaid
sequenceDiagram
    actor User
    participant LB as Leaderboard
    participant Ctx as AppContext
    participant UserRepo
    participant XP as Domain xp
    participant DB as AppDatabase

    User->>LB: open Leaderboard tab
    LB->>Ctx: read adb via useApp
    Ctx-->>LB: adb handle
    LB->>UserRepo: listLeaderboard
    UserRepo->>DB: SELECT users ordered by xp descending
    DB-->>UserRepo: all users including demo colleagues
    UserRepo-->>LB: rows with username, department, xp
    LB->>XP: rankUsers rows
    XP-->>LB: competition ranks, ties share a rank
    LB->>XP: levelTitle for each row
    XP-->>LB: level titles
    LB-->>User: table of rank, username, department, title, XP with own row highlighted
    Note over UserRepo,DB: read only, no snapshot persist
```

## UC-14 First-time onboarding tour

After login or signup, the Shell opens the 4-step tour when the user's `has_seen_onboarding` flag is 0. The steps cover tasks and due dates, XP and the leaderboard, Kapi and cortisol, and the calendar. Finishing or skipping calls `completeOnboarding`, which sets the flag in the `users` table and persists - so the tour never auto-opens again for that account. The header help button reopens it anytime without writing.

```mermaid
sequenceDiagram
    actor User
    participant Shell
    participant Tour as OnboardingTour
    participant Ctx as AppContext
    participant UserRepo
    participant DB as AppDatabase
    participant IDB as IndexedDB

    Note over Shell,Ctx: after login the Shell reads has_seen_onboarding from the user
    alt first login for this account
        Shell->>Tour: open at step 1 of 4
        loop steps for tasks, XP, Kapi, calendar
            User->>Tour: Next or Back
            Tour->>Tour: show step content
        end
        User->>Tour: Finish or Skip
        Tour->>Ctx: completeOnboarding
        Ctx->>UserRepo: setOnboardingSeen userId
        Ctx->>DB: persist
        DB->>IDB: write snapshot
        Tour-->>User: modal closes
    else flag already set
        Note over Shell,Tour: tour stays closed
    end
    opt help button in the header
        User->>Shell: click help
        Shell->>Tour: reopen tour
        Note over Tour,UserRepo: reopening never writes to the database
    end
```

## Flows without a dedicated diagram

The remaining use cases are render-time derivations or reuse a pattern shown above, so a separate diagram would add no new interaction:

- **UC-06 Filter tasks** - `filterTodos` runs purely at render over the in-memory list; no service, repository, or persist call is involved.
- **UC-07 Clear completed tasks** - `clearCompletedTasks` follows the UC-03 mutation pattern with a single bulk delete, then persists.
- **UC-12 Assign due dates and view the calendar** - assigning a due date is part of UC-01 and UC-02; the due badges via `dueBadge` and the Monday-start month grid via `buildMonthGrid`, `monthLabel`, and `todosOn` are pure calendar-domain derivations computed at render.
- **UC-13 Mascot reacts to task load** - after every state refresh the Mascot component recomputes `cortisolLevel` from active and overdue counts, maps it through `moodForCortisol`, and renders the matching expression, message, and CortisolBar; nothing is stored.
