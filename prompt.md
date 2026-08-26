I have a technical assessment with ShopBack company and it is required me to build a AI-Assisted App for this Engineering role in ShopBack company. The task is to build a working To-Do List app using any language, framework or tools that I prefer, the minimum features will be to add, edit, delete task. To mark tasks as complete, the basic persistence, for example like local storage, file and DB.

It is expected me to use AI tools throughout for the assessment, and I will need to document of how I used them. They are interested in how I work with AI to build a real system and where I apply my own judgement on top of what it has produced.

Eventually I will need to submit a ZIP file containing my entire project that must include:
1. Codebase: my complete, working application source files.
2. README.md: with the instruction on how to run the app.
3. prompt.md: A plain text file containing my exact initial AI prompt. Paste it as-is. No cleaning it up.
4. Screenshots: A folder containing images of my working app's UI and main features.
5. Reflection.md: An AI Usage Write-Up with maximum 500 words answering these 4 questions:
- How did I break down the problem before prompting?
- What did the AI get wrong, and how did I fix it?
- What did I deliberately not delegate to AI, and why?
- What would I do differently with more time?

For the reflection I will work on it myself, so I just need you to help me create the empty md file. I have created this private github repo for us to update the code progressively and commit by batch there: "https://github.com/Kopi-O-Kosong-Beng/ShopBack_AI-Assisted-App". I want the commits to be in small meaningful batches so the commit history can show how the project progress.

They will evaluate me based on how I think before I prompt. How I course-correct when AI give me garbage. Whether I understand what I shipped.

Since this is a simple to-do app without routing/server concepts, the stack can be just TypeScript, React, Vite, Tailwind CSS, localStorage for persistence, Vitest + React Testing Library for unit and integration tests, Playwright for e2e tests, and Vercel for deployment.

And I will want you to understand the project scope first, and prepare the following documents for me. Put all these documents inside a specs/ folder in the repo as separate files so they are easy to find and read. For all the diagrams (domain class model, component architecture, sequence diagrams), use Mermaid code blocks so they can render directly on GitHub:

1. I want you to clarify the requirement and project scope with me first by having a md file that write down the core features, nice-to-have features, assumptions, constraints, and what counts as "done". For "done" I expect at least: all tests pass, lint and build pass with no error, tasks still remain after page refresh, app deployed on Vercel, and screenshots captured. Also list down the edge cases we need to handle, for example empty or whitespace-only task, very long task text, editing a task to become empty, duplicate tasks, localStorage not available or data corrupted, and what the UI shows when there is no task yet.

2. Then I want you to write down the use case description including the use case id, the primary, secondary user, the trigger, preconditions, postconditions, main flow, alternative flow, and error state, and success state.

3. Create domain class model.

4. Create a component architecture.

5. And have sequence diagrams for the main use cases.

6. Define test case for each feature, and I need the test case to cover unit, integration and e2e testing. For frontend can just use top down testing to simulate user interaction with the app, and the domain/storage logic use bottom up to isolate important part. For each use case I want you to identify and make table for it, to specify the test case id, which use case it links to, the test level (unit / integration / e2e), what is mocked, what is the target unit, what is the pre condition and post condition (the state before and after the test), the domain and expected result. The test cases must cover the happy path, edge cases and error states for each feature. Use Vitest for unit tests, React Testing Library for component/integration tests, and Playwright for e2e.

For the UI, I will give the overview direction first: I want a clean and minimal design, light theme with one accent color, card style task list, a clear empty state when there is no task yet, and it must be mobile responsive. No need fancy animation. We can refine the design details together during the brainstorming phase.

Also, for the way we work together: do not one-shot the whole app. Work in small increments, and stop at each checkpoint for me to review before continue. For the key decisions, give me the options with the tradeoffs and let me decide. If you make any assumption, state it out clearly so I can confirm or correct it. I need to understand everything I ship, so be ready to explain any part of the code when I ask.

I want you to use the "Superpowers" skills for this task. First use the brainstorming sub-skill to clarify the scope, requirement, edge cases, UI before coding, and ask me questions if anything is unclear instead of assuming. Then writing-plans to write down the above listed pre-implementation documents. Then I want you to use test-driven-development sub-skill to write tests for core todo behavior before or alongside implementation. Then I want you to use verification-before-completion to run tests, build, lint and manually verify requirement before finishing. Also you can use systematic-debugging only when something actually breaks.

For the model usage, I plan to use Fable 5 for the brainstorming and planning phase to maximize the quality of the plan and the documents, then switch to Opus 5 for the implementation phase to save token. If something tricky comes out or something breaks badly, I will switch back to Fable 5 for the debugging.
