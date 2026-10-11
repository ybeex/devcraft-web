# Checkpoint 29 — Admin UI: Users, Submissions, Community

Covers step 6 — the last piece of the Admin UI roadmap item. **All six
steps are now done**, across checkpoints 26–29. No backend gap-filling
needed this time (unlike checkpoint 28) — `admin.routes.ts` already had
full support for all three areas; this checkpoint is frontend-only,
except for one thing that needed fixing immediately once found (see
below). `devcraft-api` moves to v11 for that fix alone.

## What shipped

- **`/admin/users`** — searchable (by email), filterable (role, tier)
  list. **`/admin/users/[id]`** — full profile: stats row, an edit form
  (display name/role/tier/active/email-verified/XP-direct-correction), a
  separate Grant XP action (amount + required reason — semantically
  different from the direct XP field: this one goes through the
  dedicated endpoint that also logs an `xp_events` row, so the reason is
  actually preserved somewhere), recent submissions, recent XP events,
  portfolio summary if one exists. Deactivate button (soft-delete: sets
  `isActive=false`, appends `.deleted` to the email) is hidden entirely
  for ADMIN-role accounts, matching the backend's own refusal to delete
  those — no point letting an admin click into an error the API was
  always going to give them.
- **`/admin/submissions`** — status-filtered, paginated, expandable rows.
  Each expands to repo/live links, notes, an AI-review panel (trigger +
  display existing review text, rate-limited 20/hour on the backend), an
  optional note field, and approve/request-revision actions.
- **`/admin/community`** — paginated post list, force-delete with
  confirm. No filters beyond pagination, matching what `GET /admin/posts`
  actually supports — didn't build filter UI for filtering this endpoint
  doesn't have.

No new shared form components needed here — `FormFields.tsx`,
`useContentSave`, and the confirm-then-delete pattern from checkpoints
26–28 covered everything.

## Found while verifying

**`AdminCreateAnnouncementSchema` (in `admin.schema.ts`) has no route
anywhere and doesn't need one.** Went looking for a "create announcement"
endpoint to build a Community moderation feature around, since the
schema exists and the original roadmap's P3 item 4 lists "Announcements"
as a shipped community feature. Traced it instead to
`community.routes.ts`'s `listPosts`, which explains directly in its own
comment: **"Announcements" isn't a post type — it's staff-authored
content of any type.** An admin or moderator "creates an announcement" by
creating a regular post through the same flow every user has; it shows
up in the Announcements filter because of who posted it, not because of
a special creation path. The schema is leftover from an earlier design
that was reconsidered — not a gap, nothing to build. The Community page
here badges staff-authored posts (`STAFF`) so this is visible at a
glance without needing a dedicated view.

**`PATCH /admin/users/:id` was leaking `passwordHash` in its response.**
Found while typing `AdminUserDetail`/checking what the update endpoint
actually returns before wiring the edit form's save handler to it — the
service's `.returning()` call had no column restriction. Real
information-disclosure bug, not cosmetic; fixed in the backend
immediately rather than just avoiding the field in this page's own
rendering (a fix that stayed client-side would leave the raw HTTP
response still containing it for anyone checking network traffic).
Full detail in `devcraft-api`'s own `CHECKPOINT_29_CHANGELOG.md`.

## Verification

```
Frontend: tsc --noEmit clean, full next build clean — 4 new routes
          (/admin/users, /admin/users/[id], /admin/submissions,
          /admin/community all real now, replacing checkpoint 26's
          placeholders). Everything else unchanged.
Backend:  tsc --noEmit clean, 98/98 tests passing after the passwordHash
          fix.
```

## Admin UI item: complete

All six steps from the original roadmap
(`PRD_GAP_ANALYSIS_AND_ROADMAP.md` → `CONTINUATION_PLAN.md` →
`CONTINUATION_PLAN_v2.md` onward) are done: shell, Overview dashboard,
Audit log, Conflict resolution, Content CRUD, and now Users/Submissions/
Community. This has been the single largest item on the roadmap since
before checkpoint 26.

## Still open

Per `CONTINUATION_PLAN_v5.md`'s remaining P3 items: system-design content
type (20 FE + 20 BE challenges — needs a schema decision first, since it
implies a distinct content type from regular Q&A) and portfolio activity
heatmap / PDF export / custom domain, in that order. P4 (content
authoring) and P5 (hygiene) remain untouched, per standing direction.
