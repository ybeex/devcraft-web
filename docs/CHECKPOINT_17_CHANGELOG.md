# Checkpoint 17 — Changelog

Continuation of `CONTINUATION_PLAN.md` from checkpoint 16. All seven remaining
pages are built, wired to real (or best-effort) API contracts, and the app
passes a full `npm run build` (33 routes, zero errors) plus `tsc --noEmit`.

## What shipped

1. **Project detail** (`/projects/[id]`) — stage breakdown with collapsible
   hints and an optional starter-code preview, tier-gate for Pro-only
   projects, submission form, and a status view (AI review + peer reviews)
   for existing submissions.
2. **Community** (`/community`, `/community/[id]`, `/community/new`) —
   extended `lib/api/community.ts` with detail/create/comment/reaction/resolve
   per the plan's exact contract. Reactions and resolve-as-answer are wired
   to real mutations.
3. **Leaderboard** (`/leaderboard`) — weekly/monthly/all-time toggle, medal
   styling for top 3, a "your rank" callout, and a rank-up reward pulse. See
   *Rank-up heuristic* below for how that last part actually works.
4. **Notifications** (`/notifications`) — infinite-scroll list, mark-read /
   mark-all-read, defensive payload parsing per notification type (see
   *Notification payload rendering* below).
5. **Interview prep** (`/interview`, `/interview/[id]`) — flip-to-reveal
   flashcards on the list; the detail page (also the target of TopBar's
   search results) adds a mock-interview panel with 402 tier-gating.
6. **Public portfolio** (`/p/[username]`) — deliberately a plain **Server
   Component**, not the client+useQuery pattern used everywhere else: it's
   the one page in this app meant to be opened by people without accounts
   (employers), so it needed real SSR rather than a client-side spinner.
   Lives outside `(platform)` and `(marketing)` with its own minimal layout.
7. **Playground** (`/playground`, `/playground/shared/[token]`) — Monaco
   editor (config lifted from `LessonEditorPane`), save/load/delete for your
   own snippets, a community-browse tab, and share-link copying. No run
   button — see *No execution endpoint* below.

Every mutating call added this session carries a fresh
`idempotencyKey: crypto.randomUUID()`, matching the pattern documented in
the plan's idempotency-key section.

## Decisions worth flagging

**Playground's type contract was never fully specified.** Unlike
`interview.ts`/`portfolio.ts`, the plan only named six function signatures
for `playground.ts` (`createSnippet`, `listMySnippets`, `getOwnSnippet`,
`deleteSnippet`, `getSnippetByShareToken`, `listCommunitySnippets`) without
field-level types — no backend source was in this checkpoint to check
against. The `Snippet` shape in `lib/api/playground.ts` is a best-effort
match to this codebase's conventions, flagged in a comment at the top of
that file. If the real DTOs differ, that's the one place to reconcile.

**Share links require login.** `getSnippetByShareToken` is a public
endpoint, but the viewer page lives at `(platform)/playground/shared/[token]`
— inside the authenticated shell — rather than as a new top-level route
tree. A separate `src/app/playground/...` directory alongside
`(platform)/playground/...` would have both resolved to the same `/playground`
URL prefix, which is exactly the kind of route-tree conflict Next.js
rejects at build time. Nesting it nets a working share feature without that
risk; the tradeoff is a logged-out recipient hits the login wall first. If
truly-public sharing matters, that needs a backend-confirmed decision on
whether `(platform)`'s layout auth-gate should special-case this one path,
not just a frontend routing tweak.

**No execution endpoint.** The plan's function list for playground didn't
include a run/execute call (unlike interview's `runMockInterview`), which is
a strong signal none exists yet. The editor ships save/share/browse only;
in place of a non-functional Run button there's a one-line note in the UI
saying execution isn't wired up. No dead button pretending otherwise.

**Rank-up heuristic (leaderboard).** There's no "previous rank" concept
server-side, so the reward pulse compares each successful `getMyRank` fetch
against the last one seen *for the same period* (a ref, not persisted
across page loads). Both `getMyRank` and `getLeaderboard` poll every 60s so
the comparison has a real chance to fire during a session — this is a
frontend-only motivational device, consistent with how the curriculum
tree's lock/unlock state and the daily XP goal ring already work elsewhere
in this app.

**Notification payload rendering.** `Notification.payload` is
`Record<string, unknown>` on the wire — untyped. `getMessage`/`getLink` in
the notifications page read specific keys defensively (`typeof v ===
'string'` guards) with generic fallback copy per type, rather than assuming
a schema. Mentions and peer-review notifications deep-link to the relevant
post/project when the payload has the right id; everything else is
display-only.

**Markdown renderer extracted.** `markdownComponents` moved out of
`LessonContentPane.tsx` into `lib/markdown/components.tsx` so the community
post detail page renders prose identically instead of drifting. No visual
change to lessons.

## Explicitly deferred (not blocking)

- Portfolio settings page (`updateMyPortfolio` exists in the API client;
  no settings UI was built — the public view was the priority).
- Playground code execution (see above).
- A dedicated `not-found.tsx` + catch-all for `/p/*` beyond the `[username]`
  segment itself — a multi-segment junk path under `/p/` still 404s
  correctly via the root fallback, just without the minimal portfolio
  header. Low-value edge case, skipped to keep scope disciplined.

## Verification

```
npx tsc --noEmit   → clean
npm run build      → 33/33 routes, zero errors
```
All `[id]`/`[...catchAll]` sibling pairs (projects, community, interview)
and the `community/new`, `playground/shared/[token]` static-vs-dynamic
coexistences confirmed building correctly in the production output — not
just reasoned about.
