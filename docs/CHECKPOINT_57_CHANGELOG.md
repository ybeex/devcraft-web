# Checkpoint 57: learner fixes, Pro access, admin console, projects, Git module

Packages: `devcraft-api-v38.zip`, `devcraft-web-checkpoint39.zip`
Tests: 533 unit, 272 live (real Postgres + Redis), web `tsc` + `next build` clean, browser flows verified in Chromium (signup, palette, lesson, AI drawer, playground, projects, profile, Pro redeem, bell, 404, admin shell, analytics, code generation, admin logout).

## Before you deploy (important)
1. **Apply migrations 0006 to 0010 on Neon**, in order: `0006_onboarding_state`, `0007_placement`, `0008_pro_access`, `0009_admin_notifications`, `0010_projects_many_per_module`. If 0006/0007 are missing, saving a track or goals fails, which is the most likely cause of "the track banner still shows" on your live site.
2. **Seed in this order**: `db:seed`, `db:seed:lessons-batch1..7`, `db:seed:content` (now also creates the two Git modules), then `db:seed:projects`. All of them are idempotent.
3. Add `PRO_TRIAL_DAYS=7`, `PRO_REWARD_TOP_N=10`, `PRO_REWARD_DAYS=30` to the API environment (see `.env.example`). `PRO_TRIAL_DAYS=0` switches the trial off.
4. The curriculum and lesson caches live in Redis for a short time, so the new modules appear within minutes of seeding.

## Learner fixes
- **Playground snippets** open only as a right-side overlay (Esc and backdrop close it; loading a snippet closes it). The editor is full width.
- **Playground console** folds away on HTML and CSS so the preview gets the height, and opens on JS. It can still be toggled by hand.
- **Lesson AI** is a floating "AI Tutor" button that opens a side drawer.
- **AI hint credits**: the usage log row is written only after the work succeeded, so a failed request no longer costs a credit. A test proves it and fails if the old behaviour returns.
- **Next lesson**: once a lesson is complete the header shows "Next lesson", or "Back to track" at the end of a track.
- **Signup / track banner**: the track is saved the moment it is chosen in onboarding (or taken from `?track=`), and the dashboard shows a skeleton until the saved session loads so the picker never flashes.
- **Command palette** responds to the keyboard: Ctrl/Cmd+K, arrows, Enter, Escape. Lesson results go to the lesson.
- **Interview prep** defaults to your track; "All" is still there.
- **Leaderboard tracks**: track boards rank lesson XP earned in that track (the old query filtered on a primary track that many users do not have). Four live tests cover it.
- **Sessions last a week** and slide on use. A 20-second grace stops two tabs refreshing together from signing you out; a logged-out token is never revived. The web app logs out only on a definitive 401/403 from refresh.
- **Notification bell**: unread count, a dropdown of the latest five, "Mark all read", "View all" to `/notifications`.
- **404 for signed-in users**: a "Back to your dashboard" button (plus an admin link for admins). The marketing header also swaps "Log in / Start free" for "Dashboard" when you are signed in.
- **Profile page** (`/profile`): avatar presets or an https URL, display name, bio, track and goals.

## Pro access
- **Codes**: the admin generates `DC-XXXX-XXXX-XXXX` codes (count, days, uses, validity, note) at `/admin/pro`, with CSV export, search, filters and revoke.
- **Redeem**: `/pro` for learners. Redemption is transactional, time stacks on top of any Pro already held, a code can be single or multi use, and wrong guesses are throttled per learner (10 per 15 minutes). A fresh PRO token comes back with the response.
- **1-week trial** for every new account. `users.tier` stays the permanent plan; `pro_until` and `pro_source` (TRIAL, CODE, REWARD) hold the time-limited Pro, and access tokens expire when it does.
- **Monthly rewards**: the top learners by monthly XP get a reward code (default 10 learners, 30 days, valid 90 days). Issued lazily when anyone opens `/pro/status` and also on demand from the admin. Idempotent per learner and month.
- A banner warns in the last three days of a trial or reward.

## Admin console
- Its own layout (`(admin)` route group): no learner sidebar, own header with theme toggle, "Learner view" link and a **Log out** button.
- **Admin notifications** are a separate store from learner notifications (new submissions, contact messages, AI provider errors, content conflicts, reward runs), with per-admin read state and their own bell and page.
- **Analytics** (`/admin/analytics`): growth, lessons completed, XP, AI usage, posts, retention cohorts, funnel and AI reuse, tracks, plans and goals, most-completed and stuck lessons, Pro, community, interview, placement and submissions. Every number is cross-checked against the database in live tests.

## Content
- **40+ original projects**: 21 Frontend and 22 Backend briefs across all difficulty levels (a few Pro). Each has a brief, acceptance criteria, outcomes and three stages with hints. They are inspired by the kinds of challenges on sites like Frontend Mentor but written from scratch: no copied text, designs or assets, and a test fails if third-party challenge references appear.
- The projects page has a track filter (defaults to yours) and "Load more"; the project page lists what you will practise.
- **Git & GitHub modules** for both tracks, placed right after the first module of each: 12 lessons each (FE: mental model, conventional commits, .gitignore, history, branching, merge vs rebase, conflicts, remotes, pull requests, GitHub Actions, undo, semver releases; BE: status, commit messages, secrets, bisect, cherry-pick hotfixes, merge strategies, migration conflicts, SSH/HTTPS remotes, diff review, CI with a database, reflog recovery, release tags). Every lesson is run in tests: the solution passes every check and the starter passes none.

## Bugs found on the way
- **"Semantic HTML" had no test results**: HTML lessons were sent to the code runner, which refuses HTML, so Check never produced results. HTML lessons are now checked against the parsed markup on the server (scripts in learner markup never run). Two other HTML lessons ("Heading Hierarchy", "Accessible Forms") had no tests at all and now have them. A live test asserts every lesson in the database has test code.
- **Project submission was broken**: the route passed the project id and user id to the service in swapped order, so every submission returned 404. It never showed because no projects had been seeded. Fixed, with a live test that fails if the order is swapped again.
- **Refresh race**: two simultaneous refreshes of one token could occasionally sign a tab out. Rotation now claims the token atomically and the loser receives the winner's pair.
- Projects could not have more than one per module (a unique index). Relaxed in migration 0010.

## Known / not done
- Streaks still update at login only. No funnel analytics beyond what exists.
- `npm run test:external` (real SMTP, Judge0, OpenRouter) has never been run.
- Tokens are still in localStorage (httpOnly cookies would be safer).
- HTML lessons have no live preview in the lesson editor; Run explains that markup is checked, not executed.
- Playground (Monaco) pages log script errors in my sandbox only because the editor loads from a CDN that is blocked here.
