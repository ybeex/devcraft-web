# Continuation plan v40

State after Checkpoint 63: BE practice database (Checkpoints 59-62) and the FE counterpart (Storefront API, 8 browser lessons, hosted previews). Unit 572, live 389.

## Open
1. `npm run test:external` (kept open on purpose).
2. Create the preview domain (wildcard DNS and TLS) and set `PREVIEW_HOST_SUFFIX`, `PUBLIC_API_URL`; apply migration 0016. Until then previews report "not available".
3. Wire `npm run sandbox:sweep` to a scheduler (previews sweep lazily already).
4. More browser lessons: optimistic UI with rollback, pagination with page numbers and URL state, form validation before and after submit, polling an order until delivered (`orders` progress by age), debounced autosave, WebSocket-free live updates with `_flaky`, accessibility of loading states (aria-live).
5. React versions of the browser lessons (needs a bundler or an in-iframe Babel; decide CDN versus bundled).
6. Monaco-typing browser pass (CDN unreachable in the build sandbox; lessons were opened with the solution as starter).
7. Preview polish: edit a preview's HTML from the Previews page, a "report this preview" endpoint (currently Contact), view counts per day.
8. Database: transactions and isolation, recursive CTEs, LATERAL, materialised views. Level B (hosting learner-built APIs) only if still wanted.

## Reminders
- Redis and Postgres often need restarting between sessions (`pg_ctlcluster 16 main start`, `redis-server --daemonize yes`); recreate `.env.test` with `cp .env.test.example .env.test` (contains `PREVIEW_HOST_SUFFIX=localhost:3000`).
- Live tests: flush Redis (`redis-cli flushall`) and delete `%@devcraft-test.io` users before a full run if rate limits or leaderboard pollution appear.
- Never `pkill -f` a pattern that appears in your own command line.
