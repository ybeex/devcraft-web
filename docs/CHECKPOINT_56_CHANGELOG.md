# Checkpoint 56: Placement hardening (the three caveats from checkpoint 55)

Packages: `devcraft-api-v37.zip`, `devcraft-web-checkpoint38.zip`
Tests: 442 unit, 232 live (real Postgres + Redis), web `tsc` + `next build` clean, browser flows verified (Chromium). No new migration.

## 1. Question bank: 120 questions, balanced options
- 8 questions per module (was 4). Same rules: answers never leave the server, options are shuffled per session.
- Option lengths are balanced so length gives nothing away. Measured on the bank: the right option is the strictly longest in 28% of questions and the strictly shortest in 15% (chance is 25% each). The old bank was 72% longest.
- `tests/placement-bank.test.ts` now enforces it (longest between 12% and 36%, shortest between 10% and 36%, at most 5 of 8 per module, no option 4x longer than another). I checked that these tests fail on the old bank.
- My first rebalance overshot and made the longest option almost never right, which is the same tell reversed; the tests would have caught that too.

## 2. "Lessons start at order 3": a test-database artifact, not a product bug
- The `db:seed:lessons-batch1..7` scripts skip any module that already has lessons. My test database had been seeded with the checkpoint-53 content first, so batches 1-7 (the beginner lessons at orders 0-2) never ran there.
- Seeded in the real order (batches 1-7, then `db:seed:content`), every module has orders 0-6 and most have a BEGINNER lesson. Verified on a copy: a career-switch learner sees "Building your fundamentals" on beginner lessons.
- **If your database was seeded content-first, run the batch seeds on a fresh DB or renumber.** Nothing in the code changed for this.

## 3. Free learner placed in a Pro module
- `GET /suggestions` now returns `lockedFrom: { moduleSlug, moduleTitle } | null`. It is set only for a free account whose next lessons (from the placement start on) are all Pro. Pro accounts never get it. An in-progress free lesson counts as open work.
- Dashboard: a note above the card ("You placed into React Advanced, which is part of Pro...") linking to `/pricing`, with the free basics still offered. If nothing free is left at all, the card says "You've finished the free lessons" and links to pricing.
- Plan page shows the same note under "Where you start".

## Known / not done
- Questions are still foundational probes (two per module are used per run). A code-reading question type would test more than recall.
- Streaks update only at login; no onboarding/placement funnel analytics; real SMTP and `test:external` never run.
