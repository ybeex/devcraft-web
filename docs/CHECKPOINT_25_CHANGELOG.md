# Checkpoint 25 — Playground: Lesson-Aware Scoping & Real Console Output

Follow-up to the playground rebuild, addressing three specific gaps:
track-aware language filtering, terminal output that doesn't require
opening devtools, and confirming the backend-track experience is built
around execution/output rather than web rendering.

**This checkpoint hit a full sandbox reset mid-work** — the entire
`/home/claude` working directory was wiped. Recovered by re-extracting
the last two presented checkpoints (`devcraft-api-v9.zip`,
`devcraft-web-checkpoint23.zip`) from `/mnt/user-data/outputs/`, which
survived intact, and re-applying this checkpoint's changes from scratch
against that known-good base. Full `tsc --noEmit` and `next build` both
passed clean afterward — flagging this so the recovery itself doesn't
read as assumed-fine without having actually re-verified it.

## 1. Lesson-aware language scoping

A lesson page now has a "Try in Playground" link (next to the existing
"Ask community" one) carrying `?track=FE|BE` plus the current editor code
and language. The playground reads this and filters its language list:

- **Backend-scoped**: `web`, `html`, `css` removed. No reason to see
  HTML/CSS/web-mode when nothing about backend work involves a browser.
- **Frontend-scoped**: `python`, `sql` removed.
- **No track param** (direct `/playground` visit): all nine languages,
  unchanged from before — this only activates when arriving from a
  lesson, not as a default restriction on the standalone tool.

A dismissible banner names the active scope with a "Show all languages"
escape hatch — scoping is a helpful default, not a lock. The Component
starter template (web-mode) is hidden specifically for backend scope, for
the same reason as the language filtering.

## 2. "The backend playground should be what backend needs for execution and pipeline previews"

Interpreted as: backend work is fundamentally about processing/
transforming data and inspecting the result, not rendering a page — so
"preview" for backend means execution output, not an iframe. That's
already what `ConsoleOutput` (from the prior checkpoint) does; this
checkpoint's job was making sure backend-scoped sessions are steered
there by default rather than defaulting into `web` mode, which the
language-scoping above now does directly (`web` isn't even an option
when backend-scoped, so there's no path into an HTML preview from a
backend lesson).

## 3. Console errors now show in the app, not just devtools

Previously flagged as a known gap in the prior checkpoint. Implemented a
`postMessage` bridge: `buildWebPreviewDocument` now injects a small script
before the user's own JS that wraps `console.log/warn/error/info` and
listens for `window.onerror`/`unhandledrejection`, forwarding all of it to
the parent window (namespaced under `__devcraftConsole` to avoid
colliding with unrelated postMessage traffic). The original console
methods still run unchanged — devtools keeps working exactly as before,
this adds a second listener rather than replacing anything.

`WebModeEditor` now has a real console panel below the live preview,
listening for these messages and rendering them with level-appropriate
styling (errors in red, warnings in amber). Logs clear automatically each
time the preview reloads (a fresh `srcDoc` means a fresh script context —
old logs belonged to the previous version of the code, so keeping them
around would be misleading, not helpful) plus a manual clear button.

Since the bridge lives in the shared `buildWebPreviewDocument` function,
`SharedSnippetView`'s read-only preview also gets it for free, even
though it has nowhere to display it yet — harmless (the original console
methods still fire normally there), and it means adding a console panel
to the shared view later needs no changes to the document-building side.

## Verification

```
Frontend: tsc --noEmit clean, full next build clean — all 30+ routes
          intact post-recovery, /playground still prerenders statically
          despite useSearchParams() usage (Suspense boundary confirmed
          still correct)
Backend:  untouched this checkpoint — sanity-checked tsc --noEmit clean
          on the recovered copy, no functional changes
```

## Still open from the roadmap

Next per the suggested P3 order: admin UI, then system-design content
type, then portfolio heatmap/PDF/custom-domain. P5 hygiene still last.
