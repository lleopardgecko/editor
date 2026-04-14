# Submission

## Deliverables

- [x] Source code
- [x] README.md
- [x] ARCHITECTURE.md
- [x] AI_WORKFLOW.md
- [x] SUBMISSION.md

## Live URL

https://editor-rouge-ten.vercel.app


## Features Working

- Document creation
- Rich text editing: bold, italic, underline, H1/H2/H3, bullet lists, numbered lists
- Autosave every 3 seconds
- Document rename
- File upload (.txt and .md)
- Share document by email
- Owned vs. shared document sections on the dashboard
- Document deletion (owner only)

## Features Not Included

- .docx import
- Real-time collaboration
- Granular permissions (view vs. edit)
- Version history

## What Would Be Built Next (2–4 hours)

- **UI design**
- **.docx support** via `mammoth.js` — add a conversion layer that transforms .docx content into Tiptap-compatible JSON on upload
- **Real-time collaboration** via Supabase Realtime — broadcast editor transactions to other connected clients on the same document
- **Improved sharing UX** — permission levels (view vs. edit), revoke access, see who a document is shared with
