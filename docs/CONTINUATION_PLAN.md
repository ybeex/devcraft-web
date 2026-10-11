# DevCraft Web — Continuation Build Plan

**Document purpose:** this repo has been rebuilt from scratch multiple times this session due to sandbox resets. This doc exists so that a *fresh* session — with zero memory of prior conversation — can pick up exactly where this one left off, with no ambiguity about what exists, what's missing, and what contracts must be honored.

**Read this whole document before writing any code.** Section 3 in particular contains load-bearing constraints — routes and API shapes that *already-built* pages depend on. Getting these wrong breaks working code.

---

## 1. Current Status

### Backend (`devcraft-api`) — ~95% complete
Every core feature is built: auth, curriculum, lessons (with sandboxed code execution), progress, projects, community, portfolio, interview prep, AI tutor (OpenRouter, 7-model catalogue), leaderboard, admin CMS, certificates, notifications, search, playground, plus a full security-hardening pass (SQL injection fix, refresh-token hashing, JTI revocation, atomic AI credits, prompt-injection guard, audit logging).

Three standalone modules were built separately and need merging into the main API repo via their own `INTEGRATION.md`:
1. **Admin analytics + audit-log view + conflict resolution** (`devcraft-admin-analytics-module.zip`)
2. **Bulk lesson-status endpoint** (`devcraft-bulk-lesson-status-module.zip`) — `GET /progress/tracks/:slug/lessons`
3. **Contact form backend** (`devcraft-contact-module.zip`)

### Frontend (`devcraft-web`) — ~80% complete

**Fully built and verified (compiled + `next build` succeeded):**
- Design system foundation (`globals.css`, motion variants, brand mark, 10 custom icons, all core UI primitives)
- Full marketing site: home, `/fe`, `/be`, `/pricing`, `/about`, `/blog` (+5 articles), `/contact` (real API), `/legal/terms`, `/legal/privacy`, `/changelog`
- Auth flow: `/register`, `/login`, `/forgot-password`, `/reset-password`
- Onboarding: `/onboarding` (3-screen: track → goals → AI tutor intro)
- Dashboard shell: responsive sidebar, top bar with real debounced search + live notification polling, `/dashboard` page (continue-learning card, XP ring, stats, activity feed, community snippet)
- Both 404 variants (marketing full-bleed + dashboard-shell-preserving, via the catch-all-route workaround — see §3.3)
- Curriculum tree: `/learn/fe`, `/learn/be` (D3-assisted skill tree)
- **Full lesson detail page**: `/learn/fe/[slug]`, `/learn/be/[slug]` — three-pane Monaco editor, AI tutor chat, run/check/complete flow, reward-pulse celebration
- Projects list: `/projects` (grid, difficulty filter) + `ProjectCard` component

**NOT built — this is the remaining ~20%:**

| Page | Route | API client | Priority |
|---|---|---|---|
| Project detail + submit | `/projects/[id]` | ✅ exists (`lib/api/projects.ts`) | Highest — list page links here already |
| Community list + detail | `/community`, `/community/[id]` | ✅ exists (`lib/api/community.ts`) but incomplete (see §4.2) | Highest — TopBar search, dashboard widget already link here |
| Interview prep | `/interview`, question detail | ❌ not started | High |
| Leaderboard | `/leaderboard` | ✅ exists (`lib/api/leaderboard.ts`) | Medium — just needs UI |
| Public portfolio | `/p/[username]` | ❌ not started | Medium — sidebar + topbar avatars already link here |
| Playground | `/playground` | ❌ not started | Lower |
| Notifications | `/notifications` | ✅ exists (`lib/api/notifications.ts`) | Lower — bell icon already links here |

---

## 2. Tech Stack Reference

```
Next.js 15 (App Router) · React 19 · TypeScript (strict, noUncheckedIndexedAccess)
Tailwind v4 (CSS-first @theme config, no tailwind.config.js)
Framer Motion · Zustand (+ persist) · TanStack Query · react-hook-form + Zod
@monaco-editor/react 4.7 · react-markdown 10 (default export!) + remark-gfm
D3 (skill-tree connector curves only) · Recharts (installed, not yet used anywhere)
Fonts via <link> tags in layout.tsx, NOT next/font/google (sandbox network constraint)
```

Backend: Fastify 5 + Drizzle ORM + PostgreSQL + Redis + OpenRouter. Base URL: `NEXT_PUBLIC_API_URL` env var, defaults to `http://localhost:3000/api/v1`.

---

## 3. Critical Cross-Cutting Context

### 3.1 Route structure quirks (do not "fix" these — they're intentional)

