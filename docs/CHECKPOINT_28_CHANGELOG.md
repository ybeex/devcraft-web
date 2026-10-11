# Checkpoint 28 — Admin UI: Content CRUD

Covers step 5 of the Admin UI build order — the biggest remaining form
surface: tracks, modules, lessons, and interview questions. Unlike every
checkpoint since 26, this one touches **both** repos — building this
surface for real required a backend addition first (see below).
`devcraft-api` moves to **v10**.

## Backend: admin-content-read.routes.ts (new)

`admin.routes.ts` has create/update(/delete) for tracks, modules, lessons,
and interview questions — but no way to read any of them back. `GET
/admin/tracks` nests a trimmed module list, but there's nothing for
lessons-within-a-module or interview questions at all, and nothing that
returns a single module/lesson/question's full fields for an edit form to
pre-fill from. Lessons especially needed this: `content`, `starterCode`,
`solutionCode`, and `testCode` weren't in any existing response.

New, standalone, read-only, ADMIN-only:

- `GET /admin/modules/:id`
- `GET /admin/lessons?moduleId=<uuid>`
- `GET /admin/lessons/:id`
- `GET /admin/interview-questions?track=&page=&limit=`
- `GET /admin/interview-questions/:id`

Own file (`admin-content-read.routes.ts`) rather than added to
`admin.routes.ts`/`admin.service.ts` directly, registered alongside it at
the same `/admin` prefix — matches how `analytics`/`audit-log`/`conflicts`
are each their own file, and means the existing, already-tested
create/update/delete logic isn't touched at all. Full reasoning and the
exact integration diff are in `INTEGRATION.md` (also new) and the module's
own doc comment. Fully wired into `app.ts`, not left as a pending step —
`tsc --noEmit` and the full suite (98/98, no regressions) both pass with
it in place.

**Deliberately doesn't add `DELETE` for tracks or modules.**
`admin.routes.ts` already has delete for lessons and questions but
pointedly not tracks/modules, and `modules.trackId` / `lessons.moduleId`
are both `onDelete: 'cascade'` — that split reads as an intentional choice
about blast radius, not an oversight this checkpoint's job was to
"complete." The frontend matches: no delete button on tracks or modules,
only lessons and questions.

## Frontend: the actual Content CRUD surface

- **`/admin/content`** — Track & Module browser. Each track: quick
  publish/draft toggle (saves immediately, no form), inline edit form,
  its modules listed underneath. Each module: same quick-toggle pattern
  (see note below), inline edit form, a link into its own lesson list.
  Missing tracks (there can be at most one FE and one BE — `slug` is a
  2-value enum) get a "Create FE/BE track" prompt instead of a form
  nobody needs 99% of the time.
- **`/admin/content/modules/[id]/lessons`** — lesson browser for one
  module: list, delete (native `confirm()`, no new modal component —
  consistent with every other destructive action built so far this
  project), link to add/edit.
- **`/admin/content/lessons/new` + `/admin/content/lessons/[id]`** —
  the lesson editor, sharing one `LessonEditorForm` component between
  create and edit (the fields are identical either way; only the
  data-loading and submit behavior differ). Code fields (starter/
  solution/test) use Monaco (`CodeField`), mirroring the exact editor
  options already established in the learner-facing
  `LessonEditorPane` — same fonts, same sizing — just without its
  Run/Check/Reset toolbar, which doesn't apply to an admin just typing
  code in.
- **`/admin/content/questions`, `/questions/new`, `/questions/[id]`** —
  same create/edit-sharing pattern for interview questions, track-filtered
  list, delete with confirm.
- Shared form primitives (`TextField`, `TextAreaField`, `NumberField`,
  `SelectField`, `ToggleField`, `TagsField`) in
  `components/admin/content/FormFields.tsx` rather than re-implementing
  styled inputs four times across track/module/lesson/question forms.

**The optimistic-lock conflict path is now actually wired end to end.**
Every content save can 409 with `CONTENT_CONFLICT`, and the backend's own
`OptimisticLockError` doc comment says explicitly that it carries the new
conflict's id "so the route handler can return it to the client — the
admin UI uses this ID to open the conflict-resolution view." That view
(built checkpoint 27) didn't have a way to jump to a *specific* conflict
before this checkpoint — only browse whatever the current list page
showed. Added: `getConflictIdFromError()` in `lib/api/admin.ts`, a shared
`useContentSave` hook every form uses that catches this specific error
code, and a `ConflictNotice` banner with a link to
`/admin/conflicts?id=<id>` — which now accepts that param (using
`getConflictDetail`, previously built but unused, as a fallback when the
target conflict isn't on whatever page/filter the list happens to be
showing). Deliberately not an auto-redirect: force-navigating an admin
away from a form they were mid-editing the moment a save fails would be
disorienting. The banner lets them go review it when they're ready.

## Found while verifying

**Quick-publish-toggle needed a fetch first for modules, not tracks.**
`GET /admin/tracks`' nested module summary doesn't include `updatedAt`
(only `id, title, slug, order, isPublished, isPremium`), but every PATCH
requires `expectedUpdatedAt`. Tracks have `updatedAt` right in the list
response, so their toggle is a single request; a module's toggle fetches
the full record first (for its real `updatedAt`) and then patches — two
requests behind one click, invisible to the admin either way.

**Language options for lesson code fields came from the Playground, not
a guess.** Checked `EXECUTABLE_LANGUAGES` in `playground/page.tsx` rather
than assuming — a lesson's `language` column is a free varchar with no DB
constraint, but only javascript/typescript/python/sql are things the
Judge0 sandbox can actually run, so those are the only options offered.
html/css/json/markdown are real Playground language values but don't
apply to a single lesson's own code exercise.

`Button` doesn't support an `asChild` prop (it's a plain `forwardRef`
around a real `<button>`, nothing Radix-style) — caught by checking the
component directly rather than assuming, before it shipped as a `<Link>`
nested inside a `<button>` element.

## Verification

```
Frontend: tsc --noEmit clean, full next build clean — 7 new routes under
          /admin/content/*, everything else unchanged. No new
          [...catchAll] needed for the nested content routes — confirmed
          in the build output that /admin/[...catchAll] (checkpoint 26)
          already covers unmatched paths at any depth under /admin/*.
Backend:  tsc --noEmit clean, 98/98 tests passing (no new tests added
          for the new read endpoints specifically — same gap that
          already existed for analytics/audit-log, worth closing at
          some point but consistent with how those shipped).
```

## Still open from the roadmap

Step 6 — submission approval, community moderation, user management —
is what's left of the Admin UI item, and per the original roadmap should
be "smaller and more mechanical" now that this checkpoint and the last
two have established the form, table, and conflict-handling patterns.
Beyond Admin UI: system-design content type and portfolio heatmap/PDF
export/custom domain, per `CONTINUATION_PLAN_v4.md`.
