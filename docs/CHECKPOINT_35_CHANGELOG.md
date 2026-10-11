# Web checkpoint 35: /verify-email page

New `/verify-email?token=...` route (noindex) and `VerifyEmailStatus` component for the backend's new verification emails (api checkpoint 52).
Sends the single-use token exactly once (guarded against React Strict Mode double effects), shows verifying / verified / failed states,
and offers "Send me a new link" (asks to sign in on 401, shows the server's message on 429). `tsc --noEmit` clean, `next build` OK. Not viewed in a browser.
