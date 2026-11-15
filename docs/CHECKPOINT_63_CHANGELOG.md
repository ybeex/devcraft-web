# Checkpoint 63 (api-v44, web-checkpoint45): the Frontend counterpart: a real Storefront API, browser lessons and hosted previews

Builds on Checkpoints 59 to 62. **`npm run test:external` is still open on purpose.** Everything here is **Pro** (with a small free taste of the API).

## Before you deploy

1. **Migration on Neon (app database):** `0016_previews.sql` (one table, `previews`; idempotent).
2. `npm run db:seed:content` creates the FE module **Building Against a Real API** (`fe-api-apps`, after `fe-js-core`, later FE modules shift down by one) with 8 lessons.
3. **Hosted previews need a domain, otherwise they report "not available":**
   - Buy a SEPARATE registrable domain (for example `devcraft-preview.com`). Do not use a subdomain of the app: separation is what keeps learner-written scripts away from app cookies and storage.
   - DNS: wildcard `*.devcraft-preview.com` pointing at the API server. TLS: a wildcard certificate (Caddy with DNS challenge, Cloudflare proxy, or Let's Encrypt DNS-01).
   - Env: `PREVIEW_HOST_SUFFIX=devcraft-preview.com`, `PUBLIC_API_URL=https://<your API origin>` (how a preview page reaches the Storefront API). Optional: `PREVIEW_MAX_PER_USER` (5), `PREVIEW_MAX_KB` (512), `PREVIEW_IDLE_DAYS` (30).
   - Local development: `PREVIEW_HOST_SUFFIX=localhost:3000` works because browsers resolve `*.localhost`.
4. The Storefront API needs only Redis (already required). `SANDBOX_SECRET` or `JWT_ACCESS_SECRET` signs the keys.

## What changed

1. **Storefront API** (`/api/v1/storefront`, `src/modules/storefront`): a real shop API over the same deterministic data as the SQL lessons. Products (search, category tree, price range, sort, page or cursor pagination), product, reviews, SVG product pictures, categories, search suggestions; and, with a key: register, login, me, logout, cart (add, change, remove, coupons WELCOME10, SPRING15, FREESHIP, VIP20), checkout (declined card `4000000000000002`, `Idempotency-Key` replay, stock check), orders that progress paid, shipped, delivered by age. Errors always look like `{ error: { code, message, status, fields? } }`; validation errors carry per-field messages.
   - **Make it misbehave:** `_delay` (up to 3 s), `_fail=<4xx/5xx>`, `_flaky=<0-1>` (reproducible per caller).
   - **Free taste:** read-only endpoints, 30 requests a minute per IP. **Pro:** `GET /storefront-key` returns a signed key (`X-Storefront-Key`) that unlocks a private shop (accounts, carts and orders only that learner sees), 600 a minute; `POST /storefront-key/reset` wipes it. Keys lapse about five weeks after the last renewal, which is how a lapsed Pro plan stops working.
   - **CORS:** the Storefront alone is open to every origin, without cookies (`src/plugins/cors.ts` now picks the policy per request). The app API keeps its origin allow-list with credentials.
2. **Browser lessons** (`language: webapp`): the learner's page runs for real in a sandboxed iframe (opaque origin: no DevCraft cookies or storage, no navigation) against the real API; `API_BASE` and `API_KEY` are defined for them. **Check** loads the page in a hidden frame and runs the lesson's tests in it: `test(name, fn)`, `waitFor`, `type`, `click`, `submit`, `calls()` (every fetch the page made, with headers and timing), `apiCall`, `resetCalls`. Tests click and type like a user, assert on requests (debounce counts, headers, idempotency keys, backoff gaps) and slow or break the API on purpose. The server shares only the test script (`GET /lessons/:id/browser-tests`, premium-gated); XP still goes through the normal complete endpoint.
3. **Eight lessons**, each with a solution that passes and a starter that fails, run in real Chromium: fetch and render (cents, relative image URLs), loading and error states, debounced search with stale-response protection, cursor "load more", login form with server field errors, add to cart with a Bearer token and event delegation, double-click-safe checkout with idempotency keys, retry with exponential backoff.
4. **Storefront API page** (Playground): your key, a request builder with presets, token auto-fill after login, the three misbehave controls, the equivalent `fetch` code, reset.
5. **Hosted previews** (`/api/v1/previews`, migration 0016): publish a page from a browser lesson (Publish preview) or paste one on the Previews page; it is served at `https://<slug>.<PREVIEW_HOST_SUFFIX>/`. Requests for a preview host are answered by a plugin that runs before CORS, cookies and every app route; they serve only `GET /`. Each preview gets its own private Storefront shop and key, injected with `API_BASE`. Headers: CSP `default-src 'none'`, scripts inline plus cdnjs, jsDelivr and unpkg only, **`connect-src` limited to the Storefront API**, `form-action 'none'`, `frame-ancestors` the web app; `no-referrer`, `noindex`, `no-store`. A fixed banner says it is a practice project and links to Contact. Limits: 5 previews each, 512 KB, 120 requests a minute per IP, removed after 30 idle days (lazy daily sweep). Publishing the same lesson again updates the same preview. Admin: **Previews** page lists everything with owners and removes (audited as PREVIEW_REMOVED).

## Verification

Unit 572 pass (new: key signing, chaos clamping, cart pricing, host matching); live 389 pass (new: 12 Storefront, 9 previews); web `tsc` and production build clean. Chromium: all 16 lesson runs (solution passes, starter fails) inside a sandboxed iframe; in the app, preview renders live data, Check passes 5/5 and awards XP; a published preview opens on its own host, signs in and uses the cart, receives no DevCraft cookie, and cannot call other sites.

## Notes and trade-offs

- **Browser lesson verdicts come from the learner's browser.** The server cannot load a real page, so a determined learner could fake a pass. Lesson completion already trusted the client, so nothing new is exposed; certificates remain the same.
- **The FE certificate now requires the Pro-only module** (certificates need every published lesson in a track), as BE already does with its premium modules.
- Preview pages cannot load external images or call other APIs, by design (phishing and data exfiltration). Storefront pictures work.
- `localStorage` throws inside lesson frames (opaque origin); lessons say to keep the token in a variable.
- Dev tip: `*.localhost` previews need Chromium; Safari does not resolve them.
