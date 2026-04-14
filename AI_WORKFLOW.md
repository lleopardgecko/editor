# AI Workflow

## Tools Used

- **Claude** — planning, architecture decisions, data model design, RLS policy logic
- **Claude Code** — primary implementation tool; wrote all source files directly in the project via the CLI

## Where AI Materially Sped Up the Work

- **App scaffolding** — generated the full Next.js file structure (routes, layout, components) in one pass rather than building it incrementally
- **Tiptap integration** — wired up the editor with toolbar, autosave interval, and JSON persistence without needing to read through the full Tiptap docs manually
- **Supabase RLS policies** — drafted all row-level security policies correctly on the first pass, including the shares join condition
- **Auth flow** — login, signup, and session handling with `@supabase/ssr` middleware set up end-to-end quickly
- **Middleware** — generated the route protection logic without manual boilerplate

## What Was Changed or Rejected

Claude Code initially created the auth middleware file as `proxy.ts` instead of `middleware.ts`. Next.js only recognizes `middleware.ts` at the project root for route interception — the file had no effect until renamed. Caught during smoke testing when protected routes were accessible without a session.

All generated code was reviewed before accepting. A few component imports and Supabase client instantiation patterns were adjusted to match the actual installed package versions.

## How Correctness Was Verified

- **Manual smoke testing** of each feature after implementation: auth (sign up, log in, log out), document creation, rich text editing, autosave, file upload, sharing by email, owned vs. shared sections, deletion
- **Supabase dashboard** used to confirm rows were being written and updated correctly in `documents` and `document_shares`
- **Sharing flow tested across two accounts** (Alice and Bob) to verify RLS policies were working — shared documents appeared in the recipient's view and were inaccessible to unrelated users

## One Thing AI Got Wrong

Claude Code generated the `useEditor` autosave with a `setInterval` inside a `useEffect` but did not include the editor content in the dependency array correctly, causing the save callback to close over a stale content value. The interval was saving the document's initial state on every tick regardless of edits. Fixed by switching to a `useEffect` that watches the editor's `onUpdate` event and debounces the save, rather than using a raw interval.
