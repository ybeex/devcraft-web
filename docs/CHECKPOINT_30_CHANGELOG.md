# Checkpoint 30 — System Design: Admin Authoring UI

Frontend side of checkpoint 30 — consumes the new
`admin-system-design.routes.ts` endpoints (see `devcraft-api`'s own
`CHECKPOINT_30_CHANGELOG.md` for the schema/backend side and the
reasoning behind it). `devcraft-web` stays entirely in sync with the
backend's content model: challenges + stages, no optimistic-lock fields
on either.

## What shipped

- **`/admin/content/system-design`** — track-filtered, paginated
  challenge list, same shape as the Interview Questions browser.
- **`/admin/content/system-design/new`** + **`/admin/content/system-design/[id]`**
  — `ChallengeEditorForm` (metadata: track/slug/title/scenario/
  difficulty/estimated minutes/order/published/premium) shared between
  create and edit, same pattern as the Lesson and Question editors. The
  edit page additionally renders `StageList` — add/edit/delete stages
  inline, each stage form covering title/order/guiding questions
  (`TagsField`)/model answer/optional diagram image URL. Deleting a
  challenge warns that it takes every stage with it (matches the
  backend's `onDelete: cascade`).
- Fixed a **discoverability gap from checkpoint 28**: `/admin/content/questions`
  had no link pointing to it from anywhere in the UI — reachable only by
  typing the URL. Added a two-card row to `/admin/content` linking to
  both Interview Questions and (new) System Design Challenges, so this
  doesn't repeat for the new section.

## Found while verifying

**`useContentSave`'s `onSuccess` callback couldn't receive the saved
record — and creating a challenge needs to.** Every other content type's
create flow navigates to a fixed, known destination after saving (e.g.
`/admin/content/modules/${moduleId}/lessons`, computed from data already
in scope). A new system design challenge needs to navigate to
`/admin/content/system-design/${newChallenge.id}` — an id that doesn't
exist until the create call returns it. `useContentSave`'s `save`
function was discarding whatever `fn()` resolved to. Made `save` generic
(`<T>(fn: () => Promise<T>, onSuccess: (result: T) => void)`) rather than
fixed to `unknown`/`void` — confirmed non-breaking for all four existing
callers (Track/Module/Lesson/Question forms) before relying on it: a
function declaring fewer parameters than a call site provides is a valid
assignment in TypeScript's structural typing, so
`onSuccess: () => { onSaved(); onDone() }` still type-checks fine against
the new `(result: T) => void` shape without those forms needing any
changes. `tsc --noEmit` across the whole existing surface confirmed this
before it shipped, not just reasoned through.

## Verification

```
tsc --noEmit: clean
next build:   clean — 3 new routes (/admin/content/system-design,
              /admin/content/system-design/new,
              /admin/content/system-design/[id]), everything else
              (including the four checkpoints of prior admin work)
              unchanged.
```

## Not yet done

Same note as the backend changelog: the learner-facing browse + practice
page doesn't exist yet. The public consumption endpoints
(`GET /system-design`, `GET /system-design/:slug`, progress endpoints)
are built and ready — this is now purely a frontend task, most likely
living under `/interview` alongside the existing Q&A practice flow given
they're both Interview Prep content.
