# Checkpoint 31 — System Design: Learner Practice Page

Completes the system design content type end to end (schema → backend →
admin authoring → this). No backend changes — everything this checkpoint
needed (`GET /system-design`, `GET /system-design/:slug`,
`GET /system-design/progress`, the status endpoints) was already built
and tested in checkpoint 30.

## What shipped

- **`/interview`** — System design is now a sibling tab next to Q&A
  (`SegmentedControl`, "Q&A" / "System design"), not a separate top-level
  section, per `CONTINUATION_PLAN_v7.md`'s own framing of these as
  siblings within Interview Prep. Track and difficulty filters are shared
  across both tabs — they're the same underlying dimension regardless of
  content type, so keeping a filter set when switching tabs seemed like
  the more coherent behavior than resetting it. Shuffle stays Q&A-only
  (the challenges list endpoint has no `sort=random`, and shuffling a
  small set of substantial multi-stage challenges isn't obviously useful
  the way it is for a big flashcard deck).
- **`ChallengeCard`** — list card, same visual language as
  `QuestionFlashcard` (badges, the track color-mix trick, status-tinted
  border) but no flip mechanic — there's no short answer to preview the
  way a Q&A card has; the scenario only makes sense read in full on the
  practice page.
- **`/interview/system-design/[slug]`** — the practice page. Scenario
  shown up front, then every stage as its own card: guiding questions
  always visible (this is what they exist for — prompting the learner to
  think before looking), a "Reveal model answer" button uncovers the
  model answer and diagram image per stage independently (not gated
  sequentially — a learner can jump to any stage, consistent with
  treating this as a learning tool rather than a timed exam). Reviewed /
  needs-practice toggle in the header, identical interaction to
  `InterviewQuestionDetail`'s.
- `lib/api/system-design.ts` — mirrors `lib/api/interview.ts`'s exact
  shape: `apiFetch`/`apiFetchWithMeta` for the public list/get endpoints,
  `authFetch` for progress and status, since those really are the same
  public/authenticated split as the existing Q&A client.

## Design choices carried over from investigation, not guessed

- Fetched by **slug**, not id, unlike interview questions — a deliberate
  choice made back in checkpoint 30 (challenges are closer to
  mini-lessons than quick Q&A cards) and carried through consistently
  here rather than revisited.
- Diagram images render via `next/image` with `unoptimized` — the URLs
  are arbitrary, admin-supplied external URLs (any domain), and Next's
  image optimization pipeline requires each remote domain to be
  allowlisted in `next.config.js` ahead of time. `unoptimized` renders a
  plain `<img>` under the hood instead, which was the only option that
  doesn't require the admin's choice of image host to be predicted and
  hardcoded into the app's config.

## Verification

```
tsc --noEmit: clean
next build:   clean — 1 new route (/interview/system-design/[slug]),
              /interview itself grew (new tab + queries) but every
              existing route, including all system-design admin routes
              from checkpoint 30, is unchanged.
Backend:      untouched this checkpoint — re-confirmed clean anyway
              (98/98, tsc clean) before calling this done.
```

## System design content type: complete

Schema (30) → backend, both public and admin (30) → admin authoring UI
(30) → learner practice page (31). An admin can author a full multi-stage
challenge with guiding questions, model answers, and diagrams, and a
learner can find it under Interview Prep, work through it stage by
stage, and mark it reviewed or needing more practice.

## Still open

One P3 item left per `CONTINUATION_PLAN_v7.md`: portfolio activity
heatmap / PDF export / custom domain. `GET /progress/activity` still
only returns raw recent events, not a day-bucketed year — needs a new
aggregation query before the heatmap can be built. P4 (content
authoring) and P5 (hygiene) remain untouched, per standing direction.