- **`/dashboard`, not `/learn/dashboard`.** The `(platform)` route group has `dashboard`, `learn`, `projects`, `interview`, `community`, `leaderboard`, `playground` as *sibling* directories, not nested under `learn`. Only `/learn/fe` and `/learn/be` (curriculum trees) live under `learn/`.
- **Lesson detail routes are `[slug]` nested *under* the static `fe`/`be` directories** — i.e. `(platform)/learn/fe/[slug]/page.tsx`, NOT a shared `(platform)/learn/[track]/[slug]/page.tsx`. A shared dynamic `[track]` segment would collide with the static `fe`/`be` directories that already exist as siblings.
- **Portfolio is `/p/[username]`**, not `/portfolio/[username]` or `/profile/[username]`. This is referenced from `Sidebar.tsx` and `TopBar.tsx` avatar links already. **This route must NOT live inside `(platform)`** — it needs to be publicly viewable without auth (employers view it), so it should be its own top-level route (`src/app/p/[username]/page.tsx`) or under `(marketing)`, with its own layout that doesn't assume a logged-in session.

### 3.2 The idempotency-key lesson (learned twice this session, the hard way)

**Never derive an idempotency key from data that changes between an original request and its retry**, and **never use a key that's static across genuinely-different logical actions**. Two real bugs were caught and fixed:
1. `completeLesson` originally bucketed `timeSpentMs` into the key — wrong, because elapsed time keeps advancing even between a request and its retry.
2. `submitProject` originally used a static `submit-project-${id}` key — wrong, because the backend legitimately allows re-submitting the same project (to update URLs), and a static key would make the second submission return the cached *first* response for up to 24 hours.

**The correct pattern**, used everywhere now: `idempotencyKey: crypto.randomUUID()` generated fresh per call. This works because `authFetch`'s 401-refresh-and-retry reuses the same request options (including the key), which is the only kind of "retry" that should ever reuse a key.

### 3.3 The 404 catch-all pattern

