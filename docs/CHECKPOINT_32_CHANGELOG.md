# Checkpoint 32 — Portfolio Activity Heatmap (Frontend)

Frontend side of checkpoint 32 — see `devcraft-api`'s own
`CHECKPOINT_32_CHANGELOG.md` for the backend query and the reasoning
behind where it lives and what it does and doesn't cover.

## What shipped

- `ActivityHeatmap` — a GitHub-style contribution grid: 53 weeks × 7
  days, reconstructed client-side from the backend's sparse
  (`count > 0`-only) day list, rolled back to the preceding Sunday so
  week-columns align to real calendar weeks. Five color levels (0 / 1 /
  2–3 / 4–6 / 7+) using `bg-brand` at increasing opacity rather than a
  new color scale — this platform already has exactly one brand accent
  color, and GitHub's own multi-hue-per-theme approach isn't something
  to replicate just because it's the genre convention. Native `title`
  attributes for per-day detail on hover rather than a custom tooltip
  component — this app doesn't have one, and a native title is the
  simplest thing that's still genuinely informative.
- Wired into `PortfolioView`, placed between the "lessons completed"
  line and the Projects section — reads naturally as "here's the
  activity, here's what it produced."
- `PublicPortfolio`'s type in `lib/api/portfolio.ts` gained
  `activityHeatmap: Array<{date, count}>`, matching the backend's
  addition to the same response object — no new API call.

## Verification

```
tsc --noEmit: clean
next build:   clean — no new routes (this is additive content on the
              existing /p/[username] page), everything else unchanged.
```

## Roadmap status

This was the last item on the P3 list this continuation-plan lineage has
tracked since the original PRD gap analysis — with PDF export and custom
domain explicitly scoped out (see the backend changelog for why: both
need their own dedicated design decisions and real infrastructure
context this checkpoint doesn't have, not a "proceed with reasonable
assumptions" situation). Everything else on P3 — the full Admin UI
(26–29) and the full system-design content type (30–31) — is complete.
What's left on the original roadmap is P4 (content authoring) and P5
(hygiene), both deliberately deprioritized to last per standing
direction from earlier in this project.
