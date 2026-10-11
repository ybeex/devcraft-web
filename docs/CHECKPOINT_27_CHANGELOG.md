# Checkpoint 27 — Admin UI: Conflict Resolution

Covers step 4 of the Admin UI build order — the "keep mine / keep theirs /
merge" flow for `/admin/conflicts`, replacing the checkpoint 26 placeholder
with the real thing. Its API client functions (`listConflicts`,
`resolveConflict`, etc.) already existed from checkpoint 26; this
checkpoint is UI-only, no changes to `lib/api/admin.ts`.

No backend changes.

## What shipped

- `/admin/conflicts` is now a real list + detail view: a filterable
  (Pending/All/by-resolution-type), paginated list on the left, and a
  diff/resolve panel on the right. Selecting a row uses data already in
  the fetched list page — no separate detail fetch or loading state, the
  diff appears instantly. `getConflictDetail` stays in the API client
  unused for now; the only thing it adds over list data (the resolving
  admin's email) has no real use in this flow.
- `ConflictDiffView` — a genuine field-by-field diff, not raw JSON dumps
  side by side (per the roadmap's own framing of this as "the valuable
  version of this"). Three resolution modes: keep the current saved
  version, keep the attempted edit wholesale, or merge — where each
  differing field gets its own picker and `mergedData` is built from
  those per-field choices before being sent.
- Deliberately neutral highlighting (a brand-accent tint on whichever side
  is picked) instead of red/green. "Mine" isn't wrong and "theirs" isn't
  right — they're two edits that happened to collide — so coloring one
  red and one green would bias the reviewer before they'd looked at
  either side.
- Already-resolved conflicts render read-only: for a merged one, the
  historical per-field choice is reconstructed by comparing the stored
  `mergedData` back against each field's mine/theirs value; for
  keep-mine/keep-theirs, no per-field highlighting is needed since the
  resolution type badge already says which whole side won.
- Resolving invalidates both `admin-conflicts` (the list) and
  `admin-pending-conflicts` (the nav badge and the Conflicts-tab count) so
  the queue and badge update immediately, not on next navigation.
- No `useMutation` — matches this codebase's actual established pattern
  (confirmed by reading `CommunityPostDetailClient.tsx`, which has never
  used it either): manual `useState` loading flag + try/finally +
  `queryClient.invalidateQueries`. Added one thing that file's pattern
  doesn't have, though: an inline error message on failure. Resolving a
  conflict is a more deliberate, consequential action than a reaction
  toggle, and the existing pattern's silent-failure-on-error isn't
  something to copy into something this consequential.

## Found while verifying

**`attemptedChanges` is a partial patch, not a full row — this shaped the
diff logic directly, and almost shaped it wrong.** The first version of
`computeConflictDiff` iterated the union of keys across both
`attemptedChanges` and `currentSnapshot`. `currentSnapshot` is a full row
(confirmed in `optimistic-lock.ts`), but `attemptedChanges`'s own doc
comment there says explicitly: "the partial update payload the client
submitted." Diffing the union would have flagged every column the admin
never touched — `createdAt`, unrelated fields, anything not in their
edit — as a false-positive "change," burying the one or two fields that
actually collided under a pile of noise. Fixed before shipping: the diff
now only iterates `attemptedChanges`'s own keys. Worth flagging because
this is exactly the kind of thing that would have looked fine in a quick
manual check (a lesson edit that only touches `content` would still show
*a* diff, just a much noisier one) without actually being right.

## Verification

```
Frontend: tsc --noEmit clean, full next build clean. /admin/conflicts
          went from a 168 B placeholder to a real 7.49 kB page; every
          other route unchanged.
Backend:  untouched — not re-verified this checkpoint since nothing
          about it changed (98/98 tests, confirmed at the start of
          checkpoint 26, still stands).
```

## Still open from the roadmap

Content CRUD (step 5) is next — the biggest remaining form surface, and
the one place `expectedUpdatedAt` has to be threaded through every save
correctly or it 409s. Then submission approval + community moderation +
user management (step 6). Beyond the Admin UI item: system-design content
type and portfolio heatmap/PDF export/custom domain, per
`CONTINUATION_PLAN_v3.md`.
