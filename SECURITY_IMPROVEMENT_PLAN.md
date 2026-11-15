# Server Security Review and Improvement Plan

**Review date:** 2026-10-23  
**Scope:** Server-side security surface visible in this repository, plus the frontend API contracts that define the server trust boundaries.

## Scope and confidence

This repository contains a Next.js frontend, but no backend source, `src/app/api` directory, route handlers, middleware, or server actions were found. The frontend calls a separate API configured by `NEXT_PUBLIC_API_URL`. As a result, this review cannot confirm whether the API correctly authenticates users, authorizes operations, validates inputs, protects cookies, isolates lab execution, or handles uploads. Findings below distinguish directly observed behavior from controls that must be verified in the backend repository.

## Prioritized findings and improvement plans

### SEC-001 — Lab command execution is a high-impact server trust boundary

**Priority:** Critical to verify before production  
**Evidence:** [`src/lib/api/git-lab.ts`](src/lib/api/git-lab.ts) sends arbitrary terminal text to `POST /git-lab/exec`; [`src/lib/api/docker-lab.ts`](src/lib/api/docker-lab.ts) sends arbitrary command text to `POST /docker-lab/exec`. The terminal accepts free-form commands in [`src/components/git/GitTerminal.tsx`](src/components/git/GitTerminal.tsx). The endpoint implementation is not in this repository, so host command execution cannot be confirmed.

**Improvement plan:**

1. Review the backend handlers and trace command input to the process invocation.
2. Run each learner lab in a dedicated, short-lived, rootless container or VM; never execute learner commands on the API host or mount the Docker socket.
3. Apply CPU, memory, process-count, disk, output, and wall-clock limits; disable network access unless a lesson explicitly requires it.
4. Prefer a strict Git command and argument allowlist or a purpose-built parser. Reject shell operators, command substitution, redirection, and unexpected flags.
5. Add abuse tests for shell metacharacters, path escapes, fork bombs, oversized output, and attempts to access other users’ labs.

### SEC-002 — Lab file endpoints accept caller-provided paths

**Priority:** High to verify  
**Evidence:** [`src/lib/api/git-lab.ts`](src/lib/api/git-lab.ts) and [`src/lib/api/docker-lab.ts`](src/lib/api/docker-lab.ts) expose file read/write requests with a `path` supplied by the client. Encoding the path in the URL does not make it safe. Backend code is absent, so traversal is not confirmed.

**Improvement plan:**

1. Resolve paths against the authenticated user’s lab root on the server and reject absolute paths, `..`, NUL bytes, and platform-specific separator tricks.
2. Canonicalize and verify the final resolved path remains beneath the lab root, including after symlink resolution; disallow symlinks where possible.
3. Scope every operation to the authenticated user’s lab and validate file size and allowed file types.
4. Test traversal variants, symlink escapes, encoded separators, and cross-user identifiers.

### SEC-003 — Admin API authorization is not verifiable from the frontend

**Priority:** High to verify  
**Evidence:** Admin mutations and data access are called through ordinary `authFetch`, including operations in [`src/lib/api/admin.ts`](src/lib/api/admin.ts), [`src/lib/api/admin-projects.ts`](src/lib/api/admin-projects.ts), and [`src/lib/api/pro.ts`](src/lib/api/pro.ts). A client-side role field or hidden admin page is not an authorization control. No backend route policy is available here to verify.

**Improvement plan:**

1. Require authentication and an explicit server-side role/permission check on every admin endpoint, including reads, exports, and background-triggering actions.
2. Enforce resource ownership and tenant boundaries in the backend for learner endpoints; never trust user IDs supplied in path or body data.
3. Use allowlisted update DTOs so user requests cannot mass-assign roles, tiers, verification flags, or other protected fields.
4. Add negative authorization tests for anonymous users, ordinary users, moderators, and admins across each endpoint and resource owner.

### SEC-004 — Cookie-authenticated requests need server-enforced CSRF protections

