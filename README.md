# Ajaia Docs

A lightweight collaborative document editor built as a take-home project. Users can create and edit rich-text documents, upload plain-text files, and share individual documents with other users by email. All data is persisted in Supabase with row-level security enforced at the database layer.

## Live Demo

[LIVE_URL]

Demo accounts are available directly on the login page — click **Alice** or **Bob** to sign in instantly. Use both to test the sharing flow.

## Local Setup

```bash
git clone <repo-url>
cd ajaia-docs
npm install
```

Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Both values are in your Supabase project under **Settings → API**.

```bash
npm run dev
```

App runs at `http://localhost:3000`.

## Features

- **Document creation** — create blank documents from the dashboard
- **Rich text editing** — bold, italic, H1/H2/H3, bullet lists, ordered lists (Tiptap)
- **Autosave** — content saves automatically every 3 seconds on change
- **Rename** — edit the document title inline; saves on blur
- **File upload** — import `.txt` and `.md` files as new documents
- **Sharing by email** — owners can share a document with any registered user by email address
- **Owned vs. shared sections** — dashboard separates "My Documents" from "Shared with Me"
- **Delete** — owners can delete their own documents
- **Auth** — email/password sign-in and sign-up; session managed via Supabase SSR cookies

## Supported File Types for Upload

Only `.txt` and `.md` files are accepted. The file's text content becomes the document body; the filename (minus extension) becomes the title.

## Test Accounts

These accounts exist in the deployed Supabase project and are available via one-click buttons on the login page:

| Name  | Email          | Password    |
|-------|----------------|-------------|
| Alice | alice@demo.com | password123 |
| Bob   | bob@demo.com   | password123 |

To test sharing: sign in as Alice, create a document, share it with `bob@demo.com`, then sign in as Bob to see it appear under "Shared with Me."

## What Was Intentionally Excluded

Given the 4 hour timebox, the following were deprioritized:

- **Real-time multiplayer** — no live cursors or concurrent editing; last write wins
- **Unsharing / revoke access** — shares are permanent once granted
- **Rich paste / image support** — only plain text and basic formatting
- **Mobile layout** — functional but not optimized for small screens
- **Email confirmation** — disabled in Supabase so demo accounts work immediately
- **UI Design** - deprioritized in favor of functionality and reliability

## Tech Stack

| Layer     | Choice                               |
|-----------|--------------------------------------|
| Framework | Next.js 16 (App Router)              |
| Language  | TypeScript                           |
| Styling   | Tailwind CSS                         |
| Editor    | Tiptap (StarterKit)                  |
| Backend   | Supabase (Auth, Postgres, RLS)       |
| Hosting   | Vercel                               |
