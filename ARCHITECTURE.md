# Architecture

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 16 (App Router) | Unified frontend + API routes in one repo; no separate backend needed |
| Editor | Tiptap | Best free rich text editor for React; headless, composable, actively maintained |
| Database / Auth | Supabase | Managed Postgres + auth + RLS in a single service; no infrastructure to run |
| Deployment | Vercel | Zero-config Next.js deployment; env vars and preview URLs out of the box |

## What Was Prioritized

1. **Core editing experience** — reliable rich text with autosave
2. **Auth + persistence** — email/password auth wired to per-user document ownership
3. **Sharing logic** — share by email, separate owned vs. shared views
4. **Clean deployment** — live on Vercel with Supabase connected from day one

## What Was Cut

- **.docx import** — would require a `mammoth.js` conversion layer plus paste/drop handling; out of scope for the timebox
- **Real-time multiplayer collaboration** — needs Supabase Realtime + conflict resolution; a separate project in scope
- **Granular permissions** — view vs. edit distinction on shares was deprioritized in favor of getting basic sharing working
- **Version history** — no snapshot table or diff logic; autosave overwrites in place

## Data Model

```
profiles
  id          uuid  (references auth.users)
  email       text

documents
  id          uuid
  owner_id    uuid  (references profiles)
  title       text
  content     jsonb (Tiptap JSON)
  created_at  timestamptz
  updated_at  timestamptz

document_shares
  id           uuid
  document_id  uuid  (references documents)
  shared_with  uuid  (references profiles)
  created_at   timestamptz
```

RLS policies ensure users can only read/write their own documents or documents explicitly shared with them.

## Tradeoff

File upload parses `.txt` and `.md` as plain text and inserts it into the editor as a paragraph block. This is fast and dependency-free, but it discards any markdown formatting rather than converting it to rich text nodes. Under more time, the content would be parsed through a markdown-to-Tiptap transformer.
