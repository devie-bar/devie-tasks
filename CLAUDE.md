# De Vie Tasks

## Before changing any interface in this repo

Read `DESIGN.md` first. It is the De Vie Design Standard, identical in every De Vie repo. Do not introduce a hex value, breakpoint or control size that is not in Part 2.

## What this app is

tasks.devie.bar. Recurring checks for the bar team: opening and closing checklists that repeat on chosen weekdays, ticked by whoever does them. It does not do lists, cards, assignees or due dates: that is boards.devie.bar. Next.js 14 App Router, Tailwind, the shared De Vie Database Supabase project, same login and middleware as Handovers.

- `/` Today: the lists scheduled for the service date (`?date=`, `?list=`), tick and untick with realtime across phones.
- `/checks` Manage: create and edit lists and their checks (`?list=<id>`).
- `/history` How each past night went (`?date=`, `?days=14|30|60`).

## How it works

- Tables `task_lists`, `task_items`, `task_completions` (`supabase/migrations/20261016_tasks_v1.sql`). One completion per item per service date; unticking deletes the row. Weekdays are ISO, 1 is Monday.
- Service date is today in Paris, or yesterday before 06:00 (`lib/paris.ts`).
- Access is anyone with a row in `public.profiles` (`has_tasks_access()`).
- Every fetch goes through `lib/useLoad.ts` and `components/AsyncView.tsx`: 10 second timeout, skeleton after 200ms held 400ms, error with Try Again.
- Styles: shell and primitives in `app/globals.css` under `.tk-`, view styles in `components/*.css`.

## Setup still to do

- Apply the migration once (the app repo does not apply it).
- Add `https://tasks.devie.bar/auth/callback` to the Supabase auth redirect list.
- Point `tasks.devie.bar` at the Vercel project.
- `lib/estate.ts` carries a Tasks entry after Handovers; the same line goes in every other repo.

## Non-negotiables

- 44px controls below 840px, 32px at and above.
- PP Editorial New at -0.05em, Ultralight by default.
- Every async view has a timeout, an error and a retry.
- No em dashes or double hyphens in copy, comments or commit messages.
- A revision is a new file (v2, v3), never an edit of the previous version.