Next.js App Router route-group `not-found.tsx` files do **not** activate for genuinely-unmatched top-level paths — only when something in that group's tree explicitly calls `notFound()`. The workaround (already implemented, do not remove):
- `(marketing)/[...catchAll]/page.tsx` calls `notFound()` → triggers `(marketing)/not-found.tsx` with header/footer intact.
- `(platform)/dashboard/[...catchAll]/page.tsx` (scoped under `/dashboard` specifically, **not** a blanket `(platform)`-wide catch-all — that would collide with marketing's) calls `notFound()` → triggers `(platform)/not-found.tsx` with sidebar intact.
- **As new platform pages ship** (projects, community, etc.), add a matching scoped catch-all under each: `(platform)/projects/[...catchAll]/page.tsx`, `(platform)/community/[...catchAll]/page.tsx`, etc. — mirroring the dashboard one exactly. Without this, a bad sub-path under `/projects/*` falls through to the root/marketing 404 instead of staying in the dashboard shell.
- Root `src/app/not-found.tsx` is the true last-resort fallback (no guaranteed layout).

### 3.4 Pagination meta pattern

`apiFetch<T>(path)` returns just `T` (the `data` field). For paginated list endpoints where the caller needs `meta.total`, use `apiFetchWithMeta<T>(path)` instead, which returns `{ data: T; meta?: {...} }`. Both are exported from `lib/api/client.ts`. `listProjects` and `listCommunityPosts` already use this pattern — follow it for any new paginated endpoint (interview questions, leaderboard if paginated further, playground community snippets).

### 3.5 Real backend constraints to respect (don't build UI that implies otherwise)

- **No per-lesson server-side locking.** `POST /lessons/:id/complete` works on any valid, tier-permitted lesson ID regardless of order. The curriculum tree's lock/unlock UI (`lib/utils/curriculum-tree.ts`) is a frontend-only motivational device — this is documented in that file's comments. Don't build anything that treats lesson order as a real access-control boundary.
- **`lesson.content` never includes `solutionCode` or `testCode`** — the backend strips both (see `AUDIT_REPORT.md`'s data-exposure fix). Don't add them to the `LessonDetail` type even if a raw response payload appears to have them.
- **No "daily XP goal" concept exists server-side.** `XpGoalRing.tsx` computes "today's XP" client-side by filtering `GET /progress/activity` for today's date; the 200 XP target is a frontend-only constant (`DAILY_GOAL_XP` in that file). Don't invent a backend field for this.
- **AI calls are stateless** — no conversation-memory endpoint exists. `AiTutorPane.tsx`'s chat log is purely client-side state; each call (`getHint`/`explainError`/`reviewCode`) is independent.

### 3.6 Component reuse — check here before building something new

| Component | Location | Reuse for |
|---|---|---|
| `IconChip` | `components/ui/IconChip.tsx` | Any icon+label pairing — never render a bare icon next to text |
| `StatusDot` | `components/ui/StatusDot.tsx` | Any status indicator (post resolved, submission status, etc.) |
| `TrustBanner` | `components/ui/TrustBanner.tsx` | Project submission confirmation, any "this is secure/confirmed" moment |
| `GuidanceCard` | `components/ui/TrustBanner.tsx` (same file) | "What's next?" moments — after submission, after mock interview, etc. |
| `EmptyState` | `components/ui/EmptyState.tsx` | Every empty list state — one icon (dimmed `FeatureIcon`), headline, body, ONE action |
| `Skeleton` + friends | `components/ui/Skeleton.tsx` | Every loading state — shaped to match resolved content, never a spinner |
| `AvatarStack` | `components/ui/AvatarStack.tsx` | Peer reviewers, co-discussants |
| `SegmentedControl` | `components/ui/SegmentedControl.tsx` | Already used for project difficulty filter — reuse for interview difficulty/track filters, leaderboard period toggle |
| `FeatureIcon` | `components/brand/FeatureIcon.tsx` | Any feature-identity icon (never Lucide for these — see design philosophy doc) |
| `rewardPulse` variant | `lib/motion/variants.ts` | **Reserved for exactly 4 moments app-wide**: lesson XP, streak increment, certificate unlock, leaderboard rank-up. Lesson XP already implemented in `LessonPageClient.tsx` — mirror that pattern for rank-up on the leaderboard page. |
| `cascadeContainer`/`cascadeItem` | `lib/motion/variants.ts` | Any list/grid entrance (max 6 items staggered) |
| `hoverLift` | `lib/motion/variants.ts` | Any clickable card |

---

## 4. Remaining Pages — Detailed Specs

### 4.1 Project Detail (`/projects/[id]`) — HIGHEST PRIORITY

**Route:** `src/app/(platform)/projects/[id]/page.tsx` (+ scoped catch-all per §3.3)

**API already available** (`lib/api/projects.ts`):
- `getProject(id): Promise<ProjectDetail>` — includes `stages[]`, `module`, `submissionCount`
- `submitProject(id, { repoUrl?, liveUrl?, notes? }): Promise<{id, status}>` — idempotent, correct UUID key already
- `getMySubmissions(): Promise<MySubmission[]>` — use to check if the user already submitted this project
- `submitPeerReview(submissionId, score, feedback)`

**Build:**
1. Fetch `getProject(id)` + `getMySubmissions()` (filter client-side for `project.id === id` to find existing submission)
2. Render stages as a numbered breakdown (title, description, hints — collapsible)
3. If no existing submission: render a form (repoUrl, liveUrl, notes — react-hook-form + Zod, mirror `RegisterForm.tsx`'s pattern) ending in a `TrustBanner` ("Your submission is reviewed by peers and AI") then submit button
4. On success: show a `GuidanceCard` "What's next?" (peer review timeline, AI review timeline) — mirror the booking-flow reference pattern from the design philosophy doc
5. If existing submission: show status (`StatusDot`), repo/live links, AI review + score if present, peer reviews list (`AvatarStack` for reviewers)
6. Tier-gate: if `project.isPremium` and user tier is FREE, show an upgrade prompt instead of the form (mirror the lesson page's premium handling pattern — check `LessonDetail.isPremium` handling if it exists, otherwise this is the first tier-gate UI in the app; keep it simple, a `TrustBanner`-style callout with a link to `/pricing`)

### 4.2 Community (`/community`, `/community/[id]`) — HIGHEST PRIORITY

**`lib/api/community.ts` currently only has `listCommunityPosts`.** Needs these additions, matching the real backend (`community.routes.ts`) exactly:

```typescript
// Add to lib/api/community.ts

export interface CommunityPostDetail extends CommunityPost {
  content: string
  codeSnippet: string | null
  language: string | null
  comments: CommunityComment[]
  reactions: { userId: string; emoji: string }[]
}

export interface CommunityComment {
  id: string
  content: string
  endorsed: boolean
  upvotes: number
  createdAt: string
  user: { username: string; displayName: string; avatar: string | null }
}

export function getCommunityPost(id: string): Promise<CommunityPostDetail> {
  return apiFetch<CommunityPostDetail>(`/community/${id}`) // public
}

export function createCommunityPost(body: {
  type: 'QUESTION' | 'SHOWCASE' | 'ARTICLE' | 'NOTE'
  title: string; content: string
  codeSnippet?: string; language?: string; tags?: string[]
}): Promise<{ id: string }> {
  return authFetch('/community', { method: 'POST', body })
}

export function addComment(postId: string, content: string): Promise<{ id: string }> {
  return authFetch(`/community/${postId}/comments`, { method: 'POST', body: { content } })
}

export function toggleReaction(postId: string, emoji: 'helpful' | 'inspiring' | 'learned'): Promise<{ action: 'added' | 'removed' }> {
  return authFetch(`/community/${postId}/reactions`, { method: 'POST', body: { emoji } })
}

export function resolveQuestion(postId: string, commentId: string): Promise<{ message: string }> {
  return authFetch(`/community/${postId}/resolve`, { method: 'POST', body: { commentId } })
}
```

**Build:**
1. `/community` list page — mirror `/projects` page structure exactly (SegmentedControl for type filter: All/Question/Showcase/Article/Note, cascade grid, EmptyState)
2. `/community/[id]` detail page — post content (reuse the markdown-rendering `components` object pattern from `LessonContentPane.tsx` if the post has a code snippet), comment thread, reaction buttons, "mark resolved" button (author-only, QUESTION type only — check `post.user.username === currentUser.username`)
3. A "New Post" button/page — simple form, similar structure to the project submission form

### 4.3 Interview Prep (`/interview`) — HIGH PRIORITY

**No API client exists — build `lib/api/interview.ts` from scratch:**

```typescript
export interface InterviewQuestion {
  id: string
  track: 'FE' | 'BE'
  title: string
  answer: string
  codeExample: string | null
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  topic: string
}

export function listInterviewQuestions(params: {
  page?: number; limit?: number; track?: 'FE' | 'BE'
  difficulty?: string; topic?: string
}): Promise<{ questions: InterviewQuestion[]; total: number }> {
  // GET /interview, public, use apiFetchWithMeta
}

export function getInterviewQuestion(id: string): Promise<InterviewQuestion> {
  // GET /interview/:id, public
}

export function runMockInterview(body: {
  questionId: string; questionTitle: string; userAnswer: string
  track: 'FE' | 'BE'; difficulty: string
}): Promise<{ feedback: string }> {
  // POST /interview/mock, auth required, Pro-gated (402 for FREE tier)
}
```

**Build:**
1. `/interview` — filterable list (SegmentedControl for track FE/BE, difficulty), flashcard-style expand-to-reveal-answer UI per the original PRD spec
2. Mock interview mode: text input for an answer, submit → `runMockInterview`, show AI feedback. Handle 402 (FREE tier) with a `TrustBanner`/upgrade prompt, same pattern as project premium-gating.
3. TopBar search already links to `/interview/${id}` — decide whether that's a modal/expand-in-place on the list page or a dedicated detail route; either works, just make the route resolve.

### 4.4 Leaderboard (`/leaderboard`)

**API already complete** (`lib/api/leaderboard.ts`). Just needs UI.

**Build:** Reuse the exact visual pattern already designed in the (now-deleted, but documented in `DESIGN_PHILOSOPHY.md` §10) leaderboard row spec: rank badge (gold/silver/bronze tonal for top 3, plain for the rest), avatar, name + track, XP value right-aligned. `SegmentedControl` for period (weekly/monthly/all-time — matches `LeaderboardPeriod` type already). Highlight the current user's row if present in the list (compare `entry.userId` against the auth store's `user.id`). Use `getMyRank()` for a "Your rank" callout if the user isn't in the visible top N.

### 4.5 Public Portfolio (`/p/[username]`)

**No API client exists — build `lib/api/portfolio.ts`:**

```typescript
export interface PublicPortfolio {
  user: { username: string; displayName: string; avatar: string | null; primaryTrack: 'FE'|'BE'|null; tier: string; xp: number; level: number; currentStreak: number; memberSince: string }
  portfolio: { headline: string | null; bio: string | null; githubUrl: string | null; linkedinUrl: string | null; websiteUrl: string | null; skills: unknown[] }
  stats: { projectsBuilt: number; lessonsCompleted: number }
  projects: Array<{ id: string; title: string; track: string; techStack: string[]; difficulty: string; liveUrl: string|null; repoUrl: string|null; avgScore: number|null; submittedAt: string }>
}

export function getPublicPortfolio(username: string): Promise<PublicPortfolio> {
  // GET /portfolio/:username, PUBLIC — no auth
}

export function updateMyPortfolio(body: {
  headline?: string; bio?: string; githubUrl?: string; linkedinUrl?: string
  websiteUrl?: string; isPublic?: boolean; skills?: unknown[]
}): Promise<unknown> {
  // PUT /portfolio/me, auth required
}
```

**Build — architecturally different from other remaining pages:**
1. **Route location:** `src/app/p/[username]/page.tsx` (top-level, own layout — NOT inside `(platform)`, must render without requiring auth). Give it a minimal standalone layout (logo header linking home, no sidebar) — could share structure with `(auth)/layout.tsx`'s minimal approach but full-width, not centered-card.
2. 404 if `getPublicPortfolio` throws `NOT_FOUND` (private or nonexistent) — use `notFound()` from `next/navigation`.
3. Layout: header (avatar, name, track badge, level/XP/streak stats), bio/links, project grid (reuse `ProjectCard`-adjacent styling but simpler — no "click to view detail" since these are display-only showcases with direct liveUrl/repoUrl links).
4. A **separate, auth-gated settings page** for editing your own portfolio (`PUT /portfolio/me`) doesn't have an established route yet — reasonable to add under `(platform)/settings/portfolio` or similar when you get to it; not blocking for the public view to ship first.

### 4.6 Playground (`/playground`)

**No API client exists — build `lib/api/playground.ts`** matching `playground.routes.ts`: `createSnippet`, `listMySnippets`, `getOwnSnippet`, `deleteSnippet`, `getSnippetByShareToken` (public), `listCommunitySnippets` (public).

**Build:** Reuse `LessonEditorPane`'s Monaco setup but simplified — no lesson-specific run/check against a test suite, just a language selector + Monaco + a generic "Run" (via the same sandbox executor, but there's no `POST /playground/:id/run` endpoint — check whether playground execution reuses the lesson `/run` pattern or needs its own; if no execution endpoint exists for playground specifically, ship save/share/browse first and flag code-execution-in-playground as a follow-up gap).

### 4.7 Notifications (`/notifications`)

**API already complete** (`lib/api/notifications.ts`). Straightforward list page: paginated, mark-as-read on click, "mark all read" button, icon per `notification.type` (mirror `EVENT_ICON` mapping pattern from `ActivityFeed.tsx`).

---

## 5. Mandatory Process (do not skip steps)

This session lost work to sandbox resets **five separate times**. The following discipline is not optional:

1. **Write in small batches** — 2-4 files max before compiling.
2. **After every batch:** `cd devcraft-web && npx tsc --noEmit` — must be clean before proceeding.
3. **Before every checkpoint:** `npm run build` (full production build, not just `tsc`) — this catches things type-checking alone misses (the route-collision bug was only caught this way).
4. **After every clean build:** `rm -rf .next`, zip the `devcraft-web/` directory (excluding `node_modules` and `.next`), copy to `/mnt/user-data/outputs/`, delete the previous checkpoint zip, and **use `present_files` to surface it** — don't just save it silently.
5. **If any tool call returns an unexpected error** (especially `cd: can't cd to ...`, empty directories, or `npm` registry errors), **immediately check for a reset** before continuing: `pwd`, `ls /home/claude/devcraft-web/src`, `ls node_modules | wc -l`. Don't assume a transient glitch — verify.
6. **If `registry.npmjs.org` (or any allowed host) returns `403` with `x-deny-reason: host_not_allowed`**, this is an infrastructure-level issue, not something fixable via retries, cache-clearing, or alternate flags. Confirm it's broad (test 2-3 unrelated packages) not narrow, then stop attempting installs and report it plainly rather than burning turns retrying.
7. **When restoring from a checkpoint after a reset**, don't assume the checkpoint is stale — verify what it actually contains (`find src -type f`) before rewriting anything, since a checkpoint may be more current than expected or a partial loss (some files survived, some didn't — check precisely rather than assuming total loss).

---

## 6. Suggested Order for Remaining Work

Given dependency direction and what's already linked from existing pages:

1. **Project detail** (`/projects/[id]`) — the list page already links here; this is a dangling link right now
2. **Community list + detail** — TopBar search and dashboard widget already link here; also a dangling link
3. **Leaderboard** — API is done, purely a UI task, fast win
4. **Notifications** — API is done, purely a UI task, fast win
5. **Interview prep** — needs a new API client but otherwise self-contained
6. **Public portfolio** — architecturally distinct (public route, no auth), do this once the auth-gated pages are stable so the layout pattern split is clean
7. **Playground** — lowest priority, most likely to surface a genuine backend gap (execution endpoint)

After each page: add its scoped `[...catchAll]` 404 trigger (§3.3) before moving to the next.
