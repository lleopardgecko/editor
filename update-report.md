# Update Report

Summary of changes made in response to the code review on branch `post-submission-revision`.

## Scope

Every issue called out in the review was addressed: 6 bugs, 1 Next 16 compliance rename, 2 type-hygiene cleanups, and 4 smaller polish items. The diff touches 10 files.

---

## Bugs

### 1. Shared users no longer lose edits silently
**Files:** `app/doc/[id]/editor.tsx`, `app/doc/[id]/page.tsx`

The editor's save calls previously filtered on `.eq("owner_id", userId)`, which meant non-owner collaborators saw "Saving…" flash but their update matched zero rows and vanished. The filter is removed — RLS is the correct line of defense, not a client-side predicate. As part of this, the `userId` prop was dropped from `Editor` (no longer needed) and `page.tsx` was updated to stop passing it.

### 2. Title autosaves alongside content
**File:** `app/doc/[id]/editor.tsx`

Previously the title only persisted on blur, while content autosaved every 3s — closing the tab mid-rename lost the title. The `save` callback now diffs both fields against `lastSavedTitle` / `lastSavedContent` refs and issues a single `update` with whichever changed. A `titleRef` keeps the latest title available to the interval without restarting it on each keystroke (updated via `useEffect` to comply with React's "no ref writes during render" rule).

### 3. Save errors surface to the user
**File:** `app/doc/[id]/editor.tsx`

Added a `saveError` state. When the Supabase update returns an error, the header shows `Save failed: <message>` in red instead of silently dropping the failure. Successful saves clear the error.

### 4. Undeclared Tiptap dependency
**File:** `package.json`

`@tiptap/extension-list-item` was imported but only resolved transitively via `@tiptap/starter-kit`'s hoisted deps — fragile under pnpm or a minor-version bump of starter-kit. Added it as a direct dependency. The unused `@tiptap/extension-underline` was removed in the same change.

### 5. Auto-signup-on-failed-login removed
**File:** `app/login/page.tsx`

The login form used to fall back to `signUp` whenever `signInWithPassword` returned `Invalid login credentials`. Two problems: (a) it leaks account existence — a real user mistyping their password gets "User already registered"; (b) it silently creates accounts for new emails typed into the login form. The fallback is gone. `signIn` now reports the error and stops.

### 6. Signup respects email confirmation
**File:** `app/login/page.tsx`

When Supabase projects have email confirmation enabled (the default), `signUp` returns with `data.session === null` — the previous code pushed to `/` anyway, which bounced back to `/login` via the auth check with no feedback. Added an `info` state that shows "Check your email to confirm your account, then sign in." when no session is returned. The user is kept on the login page.

### 7. `notFound()` instead of silent redirect
**File:** `app/doc/[id]/page.tsx`

Previously `redirect("/")` fired when the doc didn't exist or the user wasn't authorized. Swapped to `notFound()` so the URL is honest about returning a 404.

---

## Next 16 compliance

### 8. `middleware.ts` renamed to `proxy.ts`
**Files:** `middleware.ts` → `proxy.ts`, `middleware.test.ts` → `proxy.test.ts`

Per `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`:

> The `middleware` file convention is deprecated and has been renamed to `proxy`.

Changes:
- `git mv middleware.ts proxy.ts`
- Exported function renamed from `middleware` to `proxy`.
- `git mv middleware.test.ts proxy.test.ts`, import path updated to `./proxy`, `describe` label updated.
- Verified with `next build`: the route table now prints `ƒ Proxy (Middleware)`, confirming Next picked up the new file convention.

`lib/supabase-middleware.ts` was left in place — it's an internal helper, not a Next convention, and renaming it was pure churn.

---

## Type hygiene

### 9. `any` casts removed from the home page
**File:** `app/page.tsx`

Introduced `Doc` and `ShareRow` types. The nested Supabase selects use `.returns<Doc[]>()` and `.returns<ShareRow[]>()` so `owned` and `shares` are typed without casts. The null-filter on shared docs is a proper type predicate (`(d): d is Doc => d !== null`) so `sharedDocs` is `Doc[]`, not `(Doc | null)[]`.

### 10. Toolbar editor prop typed
**File:** `app/doc/[id]/editor.tsx`

`function Toolbar({ editor }: { editor: any })` is now `editor: TiptapEditor`, imported from `@tiptap/react` as `type Editor as TiptapEditor`.

---

## Polish

### 11. Browser Supabase client cached at module level
**File:** `lib/supabase-browser.ts`

`createClient()` used to instantiate a new browser client every call, including on every render of `Dashboard`, `Editor`, and `LoginPage`. Added a module-scoped `client` variable so the second call onward returns the same instance.

### 12. File upload input resets after use
**File:** `app/dashboard.tsx`

The upload `<input type="file">` wasn't cleared after upload, so picking the same file twice did nothing (no `change` event). Setting `input.value = ""` immediately after reading the file fixes it.

### 13. Inline delete confirmation replaces `confirm()`
**File:** `app/dashboard.tsx`

The native `confirm("Delete this document?")` was replaced with a `confirmingId` state: the first click on "Delete" swaps the button to a red "Confirm?" label, the second click (within 3s) actually deletes. A `setTimeout` resets the state so the button doesn't stay armed forever. The older "click and hold" pattern avoids adding a modal component for a one-off confirmation.

### 14. Architecture doc reconciled with the code
**File:** `ARCHITECTURE.md`

Two drifts fixed:
- `documents.content` was described as `jsonb (Tiptap JSON)`, but the code calls `editor.getHTML()`. Updated to `text (Tiptap-serialized HTML)`.
- `document_shares` was shown with only a `shared_with uuid` column, but the insert writes both `shared_with_id` and `shared_with_email`. Both columns are now documented.

The demo-accounts module-level `process.env` read in `login/page.tsx` also got a one-line comment explaining that `NEXT_PUBLIC_*` values are inlined at build time, since the behavior (demo buttons appearing or not based on the build-time env) isn't obvious from the code alone.

---

## Things that were in the review but deliberately not changed

- **CSP header in `next.config.ts`.** The review noted this was "not required, but the next step up." Skipped to keep the change set tight; the existing `X-Content-Type-Options` / `X-Frame-Options` / `Referrer-Policy` are fine as a baseline.
- **`createDoc`'s missing `setCreating(false)` on the success path.** Navigation unmounts the component, so the stale `true` state never renders. Left alone.
- **Renaming `lib/supabase-middleware.ts` to `lib/supabase-proxy.ts`.** Internal helper name, not a Next convention. Would have been a pure rename with no behavioral effect.

---

## Verification

Ran locally after all changes:

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm run lint` | clean |
| `npm test` | 3/3 passing |
| `npm run build` | succeeds; route table shows `ƒ Proxy (Middleware)` |

No browser testing was done. Before shipping, worth clicking through:

1. Sign up with a fresh email (expect "Check your email" message, no redirect).
2. Sign in as a shared-doc recipient and edit — confirm the edit persists on reload.
3. Delete a doc from the dashboard — confirm the two-click pattern works and the timeout resets.
4. Upload the same `.txt` file twice in a row — confirm both uploads create docs.

---

## Files changed

```
ARCHITECTURE.md
app/dashboard.tsx
app/doc/[id]/editor.tsx
app/doc/[id]/page.tsx
app/login/page.tsx
app/page.tsx
lib/supabase-browser.ts
middleware.test.ts    → proxy.test.ts  (rename + edit)
middleware.ts         → proxy.ts       (rename + edit)
package.json
package-lock.json     (from npm install)
```

---

## Follow-up: narrow-viewport layout fix

**Files:** `app/dashboard.tsx`, `app/doc/[id]/editor.tsx`

After deploying the changes above, a screenshot surfaced showing the dashboard header overlapping — "Documents" heading butting up against the user's email, and document-row dates/buttons getting shoved around. Confirmed via the compiled CSS (`/_next/static/chunks/...css`) that Tailwind preflight was applied correctly and `text-2xl` resolved to 1.5rem — font sizes were fine. The real issue: `flex items-center justify-between` with no wrapping or truncation meant items simply collided on narrow viewports (the screenshot was a half-width browser window).

Changes:

- **Dashboard header row** — stacks vertically by default, switches to `flex-row sm:justify-between` at ≥640px. Email gets `truncate`, sign-out gets `shrink-0` so it never wraps off-screen.
- **Owned-document rows** — title wrapped in `min-w-0 truncate` so long titles ellipsize instead of pushing the date and delete button out. Date + delete are `shrink-0` with consistent `gap-3` spacing.
- **Shared-document rows** — same truncation + shrink treatment applied.
- **Editor header** — swapped to `flex-wrap` with `gap-3` so Back / Save status / Share button reflow onto a second row on narrow viewports instead of colliding.
- **Share form** — wraps when narrow; the `shareMsg` feedback gets `basis-full` so it drops to its own row rather than squeezing between the input and the button.

Wide-desktop layout is unchanged. `npm run lint` and `npx tsc --noEmit` remained clean after the changes.
