# Checkpoint 26 — Admin UI: Overview Dashboard & Audit Log Browser

Covers steps 1–3 of the Admin UI build order from `CONTINUATION_PLAN_v2.md`:
the shell (layout, role gate, nav, API client), the Overview dashboard (all
four analytics endpoints, visualized), and the Audit log browser. Steps 4–6
(Conflict resolution UI, Content CRUD, Submission/Community/User management)
remain, as the roadmap itself expected — each gets its own placeholder page
in the shell rather than a 404, so the nav is honest about what's here.

No backend changes. Every endpoint consumed this checkpoint (analytics,
audit-log, conflicts) was already registered in `app.ts` and covered by the
existing 98-test suite (analytics/audit-log specifically aren't
test-covered themselves — only `conflicts.test.ts` exists among the three —
so their contracts were verified by reading `*.service.ts` directly rather
than trusting the route's `z.unknown()` response typing or the roadmap's
prose).

## 1. Admin shell

- `lib/api/admin.ts` — typed client for all three modules (analytics,
  audit-log, conflicts), per the roadmap's "API client to start" note. Full
  pagination envelope (`page/limit/total/totalPages/hasNext/hasPrev`) is
  preserved here rather than discarded down to just `total` the way
  `community.ts`/`interview.ts` do — those pages use infinite-scroll and
  only need "is there more?"; the admin browsers here use real page-number
  pagination and need the rest.
- `(platform)/admin/layout.tsx` — role gate, `AdminNav` sub-nav, scoped
  `[...catchAll]` 404 (mirrors the per-route-group pattern everywhere else).
- Sidebar now shows an "Admin" link (`ShieldCheck`, own divider, shares the
  sliding active-indicator's `layoutId` so it animates consistently with
  the rest of the nav) for `role === 'ADMIN'` users. It didn't exist before
  this checkpoint — the section was reachable only by typing the URL.
- `AdminNav` — 7-tab horizontal nav (Overview/Content/Submissions/
  Community/Users/Audit Log/Conflicts) using the same sliding-pill
  technique as `SegmentedControl`, sticky under the TopBar. Conflicts shows
  a live pending-count badge from `getPendingConflictCount` even though its
  own page is still a placeholder — the count is real signal today
  regardless of whether the resolution UI exists yet.

**Role gate is ADMIN-only, not ADMIN-or-MODERATOR.** The roadmap's
suggested build order says to redirect "if not `ADMIN`/`MODERATOR`," but
every single route in `admin.routes.ts`, `analytics.routes.ts`,
`audit-log-view.routes.ts`, and `conflicts.routes.ts` gates on
`authorize('ADMIN')` specifically — there is no MODERATOR-accessible admin
endpoint anywhere in the backend today. Gating the frontend more loosely
than the backend would just mean a MODERATOR gets past the layout and then
hits 403s on every request the pages make. Built to match the real
contract; loosen this if a MODERATOR-accessible endpoint ships later.

## 2. Overview dashboard (`/admin`)

First real usage of `recharts` in the app (installed, unused until now) —
and first real usage of the `--chart-1..6` palette that was already sitting
in `globals.css` for exactly this. A days selector (7D/30D/90D, shared
across all four) plus:

- **KPI row** — Registered, Certified (with conversion % of registered),
  Active learners (summed across tracks), Pending conflicts (ties to the
  Conflicts tab; warning-tinted when > 0).
- **Learner funnel** — horizontal bar chart, one brand hue at decreasing
  opacity per stage rather than a categorical palette, since this is one
  journey narrowing down, not five unrelated series. Tooltip surfaces
  `percentOfPrevious`.
- **Track engagement** — rendered as cards, not a chart. With ~2 tracks and
  three heterogeneous fields per track (a count, a percentage, a nested
  drop-off object), a 2-bar chart would've been sparser and less legible
  than cards with an inline completion-% bar and a drop-off callout.
