# AI Usage Write-Up

## How did I break down the problem before prompting?

I settled the decisions that were mine before the AI wrote anything: the stack (TypeScript, React, Vite, Tailwind, SQLite, Vitest + RTL, Playwright, Vercel), the minimum features, and a concrete definition of "done" (all tests pass, lint and build clean, tasks survive refresh, deployed, screenshots taken). Then I structured the prompt itself as phases: clarify scope and edge cases first, produce the specs documents (scope, use cases, domain model, component architecture, sequence diagrams, test plan) before any code, then test-driven implementation, then verification before claiming done. I also planned model usage per phase, a stronger model for planning and debugging, a cheaper one for execution. Before starting, I even had the AI review my prompt for gaps. It caught that I asked for e2e test cases but never named an e2e tool.

## What did the AI get wrong, and how did I fix it?

Three examples. It hid the Edit and Delete buttons behind hover, so two required features were invisible. I only caught it because I insisted on reviewing actual screenshots, not test results. Second, when XP looked broken, the real cause was a design gap: re-completing a task silently gives nothing because XP is banked once per task to stop farming. The fix was feedback (a toast explaining it), not changing the rule. Third, I asked whether deleting a completed task lets users farm infinite XP. Digging in showed delete was not the hole, the real exploit is adding and completing endless tasks. A test audit I ran also caught the AI's migration code deleting the legacy data key even when it could not read it, and edit and delete missing the ownership check that toggle had. Both are fixed, with tests pinning them.

## What did I deliberately not delegate to AI, and why?

The judgment calls. I chose the scope, the stack, and what "done" means. When we found XP is farmable, I decided to document it as a known limitation instead of half-fixing it, because policing self-entered tasks honestly needs a backend. I decided completed tasks stay until the user clears them, since auto-deleting finished work would surprise people. I kept prompt.md in my own words and only let the AI point out what was missing. And I verified everything myself: I watched the app at localhost:3000 while it was built, reviewed every screenshot, and rejected things the AI thought were fine, like a logo that blurred at favicon size.

## What would I do differently with more time?

Put the database behind a real backend (Firestore is already provisioned, and the repository layer is the only seam that changes) so accounts work across devices and XP is validated server-side. Add CI so the 220+ tests run on every push. Enforce stricter red-green TDD on the UI layer, where some tests were written first but I did not always watch them fail before implementing. And run a proper accessibility pass.
