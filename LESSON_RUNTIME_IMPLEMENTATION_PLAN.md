# Lesson Runtime Implementation Plan

## Goal

Give learners immediate feedback in React, Next.js, HTML, CSS, JavaScript, TypeScript, SQL, Git, and Docker lessons without booting a full browser Node.js environment for normal lessons. Preserve real execution for the small set of lessons where it is required.

## Design decisions

1. Keep the current iframe-based browser runner as the common preview and test boundary.
2. Do not run `npm install`, a package manager, or a full Node process for ordinary React or Next.js lessons.
3. Use one small, versioned client runtime that loads once, executes in an isolated iframe, and communicates through `postMessage`.
4. Permit only a curated dependency registry in browser lessons. Resolve each approved package to a prebuilt browser module.
5. Treat full Next.js, Fastify, and Express execution as a server sandbox concern. Browser simulators teach the API shape; remote sandboxes verify real framework behavior.
6. Keep the DevCraft Shop as the single seeded fixture and give every learner an isolated database namespace or transaction for mutations.

## Current baseline (audited October 25, 2026)

- `devcraft-web` now uses a replacement self-hosted lesson runtime in `public/lesson-runtime`. It compiles JSX and TSX in a dedicated worker, renders in a sandboxed iframe, supports virtual files, local imports, CSS and JSON, and exposes only curated React and Next teaching imports. It does not download packages or boot a browser Node process.
- `devcraft-api` already provides an isolated, per-learner DevCraft Shop PostgreSQL sandbox with seeded Shop data, query limits, transaction rollback, and Pro access controls. SQL lessons can use this safely today.
- The remaining browser-runtime work is content migration, draft persistence and runtime observability. The remaining server-runtime work is the multi-file Node, Express, Fastify, and selected server-side Next execution service.
- This implementation converts the legacy HTML simulations to `web-lab` and the legacy CSS simulations to `css-lab`. The content loader updates existing lessons by slug when it is seeded.

## Phase 0 — Content and runtime audit

### Deliverables

- Enumerate every lesson by slug, language, runtime, test strategy, and premium requirement.
- Change all lessons that teach HTML or CSS but currently use `javascript` to `html`, `css`, `web-lab`, or `css-lab` as appropriate.
- Replace JavaScript-only starter, solution, and test scripts with browser-lab content and browser assertions.
- Add an idempotent data patch for existing installations and update fresh-seed definitions.

### Classification

| Lesson intent | Runtime |
| --- | --- |
| Static markup | `html` |
| CSS on supplied markup | `css-lab` |
| HTML, CSS, and browser JavaScript | `web-lab` |
| JavaScript or TypeScript algorithm | Judge0 |
| SQLite query | Judge0 SQLite |
| React component behavior | lightweight React runtime |
| Next App Router concepts | constrained Next runtime |
| Real Node framework behavior | remote server sandbox |

## Phase 1 — Shared browser lesson protocol

### Work

- Extract a `LessonRuntime` message contract shared by preview, runner, and tests.
- Define `ready`, `compile`, `result`, `console`, `runtime-error`, and `test-result` messages.
- Add a session token to every message and reject messages from any other iframe.
- Persist editor drafts by lesson, language, and runtime version.
- Enforce code size, compilation time, and test time limits in the browser runtime.

### Acceptance criteria

- The editor appears before runtime loading finishes.
- A learner can edit, run, check, refresh, and return without losing work.
- Runtime errors are rendered as friendly diagnostics with no API, stack, or infrastructure details exposed.

## Phase 2 — Lightweight React runtime

### Work

- Compile TSX and JSX in a Web Worker with `esbuild-wasm`.
- Ship React and ReactDOM as a versioned vendor bundle loaded once per application version.
- Render compiled code in an isolated iframe with a small runtime bridge.
- Provide approved imports through a manifest, beginning with React, ReactDOM, `lucide-react`, and `clsx`.
- Provide deterministic browser APIs: timers, fetch mocks, local storage mocks, and seeded fixture responses.
- Run lesson tests inside the same iframe after a clean component mount.

### Scope exclusions

- No arbitrary npm installs.
- No Node built-ins, file system, child processes, native modules, or server-only Next APIs.

### Performance target

- Initial React runtime ready in under 2 seconds on a typical desktop connection after the vendor bundle is cached.
- Re-run after an editor change in under 500 milliseconds for a normal lesson.

## Phase 3 — Constrained Next lesson runtime

### Work

- Support an App Router-shaped virtual file tree: `app/layout.tsx`, `app/page.tsx`, nested routes, dynamic route parameters, `loading.tsx`, and `error.tsx`.
- Supply a small router bridge implementing `Link`, `useRouter`, `usePathname`, and `useParams`.
- Allow client components and selected server-component teaching patterns backed by fixture loaders.
- Render route results through the same React iframe runtime.
- Mock `fetch`, cookies, headers, redirects, and DevCraft Shop reads through an explicit lesson API.

### Scope exclusions

- No real Next compiler, webpack/Turbopack build, route handlers, server actions, or arbitrary package installation in this runtime.

### Escalation path

- Mark a lesson `next-server` only where real Next server behavior is the learning objective. Those lessons use the remote sandbox in Phase 5.

## Phase 4 — DevCraft Shop fixture service

### Work

- Define versioned Shop fixture schemas and seed snapshots.
- Provide read-only fixture endpoints for React and constrained Next lessons.
- Issue a short-lived lesson session token scoped to lesson, learner, allowed methods, and fixture version.
- For write exercises, create a per-attempt transaction or schema clone; roll it back after checking.
- Expose only whitelisted Shop endpoints and return product-safe error messages.

