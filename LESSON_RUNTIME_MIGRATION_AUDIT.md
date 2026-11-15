# Lesson Runtime Migration Audit

Audited 25 October 2026 against `devcraft-api/src/db/content` and legacy TypeScript seed batches.

## Inventory

| Current runtime | Lessons | Assessment |
| --- | ---: | --- |
| `web-lab` / `css-lab` | 39 | Already on an appropriate browser runtime. |
| `react-lab` | 15 | Keep on the replacement React runtime; certify each against its supported import and browser API contract. |
| `next-lab` | 9 | Split between constrained browser Next and real server Next profiles. |
| `webapp` | 9 | Keep browser based, but move all data calls to the scoped DevCraft Shop fixture gateway. |
| `postgresql` / `nodejs-db` | 38 | Keep real database execution; promote endpoint exercises to multi-file server profiles. |
| `git-lab` / `docker-lab` | 46 | Already use dedicated labs. |
| JavaScript / TypeScript | 78 | Retain genuine algorithm lessons; redesign simulations of browsers, SQL, Docker, React, Next, or HTTP frameworks. |

## Do not migrate

These are correctly represented as JavaScript or TypeScript functions: FE JavaScript core, FE TypeScript, backend system-design patterns, pure authentication and security algorithms, and focused Node concepts without a running-process objective.

Examples include token buckets, circuit breakers, URL parsers, query-string codecs, type guards, JWT verification, HMAC validation, deep cloning, and capacity estimation.

## Already migrated

The six legacy CSS lessons are `css-lab` lessons. These HTML lessons are now `web-lab` lessons:

- `html-links-and-urls`
- `html-head-meta-escaping`
- `html-heading-outline-validation`
- `html-accessible-name-computation`

No runtime migration remains for the 23 authored CSS labs or current 16 web labs.

## Priority 1 — Legacy frontend simulations

| Lessons | Target runtime | Redesign |
| --- | --- | --- |
| `react-jsx-and-components`, `react-state-immutability`, `react-effects-dependencies`, `react-usereducer-patterns`, `react-custom-hooks-stores`, `react-query-keys-staleness` | `react-lab` | Convert to editable `App.jsx` and local modules with DOM and interaction assertions. |
| `nextjs-app-router-routing`, `nextjs-server-client-components`, `nextjs-caching-revalidation` | `next-lab` or `next-server` | Use virtual `app/` files for routing and component boundaries. Put actual cache revalidation on `next-server`. |
| `html-headings-hierarchy`, `html-accessible-forms` | `web-lab` | Add HTML/CSS files, rendered preview, and DOM/accessibility assertions. |

## Priority 2 — SQL, Docker, and API framework simulations

| Lessons | Target runtime | Redesign |
| --- | --- | --- |
| `sql-transactions-atomicity`, `sql-normalization`, `sql-null-three-valued-logic`, `sql-window-functions-simulated`, `sql-join-semantics-simulated`, `sql-group-by-having-simulated`, `sql-btree-index-simulated`, `sql-lost-update-optimistic-locking` | `postgresql` | Replace algorithms with schemas, seeded data, real SQL, result assertions, and attempt rollback. |
| `docker-layer-caching`, `docker-compose-validation`, `docker-production-hardening` | `docker-lab` | Move into the Docker workspace with Dockerfile/Compose files and command checks. |
| `rest-principles`, `request-validation`, `error-handling`, `rest-cursor-pagination`, `rest-rate-limit-headers`, `rest-idempotency-keys`, `rest-json-merge-patch`, `rest-offset-pagination-envelope` | `express-server` or `fastify-server` | Replace handler functions with HTTP acceptance tests and the DevCraft Shop fixture. |
| `web-rest-status-codes-handler`, `web-router-path-params` | `node-server`, then Express/Fastify | Learners build a multi-file server and receive HTTP assertions. |

## Priority 3 — Process and server lifecycle lessons

| Cohort | Target profile | Reason |
| --- | --- | --- |
| `node-csv-import-products`, `node-graceful-shutdown`, `node-env-config-validation`, `node-middleware-compose` | `node-server` | Files, environment, signals, streams, or middleware lifecycle are central. |
| All 18 `nodejs-db` lessons | `node-server` with Shop database capability | Endpoint lessons should run as multi-file services, with real database changes checked over HTTP. |
| `nextjs-route-handlers`, `nextjs-forms-server-actions`, `nextjs-caching-revalidation` | `next-server` | Route handlers, server actions, and cache invalidation need a real Next server. |
| `nextjs-file-routing-layouts`, `nextjs-dynamic-routes-data`, `nextjs-loading-error-streaming`, `nextjs-server-client-components`, `nextjs-search-params-navigation`, `nextjs-metadata-images`, `nextjs-numbered-pagination` | constrained `next-lab` after certification | These remain lightweight once the runtime covers routing, params, navigation, metadata, loading/error boundaries, and fixture fetches. |

## DevCraft Shop cohort

The fixture gateway is required by all 9 `webapp` lessons, React async/form lessons, constrained Next lessons that fetch Shop data, and every Node, Express, Fastify, or server Next lesson that reads or mutates Shop data.

Browser lessons receive a short-lived lesson token and allow-listed routes. Server profiles receive sandbox-local credentials and an isolated transaction or schema. No learner receives production credentials or a direct database URL.

## Implementation order

1. Finish the replacement runtime contract: file resolver, navigation, route and search params, metadata, loading/error boundaries, and friendly compiler diagnostics.
2. Convert the six legacy React lessons and browser-safe legacy Next lessons.
3. Move the eight SQL and three Docker simulations to their existing real engines.
4. Add the Shop fixture gateway and migrate the nine `webapp` lessons.
5. Deliver `node-server`, then Express and Fastify profiles, and migrate REST/process-oriented Node cohorts.
6. Deliver selected `next-server` lessons.
7. Seed content by slug and maintain a runtime-capability matrix.

## Required metadata

Add `runtime`, `files`, `entrypoint`, `profile`, `fixtureVersion`, `allowedFixtureRoutes`, `requiresServer`, and `runtimeVersion` to authored lesson data. This makes every execution contract explicit and enables controlled runtime upgrades.