- **AI usage** — line chart, one line per prompt type, pivoted from the
  API's long-format `{date, promptType, calls}` rows into one row per date.
  Explicitly zero-fills every known type for any date that has *some* data
  (rather than `connectNulls`), so a quiet day for one prompt type dips to
  zero instead of getting smoothed over — `connectNulls` would have
  visually erased real zero-call days. Tier breakdown shown as chips below
  rather than a second chart (3 data points don't need one).
- **Content health** — paginated list, not a chart; a `PartyPopper` empty
  state when there are zero issues, since that's a genuinely good outcome
  worth stating positively rather than as generic emptiness.

## 3. Audit log browser (`/admin/audit-log`)

Filterable, paginated table (search-by-action, action dropdown sourced
from `listAuditActions`, admin dropdown sourced from
`getAdminActivitySummary(365)`, free-text target-type, from/to dates).
Hand-rolled rather than pulling in `@tanstack/react-table` — `package.json`
has an explicit note that the library is intentionally not installed yet
and that table code should already be shaped for a zero-refactor drop-in.
Structured accordingly: a `columns`-shaped render loop rather than ad hoc
JSX per field, so wrapping it in real `columnHelper`/`getCoreRowModel`/
`flexRender` later is a swap, not a rewrite.

Rows expand in place to show the full target ID, IP, and pretty-printed
payload — using data already present in the list response rather than
calling `GET /admin/audit-log/:id` per row. That endpoint (built into the
API client, just not wired into this UI) only adds the acting admin's
email over what the list already returns; not worth a per-row round trip
for one field with no real workflow attached to it here.

## 4. Coming-soon placeholders

`/admin/content`, `/admin/submissions`, `/admin/community`, `/admin/users`
render a shared `ComingSoonPanel` instead of hitting the scoped 404 —
matches the roadmap's intended nav from the start rather than only adding
tabs as their pages ship. `/admin/conflicts` is the one exception with
real content: it shows the live pending count (same query as the nav
badge, no extra fetch) above the placeholder text, since that number
doesn't need the resolution UI to be useful.

## Found while verifying

**Pre-existing theme bug, not introduced this checkpoint:** `bg-brand-muted`
(27 files) and `border-rim-subtle` (62 files) have been used throughout the
app since at least checkpoint 17, but neither `--color-brand-muted` nor
`--color-rim-subtle` was ever registered under Tailwind's `@theme` block in
`globals.css` — only the raw `:root` custom properties existed. Confirmed
by inspecting the compiled CSS directly: `.bg-brand-muted` and
`.border-rim-subtle` did not exist as rules anywhere in `.next/static/css`.
Every "active/highlighted" background using `brand-muted` was rendering
fully transparent (no fallback exists for a missing `background-color`
utility); every "subtle border" was silently falling back to the regular
`--rim` value via the global `* { border-color: var(--rim) }` reset. Fixed
by adding the two missing `--color-*` mappings — a purely additive,
two-line change, rebuilt clean, confirmed both rules now compile correctly
with real color values. This affects dozens of already-shipped pages, not
just this checkpoint's new admin UI — worth a visual pass over the app
generally now that these will actually render as originally designed.

**Backend doc/implementation mismatch, not fixed this checkpoint:**
`audit-log-view.service.ts`'s `AuditLogFilters.search` field is documented
as "free-text search across action + targetType + targetId," but the
actual `listAuditLogsFiltered` implementation only does
`ilike(auditLogs.action, ...)` — it searches `action` alone. The frontend
search box here is built and labeled to match the real, narrower behavior
("Search by action"), not the doc comment's broader claim. Left the
backend alone since expanding search scope is a real design decision
(exact match vs. ilike on `targetId`? a join for admin username?), not a
one-line fix — flagging it for whoever owns that file to either widen the
implementation or narrow the comment.

## Verification

```
Frontend: tsc --noEmit clean, full next build clean — 41 routes total
          (33 previous + /admin, /admin/[...catchAll], /admin/audit-log,
          /admin/content, /admin/submissions, /admin/community,
          /admin/users, /admin/conflicts). No unused-import findings on a
          manual pass (next lint has no config in this project — tsc +
          build remain the established verification path per the
          checkpoint-25 note, so didn't introduce a new one here).
Backend:  untouched — 98/98 tests passing, tsc --noEmit clean, confirmed
          before starting (not just assumed from the roadmap doc).
```

## Still open from the roadmap

Per the original suggested order: Conflict resolution UI (step 4 — the
"keep mine / keep theirs / merge" flow with a real diff between
`attemptedChanges` and `currentSnapshot`) is the natural next slice, since
its API client functions already exist from this checkpoint. Then Content
CRUD (step 5, biggest form surface, `expectedUpdatedAt` has to be threaded
through every save), then Submission approval + Community moderation +
User management (step 6). Beyond the Admin UI item: system-design content
type (needs a schema decision first) and portfolio heatmap/PDF export/
custom domain, in that order, per `CONTINUATION_PLAN_v2.md`. P5 hygiene
still last.