### Access model

| Lesson type | Data access |
| --- | --- |
| React / constrained Next | HTTP fixture gateway with scoped token |
| Node / Fastify / Express | sandbox-local connection to an isolated Shop database |
| PostgreSQL / SQL | learner-specific practice database or transaction |

### Fixture gateway contract

The browser must never receive a database URL or unrestricted administrative endpoint. The API exposes a lesson-scoped gateway instead:

1. `POST /lessons/:lessonId/fixture-session` creates a short-lived session after authenticating the learner and checking the lesson entitlement.
2. The token contains the lesson id, learner id, Shop fixture version, allowed HTTP methods, permitted resource paths, and an expiry. It cannot be reused for another lesson.
3. `GET /lesson-fixtures/shop/products`, `/products/:id`, `/categories`, and `/cart` return deterministic fixture data for React and constrained Next lessons.
4. `POST`, `PATCH`, and `DELETE` requests are accepted only for the lesson's allow-list. Each attempt writes to a learner-owned transaction or schema clone and returns a redacted, product-facing error on failure.
5. The browser runner records gateway calls for tests. Tests assert observable request and response behavior; they do not read internal API or database errors.

### DevCraft Shop delivery sequence

- Extract the current Shop seed into a versioned fixture package shared by the sandbox and fixture gateway.
- Add read-only endpoints and contract tests for product, category, and cart reads.
- Add isolated write attempts for cart, order, and inventory exercises, rolling each attempt back after verification.
- Give React and constrained Next lessons a preconfigured `API_BASE` and scoped token. Give Node, Express, and Fastify runs a sandbox-local Shop URL and disposable credentials.

## Phase 5 — Multi-file Node, Fastify, and Express sandbox

### Work

- Define a multi-file lesson bundle format with readonly scaffold files and editable learner files.
- Start each run in a disposable server sandbox with strict CPU, memory, wall-clock, request-count, and outbound-network limits.
- Install no arbitrary packages at runtime. Use versioned base images with a curated framework set.
- Mount the isolated DevCraft Shop database credentials only for the run.
- Execute HTTP acceptance tests against the learner server, capture structured output, then terminate the sandbox.
- Use the same friendly output renderer as browser, SQL, Git, and Docker lessons.

### Framework profiles

| Profile | Included capabilities |
| --- | --- |
| `node-server` | Node, TypeScript, test client, Shop SDK |
| `express-server` | Express, router, validation, test client, Shop SDK |
| `fastify-server` | Fastify, schema validation, test client, Shop SDK |
| `next-server` | pinned Next runtime for selected advanced lessons |

### Execution and safety contract

1. Store code as an explicit file bundle: path, contents, editability, and entrypoint. Reject traversal paths, symlinks, binaries, oversized files, and more files than the configured profile permits.
2. Materialize a fresh work directory for each run. Start the process in a locked-down container with no outbound network, non-root user, read-only framework image, CPU/memory/pid limits, a hard wall-clock deadline, and a per-run port.
3. Each profile uses a pinned image containing only its curated framework version. There is no package installation, shell access, arbitrary dependency download, Docker socket, or host filesystem mount.
4. Inject the Shop capability only as a scoped internal URL and short-lived credential. The reverse proxy checks the capability on every request; the learner process never sees production credentials.
5. The orchestrator waits for a readiness signal, runs declarative HTTP tests, gathers structured console logs and assertion results, destroys the process and database attempt, then releases the port.
6. Return a stable result envelope (`status`, `tests`, `logs`, `diagnostics`) to the web app. Map compiler, startup, request, timeout, and fixture failures to learner-safe messages.

### Delivery slices

| Slice | API work | Web work | Completion evidence |
| --- | --- | --- | --- |
| Bundle protocol | Bundle schema, validation, persistence | Multi-file editor with readonly files | A saved Node bundle reloads unchanged |
| Node profile | Isolated Node runner and HTTP checker | Run and test output | A multi-file Node server passes and fails deterministically |
| Express profile | Pinned Express image and route tests | Framework-aware template | CRUD exercise works against Shop fixture |
| Fastify profile | Pinned Fastify image and schema-aware tests | Framework-aware template | Validation and reply behavior are checked |
| Shop mutations | Scoped fixture proxy and rollback | Friendly mutation state | Writes are visible during a run, then removed |
| Next server profile | Selected real Next server lessons only | Server-runtime badge | Server-only lesson works without exposing infrastructure errors |

## Phase 6 — Operations, rollout, and verification

1. Add runtime telemetry for boot time, compile time, preview failures, and check results without collecting learner source.
2. Release behind lesson-runtime feature flags.
3. Convert a small React and Next lesson cohort first.
4. Verify every solution, starter, runtime error, test failure, refresh restore, and unsupported-browser path.
5. Migrate the remaining lessons in batches with idempotent content patches.
6. Keep the old runtime as fallback until the new cohort meets the performance and reliability targets.

## Implementation order

1. Audit and correct HTML/CSS lesson metadata and content.
2. Extract the shared browser runtime protocol.
3. Deliver the React runtime and convert React lessons.
4. Deliver the constrained Next runtime and convert conceptual Next lessons.
5. Build the Shop fixture gateway.
6. Build the multi-file Node sandbox, then Fastify and Express profiles.
7. Convert advanced Next lessons to the server profile only where required.