**Priority:** High to verify  
**Evidence:** [`src/lib/api/client.ts`](src/lib/api/client.ts) sends `credentials: 'include'` for API calls. Refresh requests in [`src/lib/api/auth-fetch.ts`](src/lib/api/auth-fetch.ts) rely on an HTTP-only refresh cookie. No server cookie or CSRF policy is present in this repository. A frontend header alone is not proof of CSRF protection.

**Improvement plan:**

1. Set refresh cookies `Secure`, `HttpOnly`, and an appropriately restrictive `SameSite` policy; use a host-only cookie where deployment allows.
2. For state-changing cookie-authenticated routes, validate `Origin`/`Referer` against an explicit allowlist and use a CSRF token or an equivalent robust design where cross-site cookie use is necessary.
3. Configure credentialed CORS for exact trusted origins only; never combine credentials with wildcard origins.
4. Test cross-origin form submissions and requests from untrusted origins against refresh, logout, and all cookie-authorized mutations.

### SEC-005 — Upload checks in the browser can be bypassed

**Priority:** High to verify  
**Evidence:** [`src/lib/api/uploads.ts`](src/lib/api/uploads.ts) checks MIME type and a 2 MB size limit before calling `POST /uploads/image`. These checks are client-side only; the upload endpoint implementation is absent.

**Improvement plan:**

1. Repeat size and type validation on the server using actual file signatures and a strict image decoder; do not trust the request MIME type or filename.
2. Set request-body limits before buffering, enforce per-user rate/storage quotas, and re-encode images to safe formats with pixel/dimension limits.
3. Store uploads outside executable application paths with randomized object names and safe content-type/download headers.
4. Verify upload authorization and ownership on replacement/deletion, and test malformed, polyglot, oversized, and decompression-bomb files.

### SEC-006 — API origin has an insecure fallback

**Priority:** Medium  
**Evidence:** [`src/lib/api/client.ts`](src/lib/api/client.ts) and [`src/lib/api/projects.ts`](src/lib/api/projects.ts) default to `http://localhost:3000/api/v1` when `NEXT_PUBLIC_API_URL` is unset. This can silently misconfigure a production build and does not require HTTPS if a non-local HTTP URL is supplied.

**Improvement plan:**

1. Require `NEXT_PUBLIC_API_URL` at build/deploy time instead of silently defaulting in production.
2. Validate that production API URLs use HTTPS and an approved host; keep localhost fallback limited to development.
3. Add deployment checks that fail when the production environment points to localhost or an unencrypted origin.

### SEC-007 — Security headers are not configured in the checked-in Next.js config

**Priority:** Medium; verify hosting layer  
**Evidence:** [`next.config.ts`](next.config.ts) configures redirects and image hosts but no security headers. A reverse proxy or hosting platform may add them, but that configuration is outside this repository.

**Improvement plan:**

1. Confirm the deployed responses set HSTS, `X-Content-Type-Options: nosniff`, a restrictive `Referrer-Policy`, and an appropriate framing policy (`frame-ancestors`/`X-Frame-Options`).
2. Define and test a Content Security Policy compatible with the app’s editor and lab previews; avoid broad `unsafe-eval` or `unsafe-inline` allowances where possible.
3. Verify headers on both the frontend origin and API origin, including error and redirect responses.

## Review checklist for the backend repository

- Locate route/controller implementations for every endpoint referenced by `src/lib/api/`.
- Confirm authentication, role checks, ownership checks, schema validation, rate limits, and safe error handling at the server boundary.
- Inspect database queries for parameterization and allowlisted fields.
- Inspect password hashing, refresh-token rotation/revocation, reset-token expiry, and secret management.
- Inspect CORS, cookie attributes, CSRF policy, TLS enforcement, logs, and security headers.
- Review sandbox isolation and upload processing before exposing lab or upload features publicly.

## Summary

No server-side vulnerability can be conclusively confirmed from the available source because the backend is not included. The highest-risk review items are the lab command and file endpoints, admin/ownership authorization, cookie-based CSRF controls, and server-side upload validation. These should be verified against the API implementation before treating this as a complete security audit.
